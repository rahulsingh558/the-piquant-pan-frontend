import { Component, Input, Output, EventEmitter, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';

interface NavItem {
  name: string;
  icon: string;
  route: string;
  isActive: boolean;
}

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-sidebar.component.html'
})
export class AdminSidebarComponent {
  @Input() isSidebarOpen = false;
  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  // Navigation items with SVG paths
  navItems: NavItem[] = [
    { 
      name: 'Dashboard', 
      icon: 'dashboard', 
      route: '/admin/dashboard', 
      isActive: false 
    },
    { 
      name: 'Orders', 
      icon: 'orders', 
      route: '/admin/orders', 
      isActive: false 
    },
    { 
      name: 'Customers', 
      icon: 'customers', 
      route: '/admin/customers', 
      isActive: false 
    },
    { 
      name: 'Menu Items', 
      icon: 'menu', 
      route: '/admin/menu', 
      isActive: false 
    },
    { 
      name: 'Analytics', 
      icon: 'analytics', 
      route: '/admin/analytics', 
      isActive: false 
    },
    { 
      name: 'Settings', 
      icon: 'settings', 
      route: '/admin/settings', 
      isActive: false 
    },
  ];

  constructor(@Inject(PLATFORM_ID) private platformId: any) {
    // Set active based on current route - only in browser
    if (isPlatformBrowser(this.platformId)) {
      this.updateActiveRoute();
    }
  }

  // Update active route
  updateActiveRoute() {
    // Only update in browser environment
    if (typeof window !== 'undefined') {
      const currentRoute = window.location.pathname;
      this.navItems.forEach(item => {
        item.isActive = currentRoute === item.route;
      });
    }
  }

  // Handle navigation click
  onNavClick(clickedItem: NavItem) {
    this.navItems.forEach(item => {
      item.isActive = item.name === clickedItem.name;
    });
  }

  // Emit toggle event
  onToggle() {
    this.toggleSidebar.emit();
  }

  // Emit logout event
  onLogout() {
    this.logout.emit();
  }
}