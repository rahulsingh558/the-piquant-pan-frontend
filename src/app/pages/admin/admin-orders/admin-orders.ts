import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminAuthService } from '../../../services/admin-auth.service';
import { AdminSidebarComponent } from '../sidebar/admin-sidebar.component';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  addons: string[];
  specialInstructions?: string;
}

interface Order {
  id: string;
  orderNumber: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryAddress: string;
  items: OrderItem[];
  subtotal: number;
  deliveryCharge: number;
  tax: number;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  date: Date;
  time: string;
  notes?: string;
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AdminSidebarComponent], // Add AdminSidebarComponent here
  templateUrl: './admin-orders.html',
})
export class AdminOrdersComponent implements OnInit {
  /* =========================
     SIDEBAR STATE
  ========================== */
  isSidebarOpen = false;

  /* =========================
     FILTER STATE
  ========================== */
  showFilter = false;
  searchQuery = '';
  statusFilter = '';
  dateFilter = '';
  sortBy = 'newest';
  activeFilters = 0;

  /* =========================
     PAGINATION
  ========================== */
  pageSize = 8;
  displayedOrders: Order[] = [];
  filteredOrders: Order[] = [];
  loadMoreCount = 0;

  /* =========================
     ORDERS DATA
  ========================== */
  allOrders: Order[] = [];
  activeOrders: Order[] = [];
  recentOrders: Order[] = [];
  selectedOrder: Order | null = null;

  /* =========================
     STATS
  ========================== */
  totalOrders = 0;
  pendingOrders = 0;
  todaysOrders = 0;
  totalRevenue = 0;

  constructor(private auth: AdminAuthService) {}

  ngOnInit() {
    // Initialize with sample data
    this.generateSampleOrders();
    this.calculateStats();
    this.applyFilters();
    
    // Auto-refresh every 30 seconds
    setInterval(() => {
      this.refreshOrders();
    }, 30000);
    
    // On desktop, sidebar is open by default
    this.isSidebarOpen = window.innerWidth >= 1024;
  }

  /* =========================
     SIDEBAR METHODS
  ========================== */
  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  /* =========================
     FILTER METHODS
  ========================== */
  toggleFilter() {
    this.showFilter = !this.showFilter;
  }

  onSearch() {
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.allOrders];

    // Apply search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query) ||
        order.customerPhone.includes(query) ||
        order.customerEmail.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (this.statusFilter) {
      filtered = filtered.filter(order => order.status === this.statusFilter);
    }

    // Apply date filter
    if (this.dateFilter) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      filtered = filtered.filter(order => {
        const orderDate = new Date(order.date);
        orderDate.setHours(0, 0, 0, 0);

        switch (this.dateFilter) {
          case 'today':
            return orderDate.getTime() === today.getTime();
          case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(today.getDate() - 7);
            return orderDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(today);
            monthAgo.setMonth(today.getMonth() - 1);
            return orderDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const dateA = new Date(a.date + 'T' + a.time);
      const dateB = new Date(b.date + 'T' + b.time);

      switch (this.sortBy) {
        case 'newest':
          return dateB.getTime() - dateA.getTime();
        case 'oldest':
          return dateA.getTime() - dateB.getTime();
        case 'amount-high':
          return b.totalAmount - a.totalAmount;
        case 'amount-low':
          return a.totalAmount - b.totalAmount;
        default:
          return dateB.getTime() - dateA.getTime();
      }
    });

    this.filteredOrders = filtered;
    this.displayedOrders = filtered.slice(0, this.pageSize);
    this.loadMoreCount = Math.max(0, filtered.length - this.displayedOrders.length);
    
    // Update active filters count
    this.activeFilters = [this.searchQuery, this.statusFilter, this.dateFilter]
      .filter(Boolean).length;
  }

  clearFilters() {
    this.searchQuery = '';
    this.statusFilter = '';
    this.dateFilter = '';
    this.sortBy = 'newest';
    this.applyFilters();
  }

  /* =========================
     PAGINATION METHODS
  ========================== */
  loadMoreOrders() {
    const currentLength = this.displayedOrders.length;
    const newLength = Math.min(currentLength + 10, this.filteredOrders.length);
    this.displayedOrders = this.filteredOrders.slice(0, newLength);
    this.loadMoreCount = Math.max(0, this.filteredOrders.length - newLength);
  }

  /* =========================
     ORDER METHODS
  ========================== */
  refreshOrders() {
    // In a real app, this would fetch from API
    this.calculateStats();
    this.applyFilters();
  }

  viewOrderDetails(order: Order) {
    this.selectedOrder = order;
  }

  updateOrderStatus(order: Order) {
    const statusOptions = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
    const currentIndex = statusOptions.indexOf(order.status);
    const nextIndex = (currentIndex + 1) % (statusOptions.length - 1); // Skip cancelled
    
    order.status = statusOptions[nextIndex];
    
    // Update stats and filters
    this.calculateStats();
    this.applyFilters();
    
    // Show confirmation
    alert(`Order ${order.id} status updated to ${this.getStatusText(order.status)}`);
  }

  cancelOrder(order: Order) {
    if (confirm(`Are you sure you want to cancel order ${order.id}?`)) {
      order.status = 'cancelled';
      this.calculateStats();
      this.applyFilters();
      alert(`Order ${order.id} has been cancelled.`);
    }
  }

  exportOrders() {
    // In a real app, this would generate and download CSV/Excel
    alert('Export feature will be implemented soon!');
  }

  printOrder(order: Order) {
    window.print();
  }

  /* =========================
     HELPER METHODS
  ========================== */
  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Pending',
      'confirmed': 'Confirmed',
      'preparing': 'Preparing',
      'ready': 'Ready for Pickup',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled'
    };
    return statusMap[status] || status;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  formatTime(time: string): string {
    return time;
  }

  // Helper method to get item names as string
  getItemNames(items: OrderItem[]): string {
    return items.map(item => item.name).join(', ');
  }

  calculateStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.totalOrders = this.allOrders.length;
    this.pendingOrders = this.allOrders.filter(o => 
      ['pending', 'confirmed', 'preparing'].includes(o.status)
    ).length;
    this.todaysOrders = this.allOrders.filter(o => {
      const orderDate = new Date(o.date);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime();
    }).length;
    this.totalRevenue = this.allOrders
      .filter(o => o.status === 'delivered')
      .reduce((sum, order) => sum + order.totalAmount, 0);

    // Update active and recent orders
    this.activeOrders = this.allOrders
      .filter(o => ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status))
      .sort((a, b) => new Date(b.date + 'T' + b.time).getTime() - new Date(a.date + 'T' + a.time).getTime())
      .slice(0, 5);

    this.recentOrders = this.allOrders
      .filter(o => ['delivered', 'cancelled'].includes(o.status))
      .sort((a, b) => new Date(b.date + 'T' + b.time).getTime() - new Date(a.date + 'T' + a.time).getTime())
      .slice(0, 5);
  }

  /* =========================
     SAMPLE DATA GENERATION
  ========================== */
  generateSampleOrders() {
    const menuItems = [
      { name: 'Moong Sprouts Bowl', price: 80 },
      { name: 'Egg Meal Bowl', price: 120 },
      { name: 'Paneer Sprouts Bowl', price: 110 },
      { name: 'Chicken Bowl', price: 140 },
      { name: 'Sprouts Salad', price: 70 },
      { name: 'Protein Shake', price: 90 }
    ];

    const addons = ['Extra Cheese', 'Avocado', 'Olives', 'Nuts', 'Extra Dressing'];
    const customers = ['Rahul Sharma', 'Priya Patel', 'Amit Kumar', 'Sneha Singh', 'Vikas Gupta', 'Neha Reddy'];
    const addresses = ['123 MG Road, Bangalore', '456 Koramangala, Bangalore', '789 Indiranagar, Bangalore'];

    for (let i = 1; i <= 50; i++) {
      const itemCount = Math.floor(Math.random() * 3) + 1;
      const items: OrderItem[] = [];
      let subtotal = 0;

      for (let j = 0; j < itemCount; j++) {
        const menuItem = menuItems[Math.floor(Math.random() * menuItems.length)];
        const quantity = Math.floor(Math.random() * 2) + 1;
        const itemAddons = Math.random() > 0.5 
          ? [addons[Math.floor(Math.random() * addons.length)]]
          : [];

        items.push({
          name: menuItem.name,
          quantity,
          price: menuItem.price,
          addons: itemAddons,
          specialInstructions: Math.random() > 0.7 ? 'No onions please' : undefined
        });

        subtotal += menuItem.price * quantity;
      }

      const deliveryCharge = 30;
      const tax = Math.round(subtotal * 0.05);
      const totalAmount = subtotal + deliveryCharge + tax;

      const statuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));

      const hours = Math.floor(Math.random() * 12) + 8;
      const minutes = Math.floor(Math.random() * 60);
      const time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

      this.allOrders.push({
        id: `ORD-${1000 + i}`,
        orderNumber: 1000 + i,
        customerName: customers[Math.floor(Math.random() * customers.length)],
        customerPhone: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        customerEmail: `customer${i}@email.com`,
        deliveryAddress: addresses[Math.floor(Math.random() * addresses.length)],
        items,
        subtotal,
        deliveryCharge,
        tax,
        totalAmount,
        status,
        paymentMethod: Math.random() > 0.5 ? 'Online Payment' : 'Cash on Delivery',
        paymentStatus: status === 'cancelled' ? 'Refunded' : 'Paid',
        date,
        time,
        notes: Math.random() > 0.8 ? 'Call before delivery' : undefined
      });
    }
  }

  logout() {
    this.auth.logout();
  }
}