import { Component, Inject, PLATFORM_ID, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OrderService, Order } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orders.html',
})
export class OrdersPage implements OnInit {
  orders: Order[] = [];
  isBrowser = false;
  loading = true;
  userId: string | null = null;

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private orderService: OrderService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      // Check if user is logged in
      if (!this.authService.isAuthenticated()) {
        // Redirect to login
        this.router.navigate(['/login'], { queryParams: { returnUrl: '/orders' } });
        return;
      }

      // Get user ID from AuthService
      const currentUser = this.authService.getCurrentUser();
      if (currentUser) {
        this.userId = currentUser.id;
      } else {
        // Fallback to localStorage if not in subject yet (page reload)
        this.userId = localStorage.getItem('userId');
      }

      this.loadOrders();
    }
  }

  loadOrders() {
    this.loading = true;

    // Load all orders (backend should filter by user eventually)
    const filters: any = { limit: 50, sortBy: '-createdAt' };
    if (this.userId) {
      filters.userId = this.userId;
    }

    this.orderService.getAllOrders(filters).subscribe({
      next: (response) => {
        if (response.success) {
          this.orders = response.orders;
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.orders = [];
      },
      complete: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'confirmed': 'bg-blue-100 text-blue-800',
      'preparing': 'bg-purple-100 text-purple-800',
      'out_for_delivery': 'bg-indigo-100 text-indigo-800',
      'delivered': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  }

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

  formatDate(date: Date | string | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  formatTime(date: Date | string | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  // Modal states
  showTrackModal = false;
  showAddressModal = false;
  showHelpModal = false;
  selectedOrder: Order | null = null;
  editedAddress = {
    street: '',
    city: '',
    state: '',
    zipCode: '',
    landmark: ''
  };

  // Track Order
  openTrackModal(order: Order) {
    this.selectedOrder = order;
    this.showTrackModal = true;
  }

  closeTrackModal() {
    this.showTrackModal = false;
    this.selectedOrder = null;
  }

  // Update Address
  openAddressModal(order: Order) {
    if (this.canUpdateAddress(order.orderStatus)) {
      this.selectedOrder = order;
      this.editedAddress = {
        street: order.deliveryAddress.street,
        city: order.deliveryAddress.city,
        state: order.deliveryAddress.state,
        zipCode: order.deliveryAddress.zipCode,
        landmark: order.deliveryAddress.landmark || ''
      };
      this.showAddressModal = true;
    }
  }

  closeAddressModal() {
    this.showAddressModal = false;
    this.selectedOrder = null;
  }

  canUpdateAddress(status: string): boolean {
    return status === 'pending' || status === 'confirmed';
  }

  updateAddress() {
    if (!this.selectedOrder || !this.selectedOrder._id) return;

    this.loading = true;
    this.orderService.updateOrder(this.selectedOrder._id, { deliveryAddress: this.editedAddress }).subscribe({
      next: (response) => {
        if (response.success) {
          // Update local state
          if (this.selectedOrder) {
            this.selectedOrder.deliveryAddress = { ...this.editedAddress };
            // Update the order in the main list as well
            const index = this.orders.findIndex(o => o._id === this.selectedOrder?._id);
            if (index !== -1) {
              this.orders[index].deliveryAddress = { ...this.editedAddress };
            }
          }
          this.closeAddressModal();
          // Optional: Show success message/toast
        }
      },
      error: (error) => {
        console.error('Error updating address:', error);
        // Optional: Show error message
      },
      complete: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Help
  openHelpModal(order: Order) {
    this.selectedOrder = order;
    this.showHelpModal = true;
  }

  closeHelpModal() {
    this.showHelpModal = false;
    this.selectedOrder = null;
  }
}