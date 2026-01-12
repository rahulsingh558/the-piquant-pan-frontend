import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { CartService, Cart, CartItem } from '../../services/cart.service';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart.html',
})
export class CartPage implements OnInit {

  cart: Cart = { items: [], total: 0, itemCount: 0 };

  constructor(
    private cartService: CartService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  isBrowser = false;

  getGrandTotal(): number {
    return this.cart.total;
  }

  proceedToCheckout() {
    if (this.isBrowser) {
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      if (isLoggedIn) {
        this.router.navigate(['/address-select']);
      } else {
        this.router.navigate(['/login'], { queryParams: { returnUrl: '/address-select' } });
      }
    }
  }

  ngOnInit() {
    // Subscribe to cart updates
    this.cartService.cart$.subscribe(cart => {
      this.cart = cart;
      this.cdr.detectChanges(); // Trigger change detection
    });
  }

  increase(itemId: string) {
    const item = this.cart.items.find(i => (i._id || i.menuItemId) === itemId);
    if (item) {
      const result = this.cartService.updateQuantity(itemId, item.quantity + 1);
      if (result && typeof result.subscribe === 'function') {
        result.subscribe({
          next: () => this.cdr.detectChanges(),
          error: (err: any) => console.error('Error updating quantity:', err)
        });
      } else {
        // For guest users (non-observable)
        this.cdr.detectChanges();
      }
    }
  }

  decrease(itemId: string) {
    const item = this.cart.items.find(i => (i._id || i.menuItemId) === itemId);
    if (item && item.quantity > 1) {
      const result = this.cartService.updateQuantity(itemId, item.quantity - 1);
      if (result && typeof result.subscribe === 'function') {
        result.subscribe({
          next: () => this.cdr.detectChanges(),
          error: (err: any) => console.error('Error updating quantity:', err)
        });
      } else {
        // For guest users (non-observable)
        this.cdr.detectChanges();
      }
    }
  }

  remove(itemId: string) {
    const result = this.cartService.removeItem(itemId);
    if (result && typeof result.subscribe === 'function') {
      result.subscribe({
        next: () => this.cdr.detectChanges(),
        error: (err: any) => console.error('Error removing item:', err)
      });
    } else {
      // For guest users (non-observable)
      this.cdr.detectChanges();
    }
  }


}
