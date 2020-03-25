import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '../shared/shared.module';
import { DatapipeService } from './datapipe.service';
import { DatapipeRoutingModule } from './datapipe-routing.module';
import { InboxListComponent } from './inbox-list/inbox-list.component';
import { FormsModule } from '@angular/forms';
import { InboxDetailComponent } from './inbox-detail/inbox-detail.component';
import { ViewstreamDialogComponent } from './viewstream-dialog/viewstream-dialog.component';
import { InboxInfoComponent } from './inbox-info/inbox-info.component';
import { InboxHistoryComponent } from './inbox-history/inbox-history.component';
import { NgxTextDiffModule } from 'ngx-text-diff';
import { ConfirmDialogComponent } from '../shared/confirm-dialog/confirm-dialog.component';


@NgModule({
  declarations: [InboxListComponent, InboxDetailComponent, ViewstreamDialogComponent, InboxInfoComponent, InboxHistoryComponent],
  imports: [
    CommonModule,
    DatapipeRoutingModule,
    SharedModule,
    FormsModule,
    NgxTextDiffModule
  ],
  providers: [
    DatapipeService
  ],
  entryComponents: [
    ViewstreamDialogComponent,
    ConfirmDialogComponent
  ]
})
export class DatapipeModule { }
