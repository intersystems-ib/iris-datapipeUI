import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  Output
} from '@angular/core';
import {NgIf, NgStyle} from "@angular/common";
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
    MatTooltipModule,
    NgStyle
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

  @Input()zIndex: number = 10;
  protected cdr = inject(ChangeDetectorRef);


  // Optional: expose a method if you ever want to close programmatically
  public closeModal(): void {
    this.open = false
    this.openChange.emit(this.open);
    this.cdr.markForCheck()
  }

  public openModal():void
  {
    this.open = true
    this.openChange.emit(this.open)
    this.cdr.markForCheck()
  }

  public onTitleClick(): void {
    if (this.titleClickable) {
      this.titleClick.emit();
    }
  }

}

