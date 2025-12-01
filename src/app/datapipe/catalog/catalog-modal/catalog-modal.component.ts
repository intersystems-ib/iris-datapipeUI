import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {NgIf} from "@angular/common";

@Component({
  selector: 'catalog-modal',
  standalone: true,
  imports: [
    NgIf
  ],
  templateUrl: './catalog-modal.component.html',
  styleUrl: './catalog-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatalogModalComponent {
  @Output() openChange = new EventEmitter<boolean>();

  @Input() open: boolean | undefined = false;

  // Optional: expose a method if you ever want to close programmatically
  public close(): void {
    this.open = false
    this.openChange.emit(this.open);
  }

}

