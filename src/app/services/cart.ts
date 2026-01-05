import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CartItem } from '../models/cart-item';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class CartService {
  private cartItems = new BehaviorSubject<CartItem[]>([]);
  cart$ = this.cartItems.asObservable();

  // ✅ CART COUNT OBSERVABLE (MUST BE INSIDE CLASS)
  cartCount$ = this.cart$.pipe(
    map((items) =>
      items.reduce((total, item) => total + item.quantity, 0)
    )
  );

  addToCart(item: CartItem) {
    const items = [...this.cartItems.value];

    const existingIndex = items.findIndex(
      i =>
        i.foodId === item.foodId &&
        JSON.stringify(i.addons) === JSON.stringify(item.addons)
    );

    if (existingIndex > -1) {
      items[existingIndex].quantity += item.quantity;
      items[existingIndex].totalPrice =
        items[existingIndex].basePrice *
        items[existingIndex].quantity;
    } else {
      items.push(item);
    }

    this.cartItems.next(items);
  }

  increaseQty(index: number) {
    const items = [...this.cartItems.value];
    items[index].quantity++;
    this.cartItems.next(items);
  }

  decreaseQty(index: number) {
    const items = [...this.cartItems.value];
    if (items[index].quantity > 1) {
      items[index].quantity--;
    }
    this.cartItems.next(items);
  }

  removeItem(index: number) {
    const items = [...this.cartItems.value];
    items.splice(index, 1);
    this.cartItems.next(items);
  }

  clearCart() {
    this.cartItems.next([]);
  }
}