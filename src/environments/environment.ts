// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,

  name: 'local-dev',
  description: '[local-dev]',
  tooltip: 'LOCAL-DEV',

  /** local storage key used to store the credentials */
  authLocalStorageKey: 'datapipeui-local-dev-auth',

  /** IRIS API url. IRIS REST APIs URLs will be formed using this url */
  urlIRISApi: 'http://localhost:52773/dpipe/api',

  /** IRIS url. Access to IRIS management portal (e.g. View Trace) will use this url */
  urlIRIS: 'http://localhost:52773/csp/:namespace',
  
  /** IRIS url that will be used if no namespace in Inbox */
  urlIRISDefault: 'http://localhost:52773/csp/dpipe',


};
