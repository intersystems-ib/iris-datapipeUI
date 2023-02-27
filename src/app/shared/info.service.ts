import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class InfoService {

  constructor() { }

  /**
   * Returns Application Information
   */
  getAppInfo(): any {
    return {
      name: 'datapipeUI',
      version: '2.0',
      srcVersion: '@srcVersion',
      srcTooltip: '@srcTooltip'
    };
  }
}
