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

  constructor(private router: Router) { }

  ngOnInit(): void {
    // Get order data from navigation state
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      this.orderId = navigation.extras.state['orderId'] || '';
      this.orderNumber = navigation.extras.state['orderNumber'] || 0;
      this.totalAmount = navigation.extras.state['totalAmount'] || 0;
      this.orderAmount = this.totalAmount;
      this.transactionId = this.orderId;
      this.paymentMethod = navigation.extras.state['paymentMethod'] || '';
    } else {
      // If no state, redirect to home
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
}