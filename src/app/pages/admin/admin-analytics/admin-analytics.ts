import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-analytics.html',
})
export class AdminAnalyticsComponent {
  // Analytics data
  monthlyRevenue = [8200, 9100, 7600, 10400, 11980, 9800, 11200, 13200, 14800, 12500, 14100, 15800];
  monthlyOrders = [42, 48, 35, 52, 61, 49, 56, 68, 74, 62, 71, 79];
  
  topProducts = [
    { name: 'Moong Sprouts Bowl', sales: 245, revenue: 19600 },
    { name: 'Egg Meal Bowl', sales: 189, revenue: 22680 },
    { name: 'Chicken Bowl', sales: 156, revenue: 21840 },
    { name: 'Paneer Sprouts Bowl', sales: 132, revenue: 14520 },
    { name: 'Sprouts Salad', sales: 98, revenue: 6860 },
  ];

  customerDemographics = [
    { age: '18-24', percentage: 25 },
    { age: '25-34', percentage: 45 },
    { age: '35-44', percentage: 20 },
    { age: '45+', percentage: 10 },
  ];

  get maxRevenue() {
    return Math.max(...this.monthlyRevenue);
  }

  get maxOrders() {
    return Math.max(...this.monthlyOrders);
  }

  get totalRevenue() {
    return this.monthlyRevenue.reduce((a, b) => a + b, 0);
  }

  get totalOrders() {
    return this.monthlyOrders.reduce((a, b) => a + b, 0);
  }

  get averageOrderValue() {
    return Math.round(this.totalRevenue / this.totalOrders);
  }

  get revenueGrowth() {
    const lastMonth = this.monthlyRevenue[this.monthlyRevenue.length - 1];
    const prevMonth = this.monthlyRevenue[this.monthlyRevenue.length - 2];
    return Math.round(((lastMonth - prevMonth) / prevMonth) * 100);
  }

  getOrderLinePoints(): string {
  return this.monthlyOrders.map((value, i) => {
    const x = i * 30 + 20;
    const y = 160 - (value / this.maxOrders) * 120;
    return `${x},${y}`;
  }).join(' ');
}
}