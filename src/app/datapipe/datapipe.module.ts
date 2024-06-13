import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DatapipeRoutingModule } from './datapipe-routing.module';
import { InboxListComponent } from './inbox-list/inbox-list.component';

import { SharedModule } from '../shared/shared.module';
import { InboxDetailComponent } from './inbox-detail/inbox-detail.component';
import { InboxInfoComponent } from './inbox-info/inbox-info.component';
import { ViewstreamDialogComponent } from './viewstream-dialog/viewstream-dialog.component';
import { InboxHistoryComponent } from './inbox-history/inbox-history.component';

import { NgxDiffModule } from 'ngx-diff';


@NgModule({
  declarations: [
    InboxListComponent,
    InboxDetailComponent,
    InboxInfoComponent,
    ViewstreamDialogComponent,
    InboxHistoryComponent
  ],
  imports: [
    CommonModule,
    DatapipeRoutingModule,
    SharedModule,
    NgxDiffModule
  ]
})
export class DatapipeModule { }
