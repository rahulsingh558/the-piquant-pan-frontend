import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AddressService } from '../../services/address.service';
import { Address, AddressFormData } from '../../pages/address/address';
import { CartService } from '../../services/cart';

@Component({
  standalone: true,
  selector: 'app-address-select',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './address-select.component.html',
})
export class AddressSelectComponent implements OnInit {
  addresses: Address[] = [];
  selectedAddressId: number | null = null;
  showAddressForm = false;
  isEditing = false;
  editingAddressId: number | null = null;
  cartTotal = 0;
  isBrowser = false;
  
  addressForm: FormGroup;

  constructor(
    private addressService: AddressService,
    private cartService: CartService,
    private router: Router,
    private fb: FormBuilder,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    
    // Initialize form
    this.addressForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      addressLine1: ['', [Validators.required, Validators.minLength(5)]],
      addressLine2: [''],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      pincode: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
      landmark: [''],
      isDefault: [false]
    });
  }

  ngOnInit() {
    // Subscribe to addresses
    this.addressService.addresses$.subscribe(addresses => {
      this.addresses = addresses;
      
      // Auto-select default address if none selected
      if (this.isBrowser && !this.selectedAddressId) {
        const defaultAddress = addresses.find(addr => addr.isDefault);
        if (defaultAddress) {
          this.selectedAddressId = defaultAddress.id;
          this.addressService.setSelectedAddress(defaultAddress.id);
        }
      }
    });

    // Get cart total
    this.cartService.cart$.subscribe(items => {
      this.cartTotal = items.reduce((sum, item) => 
        sum + (item.totalPrice * item.quantity), 0);
    });

    // Load initially selected address
    if (this.isBrowser) {
      const selectedAddress = this.addressService.getSelectedAddress();
      if (selectedAddress) {
        this.selectedAddressId = selectedAddress.id;
      }
    }
  }

  // Get selected address object
  get selectedAddress(): Address | null {
    return this.addresses.find(addr => addr.id === this.selectedAddressId) || null;
  }

  // Select an address
  selectAddress(addressId: number) {
    this.selectedAddressId = addressId;
    this.addressService.setSelectedAddress(addressId);
  }

  // Set as default address
  setDefaultAddress(addressId: number, event: Event) {
    event.stopPropagation();
    this.addressService.setDefaultAddress(addressId);
  }

  // Delete address
  deleteAddress(addressId: number, event: Event) {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this address?')) {
      this.addressService.deleteAddress(addressId);
      if (this.selectedAddressId === addressId) {
        this.selectedAddressId = null;
      }
    }
  }

  // Show add address form
  showAddForm() {
    this.showAddressForm = true;
    this.isEditing = false;
    this.editingAddressId = null;
    this.addressForm.reset({
      isDefault: false
    });
  }

  // Show edit address form
  showEditForm(address: Address, event: Event) {
    event.stopPropagation();
    this.showAddressForm = true;
    this.isEditing = true;
    this.editingAddressId = address.id;
    
    this.addressForm.patchValue({
      name: address.name,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      landmark: address.landmark || '',
      isDefault: address.isDefault
    });
  }

  // Submit address form
  submitAddress() {
    if (this.addressForm.invalid) {
      this.markFormGroupTouched(this.addressForm);
      return;
    }

    const formData: AddressFormData = this.addressForm.value;

    if (this.isEditing && this.editingAddressId) {
      this.addressService.updateAddress(this.editingAddressId, formData);
    } else {
      this.addressService.addAddress(formData);
    }

    this.cancelForm();
  }

  // Cancel form
  cancelForm() {
    this.showAddressForm = false;
    this.isEditing = false;
    this.editingAddressId = null;
    this.addressForm.reset({
      isDefault: false
    });
  }

  // Proceed to checkout
  proceedToCheckout() {
    if (!this.selectedAddressId) {
      alert('Please select a delivery address');
      return;
    }

    this.router.navigate(['/checkout']);
  }

  // Back to cart
  backToCart() {
    this.router.navigate(['/cart']);
  }

  // Helper method to mark all form controls as touched
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Get formatted address string
  getFormattedAddress(address: Address): string {
    let parts = [
      address.addressLine1,
      address.addressLine2,
      address.city,
      address.state,
      address.pincode,
      address.landmark
    ].filter(part => part && part.trim() !== '');
    
    return parts.join(', ');
  }
}