import { Component, OnInit, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { Observable } from 'rxjs';
import { Inbox } from '../datapipe.model';
import { DatapipeService } from '../datapipe.service';
import { MatPaginator, PageEvent } from '@angular/material';
import { NgForm } from '@angular/forms';
import { map, tap } from 'rxjs/operators';

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
  displayedColumns = ['actions', 'Source', 'Flow', 'MsgId', 'Element', 'UpdatedTS', 'Status', 'StagingStatus', 'OperStatus'];

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
    public datapipeService: DatapipeService
  ) { }

  /**
   * Component init
   */
  ngAfterViewInit() {
    this.status = [ 'INGESTING', 'ERROR-INGESTING', 'STAGING', 'ERROR-STAGING', 'OPERATING', 'ERROR-OPERATING', 'DONE', 'ERROR-GENERAL'];
    this.filteredStatus = this.status;
    this.stagingStatus = [ 'N/A', 'Valid', 'Invalid'];
    this.filteredStagingStatus = this.stagingStatus;
    this.operStatus = [ 'N/A', 'Processing', 'Processed', 'Error'];
    this.filteredOperStatus = this.operStatus;

    this.paginator.pageIndex = 0;
    this.paginator.pageSize = 10;
    this.getDataPage(this.paginator.pageIndex, this.paginator.pageSize);
  }

  /**
   * Get a page of data from the server using service
   * @param pageIndex
   * @param pageSize 
   */
  getDataPage(pageIndex: number, pageSize: number) {
    this.cdr.detectChanges();
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
  clickResetFilters(): void {
    this.filters = {};
    this.filtersForm.reset();
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


}
