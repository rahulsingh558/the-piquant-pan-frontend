import { Component, Inject, PLATFORM_ID, OnInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart';
import { AddressService } from '../../services/address.service';
import { Address } from '../../pages/address/address';
import { CartItem } from '../../models/cart-item';


interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  description: string;
}

interface OnlinePaymentMethod {
  id: string;
  name: string;
  icon: string;
  description: string;
}

@Component({
  standalone: true,
  templateUrl: './checkout.html',
  imports: [CommonModule, FormsModule],
})
export class Checkout implements OnInit {
  selectedAddress: Address | null = null;
  items: CartItem[] = [];
  isPlacingOrder = false;
  isBrowser = false;
  deliveryInstructions = '';
  paymentMethod = 'cod'; // 'cod' or 'online'
  
  // Online payment fields
  showOnlinePaymentForm = false;
  onlinePaymentMethod = 'upi'; // 'upi', 'card', 'netbanking', 'wallet'
  upiId = '';
  cardNumber = '';
  cardExpiry = '';
  cardCvv = '';
  cardName = '';
  walletType = 'paytm';
  selectedBank = 'hdfc';
  isProcessingPayment = false;

  // Payment methods
  paymentMethods: PaymentMethod[] = [
    { id: 'cod', name: 'Cash on Delivery', icon: '💵', description: 'Pay when you receive' },
    { id: 'online', name: 'Pay Online', icon: '💳', description: 'Card, UPI, Net Banking' }
  ];

  onlinePaymentMethods: OnlinePaymentMethod[] = [
    { id: 'upi', name: 'UPI', icon: '📱', description: 'Google Pay, PhonePe, Paytm' },
    { id: 'card', name: 'Credit/Debit Card', icon: '💳', description: 'Visa, Mastercard, RuPay' },
    { id: 'netbanking', name: 'Net Banking', icon: '🏦', description: 'All major banks' },
    { id: 'wallet', name: 'Wallet', icon: '👛', description: 'Paytm, PhonePe, Amazon Pay' },
  ];

  banks = [
    { id: 'hdfc', name: 'HDFC Bank' },
    { id: 'icici', name: 'ICICI Bank' },
    { id: 'sbi', name: 'State Bank of India' },
    { id: 'axis', name: 'Axis Bank' },
    { id: 'kotak', name: 'Kotak Mahindra Bank' },
  ];

  wallets = [
    { id: 'paytm', name: 'Paytm', icon: '📱' },
    { id: 'phonepe', name: 'PhonePe', icon: '📱' },
    { id: 'amazonpay', name: 'Amazon Pay', icon: '📦' },
    { id: 'gpay', name: 'Google Pay', icon: '📱' },
  ];

  constructor(
    private cartService: CartService,
    private addressService: AddressService,
    public router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    // Get cart items
    this.cartService.cart$.subscribe(items => {
      this.items = items;
      if (items.length === 0) {
        this.router.navigate(['/cart']);
      }
    });

    // Get selected address
    if (this.isBrowser) {
      this.selectedAddress = this.addressService.getSelectedAddress();
      
      // If no address selected, redirect to address select page
      if (!this.selectedAddress) {
        this.router.navigate(['/address-select']);
      }
    }
  }

  // Helper method to get payment method name
  getPaymentMethodName(): string {
    const method = this.paymentMethods.find(m => m.id === this.paymentMethod);
    return method ? method.name : '';
  }

  // Helper method to get online payment method name
  getOnlinePaymentMethodName(): string {
    const method = this.onlinePaymentMethods.find(m => m.id === this.onlinePaymentMethod);
    return method ? method.name : '';
  }

  // Helper method to get wallet name
  getWalletName(): string {
    const wallet = this.wallets.find(w => w.id === this.walletType);
    return wallet ? wallet.name : '';
  }

  isFormValid(): boolean {
    // Basic validation
    if (!this.selectedAddress || this.items.length === 0) {
      return false;
    }

    // Additional validation for online payment
    if (this.paymentMethod === 'online') {
      return this.isOnlinePaymentValid();
    }

    return true;
  }

  isOnlinePaymentValid(): boolean {
    switch (this.onlinePaymentMethod) {
      case 'upi':
        return this.upiId.trim().length > 0 && this.upiId.includes('@');
      case 'card':
        return this.cardNumber.replace(/\s/g, '').length === 16 &&
               this.cardExpiry.trim().length === 5 &&
               this.cardCvv.trim().length >= 3 &&
               this.cardName.trim().length > 0;
      case 'netbanking':
        return true; // Bank is pre-selected
      case 'wallet':
        return true; // Wallet is pre-selected
      default:
        return false;
    }
  }

  getGrandTotal(): number {
    return this.items.reduce(
      (sum, item) => sum + item.totalPrice * item.quantity,
      0
    );
  }

  getDeliveryCharge(): number {
    return 0; // Free delivery
  }

  getGst(): number {
    return this.paymentMethod === 'online' ? this.getGrandTotal() * 0.05 : 0;
  }

  getTotalAmount(): number {
    return this.getGrandTotal() + this.getDeliveryCharge() + this.getGst();
  }

  changeAddress() {
    this.router.navigate(['/address-select']);
  }

  onPaymentMethodChange() {
    if (this.paymentMethod === 'online') {
      this.showOnlinePaymentForm = true;
    } else {
      this.showOnlinePaymentForm = false;
      this.isProcessingPayment = false;
    }
  }

  generateUpiId() {
    const sampleUpiIds = [
      'user@oksbi',
      'user@ybl',
      'user@upi',
      'user@paytm'
    ];
    this.upiId = sampleUpiIds[Math.floor(Math.random() * sampleUpiIds.length)];
  }

  formatCardNumber(event: any) {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length > 16) value = value.substring(0, 16);
    value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    this.cardNumber = value;
  }

  formatExpiry(event: any) {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.substring(0, 4);
    if (value.length > 2) {
      value = value.substring(0, 2) + '/' + value.substring(2);
    }
    this.cardExpiry = value;
  }

  processOnlinePayment() {
    if (!this.isOnlinePaymentValid()) return;

    this.isProcessingPayment = true;

    // Simulate payment processing
    setTimeout(() => {
      this.isProcessingPayment = false;
      this.placeOrder();
    }, 2000);
  }

  placeOrder() {
    if (!this.isBrowser || !this.isFormValid()) return;

    this.isPlacingOrder = true;

    const order = {
      id: 'ORD-' + Date.now(),
      date: new Date().toISOString(),
      customer: {
        name: this.selectedAddress?.name || '',
        phone: this.selectedAddress?.phone || '',
        address: this.getFormattedAddress(),
      },
      deliveryInstructions: this.deliveryInstructions,
      paymentMethod: this.paymentMethod,
      onlinePaymentMethod: this.paymentMethod === 'online' ? this.onlinePaymentMethod : null,
      items: this.items.map(item => ({
        ...item,
        total: item.totalPrice * item.quantity
      })),
      subtotal: this.getGrandTotal(),
      deliveryCharge: this.getDeliveryCharge(),
      gst: this.getGst(),
      total: this.getTotalAmount(),
      status: this.paymentMethod === 'online' ? 'confirmed' : 'confirmed',
      paymentStatus: this.paymentMethod === 'online' ? 'paid' : 'cod',
      transactionId: this.paymentMethod === 'online' ? 'TXN' + Date.now() : 'COD' + Date.now()
    };

    // Save order to localStorage
    const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    localStorage.setItem('orders', JSON.stringify([order, ...existingOrders]));

    setTimeout(() => {
      this.isPlacingOrder = false;
      this.cartService.clearCart();
      
      const message = this.paymentMethod === 'online' 
        ? 'Payment successful! Order placed.' 
        : 'Order placed successfully! You will receive a confirmation call shortly.';
      
      alert(message);
      this.router.navigate(['/orders']);
    }, 800);
  }

  private getFormattedAddress(): string {
    if (!this.selectedAddress) return '';
    
    const parts = [
      this.selectedAddress.addressLine1,
      this.selectedAddress.addressLine2,
      this.selectedAddress.city,
      this.selectedAddress.state,
      this.selectedAddress.pincode,
      this.selectedAddress.landmark
    ].filter(part => part && part.trim() !== '');
    
    return parts.join(', ');
  }
}