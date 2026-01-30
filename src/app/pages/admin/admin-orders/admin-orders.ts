import { Component, OnInit, OnDestroy, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminAuthService } from '../../../services/admin-auth.service';
import { AdminSidebarComponent } from '../sidebar/admin-sidebar.component';
import { OrderService, Order as ApiOrder } from '../../../services/order.service';
import { MapplsService, Coordinates, RouteInfo } from '../../../services/mappls.service';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../../environments/environment';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  addons: string[];
  specialInstructions?: string;
}

interface Order {
  id: string;
  orderNumber: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryAddress: string;
  deliveryCoords?: { lat?: number; lng?: number };  // For map display
  items: OrderItem[];
  subtotal: number;
  deliveryCharge: number;
  tax: number;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  date: Date;
  time: string;
  notes?: string;
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AdminSidebarComponent], // Add AdminSidebarComponent here
  templateUrl: './admin-orders.html',
})
export class AdminOrdersComponent implements OnInit, OnDestroy {
  /* =========================
     SIDEBAR STATE
  ========================== */
  isSidebarOpen = false;

  /* =========================
     FILTER STATE
  ========================== */
  showFilter = false;
  searchQuery = '';
  statusFilter = '';
  dateFilter = '';
  sortBy = 'newest';
  activeFilters = 0;

  /* =========================
     PAGINATION
  ========================== */
  pageSize = 8;
  displayedOrders: Order[] = [];
  filteredOrders: Order[] = [];
  loadMoreCount = 0;

  /* =========================
     ORDERS DATA
  ========================== */
  allOrders: Order[] = [];
  activeOrders: Order[] = [];
  recentOrders: Order[] = [];
  selectedOrder: Order | null = null;

  /* =========================
     STATS
  ========================== */
  totalOrders = 0;
  pendingOrders = 0;
  todaysOrders = 0;
  totalRevenue = 0;
  loading = true;

  /* =========================
     MAP STATE
  ========================== */
  isBrowser = false;
  selectedOrderMapInitialized = false;
  selectedOrderRawAddress: { lat?: number; lng?: number; street: string; city: string } | null = null;

  /* =========================
     SOCKET & DELIVERY TRACKING
  ========================== */
  private socket: Socket | null = null;
  private deliveryMarker: any = null;
  private selectedOrderDeliveryCoords: Coordinates | null = null;
  selectedOrderRouteInfo: RouteInfo | null = null;  // Public for template access

  constructor(
    private auth: AdminAuthService,
    private orderService: OrderService,
    private cdr: ChangeDetectorRef,
    private mapplsService: MapplsService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    // Load orders from backend
    this.loadOrders();

    // Auto-refresh every 30 seconds
    setInterval(() => {
      this.refreshOrders();
    }, 30000);

    // On desktop, sidebar is open by default
    this.isSidebarOpen = window.innerWidth >= 1024;
  }

  ngOnDestroy() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /* =========================
     SIDEBAR METHODS
  ========================== */
  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  /* =========================
     FILTER METHODS
  ========================== */
  toggleFilter() {
    this.showFilter = !this.showFilter;
  }

  onSearch() {
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.allOrders];

    // Apply search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query) ||
        order.customerPhone.includes(query) ||
        order.customerEmail.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (this.statusFilter) {
      filtered = filtered.filter(order => order.status === this.statusFilter);
    }

    // Apply date filter
    if (this.dateFilter) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      filtered = filtered.filter(order => {
        const orderDate = new Date(order.date);
        orderDate.setHours(0, 0, 0, 0);

        switch (this.dateFilter) {
          case 'today':
            return orderDate.getTime() === today.getTime();
          case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(today.getDate() - 7);
            return orderDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(today);
            monthAgo.setMonth(today.getMonth() - 1);
            return orderDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const dateA = new Date(a.date + 'T' + a.time);
      const dateB = new Date(b.date + 'T' + b.time);

      switch (this.sortBy) {
        case 'newest':
          return dateB.getTime() - dateA.getTime();
        case 'oldest':
          return dateA.getTime() - dateB.getTime();
        case 'amount-high':
          return b.totalAmount - a.totalAmount;
        case 'amount-low':
          return a.totalAmount - b.totalAmount;
        default:
          return dateB.getTime() - dateA.getTime();
      }
    });

    this.filteredOrders = filtered;
    this.displayedOrders = filtered.slice(0, this.pageSize);
    this.loadMoreCount = Math.max(0, filtered.length - this.displayedOrders.length);

    // Update active filters count
    this.activeFilters = [this.searchQuery, this.statusFilter, this.dateFilter]
      .filter(Boolean).length;
  }

  clearFilters() {
    this.searchQuery = '';
    this.statusFilter = '';
    this.dateFilter = '';
    this.sortBy = 'newest';
    this.applyFilters();
  }

  /* =========================
     PAGINATION METHODS
  ========================== */
  loadMoreOrders() {
    const currentLength = this.displayedOrders.length;
    const newLength = Math.min(currentLength + 10, this.filteredOrders.length);
    this.displayedOrders = this.filteredOrders.slice(0, newLength);
    this.loadMoreCount = Math.max(0, this.filteredOrders.length - newLength);
  }

  /* =========================
     ORDER METHODS
  ========================== */
  refreshOrders() {
    this.loadOrders();
  }

  loadOrders() {
    this.loading = true;
    this.orderService.getAllOrders({ limit: 100, sortBy: '-createdAt' }).subscribe({
      next: (response) => {
        if (response.success) {
          this.allOrders = response.orders.map(order => this.mapApiOrderToLocal(order));
          this.calculateStats();
          this.applyFilters();
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        console.error('Error loading orders:', error);
      },
      complete: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  mapApiOrderToLocal(apiOrder: ApiOrder): Order {
    return {
      id: `#${apiOrder.orderNumber}`,
      orderNumber: apiOrder.orderNumber || 0,
      customerName: apiOrder.customerName,
      customerPhone: apiOrder.customerPhone,
      customerEmail: apiOrder.customerEmail,
      deliveryAddress: `${apiOrder.deliveryAddress.street}, ${apiOrder.deliveryAddress.city}`,
      deliveryCoords: {
        lat: apiOrder.deliveryAddress.lat,
        lng: apiOrder.deliveryAddress.lng
      },
      items: apiOrder.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.basePrice,
        addons: item.addons.map(a => a.name),
        specialInstructions: undefined
      })),
      subtotal: apiOrder.subtotal,
      deliveryCharge: apiOrder.deliveryCharge,
      tax: apiOrder.tax,
      totalAmount: apiOrder.totalAmount,
      status: apiOrder.orderStatus,
      paymentMethod: apiOrder.paymentMethod,
      paymentStatus: apiOrder.paymentStatus,
      date: apiOrder.createdAt ? new Date(apiOrder.createdAt) : new Date(),
      time: apiOrder.createdAt ? new Date(apiOrder.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '',
      notes: apiOrder.specialInstructions
    };
  }

  async viewOrderDetails(order: Order) {
    this.selectedOrder = order;
    this.selectedOrderMapInitialized = false;
    this.cdr.detectChanges();

    // Initialize map after modal is rendered
    setTimeout(() => this.initOrderMap(order), 300);
  }

  async initOrderMap(order: Order) {
    if (!this.isBrowser || this.selectedOrderMapInitialized) return;

    try {
      const restaurantCoords = await this.mapplsService.getRestaurantCoordinates();
      let deliveryCoords: Coordinates;

      if (order.deliveryCoords?.lat && order.deliveryCoords?.lng) {
        deliveryCoords = { lat: Number(order.deliveryCoords.lat), lng: Number(order.deliveryCoords.lng) };
      } else {
        // Fallback: geocode from address string
        deliveryCoords = await this.mapplsService.geocodeAddress(order.deliveryAddress);
      }

      console.log('[AdminOrders] Restaurant:', restaurantCoords, 'Delivery:', deliveryCoords);

      // Store for route redrawing
      this.selectedOrderDeliveryCoords = deliveryCoords;

      const centerCoords: Coordinates = {
        lat: (restaurantCoords.lat + deliveryCoords.lat) / 2,
        lng: (restaurantCoords.lng + deliveryCoords.lng) / 2
      };

      await this.mapplsService.createMap('admin-order-map', centerCoords, 13);
      this.selectedOrderMapInitialized = true;

      this.mapplsService.addColoredMarker(restaurantCoords, 'orange', 'Restaurant');
      this.mapplsService.addColoredMarker(deliveryCoords, 'green', 'Delivery');

      // Route will be drawn dynamically from delivery person's live location
      console.log('[AdminOrders] Waiting for delivery person location to draw route');

      this.mapplsService.fitBounds([restaurantCoords, deliveryCoords]);

      // Setup socket for delivery person tracking
      this.setupDeliveryTracking(order.orderNumber);

      this.cdr.detectChanges();
    } catch (error) {
      console.error('[AdminOrders] Error initializing order map:', error);
    }
  }

  setupDeliveryTracking(orderNumber: number) {
    if (!this.isBrowser) return;

    // Disconnect existing socket if any
    if (this.socket) {
      this.socket.disconnect();
    }

    // Connect to socket server
    this.socket = io(environment.backendUrl, {
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('[AdminOrders] Connected to tracking server');
      // Join tracking room for this order
      this.socket?.emit('tracking:join', { orderId: orderNumber });
    });

    // Listen for delivery person location updates
    this.socket.on('delivery:position', (data: any) => {
      console.log('[AdminOrders] Delivery person location update:', data);
      if (data.lat && data.lng) {
        this.updateDeliveryPersonMarker(Number(data.lat), Number(data.lng));
      }
    });
  }

  async updateDeliveryPersonMarker(lat: number, lng: number) {
    const pos = { lat, lng };

    // Remove existing marker if any
    if (this.deliveryMarker) {
      try {
        this.deliveryMarker.remove();
      } catch (e) {
        console.error('Error removing delivery marker:', e);
      }
    }

    // Add rider avatar marker with scooter icon
    this.deliveryMarker = this.mapplsService.addRiderMarker(pos);

    // Redraw route from delivery person to delivery address
    if (this.selectedOrderDeliveryCoords) {
      console.log('[AdminOrders] Redrawing route from delivery person to destination');
      this.selectedOrderRouteInfo = await this.mapplsService.drawActualRoute(pos, this.selectedOrderDeliveryCoords);
      console.log('[AdminOrders] Route info:', this.selectedOrderRouteInfo);
    }

    this.cdr.detectChanges();
  }

  updateOrderStatus(order: Order) {
    const statusOptions = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
    const currentIndex = statusOptions.indexOf(order.status);
    const nextIndex = (currentIndex + 1) % (statusOptions.length - 1); // Skip cancelled

    const newStatus = statusOptions[nextIndex];
    const orderIdNum = order.id.replace('#', '');

    // Find the API order
    this.orderService.getAllOrders({ search: orderIdNum, limit: 1 }).subscribe({
      next: (response) => {
        if (response.success && response.orders.length > 0) {
          const apiOrder = response.orders[0];
          this.orderService.updateOrderStatus(apiOrder._id!, newStatus).subscribe({
            next: () => {
              order.status = newStatus;
              this.calculateStats();
              this.applyFilters();
              this.cdr.detectChanges();
              alert(`Order ${order.id} status updated to ${this.getStatusText(newStatus)}`);
            },
            error: (error) => {
              console.error('Error updating order status:', error);
              alert('Failed to update order status');
            }
          });
        }
      }
    });
  }

  cancelOrder(order: Order) {
    if (confirm(`Are you sure you want to cancel order ${order.id}?`)) {
      const orderIdNum = order.id.replace('#', '');

      this.orderService.getAllOrders({ search: orderIdNum, limit: 1 }).subscribe({
        next: (response) => {
          if (response.success && response.orders.length > 0) {
            const apiOrder = response.orders[0];
            this.orderService.updateOrderStatus(apiOrder._id!, 'cancelled', 'Cancelled by admin').subscribe({
              next: () => {
                order.status = 'cancelled';
                this.calculateStats();
                this.applyFilters();
                this.cdr.detectChanges();
                alert(`Order ${order.id} has been cancelled.`);
              },
              error: (error) => {
                console.error('Error cancelling order:', error);
                alert('Failed to cancel order');
              }
            });
          }
        }
      });
    }
  }

  exportOrders() {
    // In a real app, this would generate and download CSV/Excel
    alert('Export feature will be implemented soon!');
  }

  printOrder(order: Order) {
    window.print();
  }

  /* =========================
     HELPER METHODS
  ========================== */
  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Pending',
      'confirmed': 'Confirmed',
      'preparing': 'Preparing',
      'out_for_delivery': 'Out for Delivery',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled'
    };
    return statusMap[status] || status;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  formatTime(time: string): string {
    return time;
  }

  // Helper method to get item names as string
  getItemNames(items: OrderItem[]): string {
    return items.map(item => item.name).join(', ');
  }

  calculateStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.totalOrders = this.allOrders.length;
    this.pendingOrders = this.allOrders.filter(o =>
      ['pending', 'confirmed', 'preparing'].includes(o.status)
    ).length;
    this.todaysOrders = this.allOrders.filter(o => {
      const orderDate = new Date(o.date);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime();
    }).length;
    this.totalRevenue = this.allOrders
      .filter(o => o.status === 'delivered')
      .reduce((sum, order) => sum + order.totalAmount, 0);

    // Update active and recent orders
    this.activeOrders = this.allOrders
      .filter(o => ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status))
      .sort((a, b) => new Date(b.date + 'T' + b.time).getTime() - new Date(a.date + 'T' + a.time).getTime())
      .slice(0, 5);

    this.recentOrders = this.allOrders
      .filter(o => ['delivered', 'cancelled'].includes(o.status))
      .sort((a, b) => new Date(b.date + 'T' + b.time).getTime() - new Date(a.date + 'T' + a.time).getTime())
      .slice(0, 5);
  }

  logout() {
    this.auth.logout();
  }
}