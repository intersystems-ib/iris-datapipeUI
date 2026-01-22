import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import moment from 'moment';
import {catchError, finalize, map, Observable, of, switchMap, take, takeWhile, throwError, timer} from 'rxjs';
import {environment} from '../../environments/environment';
import {AlertService} from '../shared/alert.service';
import {
  Catalog,
  CatalogGraphResult,
  Category,
  Inbox,
  Ingestion,
  Oper,
  Pipe,
  QueryResult,
  Staging,
  TableColumn,
  TableIndex
} from './datapipe.model';
import {ViewstreamDialogComponent} from './viewstream-dialog/viewstream-dialog.component';
import {ExportDataOptions} from "./catalog/catalog.component";
import {tap} from "rxjs/operators";
import {ToastService} from "../shared/toast/toast.service";

@Injectable({
  providedIn: 'root'
})
export class DatapipeService {

  /** Base URL */
  private urlBase = environment.urlIRISApi;

  /** Options used in request */
  private options = {};

  /**
   * Constructor
   * @param http
   * @param alertService
   */
  constructor(
    private http: HttpClient,
    private alertService: AlertService,
    public dialog: MatDialog,
    public toastService: ToastService
  ) {
  }


  /**
   * Calls RESTForms2 query based on `DataPipe.Data.Inbox:queryFIND` method.
   * @param pageIndex number of page
   * @param pageSize page size
   * @param query search filters to use
   */
  findInboxes(pageIndex: number, pageSize: number, query: any): Observable<QueryResult<Inbox>> {
    let filter = '';
    if (query.Ignored) {
      filter += `+Ignored+eq+${query.Ignored}`;
    }
    if (query.Source) {
      filter += `+Source+eq+${query.Source}`;
    }
    if (query.MsgId) {
      filter += `+MsgId+eq+${query.MsgId}`;
    }
    if (query.Element) {
      filter += `+Element+eq+${query.Element}`;
    }
    if (query.Subject) {
      filter += `+Subject+eq+${query.Subject}`;
    }
    if (query.Namespace) {
      filter += `+Namespace+contains+${query.Namespace}`;
    }
    if (query.ValidationErrors) {
      filter += `+ValidationErrors+contains+${query.ValidationErrors}`;
    }
    if (query.OperErrors) {
      filter += `+OperErrors+contains+${query.OperErrors}`;
    }

    if (query.Status && query.Status.length > 0) {
      let serializedStatus = query.Status.reduce(function (ret: any, item: any) {
        return ret + '~' + item;
      });
      filter += `+Status+in+${serializedStatus}`;
    }
    if (query.StagingStatus && query.StagingStatus.length > 0) {
      let serializedStagingStatus = query.StagingStatus.reduce(function (ret: any, item: any) {
        return ret + '~' + item;
      });
      filter += `+StagingStatus+in+${serializedStagingStatus}`;
    }
    if (query.OperStatus && query.OperStatus.length > 0) {
      let serializedOperStatus = query.OperStatus.reduce(function (ret: any, item: any) {
        return ret + '~' + item;
      });
      filter += `+OperStatus+in+${serializedOperStatus}`;
    }
    if (query.Pipe && query.Pipe.length > 0) {
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
    if (query.Code) {
      filter += `+Code+contains+${query.Code}`;
    }
    if (query.Description) {
      filter += `+Description+contains+${query.Description}`;
    }

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
    if (query.Pipe && query.Pipe.length > 0) {
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
      {"ids": inboxIdsArray, "type": type},
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
      {"ids": inboxIdsArray},
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
    if (typeof (errorArr) == "string" && errorArr !== "") {
      errorArr = JSON.parse(errorArr);
    }
    return {
      cssClass: 'staging-' + status.toLowerCase().replace('/', ''),
      icon: status === 'VALID' ? 'thumb_up' :
        status === 'INVALID' ? 'thumb_down' :
          status === 'WARNING' ? 'priority_high' :
            'not_interested',
      desc: '',
      tooltip: (errorArr) ? errorArr.reduce(function (res, item) {
          return res + item + '\n';
        }, '') :
        ''
    };
  }

  /**
   * OperStatus format
   */
  getOperStatusChipFormat(status: string, retries?: number, errorArr?: string[]): any {
    if (typeof (errorArr) == "string" && errorArr !== "") {
      errorArr = JSON.parse(errorArr);
    }
    return {
      cssClass: 'oper-general oper-' + status.toLowerCase().replace('/', ''),
      icon: status === 'PROCESSING' ? 'hourglass_empty' :
        status === 'PROCESSED' ? 'done' :
          status === 'ERROR' ? 'sync_problem' :
            'not_interested',
      desc: (+(retries || 0) > 1) ? '(' + retries + ')' :
        '',
      tooltip: (errorArr) ? errorArr.reduce(function (res, item) {
          return res + item + '\n';
        }, '') :
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
  updatePipe(pipeCode: string, pipe: Pipe) {
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


  //catalog

  getCatalog(): Observable<{ result: Catalog[], categories: Category[] } | any> {
    return this.http.get(this.urlBase + `/catalog`).pipe(
      catchError(err => {
        this.alertService.error('[getCatalog] ' + err.message)
        return throwError(() => err);
      })
    )
  }

//Used to refresh a single element
  getById(id: string | number, exportChildren: boolean = false): Observable<{ result: Catalog[] } | any> {
    return this.http.get(this.urlBase + `/catalog/${id}${exportChildren ? '?exportChildren=1' : ''}`).pipe(
      catchError(err => {
        this.alertService.error('[getCatalogById] ' + err.message)
        return throwError(() => err);
      })
    )
  }


  updateEntry(catalog: Catalog): Observable<{ result: Catalog, categories: string[] } | any> {
    if (catalog.Id === -1) {
      delete (catalog as any).Id
    }
    return this.http.post(
      this.urlBase + `/catalog/update`,
      catalog
    ).pipe(
      catchError(err => {
        if (err.status == 404 || err.status == 400) {
          return of(err.error)
        }
        if (!err.error.error.includes("Table not found"))
          this.alertService.error('[updateCatalog] ' + err.message)
        return throwError(() => err);
      })
    );
  }

  deleteEntry(catalog: Catalog) {
    return this.http.delete(
      this.urlBase + `/catalog/delete/${catalog.Id}`
    ).pipe(
      catchError(err => {
        this.alertService.error('[deleteCatalog] ' + err.message)
        return throwError(() => err);
      })
    )
  }

  syncCube(catalogId: string | number) {
    return this.http.post(
      this.urlBase + `/catalog/syncCube/${catalogId}`,
      {}
    ).pipe(
      catchError(err => {
        this.alertService.error('[syncCube] ' + err.message)
        return throwError(() => err);
      })
    )
  }

  buildCube(catalogId: string | number) {
    return this.http.post(
      this.urlBase + `/catalog/buildCube/${catalogId}`,
      {}
    ).pipe(
      catchError(err => {
        this.alertService.error('[buildCube] ' + err.message)
        return throwError(() => err);
      })
    )
  }

  pollCube(catalog: Catalog, minutesTillDrop: number = 1, pollingIntervalInSec = 5): Observable<any> {
    let shouldContinue = true;
    ///Time in ms, by default 10 seconds per call
    return timer(0, pollingIntervalInSec * 1000)
      .pipe(
        ///Max amount of times to call
        take(minutesTillDrop * 60 / pollingIntervalInSec),
        ///Forceful cutoff to when a status as NA or error is received
        takeWhile(() => shouldContinue),
        ///REST petition
        switchMap((): Observable<CubeStatus> => {
          return this.fetchCubeStatus(catalog.Id) as Observable<CubeStatus>
        }),

        ///Logic for the aforementioned status break
        tap((status: CubeStatus) => {
          if (status.status === "ERROR") {
            this.alertService.error("Failed to listen for cube update finishing.")
          }
          shouldContinue = !(status.status === "NA" || status.status === "ERROR")
        }),
        ///If we reach here, the
        finalize(() => {
          if (shouldContinue) {
            this.toastService.info("Cube is taking too long, stopped listening for updates.")
            catalog.cubeOperationRunning = false
          }
        })
      )
  }

  fetchCubeStatus(catalogId: string | number) {
    return this.http.get(
      this.urlBase + `/catalog/checkState/${catalogId}`
    ).pipe(
      catchError((err: any) => {
        this.alertService.error('[fetchCubeStatus] ' + err.message)
        return of({status: "ERROR"})
      }),
      tap(
        obj => obj
      ));
  }

  importCatalogs(obj: any) {
    return this.http.post(
      this.urlBase + `/catalog/import`,
      Array.isArray(obj) ? obj : [obj]
    ).pipe(
      catchError(err => {
        this.alertService.error('[importCatalog] ' + err.message)
        return throwError(() => err);
      })
    )
  }

  getNamespaces(): Observable<string[] | any> {
    return this.http.get(
      this.urlBase + `/catalog/namespaces`
    ).pipe(
      catchError(err => {
        this.alertService.error('[getNamespaces] ' + err.message)
        return throwError(() => err);
      })
    )
  }


  getTableColumns(Id: string | number, noCache: boolean = false): Observable<{
    columns: TableColumn[],
    indexes: TableIndex[]
  }> | any {
    return this.http.get(
      this.urlBase + `/catalog/${Id}/tableInfo${noCache ? '?noCache=1' : ''}`
    ).pipe(
      catchError(err => {
        if (err.status == 404) {
          return of(err.error)
        }
        this.alertService.error('[tableInfo] ' + err.message)
        return throwError(() => err);
      })
    )
  }


  reorder(from: string | number, to: string | number) {
    return this.http.post(
      this.urlBase + `/catalog/reorder/${from}/${to}`,
      {}
    ).pipe(
      catchError(err => {
        this.alertService.error('[reorderCatalog] ' + err.message)
        return throwError(() => err);
      })
    )
  }

  extractData(catalogId: string | number, options: ExportDataOptions) {
    const fileType = options.fileType === "JSON" ? 'application/json' : "text/csv"
    return this.http.get(
      this.urlBase + `/catalog/extract/${catalogId}?columnList=${options.columns.join(', ')}&` +
      `type=${options.type}&amount=${options.amount}&addHeader=${options.addHeader ? 1 : 0}&addInfo=${options.addInfo ? 1 : 0}`,
      {
        headers: {
          'Accept': fileType
        },
        responseType: 'text'
      }
    ).pipe(
      map(
        data => {
          return {
            content: data,
            type: fileType
          }
        }
      ),
      catchError(err => {
        if (err.status == 404) {
          return of(JSON.parse(err.error))
        }
        this.alertService.error('[extractData] ' + err.message)
        return throwError(() => err);
      })
    )

  }

  getGraphData(catalogId: string | number): Observable<CatalogGraphResult | any> {
    return this.http.get(this.urlBase + `/catalog/${catalogId}/graphData`).pipe(catchError(err => {
      if (err.status == 404) {
        return of(JSON.parse(err.error))
      }
      this.alertService.error('[graphData] ' + err.message)
      return throwError(() => err);
    }))
  }


  getCategories(filter: string): Observable<any | { categories: Category[] }> {
    return this.http.get(this.urlBase + `/catalog/categories${filter != '' ? '?filter=' + filter : ''}`).pipe(catchError(err => {
      this.alertService.error('[getCategories] ' + err.message)
      return throwError(() => err);
    }))
  }

  getResources(): Observable<any | { resources: string[] }> {
    return this.http.get(this.urlBase + `/catalog/categories/resources`).pipe(catchError(err => {
      this.alertService.error('[getResources] ' + err.message)
      return throwError(() => err);
    }))
  }

  updateCategories(categories: Category[]): Observable<any> {
    return this.http.post(this.urlBase + `/catalog/categories/update`,
      categories
    ).pipe(catchError(err => {
      if (err.status !== 400 && err.status !== 404) {
        this.alertService.error('[extractData] ' + err.message)
        return throwError(() => err);
      }
      return of(err.error)
    }))
  }

  deleteCategory(Id: any) {
    return this.http.delete(this.urlBase + `/catalog/categories/${Id}`
    ).pipe(catchError(err => {
      if (err.status !== 400 && err.status !== 404) {
        this.alertService.error('[extractData] ' + err.message)
        return throwError(() => err);
      }
      return of(err.error)
    }))
  }
}


export type CubeStatus = { status: ("NA" | "BUILD" | "SYNC" | "TIMEOUT" | "ERROR") }
