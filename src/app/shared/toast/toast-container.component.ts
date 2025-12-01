import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from './toast.service';
import { ToastComponent } from './toast.component';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, ToastComponent],
  template: `
    <div class="toast-container">
      <bos-msg-toast
        *ngFor="let toast of (toastService.toasts$ | async)?.entries(); let i = index"
        [config]="toast[1]"
        [id]="toast[0]"
        [height]="(i * 5 + 1).toString()"
        [startTimer]="true"
        (done)="toastService.remove($event)"
      ></bos-msg-toast>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 0;
      right: 0;
      z-index: 9999;
      pointer-events: none;
    }

    .toast-container > * {
      pointer-events: all;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToastContainerComponent {
  constructor(public toastService: ToastService) {}
}
