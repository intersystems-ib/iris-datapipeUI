import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import moment from 'moment';
import { catchError, map, Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AlertService } from '../shared/alert.service';
import { Catalog, Inbox, Ingestion, Oper, Pipe, QueryResult, Staging, TableColumn } from './datapipe.model';
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



  //catalog

getCatalog(): Observable<{result:Catalog[], categories:string[]}|any> {
  return this.http.get(this.urlBase + `/catalog`).pipe(
    catchError(err => {
      this.alertService.error('[getCatalog] ' + err.message)
      return throwError(() => err);
    })
  )
  /*const mockData: Catalog[] = [
    // ===== RAÍZ ODS FHIR =====
    {
      Id: 1,
      Order: 0,
      Category: 'ODS FHIR',
      Subtypeof: null,
      Entity: 'Episodios (Encounters)',
      EntityDescription: 'Conjunto de episodios de atención registrados en el sistema ODS FHIR.',
      Table: 'ODS_FHIR.Encounter',
      Filter: '',
      MDXTotal: 'SELECT FROM [ODS_CATALOG_ENCOUNTER]',
      MDXHistogram: 'SELECT NON EMPTY [StartDate].[StartDateYear].[StartDateYear].Members ON 1 FROM [ODS_CATALOG_ENCOUNTER]',
      MDXHistogramUpdated: '',
      totalRecords: 3126000,
      expanded: false,
      histogramData: [
        { year: 2020, count: 446000 },
        { year: 2021, count: 483000 },
        { year: 2022, count: 511000 },
        { year: 2023, count: 535000 },
        { year: 2024, count: 562000 },
        { year: 2025, count: 589000 }
      ]
    },
    // Hijos de Encounters
    {
      Id: 2,
      Order: 0,
      Category: 'ODS FHIR',
      Subtypeof: 1,
      Entity: 'Episodios de ingreso (Inpatients)',
      EntityDescription: 'Episodios de hospitalización (ingreso) de pacientes.',
      Table: 'ODS_FHIR.Encounter',
      Filter: '[class_code]=IMP',
      MDXTotal: 'SELECT FROM [ODS_CATALOG_ENCOUNTER] %FILTER [ClassCode].[ClassCode].[ClassCode].&[IMP]',
      MDXHistogram: 'SELECT NON EMPTY [StartDate].[StartDateYear].[StartDateYear].Members ON 1 FROM [ODS_CATALOG_ENCOUNTER] %FILTER [ClassCode].[ClassCode].[ClassCode].&[IMP]',
      MDXHistogramUpdated: '',
      totalRecords: 900000,
      expanded: false,
      histogramData: [
        { year: 2020, count: 130000 },
        { year: 2021, count: 140000 },
        { year: 2022, count: 150000 },
        { year: 2023, count: 155000 },
        { year: 2024, count: 160000 },
        { year: 2025, count: 165000 }
      ]
    },
    // Nieto de Encounters → hijo de Inpatients
    {
      Id: 5,
      Order: 0,
      Category: 'ODS FHIR',
      Subtypeof: 2,
      Entity: 'Ingresos - Maternidad',
      EntityDescription: 'Ingresos hospitalarios correspondientes a los servicios de maternidad.',
      Table: 'ODS_FHIR.Encounter',
      Filter: '[class_code]=IMP|[OrganizationCode]=MAT',
      MDXTotal: 'SELECT FROM [ODS_CATALOG_ENCOUNTER] %FILTER [OrganizationCode].[OrganizationCode].&[MAT]',
      MDXHistogram: 'SELECT NON EMPTY [StartDate].[StartDateYear].[StartDateYear].Members ON 1 FROM [ODS_CATALOG_ENCOUNTER] %FILTER [OrganizationCode].[OrganizationCode].&[MAT]',
      MDXHistogramUpdated: '',
      totalRecords: 104000,
      expanded: false,
      histogramData: [
        { year: 2020, count: 15000 },
        { year: 2021, count: 16000 },
        { year: 2022, count: 17000 },
        { year: 2023, count: 18000 },
        { year: 2024, count: 19000 },
        { year: 2025, count: 20000 }
      ]
    },
    {
      Id: 3,
      Order: 1,
      Category: 'ODS FHIR',
      Subtypeof: 1,
      Entity: 'Episodios de urgencias (Emergency)',
      EntityDescription: 'Episodios atendidos en los servicios de urgencias.',
      Table: 'ODS_FHIR.Encounter',
      Filter: '[class_code]=EMER',
      MDXTotal: 'SELECT FROM [ODS_CATALOG_ENCOUNTER] %FILTER [ClassCode].[ClassCode].[ClassCode].&[EMER]',
      MDXHistogram: 'SELECT NON EMPTY [StartDate].[StartDateYear].[StartDateYear].Members ON 1 FROM [ODS_CATALOG_ENCOUNTER] %FILTER [ClassCode].[ClassCode].[ClassCode].&[EMER]',
      MDXHistogramUpdated: '',
      totalRecords: 126000,
      expanded: false,
      histogramData: [
        { year: 2020, count: 16000 },
        { year: 2021, count: 23000 },
        { year: 2022, count: 21000 },
        { year: 2023, count: 20000 },
        { year: 2024, count: 22000 },
        { year: 2025, count: 24000 }
      ]
    },
    {
      Id: 6,
      Order: 2,
      Category: 'ODS FHIR',
      Subtypeof: 1,
      Entity: 'Episodios ambulatorios (Ambulatory)',
      EntityDescription: 'Atenciones en régimen ambulatorio/consulta externa.',
      Table: 'ODS_FHIR.Encounter',
      Filter: '[class_code]=AMB',
      MDXTotal: 'SELECT FROM [ODS_CATALOG_ENCOUNTER] %FILTER [ClassCode].[ClassCode].[ClassCode].&[AMB]',
      MDXHistogram: 'SELECT NON EMPTY [StartDate].[StartDateYear].[StartDateYear].Members ON 1 FROM [ODS_CATALOG_ENCOUNTER] %FILTER [ClassCode].[ClassCode].[ClassCode].&[AMB]',
      MDXHistogramUpdated: '',
      totalRecords: 2100000,
      expanded: false,
      histogramData: [
        { year: 2020, count: 300000 },
        { year: 2021, count: 320000 },
        { year: 2022, count: 340000 },
        { year: 2023, count: 360000 },
        { year: 2024, count: 380000 },
        { year: 2025, count: 400000 }
      ]
    },

    // ===== RAÍZ MEDICACIÓN =====
    {
      Id: 10,
      Order: 1,
      Category: 'ODS FHIR',
      Subtypeof: null,
      Entity: 'Medicación (Medication)',
      EntityDescription: 'Prescripciones y dispensaciones registradas en el ODS FHIR.',
      Table: 'ODS_FHIR.Medication',
      Filter: '',
      MDXTotal: 'SELECT FROM [ODS_CATALOG_MEDICATION]',
      MDXHistogram: 'SELECT NON EMPTY [Date].[Year].[Year].Members ON 1 FROM [ODS_CATALOG_MEDICATION]',
      MDXHistogramUpdated: '',
      totalRecords: 4900000,
      expanded: false,
      histogramData: [
        { year: 2020, count: 700000 },
        { year: 2021, count: 770000 },
        { year: 2022, count: 810000 },
        { year: 2023, count: 840000 },
        { year: 2024, count: 870000 },
        { year: 2025, count: 910000 }
      ]
    },
    // Hijos de Medicación
    {
      Id: 11,
      Order: 0,
      Category: 'ODS FHIR',
      Subtypeof: 10,
      Entity: 'Medicación en ingresos',
      EntityDescription: 'Órdenes y administración de medicación durante ingresos hospitalarios.',
      Table: 'ODS_FHIR.MedicationAdministration',
      Filter: '[setting]=INPATIENT',
      MDXTotal: 'SELECT FROM [ODS_CATALOG_MEDICATION] %FILTER [Setting].[Setting].&[INPATIENT]',
      MDXHistogram: 'SELECT NON EMPTY [Date].[Year].[Year].Members ON 1 FROM [ODS_CATALOG_MEDICATION] %FILTER [Setting].[Setting].&[INPATIENT]',
      MDXHistogramUpdated: '',
      totalRecords: 3500000,
      expanded: false,
      histogramData: [
        { year: 2020, count: 500000 },
        { year: 2021, count: 550000 },
        { year: 2022, count: 580000 },
        { year: 2023, count: 600000 },
        { year: 2024, count: 620000 },
        { year: 2025, count: 650000 }
      ]
    },
    {
      Id: 12,
      Order: 1,
      Category: 'ODS FHIR',
      Subtypeof: 10,
      Entity: 'Medicación SIRE',
      EntityDescription: 'Registros de SIRE (sistema regional) integrados en ODS FHIR.',
      Table: 'ODS_FHIR.MedicationRequest',
      Filter: '[source]=SIRE',
      MDXTotal: 'SELECT FROM [ODS_CATALOG_MEDICATION] %FILTER [Source].[Source].&[SIRE]',
      MDXHistogram: 'SELECT NON EMPTY [Date].[Year].[Year].Members ON 1 FROM [ODS_CATALOG_MEDICATION] %FILTER [Source].[Source].&[SIRE]',
      MDXHistogramUpdated: '',
      totalRecords: 1400000,
      expanded: false,
      histogramData: [
        { year: 2020, count: 200000 },
        { year: 2021, count: 220000 },
        { year: 2022, count: 230000 },
        { year: 2023, count: 240000 },
        { year: 2024, count: 250000 },
        { year: 2025, count: 260000 }
      ]
    },

    // ===== RAÍZ VACUNAS =====
    {
      Id: 20,
      Order: 2,
      Category: 'ODS FHIR',
      Subtypeof: null,
      Entity: 'Vacunas (Immunization)',
      EntityDescription: 'Administración de vacunas registradas en ODS FHIR.',
      Table: 'ODS_FHIR.Immunization',
      Filter: '',
      MDXTotal: 'SELECT FROM [ODS_CATALOG_IMMUNIZATION]',
      MDXHistogram: 'SELECT NON EMPTY [Date].[Year].[Year].Members ON 1 FROM [ODS_CATALOG_IMMUNIZATION]',
      MDXHistogramUpdated: '',
      totalRecords: 700000,
      expanded: false,
      histogramData: [
        { year: 2020, count: 100000 },
        { year: 2021, count: 120000 },
        { year: 2022, count: 110000 },
        { year: 2023, count: 130000 },
        { year: 2024, count: 125000 },
        { year: 2025, count: 115000 }
      ]
    },

    // ===== RAÍZ PROCEDIMIENTOS =====
    {
      Id: 30,
      Order: 3,
      Category: 'ODS FHIR',
      Subtypeof: null,
      Entity: 'Procedimientos (Procedures)',
      EntityDescription: 'Procedimientos clínicos codificados y registrados en ODS FHIR.',
      Table: 'ODS_FHIR.Procedure',
      Filter: '',
      MDXTotal: 'SELECT FROM [ODS_CATALOG_PROCEDURE]',
      MDXHistogram: 'SELECT NON EMPTY [Date].[Year].[Year].Members ON 1 FROM [ODS_CATALOG_PROCEDURE]',
      MDXHistogramUpdated: '',
      totalRecords: 580500,
      expanded: false,
      histogramData: [
        { year: 2020, count: 88000 },
        { year: 2021, count: 91500 },
        { year: 2022, count: 95000 },
        { year: 2023, count: 98500 },
        { year: 2024, count: 102000 },
        { year: 2025, count: 105500 }
      ]
    },
    // Hijos de Procedimientos
    {
      Id: 31,
      Order: 0,
      Category: 'ODS FHIR',
      Subtypeof: 30,
      Entity: 'Intervenciones quirúrgicas',
      EntityDescription: 'Intervenciones programadas y no programadas en bloque quirúrgico.',
      Table: 'ODS_FHIR.Procedure',
      Filter: '[type]=INTERVENTION',
      MDXTotal: 'SELECT FROM [ODS_CATALOG_PROCEDURE] %FILTER [Type].[Type].&[INTERVENTION]',
      MDXHistogram: 'SELECT NON EMPTY [Date].[Year].[Year].Members ON 1 FROM [ODS_CATALOG_PROCEDURE] %FILTER [Type].[Type].&[INTERVENTION]',
      MDXHistogramUpdated: '',
      totalRecords: 250500,
      expanded: false,
      histogramData: [
        { year: 2020, count: 38000 },
        { year: 2021, count: 39500 },
        { year: 2022, count: 41000 },
        { year: 2023, count: 42500 },
        { year: 2024, count: 44000 },
        { year: 2025, count: 45500 }
      ]
    },
    // Nietos de Procedimientos → hijos de Intervenciones
    {
      Id: 32,
      Order: 0,
      Category: 'ODS FHIR',
      Subtypeof: 31,
      Entity: 'CMA (cirugía mayor ambulatoria)',
      EntityDescription: 'Intervenciones de CMA realizadas sin ingreso.',
      Table: 'ODS_FHIR.Procedure',
      Filter: '[type]=INTERVENTION|[setting]=CMA',
      MDXTotal: 'SELECT FROM [ODS_CATALOG_PROCEDURE] %FILTER [Setting].[Setting].&[CMA]',
      MDXHistogram: 'SELECT NON EMPTY [Date].[Year].[Year].Members ON 1 FROM [ODS_CATALOG_PROCEDURE] %FILTER [Setting].[Setting].&[CMA]',
      MDXHistogramUpdated: '',
      totalRecords: 135000,
      expanded: false,
      histogramData: [
        { year: 2020, count: 20000 },
        { year: 2021, count: 21000 },
        { year: 2022, count: 22000 },
        { year: 2023, count: 23000 },
        { year: 2024, count: 24000 },
        { year: 2025, count: 25000 }
      ]
    },
    {
      Id: 33,
      Order: 1,
      Category: 'ODS FHIR',
      Subtypeof: 31,
      Entity: 'CME (cirugía mayor con ingreso)',
      EntityDescription: 'Intervenciones quirúrgicas con ingreso hospitalario.',
      Table: 'ODS_FHIR.Procedure',
      Filter: '[type]=INTERVENTION|[setting]=CME',
      MDXTotal: 'SELECT FROM [ODS_CATALOG_PROCEDURE] %FILTER [Setting].[Setting].&[CME]',
      MDXHistogram: 'SELECT NON EMPTY [Date].[Year].[Year].Members ON 1 FROM [ODS_CATALOG_PROCEDURE] %FILTER [Setting].[Setting].&[CME]',
      MDXHistogramUpdated: '',
      totalRecords: 115500,
      expanded: false,
      histogramData: [
        { year: 2020, count: 18000 },
        { year: 2021, count: 18500 },
        { year: 2022, count: 19000 },
        { year: 2023, count: 19500 },
        { year: 2024, count: 20000 },
        { year: 2025, count: 20500 }
      ]
    },
    {
      Id: 34,
      Order: 1,
      Category: 'ODS FHIR',
      Subtypeof: 30,
      Entity: 'Procedimientos médicos',
      EntityDescription: 'Procedimientos no quirúrgicos (endoscopias, pruebas funcionales, etc.).',
      Table: 'ODS_FHIR.Procedure',
      Filter: '[type]=MEDICAL',
      MDXTotal: 'SELECT FROM [ODS_CATALOG_PROCEDURE] %FILTER [Type].[Type].&[MEDICAL]',
      MDXHistogram: 'SELECT NON EMPTY [Date].[Year].[Year].Members ON 1 FROM [ODS_CATALOG_PROCEDURE] %FILTER [Type].[Type].&[MEDICAL]',
      MDXHistogramUpdated: '',
      totalRecords: 330000,
      expanded: false,
      histogramData: [
        { year: 2020, count: 50000 },
        { year: 2021, count: 52000 },
        { year: 2022, count: 54000 },
        { year: 2023, count: 56000 },
        { year: 2024, count: 58000 },
        { year: 2025, count: 60000 }
      ]
    },

    // ===== RAÍZ HC3 =====
    {
      Id: 40,
      Order: 4,
      Category: 'HC3',
      Subtypeof: null,
      Entity: 'Documentos enviados (HC3)',
      EntityDescription: 'Número de documentos remitidos a HC3 mediante la interfaz HCE.',
      Table: 'HC3_Sent',
      Filter: '[flow]=document',
      MDXTotal: 'SELECT FROM [HC3_SENT] %FILTER [Flow].[Flow].&[document]',
      MDXHistogram: 'SELECT NON EMPTY [Date].[Year].[Year].Members ON 1 FROM [HC3_SENT] %FILTER [Flow].[Flow].&[document]',
      MDXHistogramUpdated: '',
      totalRecords: 120000,
      expanded: false,
      histogramData: [
        { year: 2020, count: 16000 },
        { year: 2021, count: 23000 },
        { year: 2022, count: 21000 },
        { year: 2023, count: 20000 },
        { year: 2024, count: 19500 },
        { year: 2025, count: 20500 }
      ]
    },
    {
      Id: 41,
      Order: 5,
      Category: 'HC3',
      Subtypeof: null,
      Entity: 'Resultados de laboratorio enviados (HC3)',
      EntityDescription: 'Resultados de laboratorio transmitidos a HC3.',
      Table: 'HC3_Sent',
      Filter: '[flow]=lab',
      MDXTotal: 'SELECT FROM [HC3_SENT] %FILTER [Flow].[Flow].&[lab]',
      MDXHistogram: 'SELECT NON EMPTY [Date].[Year].[Year].Members ON 1 FROM [HC3_SENT] %FILTER [Flow].[Flow].&[lab]',
      MDXHistogramUpdated: '',
      totalRecords: 59000,
      expanded: false,
      histogramData: [
        { year: 2020, count: 8000 },
        { year: 2021, count: 9000 },
        { year: 2022, count: 9500 },
        { year: 2023, count: 10000 },
        { year: 2024, count: 11000 },
        { year: 2025, count: 11500 }
      ]
    }
  ];

  return new Observable(observer => {
    observer.next(mockData);
    observer.complete();
  });
  */
}


updateEntry(catalog:Catalog):Observable<{result:Catalog, categories:string[]}|any>{
    if(catalog.Id===-1){
      delete (catalog as any).Id
    }
  return this.http.post(
    this.urlBase + `/catalog/update`,
      catalog
    ).pipe(
    catchError(err => {
      this.alertService.error('[getCatalog] ' + err.message)
      return throwError(() => err);
    })
  );
}

getNamespaces():Observable<string[]|any>{
    return this.http.get(
      this.urlBase + `/catalog/namespaces`
    ).pipe(
      catchError(err => {
        this.alertService.error('[getCatalog] ' + err.message)
        return throwError(() => err);
      })
    )
}


getTableColumns(table: string): Observable<TableColumn[]>|any {
  /*
  // Por ahora solo tenemos mock para ODS_FHIR.Encounter
  if (table !== 'ODS_FHIR.Encounter') {
    // Si quieres, aquí puedes devolver [] o hacer throw de un error
    return new Observable(observer => {
      observer.next([]);
      observer.complete();
    });
  }

  const mockColumns: TableColumn[] = [
    { columnName: 'ID', description: '', dataType: 'bigint', isNullable: false, isGenerated: false },
    { columnName: 'BasedOn', description: 'The ServiceRequest that initiated this encounter', dataType: 'bigint', isNullable: true, isGenerated: false },
    { columnName: 'Deid', description: 'De-identified elements', dataType: 'bigint', isNullable: true, isGenerated: false },
    { columnName: 'Destination', description: 'Location/organization to which the patient is discharged', dataType: 'bigint', isNullable: true, isGenerated: false },
    { columnName: 'DietPreference', description: 'Diet preferences reported by the patient', dataType: 'varchar', isNullable: true, isGenerated: false },
    { columnName: 'EpisodeOfCare', description: 'Episode(s) of care that this encounter should be recorded against', dataType: 'varchar', isNullable: true, isGenerated: false },
    { columnName: 'FHIRID', description: '', dataType: 'numeric', isNullable: true, isGenerated: false },
    { columnName: 'FHIRVersion', description: '', dataType: 'varchar', isNullable: true, isGenerated: false },
    {
      columnName: 'FinalLength',
      description: 'Quantity of time the encounter lasted (less time absent) in seconds once the encounter is finished. While the encounter is not finished, this field is NULL',
      dataType: 'numeric',
      isNullable: true,
      isGenerated: true
    },
    {
      columnName: 'Identifier',
      description: 'An identifier for the episode in the origin system. ⛔️ For deidentified use, a random identifier with similar nomenclature (keeping the prefix) will be calculated',
      dataType: 'varchar',
      isNullable: false,
      isGenerated: false
    },
    { columnName: 'LastOriginMessageDateTime', description: '', dataType: 'timestamp', isNullable: true, isGenerated: false },
    { columnName: 'LastUpdate', description: '', dataType: 'timestamp', isNullable: true, isGenerated: false },
    {
      columnName: 'Length',
      description: 'Quantity of time the encounter lasted (less time absent) in seconds. Must take into account the absence periods to calculate it. When the encounter is finished, it is equal to the field finalLength',
      dataType: 'numeric',
      isNullable: true,
      isGenerated: true
    },
    { columnName: 'Origin', description: 'The location/organization from which the patient came before admission', dataType: 'bigint', isNullable: true, isGenerated: false },
    { columnName: 'OriginService', description: 'The organization (service) from which the patient came before admission', dataType: 'bigint', isNullable: true, isGenerated: false },
    {
      columnName: 'PartOf',
      description: 'Another Encounter this encounter is part of. Used for RIS, APAT or LAB encounters',
      dataType: 'bigint',
      isNullable: true,
      isGenerated: false
    },
    { columnName: 'PharmacyLastRevision', description: 'Last date when the Pharmacy Treatment was reviewed', dataType: 'timestamp', isNullable: true, isGenerated: false },
    { columnName: 'PreAdmissionIdentifier', description: 'Pre-admission identifier', dataType: 'varchar', isNullable: true, isGenerated: false },
    {
      columnName: 'ReAdmission',
      description: 'The type of hospital re-admission that has occurred (if any). v2 RE-ADMISSION INDICATOR (Example): R = Readmission',
      dataType: 'varchar',
      isNullable: true,
      isGenerated: false
    },
    {
      columnName: 'ReasonCode',
      description: 'Coded reason the encounter takes place. Encounter Reason Codes (Preferred)',
      dataType: 'varchar',
      isNullable: true,
      isGenerated: false
    },
    {
      columnName: 'ServiceType',
      description: 'Specific type of service. Service type (Example)',
      dataType: 'varchar',
      isNullable: true,
      isGenerated: false
    },
    {
      columnName: 'Site',
      description: 'Extension para indicar el SITE responsable del encounter',
      dataType: 'varchar',
      isNullable: true,
      isGenerated: false
    },
    {
      columnName: 'SpecialArrangement',
      description: 'Wheelchair, translator, stretcher, etc. Special arrangements (Preferred)',
      dataType: 'varchar',
      isNullable: true,
      isGenerated: false
    },
    {
      columnName: 'Status',
      description: 'planned | arrived | triaged | in-progress | onleave | discharged | finished | cancelled. EncounterStatus (Required)',
      dataType: 'varchar',
      isNullable: false,
      isGenerated: false
    },
    {
      columnName: 'Subject',
      description: 'The patient or group present at the encounter',
      dataType: 'bigint',
      isNullable: true,
      isGenerated: false
    },
    {
      columnName: 'Type',
      description: 'Specific type of encounter. Encounter type (Example)',
      dataType: 'varchar',
      isNullable: true,
      isGenerated: false
    },
    { columnName: 'UID', description: '', dataType: 'varchar', isNullable: false, isGenerated: false },

    { columnName: 'AdmitSource_Code', description: '', dataType: 'varchar', isNullable: true, isGenerated: false },
    { columnName: 'AdmitSource_Description', description: '', dataType: 'varchar', isNullable: true, isGenerated: false },
    { columnName: 'AdmitSource_System', description: '', dataType: 'varchar', isNullable: true, isGenerated: false },

    { columnName: 'Class_Code', description: '', dataType: 'varchar', isNullable: true, isGenerated: false },
    { columnName: 'Class_Description', description: '', dataType: 'varchar', isNullable: true, isGenerated: false },
    { columnName: 'Class_System', description: '', dataType: 'varchar', isNullable: true, isGenerated: false },

    { columnName: 'DischargeDisposition_Code', description: '', dataType: 'varchar', isNullable: true, isGenerated: false },
    { columnName: 'DischargeDisposition_Description', description: '', dataType: 'varchar', isNullable: true, isGenerated: false },
    { columnName: 'DischargeDisposition_System', description: '', dataType: 'varchar', isNullable: true, isGenerated: false },

    { columnName: 'Period_Active', description: '', dataType: 'bit', isNullable: true, isGenerated: true },
    { columnName: 'Period_EndDate', description: '', dataType: 'timestamp', isNullable: true, isGenerated: false },
    { columnName: 'Period_EndDateYYYYMMDD', description: '', dataType: 'integer', isNullable: true, isGenerated: true },
    { columnName: 'Period_StartDate', description: '', dataType: 'timestamp', isNullable: true, isGenerated: false },
    { columnName: 'Period_StartDateYYYYMMDD', description: '', dataType: 'integer', isNullable: true, isGenerated: true },

    { columnName: 'Priority_Code', description: '', dataType: 'varchar', isNullable: true, isGenerated: false },
    { columnName: 'Priority_Description', description: '', dataType: 'varchar', isNullable: true, isGenerated: false },
    { columnName: 'Priority_System', description: '', dataType: 'varchar', isNullable: true, isGenerated: false },

    { columnName: 'ReasonText_Code', description: '', dataType: 'varchar', isNullable: true, isGenerated: false },
    { columnName: 'ReasonText_Description', description: '', dataType: 'varchar', isNullable: true, isGenerated: false },
    { columnName: 'ReasonText_System', description: '', dataType: 'varchar', isNullable: true, isGenerated: false },

    { columnName: 'SpecialCourtesy_Code', description: '', dataType: 'varchar', isNullable: true, isGenerated: false },
    { columnName: 'SpecialCourtesy_Description', description: '', dataType: 'varchar', isNullable: true, isGenerated: false },
    { columnName: 'SpecialCourtesy_System', description: '', dataType: 'varchar', isNullable: true, isGenerated: false }
  ];

  return new Observable(observer => {
    observer.next(mockColumns);
    observer.complete();
  });*/
}



}
