import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable, throwError } from "rxjs";
import { map, tap, catchError } from "rxjs/operators";
import { Inbox, QueryResult, Ingestion, Staging, Oper } from './datapipe.model';
import { AlertService } from '../shared/alert.service';
import * as moment from 'moment';
import { environment } from '../../environments/environment';
import { MatDialog } from '@angular/material';
import { ViewstreamDialogComponent } from './viewstream-dialog/viewstream-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class DatapipeService {
  
  /** Base URL */
  private urlBase = environment.urlIRISApi;
  
  /** Options used in request */
  private options = { };

  /**
   * Constructor
   * @param http 
   * @param alertService 
   */
  constructor(
    private http:HttpClient, 
    private alertService: AlertService,
    public dialog: MatDialog) { }

  /**
   * Calls RESTForms2 query based on `DataPipe.Data.Inbox:queryFIND` method.
   * @param pageIndex number of page
   * @param pageSize page size
   * @param query search filters to use
   */
  findInboxes(pageIndex: number, pageSize: number, query: any): Observable<QueryResult<Inbox>> {
    let filter = '';
    if (query.Ignored) { filter += `+Ignored+eq+${query.Ignored}`; }
    if (query.Source) { filter += `+Source+eq+${query.Source}`; }
    if (query.Flow) { filter += `+Flow+eq+${query.Flow}`; }
    if (query.MsgId) { filter += `+MsgId+eq+${query.MsgId}`; }
    if (query.Element) { filter += `+Element+eq+${query.Element}`; }
    if (query.Subject) { filter += `+Subject+eq+${query.Subject}`; }
    
    if (query.Status) { 
      let serializedStatus = query.Status.reduce(function (ret, item) {
        return ret + '~' + item; 
      });
      filter += `+Status+in+${serializedStatus}`; 
    }
    if (query.StagingStatus) { 
      let serializedStagingStatus = query.StagingStatus.reduce(function (ret, item) {
        return ret + '~' + item; 
      });
      filter += `+StagingStatus+in+${serializedStagingStatus}`; 
    }
    if (query.OperStatus) { 
      let serializedOperStatus = query.OperStatus.reduce(function (ret, item) {
        return ret + '~' + item; 
      });
      filter += `+OperStatus+in+${serializedOperStatus}`; 
    }

    if (query.UpdatedTSFrom) {
      const updatedTSFromString = this.dateToString(query.UpdatedTSFrom);
      filter += `+UpdatedTS+gte+${updatedTSFromString}T${query.UpdatedTSFromTime}:00Z`;
    }
    if (query.UpdatedTSTo) {
      const updatedTSToString = this.dateToString(query.UpdatedTSTo);
      filter += `+UpdatedTS+lte+${updatedTSToString}T${query.UpdatedTSToTime}:59Z`;
    }
    let escapedFilter = filter.replace(new RegExp(' ', 'g'), '%09');
    escapedFilter = escapedFilter.replace(new RegExp('\\+'), '');
    
    return this.http.get<QueryResult<Inbox>>(
      this.urlBase + `/rf2/form/objects/DataPipe.Data.Inbox/find?size=${pageSize}&page=${pageIndex}&filter=${escapedFilter}&orderby=1+desc`,
      this.options
    ).pipe(
      //tap(data => console.log(data))
      catchError(err => {
        this.alertService.error('[findInboxes] ' + err.message)
        return throwError(err);
      })
    );
  }

  /**
   * Get Inbox data using a given id
   * @param id 
   */
  findInboxById(id: number): Observable<Inbox> {
    return this.http.get<Inbox>(
      this.urlBase + `/rf2/form/object/DataPipe.Data.Inbox/${id}`,
      this.options
    ).pipe(
      //tap(data => console.log(data)),
      catchError(err => {
        this.alertService.error('[findInboxById] ' + err.message)
        return throwError(err);
      })
    );
  }

  /**
   * Get Ingestion data using a given id
   * @param id 
   */
  findIngestionById(id: number): Observable<Ingestion> {
    return this.http.get<Ingestion>(
      this.urlBase + `/rf2/form/object/DataPipe.Data.Ingestion/${id}`,
      this.options
    ).pipe(
      //tap(data => console.log(data)),
      catchError(err => {
        this.alertService.error('[findIngestionById] ' + err.message)
        return throwError(err);
      })
    );
  }

  /**
   * Get Staging data using a given id
   * @param id 
   */
  findStagingById(id: number): Observable<Staging> {
    return this.http.get<Staging>(
      this.urlBase + `/rf2/form/object/DataPipe.Data.Staging/${id}`,
      this.options
    ).pipe(
      //tap(data => console.log(data)),
      catchError(err => {
        this.alertService.error('[findStagingById] ' + err.message)
        return throwError(err);
      })
    );
  }

  /**
   * Get Oper data using a given id
   * @param id 
   */
  findOperById(id: number): Observable<Oper> {
    return this.http.get<Oper>(
      this.urlBase + `/rf2/form/object/DataPipe.Data.Oper/${id}`,
      this.options
    ).pipe(
      //tap(data => console.log(data)),
      catchError(err => {
        this.alertService.error('[findOperById] ' + err.message)
        return throwError(err);
      })
    );
  }

  /**
   * Returns ingestions of a given inbox
   * @param id 
   */
  findIngestionsByInbox(id: number): Observable<QueryResult<Ingestion>> {
    return this.http.get<QueryResult<Ingestion>>(
      this.urlBase + `/rf2/form/objects/DataPipe.Data.Ingestion/find?filter=Inbox+eq+${id}&orderby=1+desc`,
      this.options
    ).pipe(
      //tap(data => console.log(data)),
      catchError(err => {
        this.alertService.error('[findIngestionsByInbox] ' + err.message)
        return throwError(err);
      })
    );
  }

  /**
   * Returns stagings of a given ingestion
   * @param id 
   */
  findStagingsByIngestion(id: number): Observable<QueryResult<Staging>> {
    return this.http.get<QueryResult<Staging>>(
      this.urlBase + `/rf2/form/objects/DataPipe.Data.Staging/find?filter=Ingestion+eq+${id}&orderby=1+desc`,
      this.options
    ).pipe(
      //tap(data => console.log(data)),
      catchError(err => {
        this.alertService.error('[findStagingsByIngestion] ' + err.message)
        return throwError(err);
      })
    );
  }

  /**
   * Returns operations of a given staging
   * @param id 
   */
  findOpersByStaging(id: number): Observable<QueryResult<Oper>> {
    return this.http.get<QueryResult<Oper>>(
      this.urlBase + `/rf2/form/objects/DataPipe.Data.Oper/find?filter=Staging+eq+${id}&orderby=1+desc`,
      this.options
    ).pipe(
      //tap(data => console.log(data)),
      catchError(err => {
        this.alertService.error('[findOpersByStaging] ' + err.message)
        return throwError(err);
      })
    );
  }

  /**
   * Resend an Interop message
   */
  resendMessage(msgId: number) {
    return this.http.post(
      this.urlBase + `/resendMessage/${msgId}`,
      {},
      this.options
    ).pipe(
      catchError(err => {
        this.alertService.error('[resendMessage] ' + err.message)
        return throwError(err);
      })
    );
  }

  /**
   * Ignore 
   * @param inboxId
   */
  ignoreInbox(inboxId: number) {
    return this.http.put<boolean>(
      this.urlBase + `/ignore/${inboxId}`,
      {},
      this.options
    ).pipe(
        catchError(err => {
          this.alertService.error('[ignoreInbox] ' + err.message)
          return throwError(err);
        })
      );
  }

  /**
   * Status chip format 
   */
  getInboxStatusChipFormat(status: string): any {
    return { 
      cssClass: 'status-' + status.toLowerCase().replace(' ', '-')
    }
  }

  /**
   * StagingStatus format 
   */
  getStagingStatusChipFormat(status: string, errors?: string): any {
    let errorArr: any[];
    if (errors) {
      errorArr = JSON.parse(errors);
    }
    return { 
      cssClass: 'staging-' + status.toLowerCase().replace('/', ''),
      icon: status === 'VALID' ? 'thumb_up':
            status === 'INVALID' ? 'thumb_down':
            status === 'WARNING' ? 'priority_high':
            'not_interested',
      desc: '',
      tooltip: (errorArr) ? errorArr.reduce(function(res, item){ return res + item + '\n'; }, ''):
                ''
    };
  }

  /**
   * OperStatus format
   */
  getOperStatusChipFormat(status: string, retries?: number, errors?: string): any {
    let errorArr: any[];
    if (errors) {
      errorArr = JSON.parse(errors);
    }
    return { 
      cssClass: 'oper-' + status.toLowerCase().replace('/', ''),
      icon: status === 'PROCESSING' ? 'hourglass_empty':
            status === 'PROCESSED' ? 'done':
            status === 'ERROR' ? 'sync_problem':
            'not_interested',
      desc: (+retries > 1) ? '('+retries+')':
            '',
      tooltip: (errorArr) ? errorArr.reduce(function(res, item){ return res + item + '\n'; }, ''):
                ''
    };
  }

  /**
   * Convert data value into string to send to backend (e.g. as query parameters)
   * @param value 
   */
  dateToString(value: any) {
    const date = new Date(value);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    const dateTxt = moment(date).format('YYYY-MM-DD');
    return dateTxt;
  }

  /**
   * Opens an Interoperability session
   */
  clickSession(sessionId): void {
    window.open(environment.urlIRIS + '/EnsPortal.VisualTrace.zen?SESSIONID=' + sessionId);
  }

  /**
   * Opens a dialog displaying a data stream
   * @param data 
   */
  clickViewStream(data: any): void {
    const dialogRef = this.dialog.open(ViewstreamDialogComponent, {
      width: '90vw',
      height: '90vh',
      data: data
    });
  }

}
