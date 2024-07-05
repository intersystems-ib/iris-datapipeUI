import { Injectable } from '@angular/core';

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

@Injectable({
  providedIn: 'root'
})
export class PreferencesService {

  /** inbox-list preferences */
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

  /** dashboard preferences */
  dashboard: DashboardPref = {
    filters: {"UpdatedTSFrom":new Date(), "UpdatedTSFromTime":"00:01", "UpdatedTSTo":new Date(), "UpdatedTSToTime":"23:59" },

    filtersPreset: {
      initial: { "UpdatedTSFrom":new Date(), "UpdatedTSFromTime":"00:01", "UpdatedTSTo":new Date(), "UpdatedTSToTime":"23:59" },
    },
  };

  constructor() { }
}
