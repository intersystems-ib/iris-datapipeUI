import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ToastConfig } from './toast.component';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSubject = new BehaviorSubject<Map<number, ToastConfig>>(new Map());
  public toasts$ = this.toastsSubject.asObservable();

  private toastIdCounter = 0;

  /**
   * Show a success toast notification
   * @param title - The title of the toast
   * @param message - Optional message
   * @param duration - Duration in milliseconds (default: 3000)
   */
  success(title: string, message?: string, duration: number = 3000): void {
    this.show({
      type: 'success',
      title,
      message,
      duration
    });
  }

  /**
   * Show an error toast notification
   * @param title - The title of the toast
   * @param message - Optional message
   * @param duration - Duration in milliseconds (default: 5000)
   */
  error(title: string, message?: string, duration: number = 5000): void {
    this.show({
      type: 'error',
      title,
      message,
      duration
    });
  }

  /**
   * Show a warning toast notification
   * @param title - The title of the toast
   * @param message - Optional message
   * @param duration - Duration in milliseconds (default: 4000)
   */
  warning(title: string, message?: string, duration: number = 4000): void {
    this.show({
      type: 'warning',
      title,
      message,
      duration
    });
  }

  /**
   * Show an info toast notification
   * @param title - The title of the toast
   * @param message - Optional message
   * @param duration - Duration in milliseconds (default: 3000)
   */
  info(title: string, message?: string, duration: number = 3000): void {
    this.show({
      type: 'info',
      title,
      message,
      duration
    });
  }

  /**
   * Show a toast notification
   * @param config - The toast configuration
   */
  private show(config: ToastConfig): void {
    const id = this.toastIdCounter++;
    const currentToasts = this.toastsSubject.value;
    currentToasts.set(id, config);
    this.toastsSubject.next(new Map(currentToasts));

    // Auto-remove after duration
    setTimeout(() => {
      this.remove(id);
    }, config.duration);
  }

  /**
   * Remove a toast by ID
   * @param id - The toast ID to remove
   */
  remove(id: number): void {
    const currentToasts = this.toastsSubject.value;
    currentToasts.delete(id);
    this.toastsSubject.next(new Map(currentToasts));
  }

  /**
   * Clear all toasts
   */
  clearAll(): void {
    this.toastsSubject.next(new Map());
  }
}
