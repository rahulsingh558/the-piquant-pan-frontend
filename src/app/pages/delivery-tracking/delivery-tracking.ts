import { Component, Inject, PLATFORM_ID, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-delivery-tracking',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './delivery-tracking.html',
})
export class DeliveryTrackingPage implements OnInit, OnDestroy {
    isBrowser = false;
    orderNumber = '';
    isTracking = false;
    error = '';
    statusMessage = '';

    currentLocation: { lat: number; lng: number } | null = null;
    lastUpdateTime: Date | null = null;
    updateCount = 0;

    private socket: Socket | null = null;
    private watchId: number | null = null;
    private updateInterval: any = null;

    constructor(@Inject(PLATFORM_ID) platformId: Object) {
        this.isBrowser = isPlatformBrowser(platformId);
    }

    ngOnInit(): void {
        if (this.isBrowser) {
            // Initialize socket connection
            this.socket = io(environment.backendUrl, {
                transports: ['websocket', 'polling']
            });

            this.socket.on('connect', () => {
                console.log('Connected to server');
            });

            this.socket.on('disconnect', () => {
                console.log('Disconnected from server');
            });
        }
    }

    ngOnDestroy(): void {
        this.stopTracking();
        if (this.socket) {
            this.socket.disconnect();
        }
    }

    startTracking(): void {
        if (!this.orderNumber.trim()) {
            this.error = 'Please enter an order number';
            return;
        }

        this.error = '';
        this.statusMessage = 'Requesting location permission...';

        // Check if geolocation is supported
        if (!navigator.geolocation) {
            this.error = 'Geolocation is not supported by your browser';
            return;
        }

        // Join the delivery room
        this.socket?.emit('delivery:join', { orderId: this.orderNumber });

        // Start watching position
        this.watchId = navigator.geolocation.watchPosition(
            (position) => this.handlePositionUpdate(position),
            (error) => this.handlePositionError(error),
            {
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 10000
            }
        );

        this.isTracking = true;
        this.statusMessage = 'Tracking started. Location is being shared.';

        // Also set up interval to send updates even if position doesn't change
        this.updateInterval = setInterval(() => {
            if (this.currentLocation) {
                this.sendLocationUpdate(this.currentLocation.lat, this.currentLocation.lng);
            }
        }, 5000);
    }

    stopTracking(): void {
        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }

        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }

        this.isTracking = false;
        this.statusMessage = 'Tracking stopped';
        this.updateCount = 0;
    }

    private handlePositionUpdate(position: GeolocationPosition): void {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        this.currentLocation = { lat, lng };
        this.lastUpdateTime = new Date();

        this.sendLocationUpdate(lat, lng);
    }

    private sendLocationUpdate(lat: number, lng: number): void {
        if (this.socket && this.isTracking) {
            this.socket.emit('delivery:location', {
                orderId: this.orderNumber,
                lat,
                lng,
                timestamp: Date.now()
            });

            this.updateCount++;
            this.statusMessage = `📍 Location sent (${this.updateCount} updates)`;
        }
    }

    private handlePositionError(error: GeolocationPositionError): void {
        switch (error.code) {
            case error.PERMISSION_DENIED:
                this.error = 'Location permission denied. Please allow location access.';
                break;
            case error.POSITION_UNAVAILABLE:
                this.error = 'Location information is unavailable.';
                break;
            case error.TIMEOUT:
                this.error = 'Location request timed out.';
                break;
            default:
                this.error = 'An unknown error occurred.';
        }
        this.stopTracking();
    }

    formatCoordinate(value: number): string {
        return value.toFixed(6);
    }
}
