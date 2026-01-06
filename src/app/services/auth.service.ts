import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface User {
    id: string;
    name: string;
    email: string;
    role?: string;
}

export interface AuthResponse {
    token: string;
    user: User;
    message?: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private API_URL = 'http://localhost:5001/api/auth';

    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();
    private isBrowser: boolean;

    constructor(
        private http: HttpClient,
        @Inject(PLATFORM_ID) platformId: Object
    ) {
        this.isBrowser = isPlatformBrowser(platformId);
        // Load user from localStorage on service init (only in browser)
        if (this.isBrowser) {
            this.loadUserFromStorage();
        }
    }

    private loadUserFromStorage(): void {
        if (!this.isBrowser) return;

        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('userData');

        if (token && userData) {
            try {
                const user = JSON.parse(userData);
                this.currentUserSubject.next(user);
            } catch (e) {
                console.error('Error parsing user data:', e);
            }
        }
    }

    /**
     * Register new user
     */
    register(name: string, email: string, password: string): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.API_URL}/register`, {
            name,
            email,
            password
        }).pipe(
            tap(response => {
                if (response.token && response.user) {
                    this.handleAuthSuccess(response);
                }
            })
        );
    }

    /**
     * Login existing user
     */
    login(email: string, password: string): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.API_URL}/login`, {
            email,
            password
        }).pipe(
            tap(response => {
                if (response.token && response.user) {
                    this.handleAuthSuccess(response);
                }
            })
        );
    }

    /**
     * Handle successful authentication
     */
    private handleAuthSuccess(response: AuthResponse): void {
        if (!this.isBrowser) return;
        // Store token
        localStorage.setItem('token', response.token);

        // Store user data
        localStorage.setItem('userData', JSON.stringify(response.user));

        // For backwards compatibility with existing code
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userEmail', response.user.email);
        localStorage.setItem('userName', response.user.name);

        // Update current user subject
        this.currentUserSubject.next(response.user);
    }

    /**
     * Logout user
     */
    logout(): void {
        if (!this.isBrowser) return;
        // Clear all auth data
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
        localStorage.removeItem('authProvider');

        // Update current user subject
        this.currentUserSubject.next(null);
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        if (!this.isBrowser) return false;
        return !!localStorage.getItem('token');
    }

    /**
     * Get stored JWT token
     */
    getToken(): string | null {
        if (!this.isBrowser) return null;
        return localStorage.getItem('token');
    }

    /**
     * Get current user
     */
    getCurrentUser(): User | null {
        return this.currentUserSubject.value;
    }

    /**
     * Get current user observable
     */
    getCurrentUser$(): Observable<User | null> {
        return this.currentUser$;
    }
}
