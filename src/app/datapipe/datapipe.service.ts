import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import moment from 'moment';
import { catchError, map, Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AlertService } from '../shared/alert.service';
import { Inbox, Ingestion, Oper, Pipe, QueryResult, Staging } from './datapipe.model';
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
    public dialog: MatDialog
  ) { }

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
    if (query.MsgId) { filter += `+MsgId+eq+${query.MsgId}`; }
    if (query.Element) { filter += `+Element+eq+${query.Element}`; }
    if (query.Subject) { filter += `+Subject+eq+${query.Subject}`; }
    if (query.Namespace) { filter += `+Namespace+contains+${query.Namespace}`; }
    if (query.ValidationErrors) { filter += `+ValidationErrors+contains+${query.ValidationErrors}`; }
    if (query.OperErrors) { filter += `+OperErrors+contains+${query.OperErrors}`; }
    
    if (query.Status && query.Status.length>0) { 
      let serializedStatus = query.Status.reduce(function (ret: any, item: any) {
        return ret + '~' + item; 
      });
      filter += `+Status+in+${serializedStatus}`; 
    }
    if (query.StagingStatus && query.StagingStatus.length>0 ) { 
      let serializedStagingStatus = query.StagingStatus.reduce(function (ret: any, item: any) {
        return ret + '~' + item; 
      });
      filter += `+StagingStatus+in+${serializedStagingStatus}`; 
    }
    if (query.OperStatus && query.OperStatus.length>0) { 
      let serializedOperStatus = query.OperStatus.reduce(function (ret: any, item: any) {
        return ret + '~' + item; 
      });
      filter += `+OperStatus+in+${serializedOperStatus}`; 
    }
    if (query.Pipe && query.Pipe.length>0) { 
      let serializedPipe = query.Pipe.reduce(function (ret: any, item: any) {
        return ret + '~' + item; 
      });
      filter += `+Pipe+in+${serializedPipe}`; 
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
      this.urlBase + `/rf2/form/objects/DataPipe.Data.Inbox/custom/find?size=${pageSize}&page=${pageIndex}&filter=${escapedFilter}&orderby=1+desc`,
      this.options
    )
    .pipe(
      //tap(data => console.log(data))
      catchError(err => {
        this.alertService.error('[findInboxes] ' + err.message)
        return throwError(() => err);
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
        return throwError(() => err);
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
        return throwError(() => err);
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
        return throwError(() => err);
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
        return throwError(() => err);
      })
    );
  }

  /**
   * Returns ingestions of a given inbox
   * @param id 
   */
  findIngestionsByInbox(id: number): Observable<QueryResult<Ingestion>> {
    return this.http.get<QueryResult<Ingestion>>(
      this.urlBase + `/rf2/form/objects/DataPipe.Data.Ingestion/custom/find?filter=Inbox+eq+${id}&orderby=1+desc`,
      this.options
    ).pipe(
      //tap(data => console.log(data)),
      catchError(err => {
        this.alertService.error('[findIngestionsByInbox] ' + err.message)
        return throwError(() => err);
      })
    );
  }

  /**
   * Returns stagings of a given ingestion
   * @param id 
   */
  findStagingsByIngestion(id: number): Observable<QueryResult<Staging>> {
    return this.http.get<QueryResult<Staging>>(
      this.urlBase + `/rf2/form/objects/DataPipe.Data.Staging/custom/find?filter=Ingestion+eq+${id}&orderby=1+desc`,
      this.options
    ).pipe(
      //tap(data => console.log(data)),
      catchError(err => {
        this.alertService.error('[findStagingsByIngestion] ' + err.message)
        return throwError(() => err);
      })
    );
  }

  /**
   * Returns operations of a given staging
   * @param id 
   */
  findOpersByStaging(id: number): Observable<QueryResult<Oper>> {
    return this.http.get<QueryResult<Oper>>(
      this.urlBase + `/rf2/form/objects/DataPipe.Data.Oper/custom/find?filter=Staging+eq+${id}&orderby=1+desc`,
      this.options
    ).pipe(
      //tap(data => console.log(data)),
      catchError(err => {
        this.alertService.error('[findOpersByStaging] ' + err.message)
        return throwError(() => err);
      })
    );
  }

  /**
   * Returns Pipes that can be listed
   * @param id 
   */
  findPipes(pageIndex: number, pageSize: number, query: any): Observable<QueryResult<Pipe>> {
    let filter = '';
    if (query.Code) { filter += `+Code+contains+${query.Code}`; }
    if (query.Description) { filter += `+Description+contains+${query.Description}`; }

    let escapedFilter = filter.replace(new RegExp(' ', 'g'), '%09');
    escapedFilter = escapedFilter.replace(new RegExp('\\+'), '');

    return this.http.get<QueryResult<Pipe>>(
      this.urlBase + `/rf2/form/objects/DataPipe.Data.Pipe/custom/find?size=${pageSize}&page=${pageIndex}&filter=${escapedFilter}&collation=UPPER&orderby=1+desc`,
      this.options
    ).pipe(
      //tap(data => console.log(data)),
      catchError(err => {
        this.alertService.error('[findPipes] ' + err.message)
        return throwError(() => err);
      })
    );
  }

  /**
   * Returns a pipe by a given code
   * @param code 
   */
  findPipeByCode(code: string): Observable<Pipe> {
    return this.http.get<QueryResult<Pipe>>(
      this.urlBase + `/rf2/form/objects/DataPipe.Data.Pipe/custom/find?filter=Code+eq+${code}`,
      this.options
    ).pipe(
      //tap(data => console.log(data)),
      map(data => data.children[0]),
      catchError(err => {
        this.alertService.error('[findPipesByCode] ' + err.message)
        return throwError(() => err);
      })
    );
  }

  /**
   * Returns inbox activity (dashboard)
   * @param id 
   */
  getInboxActivity(query: any): Observable<any> {
    let UpdatedTSFrom = '';
    let UpdatedTSTo = '';
    let serializedPipes = '';

    if (query.UpdatedTSFrom) {
      const updatedTSFromString = this.dateToString(query.UpdatedTSFrom);
      UpdatedTSFrom = `${updatedTSFromString}T${query.UpdatedTSFromTime}:00Z`;
    }
    if (query.UpdatedTSTo) {
      const updatedTSToString = this.dateToString(query.UpdatedTSTo);
      UpdatedTSTo += `${updatedTSToString}T${query.UpdatedTSToTime}:59Z`;
    }
    if (query.Pipe && query.Pipe.length>0) { 
      serializedPipes = query.Pipe.reduce(function (ret: any, item: any) {
        return ret + '~' + item; 
      }); 
    }

    return this.http.get<any>(
      this.urlBase + `/inboxActivity?UpdatedTSFrom=${UpdatedTSFrom}&UpdatedTSTo=${UpdatedTSTo}&Pipes=${serializedPipes}`,
      this.options
    ).pipe(
      //tap(data => console.log(data)),
      catchError(err => {
        this.alertService.error('[getInboxActivity] ' + err.message)
        return throwError(() => err);
      })
    );
  }

  /**
   * Repeat an inbox stage
   * @param type ingestion|staging|operation
   * @param inboxIdsArray array of inbox ids
   */
  repeatInbox(type: string, inboxIdsArray: number[]) {
    return this.http.post<any>(
      this.urlBase + `/repeat`,
      { "ids": inboxIdsArray, "type": type },
      this.options
    ).pipe(
      catchError(err => {
        this.alertService.error('[repeatInbox] ' + err.message)
        return throwError(() => err);
      })
    );
  }

  /**
   * Ignore/unignore an inbox (change visibility status) 
   * @param inboxIdsArray array of inbox ids
   */
  ignoreInbox(inboxIdsArray: number[]) {
    return this.http.put<any>(
      this.urlBase + `/ignore`,
      { "ids": inboxIdsArray },
      this.options
    ).pipe(
        catchError(err => {
          this.alertService.error('[ignoreInbox] ' + err.message)
          return throwError(() => err);
        })
      );
  }

  /**
   * Status chip format 
   */
  getInboxStatusChipFormat(status: string): any {
    return { 
      cssClass: 'status-general status-' + status.toLowerCase().replace(' ', '-')
    }
  }

  /**
   * StagingStatus format 
   */
  getStagingStatusChipFormat(status: string, errorArr?: any[]): any {
    if (typeof(errorArr) == "string" && errorArr !== "") {
      errorArr = JSON.parse(errorArr);
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
  getOperStatusChipFormat(status: string, retries?: number, errorArr?: string[]): any {
    if (typeof(errorArr) == "string" && errorArr !== "") {
      errorArr = JSON.parse(errorArr);
    }
    return { 
      cssClass: 'oper-general oper-' + status.toLowerCase().replace('/', ''),
      icon: status === 'PROCESSING' ? 'hourglass_empty':
            status === 'PROCESSED' ? 'done':
            status === 'ERROR' ? 'sync_problem':
            'not_interested',
      desc: (+(retries||0) > 1) ? '('+retries+')':
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
  clickSession(sessionId: number, namespace?: string): void {
    let urlIRIS = environment.urlIRIS;
    if (namespace) {
      urlIRIS = environment.urlIRIS.replace(":namespace", namespace.toLowerCase());
    } else {
      urlIRIS = environment.urlIRISDefault;
    }
    window.open(urlIRIS + '/EnsPortal.VisualTrace.zen?SESSIONID=' + sessionId);
  }

  /**
   * Opens a dialog displaying a data stream
   * @param data 
   */
  clickViewStream(data: any): MatDialogRef<ViewstreamDialogComponent> {
    const dialogRef = this.dialog.open(ViewstreamDialogComponent, {
      width: '90vw',
      data: data
    });
    return dialogRef;
  }


  /**
   * Create a new Pipe
   */
  createPipe(pipe: Pipe) {
    return this.http.post(
      this.urlBase + `/objects/DataPipe.Data.Pipe`,
      pipe,
      this.options
    ).pipe(
      catchError(err => {
        this.alertService.error('[createPipe] ' + err.message)
        return throwError(() => err);
      })
    );
  }

  /**
   * Update a Pipe
   */
  updatePipe(pipeCode:string, pipe: Pipe) {
    return this.http.put(
      this.urlBase + `/objects/DataPipe.Data.Pipe/${pipeCode}`,
      pipe,
      this.options
    ).pipe(
      catchError(err => {
        this.alertService.error('[updatePipe] ' + err.message)
        return throwError(() => err);
      })
    );
  }


  /**
   * Update OperRequest after manually editing normalized data
   */
  updateOperRequest(operHeaderId: number, editedNormData: string, namespace: string) {
    return this.http.put(
      this.urlBase + `/operRequest/${namespace}/${operHeaderId}`,
      editedNormData,
      this.options
    ).pipe(
      catchError(err => {
        this.alertService.error('[updateOperRequest] ' + err.message)
        return throwError(() => err);
      })
    );
  }


}
