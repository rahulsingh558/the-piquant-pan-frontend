import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MenuAdminService,
  AdminMenuItem,
} from '../../../services/menu-admin.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.html',
})
export class AdminDashboard {
  /* =========================
     MENU ITEMS
  ========================== */
  items: AdminMenuItem[] = [];
  showMenuForm = false;
  
  newItem: Omit<AdminMenuItem, 'id'> = {
    name: '',
    subtitle: 'Healthy • Fresh • Protein-rich',
    basePrice: 0,
    type: 'veg', // Default type
    image: '',
    defaultAddons: [],
    extraAddons: [],
  };

  /* =========================
     DASHBOARD METRICS
  ========================== */
  totalOrders = 124;
  totalCustomers = 68;
  notifications = 3;

  revenueThisWeek = 11980;
  revenueLastWeek = 9800;

  get totalRevenue(): number {
    return this.revenueThisWeek;
  }

  get revenueChangePercent(): number {
    if (this.revenueLastWeek === 0) return 0;
    return Math.round(
      ((this.revenueThisWeek - this.revenueLastWeek) /
        this.revenueLastWeek) *
        100
    );
  }

  /* ✅ ALIAS USED BY TEMPLATE */
  get revenueGrowthPercent(): number {
    return this.revenueChangePercent;
  }

  /* =========================
     ORDERS BAR CHART
  ========================== */
  ordersChart: { day: string; value: number }[] = [
    { day: 'Mon', value: 12 },
    { day: 'Tue', value: 18 },
    { day: 'Wed', value: 9 },
    { day: 'Thu', value: 15 },
    { day: 'Fri', value: 21 },
  ];

  maxOrders = Math.max(...this.ordersChart.map(o => o.value));

  get ordersLast5Days(): number {
    return this.ordersChart.reduce((sum, o) => sum + o.value, 0);
  }

  /* =========================
     REVENUE LINE CHART
  ========================== */
  revenueChart: { day: string; value: number }[] = [
    { day: 'Mon', value: 8200 },
    { day: 'Tue', value: 9100 },
    { day: 'Wed', value: 7600 },
    { day: 'Thu', value: 10400 },
    { day: 'Fri', value: 11980 },
  ];

  maxRevenue = Math.max(...this.revenueChart.map(r => r.value));
  revenuePolylinePoints = '';

  /* =========================
     TABLE DATA
  ========================== */
  recentOrders = [
    { id: '#ORD-101', customer: 'Rahul', amount: 280, status: 'Paid' },
    { id: '#ORD-102', customer: 'Amit', amount: 160, status: 'Paid' },
    { id: '#ORD-103', customer: 'Neha', amount: 340, status: 'Pending' },
    { id: '#ORD-104', customer: 'Sneha', amount: 220, status: 'Paid' },
    { id: '#ORD-105', customer: 'Vikas', amount: 180, status: 'Cancelled' },
  ];

  bestSelling = [
    { name: 'Moong Sprouts Bowl', sold: 52 },
    { name: 'Egg Meal Bowl', sold: 41 },
    { name: 'Paneer Sprouts Bowl', sold: 34 },
    { name: 'Chicken Bowl', sold: 28 },
  ];

  constructor(
    private menuService: MenuAdminService
  ) {
    /* Seed menu once */
    this.menuService.seedIfEmpty([
      {
        id: 1,
        name: 'Moong Sprouts Bowl',
        subtitle: 'Healthy • Fresh • Protein-rich',
        basePrice: 80,
        type: 'veg',
        image:
          'https://images.unsplash.com/photo-1540420828642-fca2c5c18abe?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
        defaultAddons: [
          { id: 1, name: 'Onion', price: 0 },
          { id: 2, name: 'Tomato', price: 0 },
          { id: 3, name: 'Cucumber', price: 0 },
        ],
        extraAddons: [],
      },
      {
        id: 2,
        name: 'Egg Meal Bowl',
        subtitle: 'Protein-packed • Healthy • Delicious',
        basePrice: 120,
        type: 'egg',
        image:
          'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
        defaultAddons: [
          { id: 1, name: 'Lettuce', price: 0 },
          { id: 2, name: 'Carrot', price: 0 },
        ],
        extraAddons: [
          { id: 3, name: 'Extra Cheese', price: 20 },
          { id: 4, name: 'Avocado', price: 30 },
        ],
      },
      {
        id: 3,
        name: 'Chicken Bowl',
        subtitle: 'High Protein • Non-Vegetarian • Fresh',
        basePrice: 140,
        type: 'nonveg',
        image:
          'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
        defaultAddons: [
          { id: 1, name: 'Onion', price: 0 },
          { id: 2, name: 'Tomato', price: 0 },
          { id: 3, name: 'Capsicum', price: 0 },
        ],
        extraAddons: [
          { id: 4, name: 'Extra Chicken', price: 50 },
        ],
      },
    ]);

    this.loadItems();
    this.buildRevenuePolyline();
  }

  /* =========================
     HELPERS
  ========================== */
  buildRevenuePolyline() {
    this.revenuePolylinePoints = this.revenueChart
      .map(
        (p, i) =>
          `${i * 80 + 40},${160 - (p.value / this.maxRevenue) * 120}`
      )
      .join(' ');
  }

  /* =========================
     CRUD
  ========================== */
  loadItems() {
    this.items = this.menuService.getAll();
  }

  addItem() {
    if (!this.newItem.name || this.newItem.basePrice <= 0) return;

    this.menuService.add(this.newItem);
    this.loadItems();

    // Reset form
    this.newItem = {
      name: '',
      subtitle: 'Healthy • Fresh • Protein-rich',
      basePrice: 0,
      type: 'veg',
      image: '',
      defaultAddons: [],
      extraAddons: [],
    };
    
    this.showMenuForm = false;
  }

  deleteItem(id: number) {
    if (confirm('Are you sure you want to delete this item?')) {
      this.menuService.delete(id);
      this.loadItems();
    }
  }
}