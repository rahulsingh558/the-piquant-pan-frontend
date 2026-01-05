import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orders.html',
})
export class OrdersPage {
  orders: any[] = [];
  isBrowser = false;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);

    if (this.isBrowser) {
      this.orders = JSON.parse(localStorage.getItem('orders') || '[]');
    }
  }
}