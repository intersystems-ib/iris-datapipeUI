// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,

  /** IRIS API url. IRIS REST APIs URLs will be formed using this url */
  urlIRISApi: 'http://localhost:52773/dpipe/api',

  /** IRIS url. Access to IRIS management portal (e.g. View Trace) will use this url */
  urlIRIS: 'http://localhost:52773/csp/dpipe'

};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
