import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-success.component.html',
})
export class OrderSuccessComponent implements OnInit {
  transactionId = '';
  orderAmount = 0;
  estimatedDelivery = '';

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Get data from navigation state or localStorage
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      this.transactionId = navigation.extras.state['transactionId'] || '';
      this.orderAmount = navigation.extras.state['amount'] || 0;
    } else {
      const payment = JSON.parse(localStorage.getItem('lastPayment') || '{}');
      this.transactionId = payment.transactionId || '';
      this.orderAmount = payment.amount || 0;
    }

    // Set estimated delivery time
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
    return 'ORD-' + Date.now().toString().slice(-8);
  }
}