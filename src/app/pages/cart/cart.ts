import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../../services/cart';
import { CartItem } from '../../models/cart-item';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart.html',
})
export class CartPage {

  items: CartItem[] = [];

  constructor(private cartService: CartService) {
    this.cartService.cart$.subscribe(items => {
      this.items = items;
    });
  }

  increase(i: number) {
    this.cartService.increaseQty(i);
  }

  decrease(i: number) {
    this.cartService.decreaseQty(i);
  }

  remove(i: number) {
    this.cartService.removeItem(i);
  }

  getGrandTotal(): number {
    return this.items.reduce(
      (sum, item) => sum + item.totalPrice * item.quantity,
      0
    );
  }
}
