import { Component, Inject, PLATFORM_ID, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { OrderService, Order } from '../../services/order.service';

@Component({
  standalone: true,
  imports: [CommonModule],
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
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      // Check if user is logged in
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

      if (!isLoggedIn) {
        // Redirect to login
        this.router.navigate(['/login'], { queryParams: { returnUrl: '/orders' } });
        return;
      }

      this.userId = localStorage.getItem('userId');
      this.loadOrders();
    }
  }

  loadOrders() {
    this.loading = true;

    // Load all orders (backend should filter by user eventually)
    this.orderService.getAllOrders({ limit: 50, sortBy: '-createdAt' }).subscribe({
      next: (response) => {
        if (response.success) {
          // Filter orders for current user (in case backend doesn't do it)
          this.orders = response.orders.filter(order =>
            !this.userId || order.userId === this.userId || order.customerEmail === localStorage.getItem('userEmail')
          );
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
}