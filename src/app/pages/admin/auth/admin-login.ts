import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminAuthService } from '../../../services/admin-auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-login.html',
})
export class AdminLogin {
  showPass: boolean = false;
  email = '';
  password = '';
  error = '';
  loading = false;

  constructor(
    private adminAuth: AdminAuthService,
    private router: Router
  ) { }

  login() {
    // Clear previous error
    this.error = '';

    // Validate inputs
    if (!this.email || !this.password) {
      this.error = 'Please enter email and password';
      return;
    }

    // Attempt login
    this.loading = true;
    this.adminAuth.login(this.email, this.password).subscribe({
      next: (response) => {
        console.log('Admin login successful');

        // Check if user is admin
        if (response.user.role !== 'admin') {
          this.error = 'Access denied. Admin privileges required.';
          this.adminAuth.clearAuth();
          this.loading = false;
          return;
        }

        this.router.navigate(['/admin/dashboard']);
      },
      error: (err) => {
        console.error('Admin login failed:', err);
        this.error = err.error?.message || 'Invalid credentials';
        this.loading = false;
      }
    });
  }

  // Optional: Handle Enter key press
  onEnter(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.login();
    }
  }
}