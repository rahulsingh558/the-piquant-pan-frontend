import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './profile.html',
})
export class Profile {
  isBrowser = false;
  loggedIn = false;

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    if (this.isBrowser) {
      this.loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    }
  }

  logout() {
    if (this.isBrowser) {
      localStorage.removeItem('isLoggedIn');
      this.router.navigate(['/']);
    }
  }
}