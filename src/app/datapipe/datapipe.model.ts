import {Observable} from 'rxjs';
import {ApexAxisChartSeries, ApexXAxis} from "ng-apexcharts";

/**
 * Inbox
 */
export interface Inbox {
  Id: number;
  Source: string;
  Pipe: Pipe;
  MsgId: string;
  Subject: string;
  Element: string;
  Status: string;
  CreatedTS: Date;
  UpdatedTS: Date;
  Ignored: boolean;
  OperRetries: string;

  LastIngestion: number;
  LastStaging: number;
  LastOper: number;

  StagingStatus: string;
  OperStatus: string;
  Namespace: string;

  Ingestions$: Observable<Ingestion[]>;
}

/**
 * Ingestion
 */
export interface Ingestion {
  Id: number;
  ModelName: string;
  ModelData: string;
  SessionId: string;
  HeaderId: string;
  CreatedTS: Date;

  Stagings$: Observable<Staging[]>;
}

/**
 * Staging
 */
export interface Staging {
  Id: number;
  ModelNormData: string;
  SessionId: string;
  HeaderId: string;
  CreatedTS: Date;
  Status: string;
  ValidationErrors: { Code: string, Desc: string }[];
  ValidationErrorsJson: any;

  Opers$: Observable<Oper[]>;
}

/**
 * Oper
 */
export interface Oper {
  Id: number;
  SessionId: string;
  HeaderId: string;
  CreatedTS: Date;
  Status: string;
  OperLog: string;
  OperErrors: { Code: string, Desc: string }[];
}

/**
 * Pipe
 */
export interface Pipe {
  Code: string;
  Description: string;
  SecurityResource: string;
}

/**
 * Query result (template)
 */
export interface QueryResult<T> {
  children: T[],
  total: number;
}

/**
 * Catalog
 */
export interface Catalog {
  Id: number;
  Category: string;
  Subtypeof: number | null;
  Entity: string;
  EntityDescription: string;
  DataOrigins: string;
  Usage: string;
  Namespace: string;
  Table: string;
  Filter: string;
  MDXTotal: string;
  MDXHistogram?: string;
  MDXHistogramUpdated?: string;
  Order: number;
  Total?: number;
  Histogram?: { [year: string]: number };
  HistogramUpdated?: { [year: string]: number };
  MDXError?: string[]

  // UI properties
  Children?: Catalog[];
  expanded?: boolean;
  ///Both HistogramSeries and HistogramXaxis are calculated upon receiving backend result
  HistogramSeries?: ApexAxisChartSeries;
  HistogramXaxis?: ApexXAxis;
  showHistogram?: boolean;
  showColumns?: boolean;
  isEditing?: boolean;
  columns?: TableColumn[],
  ChartOptionsChart?: any,
  DoneLoadingGraph?:boolean
}

export interface TableColumn {
  columnName: string;
  description: string;
  dataType: string;
  isNullable: string;
  isGenerated: string;
  isIdentity: string;
}

export interface TableIndex {
  name: string;
  description: string;
  properties: string;   // "FHIRID,FHIRVersion" o "Period.EndDate"
  type: string;         // "bitmap" | "key" | "index"...
  isUnique: "YES" | "NO";
  isPrimaryKey: "YES" | "NO";
}
