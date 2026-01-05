import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminAuthService } from '../services/admin-auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const auth = inject(AdminAuthService);
  const router = inject(Router);

  console.log('AdminGuard: Checking authentication for', state.url);

  if (auth.isLoggedIn()) {
    console.log('AdminGuard: User is authenticated');
    return true;
  }

  console.log('AdminGuard: User is NOT authenticated, redirecting to login');
  
  // Store the attempted URL for redirecting after login
  if (state.url !== '/admin/login') {
    router.navigate(['/admin/login'], { 
      queryParams: { returnUrl: state.url } 
    });
  } else {
    router.navigate(['/admin/login']);
  }
  
  return false;
};