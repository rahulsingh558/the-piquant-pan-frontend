import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { AddressSelectComponent } from './components/address-select/address-select.component';
import { PaymentComponent } from './components/payment/payment.component';
import { OrderSuccessComponent } from './components/order-success/order-success.component';
import { Signup } from './pages/signup/signup';



export const routes: Routes = [
  /* ================= PUBLIC PAGES ================= */
  
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home').then(m => m.Home),
  },
  {
    path: 'menu',
    loadComponent: () =>
      import('./pages/menu/menu').then(m => m.Menu),
  },
  {
    path: 'cart',
    loadComponent: () =>
      import('./pages/cart/cart').then(m => m.CartPage),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login').then(m => m.Login),
  },
  { 
    path: 'signup', component: Signup 
  },
  { 
    path: 'register', redirectTo: 'signup' 
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('./pages/contact/contact').then(m => m.Contact),
  },

  /* ================= USER PROTECTED ================= */
  {
    path: 'checkout',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/checkout/checkout').then(m => m.Checkout),
  },
  { 
    path: 'address-select', component: AddressSelectComponent 
  },
  { 
    path: 'payment', component: PaymentComponent 
  },
  { 
    path: 'order-success', component: OrderSuccessComponent 
  },
  {
    path: 'orders',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/orders/orders').then(m => m.OrdersPage),
  },
  {
    path: 'wishlist',
    loadComponent: () =>
      import('./pages/wishlist/wishlist').then(m => m.Wishlist),
  },
  {
    path: 'account',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/account/account').then(m => m.Account),
  },

  /* ================= ADMIN ================= */
  // 🔓 ADMIN LOGIN (NO GUARD)
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./pages/admin/auth/admin-login').then(m => m.AdminLogin),
  },

  // 🔐 ADMIN AREA (WITH LAYOUT) - IMPORTANT: Admin routes come BEFORE wildcard
  
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadChildren: () => import('./pages/admin/admin.routes').then(m => m.adminRoutes)
  },

  /* ================= FALLBACK ================= */
  {
    path: '**',
    redirectTo: '',
  },
];