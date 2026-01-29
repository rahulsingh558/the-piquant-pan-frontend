import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    phone: string;
    profilePicture: string;
    addresses: Address[];
    provider?: string;
    role?: string;
}

export interface Address {
    name?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    pincode?: string;
    landmark?: string;
    isDefault?: boolean;
}

export interface UpdateProfileData {
    name?: string;
    phone?: string;
    profilePicture?: string;
    address?: Address;
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private API_URL = 'http://localhost:5001/api/user';
    private isBrowser: boolean;

    constructor(
        private http: HttpClient,
        @Inject(PLATFORM_ID) platformId: Object
    ) {
        this.isBrowser = isPlatformBrowser(platformId);
    }

    /**
     * Get authenticated user's profile
     */
    getUserProfile(): Observable<{ success: boolean; user: UserProfile }> {
        const headers = this.getAuthHeaders();
        return this.http.get<{ success: boolean; user: UserProfile }>(
            `${this.API_URL}/profile`,
            { headers }
        );
    }

    /**
     * Update user profile
     */
    updateUserProfile(profileData: UpdateProfileData): Observable<{ success: boolean; message: string; user: UserProfile }> {
        const headers = this.getAuthHeaders();
        return this.http.put<{ success: boolean; message: string; user: UserProfile }>(
            `${this.API_URL}/profile`,
            profileData,
            { headers }
        );
    }

    /**
     * Get auth headers with JWT token
     */
    private getAuthHeaders(): HttpHeaders {
        if (!this.isBrowser) {
            return new HttpHeaders();
        }

        const token = localStorage.getItem('token');
        return new HttpHeaders({
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        });
    }
}
