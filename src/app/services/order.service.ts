import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface OrderItem {
    foodId: string;
    name: string;
    basePrice: number;
    quantity: number;
    addons: { name: string; price: number }[];
    totalPrice: number;
}

export interface Order {
    _id?: string;
    orderNumber?: number;
    userId?: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    items: OrderItem[];
    deliveryAddress: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        landmark?: string;
    };
    subtotal: number;
    deliveryCharge: number;
    tax: number;
    discount: number;
    totalAmount: number;
    paymentMethod: string;
    paymentStatus: string;
    orderStatus: string;
    specialInstructions?: string;
    createdAt?: Date;
    updatedAt?: Date;
    deliveredAt?: Date;
    cancelledAt?: Date;
    cancelReason?: string;
}

export interface OrderStats {
    totalOrders: number;
    periodOrders: number;
    totalRevenue: number;
    periodRevenue: number;
    avgOrderValue: number;
    statusBreakdown: { _id: string; count: number }[];
}

export interface BestSellingItem {
    _id: string;
    name: string;
    totalSold: number;
    totalRevenue: number;
}

export interface RevenueDataPoint {
    _id: { year: number; month: number; day?: number };
    revenue: number;
    orders: number;
}

@Injectable({
    providedIn: 'root'
})
export class OrderService {
    private apiUrl = 'http://localhost:5001/api/orders';

    constructor(private http: HttpClient) { }

    // Get all orders with optional filters
    getAllOrders(filters?: {
        status?: string;
        paymentStatus?: string;
        search?: string;
        startDate?: string;
        endDate?: string;
        limit?: number;
        skip?: number;
        sortBy?: string;
    }): Observable<{ success: boolean; orders: Order[]; total: number; page: number; totalPages: number }> {
        let params = new HttpParams();

        if (filters) {
            Object.keys(filters).forEach(key => {
                const value = filters[key as keyof typeof filters];
                if (value !== undefined && value !== null) {
                    params = params.set(key, value.toString());
                }
            });
        }

        return this.http.get<any>(this.apiUrl, { params });
    }

    // Get single order by ID
    getOrderById(id: string): Observable<{ success: boolean; order: Order }> {
        return this.http.get<any>(`${this.apiUrl}/${id}`);
    }

    // Create new order
    createOrder(order: Order): Observable<{ success: boolean; message: string; order: Order }> {
        return this.http.post<any>(this.apiUrl, order);
    }

    // Update order
    updateOrder(id: string, order: Partial<Order>): Observable<{ success: boolean; message: string; order: Order }> {
        return this.http.put<any>(`${this.apiUrl}/${id}`, order);
    }

    // Update order status
    updateOrderStatus(id: string, status: string, cancelReason?: string): Observable<{ success: boolean; message: string; order: Order }> {
        const body: any = { status };
        if (cancelReason) {
            body.cancelReason = cancelReason;
        }
        return this.http.put<any>(`${this.apiUrl}/${id}/status`, body);
    }

    // Delete order
    deleteOrder(id: string): Observable<{ success: boolean; message: string }> {
        return this.http.delete<any>(`${this.apiUrl}/${id}`);
    }

    // Get order statistics
    getOrderStats(period: string = '7d'): Observable<{ success: boolean; stats: OrderStats }> {
        const params = new HttpParams().set('period', period);
        return this.http.get<any>(`${this.apiUrl}/stats/summary`, { params });
    }

    // Get revenue data for charts
    getRevenueData(period: string = '7d', groupBy: string = 'day'): Observable<{ success: boolean; revenueData: RevenueDataPoint[] }> {
        const params = new HttpParams()
            .set('period', period)
            .set('groupBy', groupBy);
        return this.http.get<any>(`${this.apiUrl}/stats/revenue`, { params });
    }

    // Get best-selling items
    getBestSellingItems(limit: number = 10): Observable<{ success: boolean; bestSelling: BestSellingItem[] }> {
        const params = new HttpParams().set('limit', limit.toString());
        return this.http.get<any>(`${this.apiUrl}/stats/best-selling`, { params });
    }
}
