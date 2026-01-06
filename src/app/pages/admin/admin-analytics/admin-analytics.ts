import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../../services/order.service';

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-analytics.html',
})
export class AdminAnalyticsComponent implements OnInit {
  loading = true;

  // Analytics data
  monthlyRevenue: number[] = [];
  monthlyOrders: number[] = [];

  topProducts: any[] = [];

  customerDemographics = [
    { age: '18-24', percentage: 25 },
    { age: '25-34', percentage: 45 },
    { age: '35-44', percentage: 20 },
    { age: '45+', percentage: 10 },
  ];

  constructor(
    private orderService: OrderService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadAnalytics();
  }

  loadAnalytics() {
    this.loading = true;

    // Load revenue data for last 12 months
    this.orderService.getRevenueData('1y', 'month').subscribe({
      next: (response) => {
        if (response.success) {
          this.processMonthlyData(response.revenueData);
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        console.error('Error loading revenue data:', error);
      }
    });

    // Load best-selling items
    this.orderService.getBestSellingItems(5).subscribe({
      next: (response) => {
        if (response.success) {
          this.topProducts = response.bestSelling.map(item => ({
            name: item.name,
            sales: item.totalSold,
            revenue: item.totalRevenue
          }));
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        console.error('Error loading top products:', error);
      },
      complete: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  processMonthlyData(data: any[]) {
    // Get last 12 months
    const now = new Date();
    this.monthlyRevenue = [];
    this.monthlyOrders = [];

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(now.getMonth() - i);

      const matchingData = data.find(d =>
        d._id.year === date.getFullYear() &&
        d._id.month === date.getMonth() + 1
      );

      this.monthlyRevenue.push(matchingData ? matchingData.revenue : 0);
      this.monthlyOrders.push(matchingData ? matchingData.orders : 0);
    }
  }

  get maxRevenue() {
    return Math.max(...this.monthlyRevenue, 1);
  }

  get maxOrders() {
    return Math.max(...this.monthlyOrders, 1);
  }

  get totalRevenue() {
    return this.monthlyRevenue.reduce((a, b) => a + b, 0);
  }

  get totalOrders() {
    return this.monthlyOrders.reduce((a, b) => a + b, 0);
  }

  get averageOrderValue() {
    return this.totalOrders > 0 ? Math.round(this.totalRevenue / this.totalOrders) : 0;
  }

  get revenueGrowth() {
    if (this.monthlyRevenue.length < 2) return 0;
    const lastMonth = this.monthlyRevenue[this.monthlyRevenue.length - 1];
    const prevMonth = this.monthlyRevenue[this.monthlyRevenue.length - 2];
    return prevMonth > 0 ? Math.round(((lastMonth - prevMonth) / prevMonth) * 100) : 0;
  }

  getOrderLinePoints(): string {
    return this.monthlyOrders.map((value, i) => {
      const x = i * 30 + 20;
      const y = 160 - (value / this.maxOrders) * 120;
      return `${x},${y}`;
    }).join(' ');
  }
}