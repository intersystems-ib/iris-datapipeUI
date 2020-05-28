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
    filtersInitial: { "Ignored": "0" },
    filters: { "Ignored": "0" },
    pageIndex: 0,
    pageSize: 10,
  };

  constructor() { }
}
