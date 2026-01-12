import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class WebSocketService {
    private socket: Socket | undefined;
    private readonly URL = 'http://localhost:5001';
    private isBrowser: boolean;

    constructor(@Inject(PLATFORM_ID) platformId: Object) {
        this.isBrowser = isPlatformBrowser(platformId);
        if (this.isBrowser) {
            this.socket = io(this.URL);
        }
    }

    listen(eventName: string): Observable<any> {
        return new Observable((subscriber) => {
            if (this.socket) {
                this.socket.on(eventName, (data) => {
                    subscriber.next(data);
                });
            }
        });
    }

    emit(eventName: string, data: any) {
        if (this.socket) {
            this.socket.emit(eventName, data);
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }
}
