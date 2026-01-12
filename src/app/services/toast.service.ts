import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ToastMessage {
    type: 'success' | 'info' | 'error' | 'warning';
    title: string;
    message: string;
    duration?: number;
}

@Injectable({
    providedIn: 'root'
})
export class ToastService {
    private toastsSubject = new BehaviorSubject<ToastMessage[]>([]);
    public toasts$ = this.toastsSubject.asObservable();

    show(toast: ToastMessage) {
        const currentToasts = this.toastsSubject.value;
        this.toastsSubject.next([...currentToasts, toast]);

        if (toast.duration !== 0) {
            setTimeout(() => {
                this.remove(toast);
            }, toast.duration || 3000);
        }
    }

    success(title: string, message: string) {
        this.show({ type: 'success', title, message });
    }

    error(title: string, message: string) {
        this.show({ type: 'error', title, message });
    }

    info(title: string, message: string) {
        this.show({ type: 'info', title, message });
    }

    remove(toast: ToastMessage) {
        const currentToasts = this.toastsSubject.value;
        this.toastsSubject.next(currentToasts.filter(t => t !== toast));
    }
}
