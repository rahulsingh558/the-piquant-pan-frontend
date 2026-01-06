import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService, Cart, CartItem } from '../../services/cart.service';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart.html',
})
export class CartPage implements OnInit {

  cart: Cart = { items: [], total: 0, itemCount: 0 };

  constructor(private cartService: CartService) {
  }

  ngOnInit() {
    // Subscribe to cart updates
    this.cartService.cart$.subscribe(cart => {
      this.cart = cart;
    });
  }

  increase(itemId: string) {
    const item = this.cart.items.find(i => i._id === itemId);
    if (item) {
      const result = this.cartService.updateQuantity(itemId, item.quantity + 1);
      if (result && typeof result.subscribe === 'function') {
        result.subscribe();
      }
    }
  }

  decrease(itemId: string) {
    const item = this.cart.items.find(i => i._id === itemId);
    if (item && item.quantity > 1) {
      const result = this.cartService.updateQuantity(itemId, item.quantity - 1);
      if (result && typeof result.subscribe === 'function') {
        result.subscribe();
      }
    }
  }

  remove(itemId: string) {
    const result = this.cartService.removeItem(itemId);
    if (result && typeof result.subscribe === 'function') {
      result.subscribe();
    }
  }

  getGrandTotal(): number {
    return this.cart.total;
  }
}
