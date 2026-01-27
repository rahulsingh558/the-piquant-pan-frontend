import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const platformId = inject(PLATFORM_ID);

    // Check if we are in the browser before accessing localStorage
    if (isPlatformBrowser(platformId)) {
        // Get token from localStorage (user token or admin token)
        const token = localStorage.getItem('token') || localStorage.getItem('admin_token');

        // If token exists, clone request and add Authorization header
        if (token) {
            req = req.clone({
                setHeaders: {
                    Authorization: `Bearer ${token}`
                }
            });
        }
    }

    return next(req);
};
