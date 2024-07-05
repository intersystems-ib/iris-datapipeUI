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

@NgModule({
  declarations: [
    InboxListComponent,
    InboxDetailComponent,
    InboxInfoComponent,
    ViewstreamDialogComponent,
    InboxHistoryComponent,
    DashboardComponent
  ],
  imports: [
    CommonModule,
    DatapipeRoutingModule,
    SharedModule,
    NgApexchartsModule,
    SideBySideDiffComponent
  ]
})
export class DatapipeModule { }
