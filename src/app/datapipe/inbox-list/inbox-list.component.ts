import { Component, OnInit, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { Observable } from 'rxjs';
import { Inbox } from '../datapipe.model';
import { DatapipeService } from '../datapipe.service';
import { MatPaginator, PageEvent, MatDialog } from '@angular/material';
import { NgForm } from '@angular/forms';
import { map, tap } from 'rxjs/operators';
import { ConfirmDialogComponent } from 'src/app/shared/confirm-dialog/confirm-dialog.component';
import { PreferencesService } from 'src/app/shared/preferences.service';
import { AuthService } from 'src/app/auth/auth.service';
import { isNull } from '@angular/compiler/src/output/output_ast';

/**
 * Display all shows using a table
 */
@Component({
  selector: 'app-inbox-list',
  templateUrl: './inbox-list.component.html',
  styleUrls: ['./inbox-list.component.scss']
})
export class InboxListComponent implements AfterViewInit {

  /** list of inboxes to display */
  inboxes$: Observable<Inbox[]>;

  /** total results of the query sent to the server */
  totalResults: number = 0;

  /** columns that will be displayed */
  displayedColumns = ['actions', 'Source', 'Flow', 'MsgId', 'Subject', 'Element', 'UpdatedTS', 'Status', 'StagingStatus', 'OperStatus'];

  /** filters that are using to query the server */
  filters: any = {};

  /** autocomplete fields */
  status: any[];
  filteredStatus: any[];
  stagingStatus: any[];
  filteredStagingStatus: any[];
  operStatus: any[];
  filteredOperStatus: any[];

  /**
   * Constructor
   */
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild('filtersForm', {static: true}) filtersForm: NgForm;
  constructor(
    private cdr: ChangeDetectorRef,
    public datapipeService: DatapipeService,
    public dialog: MatDialog,
    public preferencesService: PreferencesService,
    public authService: AuthService,
  ) { }

  /**
   * Component init
   */
  ngAfterViewInit() {
    this.status = [ 'DONE', 'OPERATING', 'STAGING','INGESTING', 'ERROR-OPERATING','ERROR-STAGING','ERROR-INGESTING', 'ERROR-GENERAL'];
    this.filteredStatus = this.status;
    this.stagingStatus = [ 'N/A', 'Valid', 'Invalid', 'Warning'];
    this.filteredStagingStatus = this.stagingStatus;
    this.operStatus = [ 'N/A', 'Processing', 'Processed', 'Error', 'Ignored'];
    this.filteredOperStatus = this.operStatus;
    
    this.filters = this.preferencesService.inboxList.filters;
    
    this.paginator.pageIndex = this.preferencesService.inboxList.pageIndex;
    this.paginator.pageSize = this.preferencesService.inboxList.pageSize;
    this.getDataPage(this.paginator.pageIndex, this.paginator.pageSize);
  }

  /**
   * Get a page of data from the server using service
   * @param pageIndex
   * @param pageSize 
   */
  getDataPage(pageIndex: number, pageSize: number) {
    this.cdr.detectChanges();

    this.preferencesService.inboxList.pageIndex = pageIndex;
    this.preferencesService.inboxList.pageSize = pageSize;

    this.inboxes$ = this.datapipeService.findInboxes(pageIndex + 1, pageSize, this.buildQuery()).pipe(
      tap(res => {
        this.totalResults = res['total']
      }),
      map(res => res['children'])
    );
  }

  /**
   * User wants to change page, get new page data
   * @param event
   */
  onChangePage(event?: PageEvent) {
    this.getDataPage(event.pageIndex, event.pageSize);
  }

  /**
   * Search filters are modified
   * @param value
   */
  onChangeFilter(value): void {
    this.paginator.firstPage();
    this.getDataPage(this.paginator.pageIndex, this.paginator.pageSize);
  }

  /**
   * Build server query from search filters
   */
  buildQuery(): any {
    const query = {};
    for (const filter in this.filters) {
      if (this.filters.hasOwnProperty(filter)) {
        const value = this.filters[filter];
        if (value && value !== '') {
          query[filter] = this.filters[filter];
        }
      }
    }
    return query;
  }

  /**
   * Submit search form
   */
  search(event?: PageEvent) {
    this.onChangeFilter('');
  }

  /**
   * Click on reset filters button
   */
  clickResetFilters(filter): void {

    const oldFilters =this.filters;

    this.filters = {};

    if (filter == "reset") {
      filter = this.preferencesService.inboxList.filtersInitial
      this.filtersForm.reset(filter);
    }
    if (filter == "all") {
      filter = this.preferencesService.inboxList.filterAll
      this.filtersForm.reset(filter);
    }
    if (filter == "errors") {
      filter = this.preferencesService.inboxList.filterErrors
      this.filtersForm.reset(filter);
    }
    if (filter == "warnings") {
      filter = this.preferencesService.inboxList.filterWarnings
      this.filtersForm.reset(filter);
    }
    this.cdr.detectChanges();

    // set initial values for filters
    const filtersInitial = filter;
    for (const finitial in filter) {
      if (filtersInitial.hasOwnProperty(finitial)) {
        const value = filtersInitial[finitial];
        if (value && value !== '' && value !== 'SAME') {
          this.filters[finitial] = value;
        } else if (value === 'SAME') {
          this.filters[finitial] = oldFilters[finitial]
        }
      }
    }
    
    this.onChangeFilter(null);
  }


  /**
   * Returns if the user can perform a search depending on the value of the filter fields
   */
  canSearch(): boolean {
    return true;
  }

  /**
   * Filter Status (auto-complete)
   */
  onStatusKeyUp(event: any, value: String): void {
    this.filteredStatus = this.status.filter(status => {
      return (status.toUpperCase().indexOf(value.toUpperCase()) !== -1);
    });
  }

  /**
   * Filter Staging Status (auto-complete)
   */
  onStagingStatusKeyUp(event: any, value: String): void {
    this.filteredStagingStatus = this.stagingStatus.filter(stagingStatus => {
      return (stagingStatus.toUpperCase().indexOf(value.toUpperCase()) !== -1);
    });
  }

  /**
   * Filter Oper Status (auto-complete)
   */
  onOperStatusKeyUp(event: any, value: String): void {
    this.filteredOperStatus = this.operStatus.filter(operStatus => {
      return (operStatus.toUpperCase().indexOf(value.toUpperCase()) !== -1);
    });
  }

  /**
   * Click on ignore (change ignore status)
   */
  clickIgnore(inbox: Inbox): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: { title: 'Confirmation', text: 'Change ignored status?' }
    });

    dialogRef.afterClosed().subscribe(confirmation => {
      if (confirmation) {
        this.datapipeService.ignoreInbox(inbox.Id).subscribe(
          data => {
            this.search(null);
          }
        )
      }
    });
  }


}
