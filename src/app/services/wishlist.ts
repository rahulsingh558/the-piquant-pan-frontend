import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private isBrowser = false;
  private wishlistSubject = new BehaviorSubject<any[]>([]);
  wishlist$ = this.wishlistSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);

    if (this.isBrowser) {
      const saved = localStorage.getItem('wishlist');
      this.wishlistSubject.next(saved ? JSON.parse(saved) : []);
    }
  }

  getWishlist(): any[] {
    return this.wishlistSubject.value;
  }

  isWishlisted(id: number): boolean {
    return this.wishlistSubject.value.some(item => item.id === id);
  }

  toggle(item: any) {
    let wishlist = this.wishlistSubject.value;

    if (this.isWishlisted(item.id)) {
      wishlist = wishlist.filter(i => i.id !== item.id);
    } else {
      wishlist = [...wishlist, item];
    }

    this.wishlistSubject.next(wishlist);

    if (this.isBrowser) {
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
    }
  }
}