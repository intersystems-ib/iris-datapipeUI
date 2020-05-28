import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';

import { AlertDisplayComponent } from './alert-display/alert-display.component';
import { AlertService } from './alert.service';

import {
  MatButtonModule,
  MatToolbarModule,
  MatIconModule,
  MatTableModule,
  MatPaginatorModule,
  MatSortModule,
  MatInputModule,
  MatDividerModule,
  MatSidenavModule,
  MatProgressSpinnerModule,
  MatListModule,
  MatCardModule,
  MatTooltipModule,
  MatGridListModule,
  MatExpansionModule,
  MatAutocompleteModule,
  MatChipsModule,
  MatDatepickerModule,
  MatNativeDateModule,
  MatTabsModule,
  MatSelectModule
} from '@angular/material';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';

const mm = [ 
  MatButtonModule, 
  MatToolbarModule,
  MatIconModule,
  MatTableModule,
  MatPaginatorModule,
  MatSortModule,
  MatInputModule,
  MatDividerModule,
  MatSidenavModule,
  MatProgressSpinnerModule,
  MatListModule,
  MatCardModule,
  MatTooltipModule,
  MatGridListModule,
  MatExpansionModule,
  MatAutocompleteModule,
  MatChipsModule,
  MatDatepickerModule,
  MatNativeDateModule,
  MatTabsModule,
  MatSelectModule
]

@NgModule({
  declarations: [AlertDisplayComponent, ConfirmDialogComponent],
  imports: [
    CommonModule,
    FlexLayoutModule,
    ...mm
  ],
  exports: [
    ...mm,
    FlexLayoutModule,
    AlertDisplayComponent,
    ConfirmDialogComponent
  ]
})
export class SharedModule {
  static forRoot(): ModuleWithProviders {
      return {
          ngModule: SharedModule,
          providers: [
            AlertService,
          ]
      }
  }
}
