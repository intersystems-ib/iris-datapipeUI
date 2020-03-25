import { Observable } from 'rxjs';

/**
 * Inbox
 */
export interface Inbox {
    Id: number;
    Source: string;
    Flow: string;
    MsgId: string;
    Element: string;
    Status: string;
    CreatedTS: Date;
    UpdatedTS: Date;

    LastIngestion: number;
    LastStaging: number;
    LastOper: number;

    StagingStatus: string;
    OperStatus: string;
    
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
}

/**
 * Query result (template)
 */
export interface QueryResult<T> {
    children: T[],
    total: number;
}