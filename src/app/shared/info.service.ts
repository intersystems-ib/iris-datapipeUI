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
      version: '2.1',
      srcVersion: '@srcVersion',
      srcTooltip: '@srcTooltip'
    };
  }
}
