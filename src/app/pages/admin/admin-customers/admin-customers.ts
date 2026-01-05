import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  ordersCount: number;
  totalSpent: number;
  lastOrder: string;
  status: 'active' | 'inactive';
}

@Component({
  selector: 'app-admin-customers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-customers.html',
})
export class AdminCustomersComponent {
  searchQuery = '';
  customers: Customer[] = [
    { id: 1, name: 'Rahul Sharma', email: 'rahul@email.com', phone: '+91 9876543210', ordersCount: 12, totalSpent: 2840, lastOrder: '2024-12-28', status: 'active' },
    { id: 2, name: 'Priya Patel', email: 'priya@email.com', phone: '+91 9876543211', ordersCount: 8, totalSpent: 1920, lastOrder: '2024-12-27', status: 'active' },
    { id: 3, name: 'Amit Kumar', email: 'amit@email.com', phone: '+91 9876543212', ordersCount: 15, totalSpent: 3560, lastOrder: '2024-12-29', status: 'active' },
    { id: 4, name: 'Neha Reddy', email: 'neha@email.com', phone: '+91 9876543213', ordersCount: 5, totalSpent: 1200, lastOrder: '2024-12-20', status: 'inactive' },
    { id: 5, name: 'Vikas Gupta', email: 'vikas@email.com', phone: '+91 9876543214', ordersCount: 3, totalSpent: 700, lastOrder: '2024-12-15', status: 'inactive' },
    { id: 6, name: 'Sneha Singh', email: 'sneha@email.com', phone: '+91 9876543215', ordersCount: 9, totalSpent: 2150, lastOrder: '2024-12-26', status: 'active' },
  ];

  get filteredCustomers() {
    if (!this.searchQuery) return this.customers;
    
    const query = this.searchQuery.toLowerCase();
    return this.customers.filter(customer =>
      customer.name.toLowerCase().includes(query) ||
      customer.email.toLowerCase().includes(query) ||
      customer.phone.includes(query)
    );
  }

  get totalCustomers() {
    return this.customers.length;
  }

  get activeCustomers() {
    return this.customers.filter(c => c.status === 'active').length;
  }

  get totalRevenue() {
    return this.customers.reduce((sum, customer) => sum + customer.totalSpent, 0);
  }
}