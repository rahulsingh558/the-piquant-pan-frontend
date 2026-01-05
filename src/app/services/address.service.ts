import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { Address } from '../pages/address/address';

@Injectable({
  providedIn: 'root'
})
export class AddressService {
  private addressesSubject: BehaviorSubject<Address[]>;
  private addressesKey = 'userAddresses';
  private selectedAddressKey = 'selectedAddress';
  private isBrowser = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    
    let initialAddresses: Address[] = [];
    
    if (this.isBrowser) {
      const saved = localStorage.getItem(this.addressesKey);
      initialAddresses = saved ? JSON.parse(saved) : [];
      
      // Add some sample addresses for testing if none exist
      if (initialAddresses.length === 0) {
        initialAddresses = this.getSampleAddresses();
        this.saveToLocalStorage(initialAddresses);
      }
    }
    
    this.addressesSubject = new BehaviorSubject<Address[]>(initialAddresses);
  }

  // Get all addresses
  get addresses$(): Observable<Address[]> {
    return this.addressesSubject.asObservable();
  }

  // Get addresses synchronously
  getAddresses(): Address[] {
    return this.addressesSubject.getValue();
  }

  // Get selected address
  getSelectedAddress(): Address | null {
    if (!this.isBrowser) return null;
    const selectedId = localStorage.getItem(this.selectedAddressKey);
    if (!selectedId) return null;
    
    const addresses = this.getAddresses();
    return addresses.find(addr => addr.id === parseInt(selectedId)) || null;
  }

  // Add new address
  addAddress(address: Omit<Address, 'id'>): void {
    const addresses = this.getAddresses();
    const newId = addresses.length > 0 ? Math.max(...addresses.map(a => a.id)) + 1 : 1;
    
    const newAddress: Address = {
      ...address,
      id: newId
    };
    
    // If this is set as default, remove default from others
    if (newAddress.isDefault) {
      addresses.forEach(addr => addr.isDefault = false);
    }
    
    const updatedAddresses = [...addresses, newAddress];
    this.updateAddresses(updatedAddresses);
  }

  // Update existing address
  updateAddress(id: number, updatedAddress: Partial<Address>): void {
    const addresses = this.getAddresses();
    const index = addresses.findIndex(addr => addr.id === id);
    
    if (index !== -1) {
      // If setting as default, remove default from others
      if (updatedAddress.isDefault === true) {
        addresses.forEach(addr => addr.isDefault = false);
      }
      
      addresses[index] = { ...addresses[index], ...updatedAddress };
      this.updateAddresses(addresses);
    }
  }

  // Delete address
  deleteAddress(id: number): void {
    const addresses = this.getAddresses().filter(addr => addr.id !== id);
    
    // If we deleted the selected address, clear selection
    if (this.isBrowser) {
      const selectedId = localStorage.getItem(this.selectedAddressKey);
      if (selectedId && parseInt(selectedId) === id) {
        localStorage.removeItem(this.selectedAddressKey);
      }
    }
    
    this.updateAddresses(addresses);
  }

  // Set selected address
  setSelectedAddress(id: number): void {
    if (this.isBrowser) {
      localStorage.setItem(this.selectedAddressKey, id.toString());
    }
  }

  // Clear selected address
  clearSelectedAddress(): void {
    if (this.isBrowser) {
      localStorage.removeItem(this.selectedAddressKey);
    }
  }

  // Set default address
  setDefaultAddress(id: number): void {
    const addresses = this.getAddresses();
    const updatedAddresses = addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === id
    }));
    
    this.updateAddresses(updatedAddresses);
    this.setSelectedAddress(id);
  }

  // Private method to update addresses
  private updateAddresses(addresses: Address[]): void {
    this.addressesSubject.next(addresses);
    this.saveToLocalStorage(addresses);
  }

  // Save to localStorage
  private saveToLocalStorage(addresses: Address[]): void {
    if (this.isBrowser) {
      localStorage.setItem(this.addressesKey, JSON.stringify(addresses));
    }
  }

  // Sample addresses for testing
  private getSampleAddresses(): Address[] {
    return [
      {
        id: 1,
        name: 'John Doe',
        phone: '9876543210',
        addressLine1: '123 Main Street',
        addressLine2: 'Apartment 4B',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        landmark: 'Near Central Park',
        isDefault: true
      },
      {
        id: 2,
        name: 'Jane Smith',
        phone: '9876543211',
        addressLine1: '456 Oak Avenue',
        addressLine2: 'Floor 2',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110001',
        landmark: 'Opposite Metro Station',
        isDefault: false
      },
      {
        id: 3,
        name: 'Robert Johnson',
        phone: '9876543212',
        addressLine1: '789 Pine Road',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560001',
        landmark: 'Next to Mall',
        isDefault: false
      }
    ];
  }
}