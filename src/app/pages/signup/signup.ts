import { Component, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-signup',
  imports: [CommonModule, FormsModule],
  templateUrl: './signup.html',
})
export class Signup {
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

  constructor(private router: Router) {}

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
    
    // Store user data (in a real app, you'd send to backend)
    const userData = {
      name: this.name,
      email: this.email,
      phone: this.phone,
      createdAt: new Date().toISOString()
    };
    
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userEmail', this.email);
    localStorage.setItem('userName', this.name);
    localStorage.setItem('userData', JSON.stringify(userData));
    
    // Redirect to home or dashboard
    this.router.navigate(['/']);
  }

  // Google signup
  signupWithGoogle() {
    console.log('Google signup clicked');
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('authProvider', 'google');
    localStorage.setItem('userEmail', 'user@example.com');
    localStorage.setItem('userName', 'Google User');
    this.router.navigate(['/']);
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

  // Verify OTP for WhatsApp signup
  verifyOTP() {
    const enteredOTP = this.otp.join('');
    
    if (enteredOTP === this.generatedOTP) {
      console.log('WhatsApp OTP verified successfully');
      
      // Store signup state
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('authProvider', 'whatsapp');
      localStorage.setItem('userPhone', this.countryCode + this.whatsappNumber);
      localStorage.setItem('userName', 'WhatsApp User');
      
      // Auto-fill phone number in signup form
      this.phone = this.countryCode + this.whatsappNumber;
      
      // Close modal
      this.closeWhatsAppModal();
      
      // Show success message
      this.error = 'WhatsApp verified! Please complete the form above.';
      
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

  // Navigate to login page
  goToLogin() {
    this.router.navigate(['/login']);
  }
}