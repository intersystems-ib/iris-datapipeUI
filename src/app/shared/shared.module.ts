import { ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertDisplayComponent } from './alert-display/alert-display.component';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
import { DefaultFiltersComponent } from './default-filters/default-filters.component';
import { AlertService } from './alert.service';

import {MatButtonModule} from '@angular/material/button';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatTableModule} from '@angular/material/table';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatIconModule} from '@angular/material/icon';
import {MatSelectModule} from '@angular/material/select';
import {MatInputModule} from '@angular/material/input';
import {FormsModule,ReactiveFormsModule} from '@angular/forms';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatMenuModule} from '@angular/material/menu';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatChipsModule} from '@angular/material/chips';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatDialogModule} from '@angular/material/dialog';
import {MatDividerModule} from '@angular/material/divider';
import {MatTabsModule} from '@angular/material/tabs';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatListModule} from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';

const mm = [ 
  MatButtonModule,
  MatToolbarModule,
  MatFormFieldModule,
  MatIconModule,
  MatTableModule,
  MatPaginatorModule,
  MatSelectModule,
  MatInputModule,
  FormsModule,
  MatProgressSpinnerModule,
  MatAutocompleteModule,
  ReactiveFormsModule,
  MatMenuModule,
  MatTooltipModule,
  MatChipsModule,
  MatExpansionModule,
  MatDatepickerModule,
  MatDialogModule,
  MatDividerModule,
  MatTabsModule,
  MatSidenavModule,
  MatListModule,
  MatCardModule,
  MatCheckboxModule
]

@NgModule({
  declarations: [
    AlertDisplayComponent,
    ConfirmDialogComponent,
    DefaultFiltersComponent
  ],
  imports: [
    CommonModule,
    ...mm
  ],
  exports: [
    ...mm,
    ConfirmDialogComponent,
    AlertDisplayComponent,
    DefaultFiltersComponent
  ]
})
export class SharedModule { 
  static forRoot(): ModuleWithProviders<SharedModule> {
    return {
        ngModule: SharedModule,
        providers: [
          AlertService,
        ]
    }
}
}
