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
    filtersInitial: { "Status": ["ERROR-INGESTING", "ERROR-STAGING", "ERROR-OPERATING"], "Ignored": "0", "UpdatedTSFrom":new Date(), "UpdatedTSFromTime":"00:01", "UpdatedTSTo":new Date(), "UpdatedTSToTime":"23:59" },
    filters: { "Status": ["ERROR-INGESTING", "ERROR-STAGING", "ERROR-OPERATING"], "Ignored": "0", "UpdatedTSFrom":new Date(), "UpdatedTSFromTime":"00:01", "UpdatedTSTo":new Date(), "UpdatedTSToTime":"23:59" },
    pageIndex: 0,
    pageSize: 10,
  };

  constructor() { }
}
