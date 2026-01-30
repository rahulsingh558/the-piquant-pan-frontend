import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { io, Socket } from 'socket.io-client';
import { OrderService, Order } from '../../services/order.service';
import { MapplsService, Coordinates } from '../../services/mappls.service';
import { environment } from '../../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-track-order',
  templateUrl: './track-order.html',
  imports: [CommonModule, RouterModule]
})
export class TrackOrderPage implements OnInit, OnDestroy {
  orderId: string | null = null;
  order: Order | null = null;
  loading = true;
  error = '';
  isBrowser = false;

  // Tracking State
  deliveryProgress = 0;
  isLiveTracking = false;
  socket: Socket | null = null;
  mapInitialized = false;
  deliveryAddressCoords: Coordinates | null = null;  // Store for route redrawing

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private mapplsService: MapplsService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    // Get Order ID from URL
    this.orderId = this.route.snapshot.paramMap.get('id');

    if (!this.orderId) {
      this.error = 'Invalid Order ID';
      this.loading = false;
      return;
    }

    this.loadOrder();
  }

  ngOnDestroy(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
    // Cleanup map if needed? Mappls usually cleans itself or we reuse the div
  }

  loadOrder() {
    if (!this.orderId) return;

    this.orderService.getOrderById(this.orderId).subscribe({
      next: (response) => {
        if (response.success) {
          this.order = response.order;
          this.loading = false;

          if (this.isBrowser) {
            // Need a small timeout for DOM to render map div
            setTimeout(() => {
              this.initializeMap();
              this.setupSocketConnection();
            }, 100);
          }
        } else {
          this.error = 'Order not found';
          this.loading = false;
        }
      },
      error: (err) => {
        console.error('Error loading order:', err);
        this.error = 'Failed to load order details';
        this.loading = false;
      }
    });
  }

  // --- Map Logic (Copied/Adapted from OrdersPage) ---

  async initializeMap(): Promise<void> {
    if (!this.order || this.mapInitialized) return;

    // REMOVED CHECK FOR TESTING: User wants to see markers
    /*
    if (!['out_for_delivery', 'delivered'].includes(this.order.orderStatus)) {
        return;
    }
    */

    try {
      console.log('[TrackOrder] Initializing map for order:', this.order.orderNumber);

      const deliveryCoords = await this.getDeliveryCoordinates();
      const restaurantCoords = await this.mapplsService.getRestaurantCoordinates();

      console.log('[TrackOrder] Restaurant coords:', restaurantCoords);
      console.log('[TrackOrder] Delivery coords:', deliveryCoords);

      // Calculate center
      const centerCoords: Coordinates = {
        lat: (restaurantCoords.lat + deliveryCoords.lat) / 2,
        lng: (restaurantCoords.lng + deliveryCoords.lng) / 2
      };
      console.log('[TrackOrder] Center coords:', centerCoords);

      // Store delivery address for route redrawing
      this.deliveryAddressCoords = deliveryCoords;

      // Create map
      await this.mapplsService.createMap('tracking-map-page', centerCoords, 13);
      this.mapInitialized = true;

      // Add markers (Orange for Restaurant, Green for Delivery)
      console.log('[TrackOrder] Adding restaurant marker at:', restaurantCoords);
      this.mapplsService.addColoredMarker(restaurantCoords, 'orange', 'The Piquant Pan');

      console.log('[TrackOrder] Adding delivery marker at:', deliveryCoords);
      this.mapplsService.addColoredMarker(deliveryCoords, 'green', 'Delivery Address');

      // Draw Route only when order is out for delivery or delivered
      if (['out_for_delivery', 'delivered'].includes(this.order.orderStatus)) {
        console.log('[TrackOrder] Drawing initial route from restaurant to delivery');
        await this.mapplsService.drawActualRoute(restaurantCoords, deliveryCoords);
      } else {
        console.log('[TrackOrder] Route not shown - order status:', this.order.orderStatus);
      }

      // Fit bounds
      this.mapplsService.fitBounds([restaurantCoords, deliveryCoords]);

      // Progress
      this.deliveryProgress = this.mapplsService.getDeliveryProgress(this.order.orderStatus);

      // Check for Delivery Partner (if any stored location, or wait for socket)
      // Socket will handle live updates

      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }

  async getDeliveryCoordinates(): Promise<Coordinates> {
    const address = this.order?.deliveryAddress;
    console.log('[TrackOrder] Getting delivery coordinates, address:', address);

    if (!address) {
      console.warn('[TrackOrder] No delivery address found, using default');
      return { lat: 12.9750, lng: 77.6600 };
    }

    // Check if we have exact coordinates from geolocation
    if (address.lat && address.lng) {
      console.log('[TrackOrder] Using saved coordinates:', address.lat, address.lng);
      return { lat: address.lat, lng: address.lng };
    }

    // Fallback: estimate coordinates from address
    console.log('[TrackOrder] No saved coordinates, estimating from address');
    const fullAddress = [
      address.street,
      address.landmark,
      address.city,
      address.state,
      address.zipCode
    ].filter(Boolean).join(', ');

    const coords = await this.mapplsService.geocodeAddress(fullAddress);
    console.log('[TrackOrder] Estimated coordinates:', coords);
    return coords;
  }

  // --- Socket Logic ---
  setupSocketConnection() {
    if (!this.isBrowser || !this.order) return;

    this.socket = io(environment.apiUrl.replace('/api', ''), {
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('[TrackOrder] Connected to tracking server');
      // Join tracking room (must match backend: tracking:join)
      this.socket?.emit('tracking:join', { orderId: this.order?.orderNumber });
      console.log('[TrackOrder] Joined tracking room for order:', this.order?.orderNumber);
    });

    // Listen for location updates (must match backend: delivery:position)
    this.socket.on('delivery:position', (data: any) => {
      console.log('[TrackOrder] Received location update:', data);
      if (data.lat && data.lng) {
        this.isLiveTracking = true;
        this.updateDeliveryLocation(data.lat, data.lng);
      }
    });

    // Listen for status updates
    this.socket.on('order:status_update', (data: any) => {
      if (this.order && data.orderId === this.order._id) {
        this.order.orderStatus = data.status;
        this.deliveryProgress = this.mapplsService.getDeliveryProgress(data.status);
        this.cdr.detectChanges();
      }
    });
  }

  async updateDeliveryLocation(lat: number, lng: number) {
    if (!this.mapInitialized) return;
    const pos = { lat, lng };

    // Update delivery person marker (blue)
    this.mapplsService.updateDeliveryMarker(pos);

    // Redraw route from delivery person to delivery address
    if (this.deliveryAddressCoords) {
      console.log('[TrackOrder] Redrawing route from delivery person to destination');
      await this.mapplsService.drawActualRoute(pos, this.deliveryAddressCoords);
    }

    this.cdr.detectChanges();
  }


  // Helpers
  formatDate(date: any): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  }

  formatTime(date: any): string {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit'
    });
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'pending': return 'Order Placed';
      case 'confirmed': return 'Confirmed';
      case 'preparing': return 'Preparing';
      case 'out_for_delivery': return 'Out for Delivery';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  }

  goBack() {
    this.router.navigate(['/orders']);
  }
}
