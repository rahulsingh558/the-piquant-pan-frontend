import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Address } from '../pages/address/address';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AddressService {
  private API_URL = `${environment.apiUrl}/addresses`;
  private addressesSubject: BehaviorSubject<Address[]>;
  private selectedAddressIndexKey = 'selectedAddressIndex';
  private isBrowser = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.addressesSubject = new BehaviorSubject<Address[]>([]);

    // Load addresses if user is authenticated
    if (this.isBrowser && this.authService.isAuthenticated()) {
      this.loadAddresses();
    }
  }

  // Get all addresses
  get addresses$(): Observable<Address[]> {
    return this.addressesSubject.asObservable();
  }

  // Get addresses synchronously
  getAddresses(): Address[] {
    return this.addressesSubject.getValue();
  }

  // Load addresses from API
  loadAddresses(): void {
    console.log('🔵 [AddressService] loadAddresses called');
    console.log('🔵 [AddressService] isAuthenticated:', this.authService.isAuthenticated());

    if (!this.authService.isAuthenticated()) {
      console.log('⚠️ [AddressService] User not authenticated, skipping address load');
      this.addressesSubject.next([]);
      return;
    }

    console.log('🔵 [AddressService] Fetching addresses from API...');
    this.http.get<Address[]>(this.API_URL, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(error => {
          console.error('❌ [AddressService] Failed to load addresses:', error);
          return of([]);
        })
      )
      .subscribe(addresses => {
        console.log('✅ [AddressService] Addresses loaded:', addresses.length);
        this.addressesSubject.next(addresses);
      });
  }

  // Get selected address
  getSelectedAddress(): Address | null {
    if (!this.isBrowser) return null;
    const selectedIndex = localStorage.getItem(this.selectedAddressIndexKey);
    if (selectedIndex === null) return null;

    const addresses = this.getAddresses();
    const index = parseInt(selectedIndex);
    return addresses[index] || null;
  }

  // Add new address
  addAddress(address: Omit<Address, 'id'>): Observable<Address> {
    const addressData = {
      ...address,
      addressLine2: address.addressLine2 || '',
      landmark: address.landmark || ''
    };

    return this.http.post<Address>(this.API_URL, addressData, { headers: this.getAuthHeaders() })
      .pipe(
        tap(() => {
          // Reload addresses after adding
          this.loadAddresses();
        }),
        catchError(error => {
          console.error('Failed to add address:', error);
          throw error;
        })
      );
  }

  // Update existing address
  updateAddress(index: number, updatedAddress: Partial<Address>): Observable<Address> {
    return this.http.put<Address>(`${this.API_URL}/${index}`, updatedAddress, { headers: this.getAuthHeaders() })
      .pipe(
        tap(() => {
          // Reload addresses after updating
          this.loadAddresses();
        }),
        catchError(error => {
          console.error('Failed to update address:', error);
          throw error;
        })
      );
  }

  // Delete address
  deleteAddress(index: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/${index}`, { headers: this.getAuthHeaders() })
      .pipe(
        tap(() => {
          // Clear selection if we deleted the selected address
          if (this.isBrowser) {
            const selectedIndex = localStorage.getItem(this.selectedAddressIndexKey);
            if (selectedIndex && parseInt(selectedIndex) === index) {
              localStorage.removeItem(this.selectedAddressIndexKey);
            }
          }
          // Reload addresses after deleting
          this.loadAddresses();
        }),
        catchError(error => {
          console.error('Failed to delete address:', error);
          throw error;
        })
      );
  }

  // Set selected address (by index)
  setSelectedAddress(index: number): void {
    if (this.isBrowser) {
      localStorage.setItem(this.selectedAddressIndexKey, index.toString());
    }
  }

  // Clear selected address
  clearSelectedAddress(): void {
    if (this.isBrowser) {
      localStorage.removeItem(this.selectedAddressIndexKey);
    }
  }

  // Set default address
  setDefaultAddress(index: number): Observable<Address> {
    return this.http.patch<Address>(`${this.API_URL}/${index}/default`, {}, { headers: this.getAuthHeaders() })
      .pipe(
        tap(() => {
          // Auto-select the default address
          this.setSelectedAddress(index);
          // Reload addresses after setting default
          this.loadAddresses();
        }),
        catchError(error => {
          console.error('Failed to set default address:', error);
          throw error;
        })
      );
  }

  // Get auth headers
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }
}