import { AfterContentInit, AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Observable } from 'rxjs';
import { AuthService } from 'src/app/auth/auth.service';
import { ConfirmDialogComponent } from 'src/app/shared/confirm-dialog/confirm-dialog.component';
import { PreferencesService } from 'src/app/shared/preferences.service';
import { Inbox } from '../datapipe.model';
import { DatapipeService } from '../datapipe.service';

@Component({
  selector: 'app-inbox-list',
  templateUrl: './inbox-list.component.html',
  styleUrls: ['./inbox-list.component.scss']
})
export class InboxListComponent implements AfterViewInit {

  /** list of inboxes to display */
  public dataSource = new MatTableDataSource<Inbox>();

  /** total results of the query sent to the server */
  totalResults: number = 0;

  /** columns that will be displayed */
  displayedColumns = ['actions', 'Source', 'Pipe', 'MsgId', 'Subject', 'Element', 'UpdatedTS', 'Status', 'StagingStatus', 'OperStatus'];

  /** filters that are using to query the server */
  filters: any = {};

  /** autocomplete fields */
  status: any[];
  filteredStatus: any[];
  stagingStatus: any[];
  filteredStagingStatus: any[];
  operStatus: any[];
  filteredOperStatus: any[];
  filteredPipes: any[];

  @ViewChild(MatPaginator, {static: true}) paginator!: MatPaginator;
  
  @ViewChild('filtersForm', {static: true}) filtersForm!: NgForm;

  constructor(
    public datapipeService: DatapipeService,
    public preferencesService: PreferencesService,
    public authService: AuthService,
    public dialog: MatDialog,
  ) {
      this.status = [ 'DONE', 'OPERATING', 'STAGING','INGESTING', 'ERROR-OPERATING','ERROR-STAGING','ERROR-INGESTING', 'ERROR-GENERAL'];
      this.filteredStatus = this.status;
      this.stagingStatus = [ 'N/A', 'Valid', 'Invalid', 'Warning'];
      this.filteredStagingStatus = this.stagingStatus;
      this.operStatus = [ 'N/A', 'Processing', 'Processed', 'Error', 'Ignored'];
      this.filteredOperStatus = this.operStatus;

      this.filteredPipes = [];
      this.datapipeService.findPipes().subscribe((res) => {
        this.filteredPipes = res.children;
      });
  }

  /**
   * Component init
   */
  ngAfterViewInit() {
      setTimeout(() => {
        this.filters = this.preferencesService.inboxList.filters;
        this.paginator.pageIndex = this.preferencesService.inboxList.pageIndex;
        this.paginator.pageSize = this.preferencesService.inboxList.pageSize;
        this.getDataPage(this.paginator.pageIndex, this.paginator.pageSize);
      });
  }

  /**
   * Get a page of data from the server using service
   * @param pageIndex
   * @param pageSize 
   */
  getDataPage(pageIndex: number, pageSize: number) {
    this.preferencesService.inboxList.pageIndex = pageIndex;
    this.preferencesService.inboxList.pageSize = pageSize;
    
    this.datapipeService.findInboxes(pageIndex + 1, pageSize, this.buildQuery())
    .subscribe((res)=>{
      this.dataSource.data = res.children;
      this.totalResults = res.total;
    });

  }

  /**
   * User wants to change page, get new data page
   * @param event
   */
  onChangePage(event: PageEvent) {
    this.getDataPage(event.pageIndex, event.pageSize);
  }

  /**
   * Search filters are modified
   * @param value
   */
  onChangeFilter(): void {
    this.paginator.firstPage();
    this.getDataPage(this.paginator.pageIndex, this.paginator.pageSize);
  }

  /**
   * Build server query from search filters
   */
  buildQuery(): any {
    const query: any = {};
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
    this.onChangeFilter();
  }

  /**
   * Click on reset filters button
   */
  clickResetFilters(type: string): void {
    const currentFilters = this.filters;
 
    // initialize newFilters using filtersPreset
    let newFilters: any = {};
    Object.assign(newFilters, this.preferencesService.inboxList.filtersPreset[type]);

    // if newFilters value is null, replace with currentFilters
    for (const f in newFilters) {
      if (newFilters[f] === null) {
        newFilters[f] = currentFilters[f];
      }
    }

    // update filters
    this.filters = newFilters;
    this.onChangeFilter();
  }

  /**
   * Returns if the user can perform a search depending on the value of the filter fields
   */
  canSearch(): boolean {
    return true;
  }

  /**
   * Click on ignore (change ignore status)
   */
  clickIgnore(inbox: Inbox): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Confirmation', text: 'Change ignored status?' }
    });

    dialogRef.afterClosed().subscribe(confirmation => {
      if (confirmation) {
        this.datapipeService.ignoreInbox(inbox.Id).subscribe(
          data => {
            this.search();
          }
        )
      }
    });
  }

}
