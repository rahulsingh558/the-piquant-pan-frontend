import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-success.component.html',
})
export class OrderSuccessComponent implements OnInit {
  orderId = '';
  orderNumber = 0;
  totalAmount = 0;
  orderAmount = 0;
  transactionId = '';
  paymentMethod = '';
  estimatedDelivery = '';
  orderStatus = 'pending';

  timelineSteps = [
    { status: 'pending', label: 'Pending', icon: '⏳' },
    { status: 'confirmed', label: 'Confirmed', icon: '✅' },
    { status: 'preparing', label: 'Preparing', icon: '👨‍🍳' },
    { status: 'out_for_delivery', label: 'Out for Delivery', icon: '🛵' },
    { status: 'delivered', label: 'Delivered', icon: '🏠' }
  ];

  constructor(private router: Router) {
    // Get order data from navigation state - must be in constructor
    const navigation = this.router.getCurrentNavigation();

    if (navigation?.extras?.state) {
      this.setOrderDetails(navigation.extras.state);
    } else {
      // Fallback: Check history.state directly (useful for reloads or if navigation object is lost)
      const state = history.state;
      if (state && state.orderId) {
        this.setOrderDetails(state);
      } else {
        // If no state, redirect to home
        // We do this in ngOnInit to avoid router errors in constructor
      }
    }
  }

  ngOnInit(): void {
    if (!this.orderId) {
      this.router.navigate(['/menu']);
      return;
    }

    // Set estimated delivery time (45 minutes from now)
    const now = new Date();
    now.setMinutes(now.getMinutes() + 45);
    this.estimatedDelivery = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private setOrderDetails(state: any) {
    this.orderId = state['orderId'] || '';
    this.orderNumber = state['orderNumber'] || 0;
    this.totalAmount = state['totalAmount'] || 0;
    this.orderAmount = this.totalAmount;
    this.transactionId = this.orderId;
    this.paymentMethod = state['paymentMethod'] || '';
    this.orderStatus = state['orderStatus'] || 'pending';
  }

  viewOrder() {
    this.router.navigate(['/orders']);
  }

  continueShopping() {
    this.router.navigate(['/menu']);
  }

  getOrderId(): string {
    return `#${this.orderNumber}`;
  }

  getPaymentMethodText(): string {
    return this.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment';
  }

  getStepStatus(stepStatus: string): 'completed' | 'current' | 'upcoming' {
    const statusOrder = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];
    const currentIndex = statusOrder.indexOf(this.orderStatus);
    const stepIndex = statusOrder.indexOf(stepStatus);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  }
}