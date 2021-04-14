import { Injectable } from '@angular/core';

/**
 * Preferences Service.
 * Singleton service used to store preferences
 */
@Injectable({
  providedIn: 'root'
})
export class PreferencesService {

  /** inbox-list preferences */
  inboxList = {
    filtersInitial: { "Ignored": "0", "UpdatedTSFrom":new Date(), "UpdatedTSFromTime":"00:01", "UpdatedTSTo":new Date(), "UpdatedTSToTime":"23:59" },
    filters: {"Ignored": "0", "UpdatedTSFrom":new Date(), "UpdatedTSFromTime":"00:01", "UpdatedTSTo":new Date(), "UpdatedTSToTime":"23:59" },
    filterAll: {"Ignored": "0",  "UpdatedTSFrom":new Date(), "UpdatedTSFromTime":"00:01", "UpdatedTSTo":new Date(), "UpdatedTSToTime":"23:59" },
    filterErrors: { "Status": ["ERROR-INGESTING", "ERROR-STAGING", "ERROR-OPERATING","ERROR-GENERAL"], "Ignored" : "0","UpdatedTSFrom": "SAME", "UpdatedTSFromTime":"SAME", "UpdatedTSTo":"SAME", "UpdatedTSToTime":"SAME" },
    filterWarnings: { "Ignored" : "0", "StagingStatus" : ["Warning"], "UpdatedTSFrom": "SAME", "UpdatedTSFromTime":"SAME", "UpdatedTSTo":"SAME", "UpdatedTSToTime":"SAME" },
    pageIndex: 0,
    pageSize: 50,
  };

  constructor() { }
}
