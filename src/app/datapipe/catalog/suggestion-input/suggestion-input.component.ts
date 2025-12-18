import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  Output
} from '@angular/core';
import {FormsModule} from "@angular/forms";
import {NgForOf} from "@angular/common";
import {MatFormField, MatInput} from "@angular/material/input";
import {CdkConnectedOverlay, CdkOverlayOrigin} from "@angular/cdk/overlay";

@Component({
  selector: 'catalog-suggestion-input',
  standalone: true,
  imports: [
    FormsModule,
    NgForOf,
    MatInput,
    MatFormField,
    CdkConnectedOverlay,
    CdkOverlayOrigin
  ],
  templateUrl: './suggestion-input.component.html',
  styleUrl: './suggestion-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SuggestionInputComponent {

  protected cdr = inject(ChangeDetectorRef)

  @Input()
  suggestions: string[] = [];

  protected filtered: string[] = [];

  @Input()
  value: string = '';

  @Output()
  valueChange = new EventEmitter<string>();

  protected open = false;

  filterSuggestions() {
    if (this.value.length < 3) {
      this.filtered = []
    } else {
      const query = this.value.toLowerCase();
      this.filtered = this.suggestions.filter(item =>
        item.toLowerCase().includes(query)
      );
    }
    this.cdr.markForCheck()
  }

  selectSuggestion(item: string) {
    this.value = item;
    this.valueChange.emit(this.value)
    this.open = false
    this.cdr.markForCheck()
  }

}
