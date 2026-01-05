import { Component, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
})
export class Login {
  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef>;
  
  // Main login form
  email = '';
  password = '';
  error = '';
  showPass = false;

  // WhatsApp modal
  showWhatsAppModal = false;
  whatsappNumber = '';
  countryCode = '+1';
  otpSent = false;
  otp: string[] = ['', '', '', '', '', ''];
  resendTimer = 0;
  generatedOTP = '';
  otpInterval: any;

  constructor(private router: Router) {}

  // Main login method
  login() {
    this.error = '';
    
    if (!this.email || !this.password) {
      this.error = 'Please enter both email and password';
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.error = 'Please enter a valid email address';
      return;
    }
    
    console.log('Logging in with:', { email: this.email });
    
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userEmail', this.email);
    
    const redirect = localStorage.getItem('redirectAfterLogin') || '/dashboard';
    localStorage.removeItem('redirectAfterLogin');
    
    this.router.navigate([redirect]);
  }

  // Google login
  loginWithGoogle() {
    console.log('Google login clicked');
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('authProvider', 'google');
    this.router.navigate(['/dashboard']);
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

    // Generate random 6-digit OTP
    this.generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
    
    // console.log(`OTP ${this.generatedOTP} sent to ${this.countryCode}${this.whatsappNumber}`);                        Console log for OTP
    
    // In production, you would send this OTP via WhatsApp API
    console.log(`DEMO: OTP is ${this.generatedOTP} - In production, this would be sent via WhatsApp`);
    
    // Start resend timer (60 seconds)
    this.resendTimer = 60;
    this.otpInterval = setInterval(() => {
      if (this.resendTimer > 0) {
        this.resendTimer--;
      } else {
        clearInterval(this.otpInterval);
      }
    }, 1000);

    this.otpSent = true;
  }

  // Resend OTP
  resendOTP() {
    // Generate new OTP
    this.generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Reset timer
    this.resendTimer = 60;
    if (this.otpInterval) {
      clearInterval(this.otpInterval);
    }
    this.otpInterval = setInterval(() => {
      if (this.resendTimer > 0) {
        this.resendTimer--;
      } else {
        clearInterval(this.otpInterval);
      }
    }, 1000);
    
    // Clear OTP input
    this.otp = ['', '', '', '', '', ''];
    
    // Focus first input
    setTimeout(() => {
      this.focusOtpInput(0);
    }, 100);
  }

  // OTP input handling - FIXED VERSION
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
        // If current input is empty and backspace pressed, focus previous input
        event.preventDefault();
        this.otp[index] = '';
        setTimeout(() => {
          this.focusOtpInput(index - 1);
        }, 10);
      } else if (currentValue) {
        // If current input has value, clear it
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
      // Split the pasted data into individual digits
      const digits = pastedData.split('');
      for (let i = 0; i < 6; i++) {
        this.otp[i] = digits[i] || '';
      }
      
      // Focus last input
      setTimeout(() => {
        this.focusOtpInput(5);
      }, 10);
      
      // Auto-verify if complete
      if (this.isOtpComplete()) {
        setTimeout(() => {
          this.verifyOTP();
        }, 100);
      }
    }
  }

  // Helper method to focus OTP input
  focusOtpInput(index: number) {
    if (this.otpInputs && this.otpInputs.toArray()[index]) {
      this.otpInputs.toArray()[index].nativeElement.focus();
      // Select the text in the input for easy replacement
      this.otpInputs.toArray()[index].nativeElement.select();
    }
  }

  // Check if OTP is complete
  isOtpComplete(): boolean {
    return this.otp.every(digit => digit !== '');
  }

  // Verify OTP
  verifyOTP() {
    const enteredOTP = this.otp.join('');
    
    if (enteredOTP === this.generatedOTP) {
      console.log('WhatsApp OTP verified successfully');
      
      // Store login state
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('authProvider', 'whatsapp');
      localStorage.setItem('userPhone', this.countryCode + this.whatsappNumber);
      
      // Close modal
      this.closeWhatsAppModal();
      
      // Redirect to dashboard
      this.router.navigate(['/dashboard']);
    } else {
      this.error = 'Invalid OTP. Please try again.';
      // Clear OTP for retry
      this.otp = ['', '', '', '', '', ''];
      // Focus first input
      setTimeout(() => {
        this.focusOtpInput(0);
      }, 100);
    }
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
}