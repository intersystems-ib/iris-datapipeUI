import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface InboxListPref {
  filters: any,
  filtersPreset: { [key: string]: any }
  pageIndex: number,
  pageSize: number
}

export interface DashboardPref {
  filters: any,
  filtersPreset: { [key: string]: any }
}

export interface PipeListPref {
  filters: any,
  filtersPreset: { [key: string]: any },
  pageIndex: number,
  pageSize: number
}

@Injectable({
  providedIn: 'root'
})
export class PreferencesService {

  /** base URL */
  private urlBase = environment.urlIRISApi;

  /** options used in request */
  private options = { };

  /** inbox-list default preferences */
  inboxList: InboxListPref = {
    filters: {"Ignored": "0", "UpdatedTSFrom":new Date(), "UpdatedTSFromTime":"00:01", "UpdatedTSTo":new Date(), "UpdatedTSToTime":"23:59" },

    filtersPreset: {
      initial: { "Ignored": "0", "UpdatedTSFrom":new Date(), "UpdatedTSFromTime":"00:01", "UpdatedTSTo":new Date(), "UpdatedTSToTime":"23:59" },
      all: {"Ignored": "0",  "UpdatedTSFrom":new Date(), "UpdatedTSFromTime":"00:01", "UpdatedTSTo":new Date(), "UpdatedTSToTime":"23:59" },
      errors: { "Status": ["ERROR-INGESTING", "ERROR-STAGING", "ERROR-OPERATING","ERROR-GENERAL"], "Ignored" : "0", "UpdatedTSFrom": null, "UpdatedTSFromTime": null, "UpdatedTSTo": null, "UpdatedTSToTime": null },
      warnings: { "Ignored" : "0", "StagingStatus" : ["Warning"], "UpdatedTSFrom": null, "UpdatedTSFromTime": null, "UpdatedTSTo": null, "UpdatedTSToTime": null },
    },

    pageIndex: 0,
    pageSize: 50,
  };

  /** dashboard default preferences */
  dashboard: DashboardPref = {
    filters: {"UpdatedTSFrom":new Date(), "UpdatedTSFromTime":"00:01", "UpdatedTSTo":new Date(), "UpdatedTSToTime":"23:59" },

    filtersPreset: {
      initial: { "UpdatedTSFrom":new Date(), "UpdatedTSFromTime":"00:01", "UpdatedTSTo":new Date(), "UpdatedTSToTime":"23:59" },
    },
  };

  /** pipe-list default preferences */
  pipeList: PipeListPref = {
    filters: {"UpdatedTSFrom":new Date(), "UpdatedTSFromTime":"00:01", "UpdatedTSTo":new Date(), "UpdatedTSToTime":"23:59" },

    filtersPreset: {
      initial: { "UpdatedTSFrom":new Date(), "UpdatedTSFromTime":"00:01", "UpdatedTSTo":new Date(), "UpdatedTSToTime":"23:59" },
    },
    
    pageIndex: 0,
    pageSize: 50,
  };

  constructor(
    private http: HttpClient
  ) { }

  /** 
   * Get preference value 
   * @param key
   */
  get(key: string, username: string): Observable<any> {
    return this.http.get<any[]>(
      `${this.urlBase}/objects/DataPipe.Data.Preference/user/${username}/${key}`,
      this.options
    );
  }

  /**
   * Update a preference value
   * @param key 
   * @param username 
   * @param body 
   * @returns 
   */
  update(key: string, username: string, body: any) {
    return this.http.put(
        this.urlBase + `/objects/DataPipe.Data.Preference/user/${username}/${key}`, body, this.options);
  }

}
