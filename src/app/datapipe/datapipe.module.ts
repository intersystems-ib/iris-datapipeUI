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
import {NumberWithSeparatorsPipe} from "./catalog/pipes/number-with-separators.pipe";
import {LargeNumbersPipe} from "./catalog/pipes/large-numbers.pipe";
import {HighlightSearchTextPipe} from "./catalog/pipes/highlight-search-text.pipe";
import {SearchTextPipe} from "./catalog/pipes/search-text.pipe";
import {DebouncedInputDirective} from "./catalog/debounced-input.directive";
import {HighlightSearchTextDirective} from "./catalog/highlight-search-text.directive";

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
        MatSlideToggle,
        NumberWithSeparatorsPipe,
        LargeNumbersPipe,
        HighlightSearchTextPipe,
        SearchTextPipe,
        DebouncedInputDirective,
        HighlightSearchTextDirective
    ]
})
export class DatapipeModule { }
