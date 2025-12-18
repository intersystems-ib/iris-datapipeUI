import {Directive, EventEmitter, HostListener, Input, OnDestroy, Output} from '@angular/core';

@Directive({
  selector: '[debouncedInput]',
  standalone: true
})
export class DebouncedInputDirective implements OnDestroy{

  @Input() debounceTime = 100;

  /**
   * Emits the debounced input value
   */
  @Output() debouncedValue = new EventEmitter<string>();

  private timeoutId: any;

  @HostListener('input', ['$event.target.value'])
  onInput(value: string): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      this.debouncedValue.emit(value);
    }, this.debounceTime);
  }

  ngOnDestroy(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }
}
