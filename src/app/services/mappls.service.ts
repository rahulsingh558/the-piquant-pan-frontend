import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Coordinates {
    lat: number;
    lng: number;
}

@Injectable({
    providedIn: 'root'
})
export class MapplsService {
    private mapObject: any = null;
    private isInitialized = false;
    private isBrowser: boolean;
    private markers: any[] = [];
    private polylines: any[] = [];

    // Restaurant location from environment
    readonly restaurantCoords: Coordinates = environment.mappls.restaurantCoords;

    constructor(
        @Inject(PLATFORM_ID) platformId: Object,
        private http: HttpClient
    ) {
        this.isBrowser = isPlatformBrowser(platformId);
    }

    /**
     * Initialize Mappls SDK by loading the script
     */
    async initialize(): Promise<void> {
        if (!this.isBrowser || this.isInitialized) return;

        return new Promise((resolve, reject) => {
            if (document.querySelector('script[src*="apis.mappls.com"]')) {
                this.isInitialized = true;
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = `https://apis.mappls.com/advancedmaps/api/${environment.mappls.apiKey}/map_sdk?layer=vector&v=3.0`;
            script.async = true;
            script.onload = () => {
                console.log('Mappls SDK loaded successfully');
                this.isInitialized = true;
                resolve();
            };
            script.onerror = (error) => {
                console.error('Failed to load Mappls SDK', error);
                reject(new Error('Failed to load Mappls SDK'));
            };
            document.head.appendChild(script);
        });
    }

    /**
     * Wait for mappls global object
     */
    private waitForMappls(timeout: number = 10000): Promise<void> {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const checkMappls = () => {
                if ((window as any).mappls) {
                    console.log('Mappls global object available');
                    resolve();
                } else if (Date.now() - startTime > timeout) {
                    reject(new Error('Timeout waiting for Mappls object'));
                } else {
                    setTimeout(checkMappls, 100);
                }
            };
            checkMappls();
        });
    }

    /**
     * Get restaurant coordinates
     * Note: eLoc API is CORS blocked from browser, so use stored coordinates
     */
    private resolvedRestaurantCoords: Coordinates | null = null;

    /**
     * Get restaurant coordinates
     * Resolves eLoc via backend for accuracy, falls back to stored coords
     */
    async getRestaurantCoordinates(): Promise<Coordinates> {
        if (this.resolvedRestaurantCoords) return this.resolvedRestaurantCoords;

        try {
            const eloc = environment.mappls.restaurantELoc;
            if (eloc) {
                console.log('Resolving restaurant location for eLoc:', eloc);
                const coords = await this.getPlaceDetails(eloc);
                if (coords) {
                    this.resolvedRestaurantCoords = coords;
                    console.log('Resolved restaurant coords:', coords);
                    return coords;
                }
            }
        } catch (error) {
            console.error('Failed to resolve restaurant eLoc:', error);
        }

        console.warn('Using fallback restaurant coordinates');
        return this.restaurantCoords;
    }

    /**
     * Get place details (coordinates) from eLoc via backend
     */
    async getPlaceDetails(eloc: string): Promise<Coordinates | null> {
        try {
            const url = `${environment.apiUrl}/mappls/place-details?eloc=${eloc}`;
            const response = await firstValueFrom(this.http.get<any>(url));

            if (response && response.success && response.data) {
                const data = response.data;
                // Mappls API response usually has latitude/longitude at root or inside
                // Check for common formats
                const lat = data.latitude || (data.point ? data.point.lat : null);
                const lng = data.longitude || (data.point ? data.point.lng : null);

                if (lat && lng) {
                    return { lat: parseFloat(lat), lng: parseFloat(lng) };
                }
            }
            return null;
        } catch (error) {
            console.error('Error fetching place details:', error);
            return null;
        }
    }

    /**
     * Create a map instance
     */
    async createMap(containerId: string, center?: Coordinates, zoom: number = 14): Promise<any> {
        if (!this.isBrowser) return null;

        try {
            if (!this.isInitialized) {
                await this.initialize();
            }
            await this.waitForMappls();

            const mapCenter = center || this.restaurantCoords;
            console.log('Creating map at center:', mapCenter);

            const mapplsObj = (window as any).mappls;

            this.mapObject = new mapplsObj.Map(containerId, {
                center: [mapCenter.lat, mapCenter.lng],
                zoom: zoom,
                zoomControl: true,
                location: false
            });

            return new Promise((resolve) => {
                this.mapObject.on('load', () => {
                    console.log('Map loaded successfully');
                    resolve(this.mapObject);
                });

                setTimeout(() => {
                    if (this.mapObject) {
                        console.log('Map load timeout, but continuing...');
                        resolve(this.mapObject);
                    }
                }, 5000);
            });
        } catch (error) {
            console.error('Error creating map:', error);
            throw error;
        }
    }

    /**
     * Add a marker to the map
     */
    addMarker(coords: Coordinates, options: {
        iconUrl?: string;
        html?: string;
        width?: number;
        height?: number;
        draggable?: boolean;
    } = {}): any {
        if (!this.mapObject) {
            console.error('Cannot add marker - map not initialized');
            return null;
        }

        try {
            const mapplsObj = (window as any).mappls;

            const markerOptions: any = {
                map: this.mapObject,
                position: [coords.lat, coords.lng], // Use array format [lat, lng]
                draggable: options.draggable || false,
                html: options.html // HTML content for marker
            };

            // Icon must be an object with url, width, height per Mappls API
            if (options.iconUrl) {
                markerOptions.icon = {
                    url: options.iconUrl,
                    width: options.width || 32,
                    height: options.height || 32
                };
            }

            console.log('Adding marker at:', coords, 'with options:', markerOptions);
            const marker = new mapplsObj.Marker(markerOptions);

            this.markers.push(marker);
            console.log('Marker added successfully');
            return marker;
        } catch (error) {
            console.error('Error adding marker:', error);
            return null;
        }
    }

    /**
     * Add a colored marker using inline SVG HTML (Guaranteed Visibility)
     */
    addColoredMarker(coords: Coordinates, color: 'orange' | 'green' | 'blue', label?: string): any {
        const colors: { [key: string]: string } = {
            'orange': '#F97316', // tailwind orange-500
            'green': '#22C55E',  // tailwind green-500
            'blue': '#3B82F6'    // tailwind blue-500
        };

        const hexColor = colors[color] || colors['orange'];

        // Simple pin SVG
        const svgHtml = `
            <div style="width: 32px; height: 32px; transform: translate(-50%, -100%);">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${hexColor}" stroke="white" stroke-width="2" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3)); width: 100%; height: 100%;">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
            </div>
        `;

        return this.addMarker(coords, {
            html: svgHtml
        });
    }

    /**
     * Draw a polyline with multiple points
     */
    drawPolyline(points: Coordinates[], color: string = '#FF6B00'): any {
        if (!this.mapObject || points.length < 2) return null;

        try {
            const mapplsObj = (window as any).mappls;
            const paths = points.map(p => ({ lat: p.lat, lng: p.lng }));

            const polyline = new mapplsObj.Polyline({
                map: this.mapObject,
                paths: paths,
                strokeColor: color,
                strokeOpacity: 0.9,
                strokeWeight: 5
            });

            this.polylines.push(polyline);
            console.log('Polyline drawn with', points.length, 'points');
            return polyline;
        } catch (error) {
            console.error('Error drawing polyline:', error);
            return null;
        }
    }

    /**
     * Draw route between points (straight line - Directions API is CORS blocked)
     */
    async drawActualRoute(start: Coordinates, end: Coordinates, color: string = '#FF6B00'): Promise<any> {
        if (!this.mapObject) return null;

        try {
            // Call backend proxy to get directions
            const url = `${environment.apiUrl}/mappls/directions?start=${start.lng},${start.lat}&end=${end.lng},${end.lat}`;
            console.log('Fetching route from backend:', url);

            const response = await firstValueFrom(this.http.get<any>(url));

            if (response && response.success && response.data && response.data.routes && response.data.routes.length > 0) {
                const route = response.data.routes[0];
                if (route.geometry && route.geometry.coordinates) {
                    // Convert [lng, lat] to {lat, lng}
                    const routePoints = route.geometry.coordinates.map((coord: number[]) => ({
                        lng: coord[0],
                        lat: coord[1]
                    }));

                    console.log('Got route points from backend:', routePoints.length);
                    return this.drawPolyline(routePoints, color);
                }
            }

            // Fallback
            console.warn('No route data from backend, using straight line');
            return this.drawPolyline([start, end], color);
        } catch (error) {
            console.error('Error fetching route from backend:', error);
            return this.drawPolyline([start, end], color);
        }
    }

    /**
     * Fit map bounds to include all coordinates
     */
    fitBounds(coords: Coordinates[]): void {
        if (!this.mapObject || coords.length === 0) return;

        try {
            const mapplsObj = (window as any).mappls;
            const bounds = new mapplsObj.LatLngBounds();

            coords.forEach(coord => {
                // Mappls/Mapbox expects [lng, lat] for bounds
                bounds.extend([coord.lng, coord.lat]);
            });

            this.mapObject.fitBounds(bounds, { padding: 80 });
            console.log('Map bounds fitted');
        } catch (error) {
            console.error('Error fitting bounds:', error);
        }
    }

    /**
     * Update marker position
     */
    updateMarkerPosition(marker: any, coords: Coordinates): void {
        if (marker) {
            try {
                marker.setPosition([coords.lat, coords.lng]);
            } catch (error) {
                console.error('Error updating marker position:', error);
            }
        }
    }

    private deliveryMarker: any = null;

    /**
     * Update or create delivery marker
     */
    updateDeliveryMarker(coords: Coordinates): void {
        if (this.deliveryMarker) {
            this.updateMarkerPosition(this.deliveryMarker, coords);
        } else {
            this.deliveryMarker = this.addColoredMarker(coords, 'blue', 'Delivery Partner');
        }
    }

    /**
     * Remove the map instance and cleanup
     */
    destroyMap(): void {
        try {
            this.markers.forEach(m => {
                try { m.remove(); } catch (e) { }
            });
            this.polylines.forEach(p => {
                try { p.remove(); } catch (e) { }
            });
            if (this.mapObject) {
                this.mapObject.remove();
            }
        } catch (error) {
            console.error('Error destroying map:', error);
        }

        this.mapObject = null;
        this.markers = [];
        this.polylines = [];
        this.deliveryMarker = null;
    }

    /**
     * Get delivery progress based on order status
     */
    getDeliveryProgress(orderStatus: string): number {
        const progressMap: { [key: string]: number } = {
            'pending': 0,
            'confirmed': 10,
            'preparing': 25,
            'out_for_delivery': 60,
            'delivered': 100,
            'cancelled': 0
        };
        return progressMap[orderStatus] || 0;
    }

    /**
     * Get position along route based on percentage
     */
    getPositionOnRoute(start: Coordinates, end: Coordinates, percentage: number): Coordinates {
        const t = percentage / 100;
        return {
            lat: start.lat + (end.lat - start.lat) * t,
            lng: start.lng + (end.lng - start.lng) * t
        };
    }

    /**
     * Get estimated coordinates based on address hash (fallback for delivery address)
     */
    getEstimatedCoordinates(address: string): Coordinates {
        let hash = 0;
        const addr = address || '';
        for (let i = 0; i < addr.length; i++) {
            hash = ((hash << 5) - hash) + addr.charCodeAt(i);
            hash = hash & hash;
        }

        const offset = (Math.abs(hash) % 1000) / 50000;
        return {
            lat: this.restaurantCoords.lat + 0.01 + offset,
            lng: this.restaurantCoords.lng + 0.015 + offset
        };
    }

    /**
     * Geocode address (uses estimated coordinates - real geocoding requires backend)
     */
    async geocodeAddress(address: string): Promise<Coordinates> {
        return this.getEstimatedCoordinates(address);
    }
}
