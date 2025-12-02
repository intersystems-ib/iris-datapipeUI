import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { SideBySideDiffComponent } from 'ngx-diff';

import { DatapipeRoutingModule } from './datapipe-routing.module';
import { InboxListComponent } from './inbox-list/inbox-list.component';

import { SharedModule } from '../shared/shared.module';
import { InboxDetailComponent } from './inbox-detail/inbox-detail.component';
import { InboxInfoComponent } from './inbox-info/inbox-info.component';
import { ViewstreamDialogComponent } from './viewstream-dialog/viewstream-dialog.component';
import { InboxHistoryComponent } from './inbox-history/inbox-history.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { PipeListComponent } from './pipe-list/pipe-list.component';
import { PipeDetailComponent } from './pipe-detail/pipe-detail.component';
import { CatalogComponent } from './catalog/catalog.component';
import {CatalogModalComponent} from "./catalog/catalog-modal/catalog-modal.component";
import {MatButtonToggle, MatButtonToggleGroup} from "@angular/material/button-toggle";
import {MatSlideToggle} from "@angular/material/slide-toggle";

@NgModule({
  declarations: [
    InboxListComponent,
    InboxDetailComponent,
    InboxInfoComponent,
    ViewstreamDialogComponent,
    InboxHistoryComponent,
    DashboardComponent,
    PipeListComponent,
    PipeDetailComponent,
    CatalogComponent,
  ],
  imports: [
    CommonModule,
    DatapipeRoutingModule,
    SharedModule,
    NgApexchartsModule,
    SideBySideDiffComponent,
    CatalogModalComponent,
    MatButtonToggleGroup,
    MatButtonToggle,
    MatSlideToggle
  ]
})
export class DatapipeModule { }
