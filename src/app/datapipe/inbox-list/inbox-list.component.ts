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
import { ActivatedRoute } from '@angular/router';
import { SelectionModel } from '@angular/cdk/collections';
import { NotificationService } from 'src/app/shared/notification.service';

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
  displayedColumns = ['select', 'actions', 'Source', 'Pipe', 'MsgId', 'Subject', 'Element', 'UpdatedTS', 'Status', 'StagingStatus', 'OperStatus'];

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
  params: any;

  /** whether master data is completely loaded or not */
  masterDataLoaded: boolean = false;

  /** fav filters loaded */
  defaultFiltersComponentLoaded: boolean = false;

  /** filter fields that will not be stored in favs */
  skippedFilterInFavs = ['UpdatedTSFrom', 'UpdatedTSFromTime', 'UpdatedTSTo', 'UpdatedTSToTime'];

  selection = new SelectionModel<Inbox>(true, []);

  @ViewChild(MatPaginator, {static: true}) paginator!: MatPaginator;
  
  @ViewChild('filtersForm', {static: true}) filtersForm!: NgForm;

  constructor(
    public datapipeService: DatapipeService,
    public preferencesService: PreferencesService,
    public authService: AuthService,
    public dialog: MatDialog,
    private router: ActivatedRoute,
    private notificationService: NotificationService
  ) {
      // retrieve query params from url
      this.params = {};
      this.router.queryParamMap.subscribe((p: any) => {
        this.params = p['params'];
      }) 

      this.status = [ 'DONE', 'OPERATING', 'STAGING','INGESTING', 'ERROR-OPERATING','ERROR-STAGING','ERROR-INGESTING', 'ERROR-GENERAL'];
      this.filteredStatus = this.status;
      this.stagingStatus = [ 'N/A', 'Valid', 'Invalid', 'Warning'];
      this.filteredStagingStatus = this.stagingStatus;
      this.operStatus = [ 'N/A', 'Processing', 'Processed', 'Error', 'Ignored'];
      this.filteredOperStatus = this.operStatus;

      this.filteredPipes = [];
      this.datapipeService.findPipes(1, 100, {}).subscribe((res) => {
        this.filteredPipes = res.children;
        this.masterDataLoaded = true;
      });
  }

  /**
   * Component init
   */
  ngAfterViewInit() {
      setTimeout(() => {
        // load last used filters
        this.filters = this.preferencesService.inboxList.filters;
        
        // handle query params
        const paramKeys = Object.keys(this.params);
        if (paramKeys.length>0) {
          this.clickResetFilters('initial', false, false);
        }
        if (this.params.pipe) {
          this.filters.Pipe = [this.params.pipe];
        }
        if (this.params.from) {
          this.filters.UpdatedTSFrom = this.params.from.slice(0, 10);
        }
        if (this.params.to) {
          this.filters.UpdatedTSTo = this.params.to.slice(0, 10);
        }

        if (this.params.type === 'Errors') {
          this.filters.Status = ['ERROR-OPERATING','ERROR-STAGING','ERROR-INGESTING', 'ERROR-GENERAL'];
        } 
        else if (this.params.type === 'InProgress') {
          this.filters.Status = ['OPERATING', 'STAGING','INGESTING'];
        } 
        else if (this.params.type === 'Ok') {
          this.filters.Status = ['DONE'];
        }
        else if (this.params.type === 'Warnings') {
          this.filters.StagingStatus = ['Warning'];
        }
        
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
  clickResetFilters(type: string, useCurrentFiltersWhenNull: boolean = true, autoSearch: boolean = true): void {
    const currentFilters = this.filters;
 
    // initialize newFilters using filtersPreset
    let newFilters: any = {};
    Object.assign(newFilters, this.preferencesService.inboxList.filtersPreset[type]);

    if (useCurrentFiltersWhenNull) {
      // if newFilters value is null, replace with currentFilters
      for (const f in newFilters) {
        if (newFilters[f] === null) {
          newFilters[f] = currentFilters[f];
        }
      }
    }

    // update filters
    this.filters = newFilters;

    // save current filters in preferences so that filters are kept when going back
    this.preferencesService.inboxList.filters = this.filters;

    if (autoSearch) {
      this.onChangeFilter();
    }
  }

  /**
   * Returns if the user can perform a search depending on the value of the filter fields
   */
  canSearch(): boolean {
    return (this.masterDataLoaded);
  }

  /** 
   * Load a clicked fav filter 
   */
  loadFavFilter(loadedFilters: any, isResetFilters: boolean =  false) {
    // get the current value of those filters that are not stored in the favorites and must keep their values (skippedFilters)
    let skippedFilters: { [key: string]: any } = {};
    if (!isResetFilters) {

      this.skippedFilterInFavs.forEach(field => {
        try {
          skippedFilters[field] = this.filters[field];
        } catch (e) {
        }
      });
    }

    this.filters = loadedFilters;

    if (!isResetFilters) {
      // reset the value of the skipped filters
      Object.keys(skippedFilters).forEach(field => {
        try {
          this.filters[field] = skippedFilters[field];
        } catch (e) {
        }
      });

      // save current filters in preferences so that filters are kept when going back
      this.preferencesService.inboxList.filters = this.filters;
    }

    this.search();
  }

  /** 
   * Fav filters are loaded and ready to be used 
   */
  favFiltersReady(firstFavFilter: any) {
    this.defaultFiltersComponentLoaded = true;
  }

  /**
   * Select a row
   * @param row
   */
  selectHandler(row: Inbox) {
    this.selection.toggle(row);
  }

  /** 
   * Whether the number of selected elements matches the total number of rows. 
   */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  /** 
   * Selects all rows if they are not all selected; otherwise clear selection. 
   */
  masterToggle() {
    this.isAllSelected() ?
        this.selection.clear() :
        this.dataSource.data.forEach(row => this.selection.select(row));
  }

  /**
   * Hide selected rows
   */
  hideSelection() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Confirmation', text: 'Change visibility for selected rows? (' + this.selection.selected.length + ')' }
    });

    dialogRef.afterClosed().subscribe(confirmation => {
      if (confirmation) {
        // copy actual selection
        let selected = this.selection.selected;
        this.selection.clear();

        // for each selected
        let ids = [];
        for (let inbox of selected) {
          ids.push(inbox.Id)
        }
        
        // change visibility
        this.datapipeService.ignoreInbox(ids).subscribe(
          data => {
            let msg = "✅ " + data.ok.total + " rows affected"
            if (data.error.total > 0) {
              msg = msg + ". ❌ " + data.error.total + " errors found"
            }
            this.notificationService.openMessageBar(msg, "Dismiss")
            this.search();
          }
        )
      }
    });
  }

  /**
   * Repeat ingestion|staging|operation in selected rows
   */
  repeatSelection(type: string) {
    let confirmationMsg = `Repeat ${type} for selected rows (${this.selection.selected.length})?`;

    // copy actual selection
    let selected = this.selection.selected;
    this.selection.clear();

    // for each selected
    let ids = [];
    let showWarning = false;
    for (let inbox of selected) {
      if (inbox.Status === "DONE" && inbox.StagingStatus==="VALID" && inbox.OperStatus==="PROCESSED") {
        showWarning = true;
      }
      ids.push(inbox.Id)
    }

    if (showWarning) {
      confirmationMsg = '⚠️ Warning! Some selected records were already processed successfully\n\n' + confirmationMsg
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Confirmation', text: confirmationMsg }
    });

    dialogRef.afterClosed().subscribe(confirmation => {
      if (confirmation) {
        
        // repeat
        this.datapipeService.repeatInbox(type, ids).subscribe(
          data => {
            let msg = "✅ " + data.ok.total + " rows affected"
            if (data.error.total > 0) {
              msg = msg + ". ❌ " + data.error.total + " errors found"
            }
            this.notificationService.openMessageBar(msg, "Dismiss")
            this.search();
          }
        )
      }
    });
  }
  

}
