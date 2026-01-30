import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface CartItem {
    _id?: string;
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
    customizations?: any;
}

export interface Cart {
    items: CartItem[];
    total: number;
    itemCount: number;
}

@Injectable({
    providedIn: 'root'
})
export class CartService {
    private API_URL = `${environment.apiUrl}/cart`;
    private COOKIE_NAME = 'guest_cart';
    private COOKIE_EXPIRY_DAYS = 7;

    private cartSubject = new BehaviorSubject<Cart>({
        items: [],
        total: 0,
        itemCount: 0
    });

    public cart$ = this.cartSubject.asObservable();

    private isBrowser: boolean;

    constructor(
        private http: HttpClient,
        @Inject(PLATFORM_ID) platformId: Object
    ) {
        this.isBrowser = isPlatformBrowser(platformId);
        // Initialize cart on service creation (only in browser)
        if (this.isBrowser) {
            this.loadCart();
        }
    }

    // Check if user is logged in
    private isLoggedIn(): boolean {
        if (!this.isBrowser) return false;
        const token = localStorage.getItem('token');
        return !!token;
    }

    // Load cart from appropriate source
    loadCart(): void {
        if (this.isLoggedIn()) {
            this.loadFromAPI();
        } else {
            this.loadFromCookies();
        }
    }

    // Load cart from API (logged-in users)
    private loadFromAPI(): void {
        this.http.get<any>(this.API_URL).subscribe({
            next: (response) => {
                if (response.success) {
                    this.cartSubject.next(response.cart);
                }
            },
            error: (error) => {
                console.error('Error loading cart from API:', error);
                // Fallback to cookies if API fails
                this.loadFromCookies();
            }
        });
    }

    // Load cart from cookies (guest users)
    private loadFromCookies(): void {
        const cart = this.getCookieCart();
        this.calculateTotals(cart);
        this.cartSubject.next(cart);
    }

    // Get cart from cookies
    private getCookieCart(): Cart {
        const cookieValue = this.getCookie(this.COOKIE_NAME);
        if (cookieValue) {
            try {
                const items = JSON.parse(decodeURIComponent(cookieValue));
                return {
                    items: items || [],
                    total: 0,
                    itemCount: 0
                };
            } catch (e) {
                console.error('Error parsing cart cookie:', e);
            }
        }
        return { items: [], total: 0, itemCount: 0 };
    }

    // Save cart to cookies
    private saveToCookie(items: CartItem[]): void {
        const value = encodeURIComponent(JSON.stringify(items));
        const expires = new Date();
        expires.setDate(expires.getDate() + this.COOKIE_EXPIRY_DAYS);
        document.cookie = `${this.COOKIE_NAME}=${value};expires=${expires.toUTCString()};path=/`;
    }

    // Get cookie value
    private getCookie(name: string): string | null {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    // Delete cookie
    private deleteCookie(): void {
        document.cookie = `${this.COOKIE_NAME}=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/`;
    }

    // Calculate totals
    private calculateTotals(cart: Cart): void {
        cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    }

    // Add item to cart
    addToCart(item: CartItem): Observable<any> | void {
        if (this.isLoggedIn()) {
            return this.http.post<any>(`${this.API_URL}/add`, item).pipe(
                tap(response => {
                    if (response.success) {
                        this.cartSubject.next(response.cart);
                    }
                })
            );
        } else {
            const cart = this.cartSubject.value;
            const existingItem = cart.items.find(i =>
                i.menuItemId === item.menuItemId &&
                JSON.stringify(i.customizations) === JSON.stringify(item.customizations)
            );

            if (existingItem) {
                existingItem.quantity += item.quantity;
            } else {
                cart.items.push(item);
            }

            this.calculateTotals(cart);
            this.saveToCookie(cart.items);
            this.cartSubject.next({ ...cart });
        }
    }

    // Update item quantity
    updateQuantity(itemId: string, quantity: number): Observable<any> | void {
        if (this.isLoggedIn()) {
            return this.http.put<any>(`${this.API_URL}/update/${itemId}`, { quantity }).pipe(
                tap(response => {
                    if (response.success) {
                        this.cartSubject.next(response.cart);
                    }
                })
            );
        } else {
            const cart = this.cartSubject.value;
            const itemIndex = cart.items.findIndex(i => i.menuItemId === itemId);

            if (itemIndex !== -1) {
                if (quantity <= 0) {
                    cart.items.splice(itemIndex, 1);
                } else {
                    cart.items[itemIndex].quantity = quantity;
                }
            }

            this.calculateTotals(cart);
            this.saveToCookie(cart.items);
            this.cartSubject.next({ ...cart });
        }
    }

    // Remove item
    removeItem(itemId: string): Observable<any> | void {
        if (this.isLoggedIn()) {
            return this.http.delete<any>(`${this.API_URL}/remove/${itemId}`).pipe(
                tap(response => {
                    if (response.success) {
                        this.cartSubject.next(response.cart);
                    }
                })
            );
        } else {
            const cart = this.cartSubject.value;
            cart.items = cart.items.filter(i => i.menuItemId !== itemId);

            this.calculateTotals(cart);
            this.saveToCookie(cart.items);
            this.cartSubject.next({ ...cart });
        }
    }

    // Clear cart
    clearCart(): Observable<any> | void {
        if (this.isLoggedIn()) {
            return this.http.delete<any>(`${this.API_URL}/clear`).pipe(
                tap(response => {
                    if (response.success) {
                        this.cartSubject.next(response.cart);
                    }
                })
            );
        } else {
            const cart: Cart = { items: [], total: 0, itemCount: 0 };
            this.deleteCookie();
            this.cartSubject.next(cart);
        }
    }

    // Merge guest cart with user cart (call on login)
    migrateGuestCart(): Observable<any> {
        const guestCart = this.getCookieCart();

        if (guestCart.items.length === 0) {
            // No guest cart to migrate, just load user cart
            this.loadFromAPI();
            return new Observable(observer => {
                observer.next({ success: true });
                observer.complete();
            });
        }

        return this.http.post<any>(`${this.API_URL}/merge`, { items: guestCart.items }).pipe(
            tap(response => {
                if (response.success) {
                    this.cartSubject.next(response.cart);
                    // Clear guest cart cookie after successful merge
                    this.deleteCookie();
                }
            })
        );
    }

    // Get current cart value
    getCart(): Cart {
        return this.cartSubject.value;
    }

    // Get total
    getTotal(): number {
        return this.cartSubject.value.total;
    }

    // Get item count
    getItemCount(): number {
        return this.cartSubject.value.itemCount;
    }
}
