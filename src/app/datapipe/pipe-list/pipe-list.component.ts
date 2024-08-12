import { Component, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { DatapipeService } from '../datapipe.service';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import { PreferencesService } from 'src/app/shared/preferences.service';
import { Pipe } from '../datapipe.model';

@Component({
  selector: 'app-pipe-list',
  templateUrl: './pipe-list.component.html',
  styleUrl: './pipe-list.component.scss'
})
export class PipeListComponent {

/** list of schedules to display */
public dataSource = new MatTableDataSource<Pipe>();

/** total results of the query sent to the server */
totalResults: number = 0;

/** columns that will be displayed */
displayedColumns = ['actions', 'Code', 'Description'];

/** filters that are using to query the server */
filters: any = {};

@ViewChild(MatSort, {static: true}) sort!: MatSort;
@ViewChild(MatPaginator, {static: true}) paginator!: MatPaginator;
@ViewChild('filtersForm', {static: true}) filtersForm!: NgForm;

/** Component constructor */
constructor(
  public datapipeService: DatapipeService,
  public preferencesService: PreferencesService,
  public authService: AuthService,
  public dialog: MatDialog,
  private router: Router
) 
{
}

/**
 * Component init
 */
ngAfterViewInit() {
  setTimeout(() => {

    // load saved options for filters
    this.filters = this.preferencesService.pipeList.filters;
    
    // retrieve master data
    this.loadMasterData();

    // load saved pagination options
    this.paginator.pageIndex = this.preferencesService.pipeList.pageIndex;
    this.paginator.pageSize = this.preferencesService.pipeList.pageSize;
    
    // retrieve a results page
    this.getDataPage(this.paginator.pageIndex, this.paginator.pageSize);
  });
}

/**
 * Load master data from server
 */
loadMasterData() {
  // empty
}

/**
 * Get a page of data from the server
 * @param pageIndex
 * @param pageSize 
 */
getDataPage(pageIndex: number, pageSize: number) {
  this.preferencesService.pipeList.pageIndex = pageIndex;
  this.preferencesService.pipeList.pageSize = pageSize;
  
  let query = this.buildQuery();

  // get records
  this.datapipeService.findPipes(pageIndex + 1, pageSize, query)
  .subscribe((res)=>{
    this.dataSource.data = res.children;
    this.dataSource.sort = this.sort;
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
  //console.log(query);
  return query;
}

/**
 * Submit search form
 */
search(event?: PageEvent) {
  this.onChangeFilter();
}

/**
 * Returns if the user can perform a search depending on the value of the filter fields
 */
canSearch(): boolean {
  return true;
}

/**
 * Reset filters
 */
clickResetFilters(): void {
  this.preferencesService.pipeList.filters =  {
  };
  this.filters = this.preferencesService.pipeList.filters;
  this.onChangeFilter();
}

/**
 * Opens details component for a given opportunity
 * @param s schedule
 * @param navIndex navigation index (e.g. index in the current data page)
 */
openDetails(s: Pipe) {
  this.router.navigate([`/datapipe/pipe/${s.Code}`]);
}

/**
 * Opens details component to create a new schedule
 */
create() {
  this.router.navigate([`/learning/pipe/new`]);
}

}
