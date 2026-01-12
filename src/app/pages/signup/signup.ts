import { Component, ViewChildren, QueryList, ElementRef, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';

@Component({
  standalone: true,
  selector: 'app-signup',
  imports: [CommonModule, FormsModule],
  templateUrl: './signup.html',
})
export class Signup implements OnInit {
  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef>;

  // Signup form fields
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  phone = '';
  acceptTerms = false;
  error = '';
  showPass = false;
  showConfirmPass = false;

  // WhatsApp modal
  showWhatsAppModal = false;
  whatsappNumber = '';
  countryCode = '+91';
  otpSent = false;
  otp: string[] = ['', '', '', '', '', ''];
  resendTimer = 0;
  generatedOTP = '';
  otpInterval: any;

  constructor(
    private router: Router,
    private cartService: CartService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/menu']);
    }
  }

  // Main signup method
  signup() {
    this.error = '';

    // Validation
    if (!this.name || !this.email || !this.password || !this.confirmPassword) {
      this.error = 'Please fill in all required fields';
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.error = 'Please enter a valid email address';
      return;
    }

    // Password validation
    if (this.password.length < 6) {
      this.error = 'Password must be at least 6 characters long';
      return;
    }

    // Password match validation
    if (this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }

    // Terms acceptance
    if (!this.acceptTerms) {
      this.error = 'Please accept the terms and conditions';
      return;
    }

    console.log('Signing up with:', {
      name: this.name,
      email: this.email,
      phone: this.phone
    });

    // Call register API
    this.authService.register(this.name, this.email, this.password).subscribe({
      next: (response) => {
        console.log('Registration successful', response);

        // Migrate guest cart after successful signup
        this.cartService.migrateGuestCart().subscribe({
          next: () => console.log('Cart migrated'),
          error: (err) => console.error('Error migrating cart:', err),
          complete: () => this.router.navigate(['/'])
        });
      },
      error: (error) => {
        console.error('Registration error:', error);
        this.error = error.error?.message || 'Registration failed. Please try again.';
      }
    });
  }

  // Google signup
  signupWithGoogle() {
    console.log('Google signup clicked');
    // Redirect to backend Google Auth endpoint
    // This handles both login and signup (creates account if not exists)
    window.location.href = 'http://localhost:5001/api/auth/google';
  }

  // WhatsApp modal methods
  openWhatsAppModal() {
    this.showWhatsAppModal = true;
    this.resetWhatsAppForm();
  }

  closeWhatsAppModal() {
    this.showWhatsAppModal = false;
    this.resetWhatsAppForm();
    if (this.otpInterval) {
      clearInterval(this.otpInterval);
    }
  }

  resetWhatsAppForm() {
    this.whatsappNumber = '';
    this.otpSent = false;
    this.otp = ['', '', '', '', '', ''];
    this.resendTimer = 0;
    this.generatedOTP = '';
    if (this.otpInterval) {
      clearInterval(this.otpInterval);
    }
  }

  // Request OTP
  requestOTP() {
    if (!this.whatsappNumber || this.whatsappNumber.length < 10) {
      return;
    }

    const fullPhone = this.countryCode + this.whatsappNumber;
    console.log(`Sending OTP to ${fullPhone}`);

    this.authService.sendWhatsAppOtp(fullPhone).subscribe({
      next: (res) => {
        console.log('OTP Sent:', res);
        this.startResendTimer();
        this.otpSent = true;
      },
      error: (err) => {
        console.error('Error sending OTP:', err);
        this.error = 'Failed to send OTP. Please try again.';
      }
    });
  }

  startResendTimer() {
    this.resendTimer = 60;
    this.otpInterval = setInterval(() => {
      if (this.resendTimer > 0) {
        this.resendTimer--;
      } else {
        clearInterval(this.otpInterval);
      }
    }, 1000);
  }

  // Resend OTP
  resendOTP() {
    if (this.otpInterval) clearInterval(this.otpInterval);
    this.requestOTP();

    // Clear OTP input
    this.otp = ['', '', '', '', '', ''];
    setTimeout(() => {
      this.focusOtpInput(0);
    }, 100);
  }

  // OTP input handling
  onOtpInput(event: any, index: number) {
    const input = event.target;
    const value = input.value;

    // Only allow numbers
    if (!/^\d*$/.test(value)) {
      this.otp[index] = '';
      return;
    }

    // Update the model
    this.otp[index] = value;

    // Auto-focus next input if value is entered
    if (value && index < 5) {
      setTimeout(() => {
        this.focusOtpInput(index + 1);
      }, 10);
    }

    // Auto-submit if all digits are entered
    if (index === 5 && value && this.isOtpComplete()) {
      setTimeout(() => {
        this.verifyOTP();
      }, 100);
    }
  }

  onOtpKeyDown(event: KeyboardEvent, index: number) {
    const currentValue = this.otp[index];

    // Handle backspace
    if (event.key === 'Backspace') {
      if (!currentValue && index > 0) {
        event.preventDefault();
        this.otp[index] = '';
        setTimeout(() => {
          this.focusOtpInput(index - 1);
        }, 10);
      } else if (currentValue) {
        this.otp[index] = '';
      }
    }

    // Handle arrow keys
    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      this.focusOtpInput(index - 1);
    }

    if (event.key === 'ArrowRight' && index < 5) {
      event.preventDefault();
      this.focusOtpInput(index + 1);
    }

    // Handle delete key
    if (event.key === 'Delete') {
      this.otp[index] = '';
    }
  }

  onOtpPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text/plain').trim();

    if (pastedData && /^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      for (let i = 0; i < 6; i++) {
        this.otp[i] = digits[i] || '';
      }

      setTimeout(() => {
        this.focusOtpInput(5);
      }, 10);

      if (this.isOtpComplete()) {
        setTimeout(() => {
          this.verifyOTP();
        }, 100);
      }
    }
  }

  focusOtpInput(index: number) {
    if (this.otpInputs && this.otpInputs.toArray()[index]) {
      this.otpInputs.toArray()[index].nativeElement.focus();
      this.otpInputs.toArray()[index].nativeElement.select();
    }
  }

  isOtpComplete(): boolean {
    return this.otp.every(digit => digit !== '');
  }

  // Verify OTP for WhatsApp signup
  verifyOTP() {
    const enteredOTP = this.otp.join('');
    const fullPhone = this.countryCode + this.whatsappNumber;

    this.authService.verifyWhatsAppOtp(fullPhone, enteredOTP).subscribe({
      next: (response) => {
        console.log('WhatsApp verified successfully', response);

        // Check if user is new or existing
        // If this was signup flow, we should populate the form
        // But backend creates/logs in immediately correctly.

        // For Signup Component workflow:
        // We might want to auto-login if account created, or fill form.
        // Current backend implementation logs them in definitively.

        this.closeWhatsAppModal();

        // Migrate cart and redirect (since they are now logged in)
        this.cartService.migrateGuestCart().subscribe({
          next: () => console.log('Cart migrated'),
          error: (err) => console.error('Error migrating cart:', err),
          complete: () => this.router.navigate(['/dashboard'])
        });
      },
      error: (err) => {
        console.error('OTP Verification failed:', err);
        this.error = 'Invalid OTP. Please try again.';
        this.otp = ['', '', '', '', '', ''];
        setTimeout(() => this.focusOtpInput(0), 100);
      }
    });
  }

  // Additional method to handle when OTP modal opens (focus first input)
  ngAfterViewInit() {
    // When modal opens and OTP is shown, focus first input
    setTimeout(() => {
      if (this.showWhatsAppModal && this.otpSent) {
        this.focusOtpInput(0);
      }
    }, 300);
  }

  // Navigate to login page
  goToLogin() {
    this.router.navigate(['/login']);
  }
}