import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { AdminAuthService } from '../../services/admin-auth.service';
import { filter, Subscription } from 'rxjs';
import { AdminSidebarComponent } from '../../pages/admin/sidebar/admin-sidebar.component';
import { ToastComponent } from '../toast/toast.component';
import { WebSocketService } from '../../services/websocket.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    RouterOutlet,
    AdminSidebarComponent,
    ToastComponent
  ],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css']
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  isSidebarOpen = true;
  currentRoute = '';
  pageTitle = '';
  showUserMenu = false;
  routerSubscription!: Subscription;
  socketSubscription!: Subscription;

  // Navigation items for breadcrumb or header
  navItems = [
    { path: '/admin/dashboard', title: 'Dashboard' },
    { path: '/admin/orders', title: 'Orders Management' },
    { path: '/admin/customers', title: 'Customers' },
    { path: '/admin/menu', title: 'Menu Items' },
    { path: '/admin/chat', title: 'Chat Support' },
    { path: '/admin/analytics', title: 'Analytics' },
    { path: '/admin/settings', title: 'Settings' }
  ];

  constructor(
    private router: Router,
    private authService: AdminAuthService,
    private webSocketService: WebSocketService,
    private toastService: ToastService,
    @Inject(PLATFORM_ID) private platformId: any
  ) { }

  ngOnInit() {
    // Initialize sidebar state based on screen size - only in browser
    if (isPlatformBrowser(this.platformId)) {
      this.isSidebarOpen = window.innerWidth >= 1024;

      // Listen for new orders
      this.socketSubscription = this.webSocketService.listen('new-order').subscribe((order: any) => {
        this.toastService.success(
          'New Order Received!',
          `Order #${order.orderNumber} for ₹${order.totalAmount} has been placed.`
        );
        // Play notification sound if desired
        this.playNotificationSound();
      });
    }

    // Subscribe to route changes to update page title
    this.routerSubscription = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateCurrentRoute();
        this.updatePageTitle();
      });

    // Initial update
    this.updateCurrentRoute();
    this.updatePageTitle();
  }

  playNotificationSound() {
    try {
      const audio = new Audio('assets/sounds/notification.mp3'); // Ensure this file exists or use a default
      audio.play().catch(e => console.log('Audio play failed', e));
    } catch (e) {
      console.error('Error playing sound', e);
    }
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
  }

  logout() {
    this.authService.logout();
  }

  private updateCurrentRoute() {
    this.currentRoute = this.router.url;
  }

  private updatePageTitle() {
    const route = this.navItems.find(item => item.path === this.currentRoute);
    if (route) {
      this.pageTitle = route.title;
    } else {
      // Default title or extract from route
      this.pageTitle = this.getTitleFromRoute();
    }
  }

  private getTitleFromRoute(): string {
    const segments = this.currentRoute.split('/').filter(segment => segment);

    if (segments.length >= 2) {
      const lastSegment = segments[segments.length - 1];
      // Capitalize first letter and replace hyphens with spaces
      return lastSegment
        .replace(/-/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
    }

    return 'Admin Panel';
  }

  // Get breadcrumb items
  getBreadcrumbs(): string[] {
    const segments = this.currentRoute.split('/').filter(segment => segment);
    return segments.map(segment =>
      segment.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    );
  }

  // Helper to get breadcrumb links
  getBreadcrumbLink(index: number): string {
    const segments = this.currentRoute.split('/').filter(segment => segment);
    return '/' + segments.slice(0, index + 1).join('/');
  }

  // Action methods for buttons
  refreshDashboard() {
    console.log('Refreshing dashboard data...');
    // Implement refresh logic - could emit an event to child component
  }

  exportData() {
    console.log('Exporting data...');
    // Implement export logic
  }

  addNewItem() {
    console.log('Adding new menu item...');
    // Implement add item logic
  }

  // Handle search
  onSearch(query: string) {
    // Implement search logic based on current route
    console.log('Search query:', query, 'on route:', this.currentRoute);
  }
}