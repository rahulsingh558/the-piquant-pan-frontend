import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface WishlistItem {
  id: number;
  name: string;
  basePrice: number;
}

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private wishlistSubject: BehaviorSubject<WishlistItem[]>;
  private wishlistKey = 'wishlist';

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    // Initialize with empty array or from localStorage
    let initialWishlist: WishlistItem[] = [];
    
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem(this.wishlistKey);
      initialWishlist = saved ? JSON.parse(saved) : [];
    }
    
    this.wishlistSubject = new BehaviorSubject<WishlistItem[]>(initialWishlist);
  }

  // Observable for wishlist items
  get wishlist$(): Observable<WishlistItem[]> {
    return this.wishlistSubject.asObservable();
  }

  // Observable for wishlist count
  get wishlistCount$(): Observable<number> {
    return this.wishlistSubject.asObservable().pipe(
      map(items => items.length)
    );
  }

  // Get current wishlist
  getWishlist(): WishlistItem[] {
    return this.wishlistSubject.getValue();
  }

  // Add item to wishlist
  addToWishlist(item: WishlistItem): void {
    const currentWishlist = this.getWishlist();
    
    // Check if item already exists
    if (!currentWishlist.some(wishlistItem => wishlistItem.id === item.id)) {
      const updatedWishlist = [...currentWishlist, item];
      this.updateWishlist(updatedWishlist);
    }
  }

  // Remove item from wishlist
  removeFromWishlist(id: number): void {
    const currentWishlist = this.getWishlist();
    const updatedWishlist = currentWishlist.filter(item => item.id !== id);
    this.updateWishlist(updatedWishlist);
  }

  // Check if item is in wishlist
  isInWishlist(id: number): boolean {
    return this.getWishlist().some(item => item.id === id);
  }

  // Clear wishlist
  clearWishlist(): void {
    this.updateWishlist([]);
  }

  // Update wishlist and persist to localStorage
  private updateWishlist(wishlist: WishlistItem[]): void {
    this.wishlistSubject.next(wishlist);
    
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.wishlistKey, JSON.stringify(wishlist));
    }
  }
}