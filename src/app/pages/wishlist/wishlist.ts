import { Component, Inject, PLATFORM_ID, OnInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { CartService } from '../../services/cart.service';
import { WishlistService } from '../../services/wishlist.service';
import { Router } from '@angular/router';


@Component({
  standalone: true,
  imports: [CommonModule],
  templateUrl: './wishlist.html',
})
export class Wishlist implements OnInit {
  isBrowser = false;
  isLoggedIn = false;

  wishlist: {
    id: number;
    name: string;
    basePrice: number;
  }[] = [];

  constructor(
    private cartService: CartService,
    private wishlistService: WishlistService,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    if (this.isBrowser) {
      this.isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    }
  }

  ngOnInit() {
    if (this.isBrowser) {
      // Subscribe to wishlist service
      this.wishlistService.wishlist$.subscribe(items => {
        this.wishlist = items;
      });
    }
  }

  addToCart(item: {
    id: number;
    name: string;
    basePrice: number;
  }) {
    const result = this.cartService.addToCart({
      menuItemId: String(item.id),
      name: item.name,
      price: item.basePrice,
      quantity: 1,
      customizations: {}
    });

    // Subscribe if it's an observable (logged-in user)
    if (result && typeof result.subscribe === 'function') {
      result.subscribe({
        next: () => console.log('Item added to cart from wishlist'),
        error: (err: any) => console.error('Error adding to cart:', err)
      });
    }

    this.remove(item.id);
  }

  remove(id: number) {
    this.wishlistService.removeFromWishlist(id);
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}