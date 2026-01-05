import { Routes } from '@angular/router';
import { AdminLayoutComponent } from '../../components/admin-layout/admin-layout.component';
import { AdminChatComponent } from './admin-chat/admin-chat.component';

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./admin-dashboard/admin-dashboard').then(m => m.AdminDashboard),
        title: 'Admin Dashboard'
      },
      {
        path: 'orders',
        loadComponent: () => import('./admin-orders/admin-orders').then(m => m.AdminOrdersComponent),
        title: 'Orders Management'
      },
      {
        path: 'menu',
        loadComponent: () => import('./admin-menu/admin-menu').then(m => m.AdminMenuComponent),
        title: 'Menu Management'
      },
      {
        path: 'customers',
        loadComponent: () => import('./admin-customers/admin-customers').then(m => m.AdminCustomersComponent),
        title: 'Customers'
      },
      {
        path: 'analytics',
        loadComponent: () => import('./admin-analytics/admin-analytics').then(m => m.AdminAnalyticsComponent),
        title: 'Analytics'
      },
      {
        path: 'settings',
        loadComponent: () => import('./admin-settings/admin-settings').then(m => m.AdminSettingsComponent),
        title: 'Settings'
      },
      { 
        path: 'admin/chat', 
        component: AdminChatComponent,
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  }
];