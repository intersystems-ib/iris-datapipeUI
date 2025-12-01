import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {NgIf} from "@angular/common";
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";
import {MatTooltipModule} from "@angular/material/tooltip";

@Component({
  selector: 'catalog-modal',
  standalone: true,
  imports: [
    NgIf,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ],
  templateUrl: './catalog-modal.component.html',
  styleUrl: './catalog-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class  CatalogModalComponent {
  @Output() openChange = new EventEmitter<boolean>();
  @Output() titleClick = new EventEmitter<void>();

  @Input() open: boolean | undefined = false;
  @Input() title: string = 'Details';
  @Input() titleClickable: boolean = false;

  // Optional: expose a method if you ever want to close programmatically
  public close(): void {
    this.open = false
    this.openChange.emit(this.open);
  }

  public onTitleClick(): void {
    if (this.titleClickable) {
      this.titleClick.emit();
    }
  }

}

