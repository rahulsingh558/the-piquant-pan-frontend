import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from '../../services/toast.service';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
    selector: 'app-toast',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="fixed top-4 right-4 z-50 flex flex-col gap-2">
      <div *ngFor="let toast of toasts"
           [@fadeInOut]
           [class]="getToastClass(toast.type)"
           class="min-w-[300px] p-4 rounded-lg shadow-lg border-l-4 transform transition-all duration-300 flex justify-between items-start">
        <div>
          <h4 class="font-bold text-sm">{{ toast.title }}</h4>
          <p class="text-sm mt-1 opacity-90">{{ toast.message }}</p>
        </div>
        <button (click)="remove(toast)" class="text-sm font-bold opacity-60 hover:opacity-100 ml-4">✕</button>
      </div>
    </div>
  `,
    styles: [`
    :host { display: block; }
  `],
    animations: [
        trigger('fadeInOut', [
            transition(':enter', [
                style({ transform: 'translateX(100%)', opacity: 0 }),
                animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
            ]),
            transition(':leave', [
                animate('300ms ease-in', style({ transform: 'translateX(100%)', opacity: 0 }))
            ])
        ])
    ]
})
export class ToastComponent implements OnInit {
    toasts: ToastMessage[] = [];

    constructor(private toastService: ToastService) { }

    ngOnInit() {
        this.toastService.toasts$.subscribe(toasts => {
            this.toasts = toasts;
        });
    }

    remove(toast: ToastMessage) {
        this.toastService.remove(toast);
    }

    getToastClass(type: string): string {
        switch (type) {
            case 'success':
                return 'bg-green-100 border-green-500 text-green-800';
            case 'error':
                return 'bg-red-100 border-red-500 text-red-800';
            case 'info':
                return 'bg-blue-100 border-blue-500 text-blue-800';
            case 'warning':
                return 'bg-yellow-100 border-yellow-500 text-yellow-800';
            default:
                return 'bg-white border-gray-500 text-gray-800';
        }
    }
}
