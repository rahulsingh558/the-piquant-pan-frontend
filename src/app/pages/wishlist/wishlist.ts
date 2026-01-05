import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { CartService } from '../../services/cart';
import { Router } from '@angular/router';


@Component({
  standalone: true,
  imports: [CommonModule],
  templateUrl: './wishlist.html',
})
export class Wishlist {
  isBrowser = false;
  isLoggedIn = false;

  wishlist: {
    id: number;
    name: string;
    basePrice: number;
  }[] = [];

  constructor(
    private cartService: CartService,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    if (this.isBrowser) {
      this.isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

      this.wishlist = JSON.parse(
        localStorage.getItem('wishlist') || '[]'
      );
    }
  }

  addToCart(item: {
    id: number;
    name: string;
    basePrice: number;
  }) {
    this.cartService.addToCart({
      foodId: item.id,
      name: item.name,
      basePrice: item.basePrice,
      addons: [],
      quantity: 1,
      totalPrice: item.basePrice,
    });

    this.remove(item.id);
  }

  remove(id: number) {
    this.wishlist = this.wishlist.filter(item => item.id !== id);

    if (this.isBrowser) {
      localStorage.setItem('wishlist', JSON.stringify(this.wishlist));
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}