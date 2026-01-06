import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MenuAdminService,
  AdminMenuItem,
} from '../../../services/menu-admin.service';
import { OrderService, Order } from '../../../services/order.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.html',
})
export class AdminDashboard implements OnInit {
  /* =========================
     MENU ITEMS
  ========================== */
  items: AdminMenuItem[] = [];
  showMenuForm = false;

  newItem: Omit<AdminMenuItem, 'id'> = {
    name: '',
    subtitle: 'Healthy • Fresh • Protein-rich',
    basePrice: 0,
    type: 'veg',
    image: '',
    defaultAddons: [],
    extraAddons: [],
  };

  /* =========================
     DASHBOARD METRICS
  ========================== */
  totalOrders = 0;
  totalCustomers = 0;
  notifications = 3;
  loading = true;

  revenueThisWeek = 0;
  revenueLastWeek = 0;

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

  get revenueGrowthPercent(): number {
    return this.revenueChangePercent;
  }

  /* =========================
     ORDERS BAR CHART
  ========================== */
  ordersChart: { day: string; value: number }[] = [];
  maxOrders = 0;

  get ordersLast5Days(): number {
    return this.ordersChart.reduce((sum, o) => sum + o.value, 0);
  }

  /* =========================
     REVENUE LINE CHART
  ========================== */
  revenueChart: { day: string; value: number }[] = [];
  maxRevenue = 0;
  revenuePolylinePoints = '';

  /* =========================
     TABLE DATA
  ========================== */
  recentOrders: any[] = [];
  bestSelling: any[] = [];

  constructor(
    private menuService: MenuAdminService,
    private orderService: OrderService,
    private cdr: ChangeDetectorRef
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
  }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  /* =========================
     LOAD DASHBOARD DATA
  ========================== */
  loadDashboardData() {
    this.loading = true;

    // Load order statistics
    this.orderService.getOrderStats('7d').subscribe({
      next: (response) => {
        if (response.success) {
          this.totalOrders = response.stats.totalOrders;
          this.revenueThisWeek = response.stats.periodRevenue;
          this.totalCustomers = response.stats.totalOrders; // Approximate
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        console.error('Error loading order stats:', error);
      }
    });

    // Load revenue data for chart
    this.orderService.getRevenueData('7d', 'day').subscribe({
      next: (response) => {
        if (response.success && response.revenueData) {
          this.processRevenueData(response.revenueData);
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        console.error('Error loading revenue data:', error);
      }
    });

    // Load recent orders
    this.orderService.getAllOrders({ limit: 5, sortBy: '-createdAt' }).subscribe({
      next: (response) => {
        if (response.success) {
          this.recentOrders = response.orders.map(order => ({
            id: `#${order.orderNumber}`,
            customer: order.customerName,
            amount: order.totalAmount,
            status: this.capitalizeFirst(order.paymentStatus)
          }));
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        console.error('Error loading recent orders:', error);
      }
    });

    // Load best-selling items
    this.orderService.getBestSellingItems(5).subscribe({
      next: (response) => {
        if (response.success) {
          this.bestSelling = response.bestSelling.map(item => ({
            name: item.name,
            sold: item.totalSold
          }));
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        console.error('Error loading best-selling items:', error);
      },
      complete: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /* =========================
     PROCESS REVENUE DATA
  ========================== */
  processRevenueData(data: any[]) {
    // Get last 7 days
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();

    // Initialize arrays with last 5 days
    this.revenueChart = [];
    this.ordersChart = [];

    for (let i = 4; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dayName = days[date.getDay()];

      // Find matching data
      const matchingData = data.find(d =>
        d._id.year === date.getFullYear() &&
        d._id.month === date.getMonth() + 1 &&
        d._id.day === date.getDate()
      );

      this.revenueChart.push({
        day: dayName,
        value: matchingData ? matchingData.revenue : 0
      });

      this.ordersChart.push({
        day: dayName,
        value: matchingData ? matchingData.orders : 0
      });
    }

    this.maxRevenue = Math.max(...this.revenueChart.map(r => r.value), 1);
    this.maxOrders = Math.max(...this.ordersChart.map(o => o.value), 1);

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

  capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
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