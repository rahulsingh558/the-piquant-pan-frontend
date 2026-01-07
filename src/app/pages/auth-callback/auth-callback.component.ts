import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

@Component({
    selector: 'app-auth-callback',
    standalone: true,
    template: '<div class="flex justify-center items-center h-screen"><p>Authenticating...</p></div>'
})
export class AuthCallbackComponent implements OnInit {

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        @Inject(PLATFORM_ID) private platformId: Object
    ) { }

    ngOnInit() {
        // Only execute client-side logic in the browser
        if (isPlatformBrowser(this.platformId)) {
            this.route.queryParams.subscribe(params => {
                const token = params['token'];
                const userId = params['userId'];
                const role = params['role'];

                if (token) {
                    localStorage.setItem('token', token);
                    localStorage.setItem('userId', userId);
                    localStorage.setItem('userRole', role);

                    localStorage.setItem('isLoggedIn', 'true');

                    if (role === 'admin') {
                        this.router.navigate(['/admin']);
                    } else {
                        this.router.navigate(['/menu']);
                    }
                } else {
                    this.router.navigate(['/login'], { queryParams: { error: 'auth_failed' } });
                }
            });
        }
    }
}
