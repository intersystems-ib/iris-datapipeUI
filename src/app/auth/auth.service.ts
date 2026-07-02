import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {Router} from '@angular/router';
import {BehaviorSubject, Observable, throwError} from 'rxjs';
import {catchError, map, tap} from 'rxjs/operators';
import {environment} from '../../environments/environment';
import {AlertService} from "../shared/alert.service";

/**
 * Authentication Service
 */
@Injectable()
export class AuthService {

  /** username */
  username: string = "";

  /** user full name */
  fullName: string = "";

  /** user permissions */
  permissions: any = {};

  /** isLoginSubject is used to know if the user is logged in or not */
  isLoginSubject = new BehaviorSubject<boolean>(this.authenticated());

  /** private user token */
  private _token: BehaviorSubject<string> = new BehaviorSubject<string>('');

  /**
   * Constructor
   */
  constructor(private http: HttpClient, private router: Router, private alertService: AlertService) {
  }

  /**
   * Login into the app (implements Basic HTTP auth with IRIS backend)
   * @param username
   * @param password
   * @param redirectTo url to redirect after login
   */
  public login(username: string, password: string, redirectTo: string): Observable<string> {
    let basicheader = btoa((username + ":" + password));
    let headers = new HttpHeaders();
    headers = headers.set('Authorization', 'Basic ' + basicheader);
    headers = headers.set('Cache-Control', 'no-cache');

    return this.http
      .post<any>(
        environment.urlIRISApi + '/login',
        {},
        {headers}
      ).pipe(
        map(data => {
          let token = `Basic ${basicheader}`;
          localStorage.setItem(environment.authLocalStorageKey, JSON.stringify({username, token}));
          this._token.next(token);
          setTimeout(() => {
            this.isLoginSubject.next(true);
            this.getUserInfo().subscribe({
              next: (d => {
                  this.router.navigateByUrl(redirectTo).then((wasSuccessful) => {
                    if (!wasSuccessful)
                      this.router.navigateByUrl('/datapipe/catalog')
                  });
                }
              ), error: (err: HttpErrorResponse) => {
                if (err && (err.status === 403 || err.status === 500)) {
                  const body = (typeof err.error === 'string') ? err.error : (err.error && err.error.message ? err.error.message : err.message);
                  const message = body && body.trim().length > 0 ? body : `Request failed with status ${err.status}`;
                  this.alertService.error(message);
                }
              }
            });
          });
          this.username = username;
          return username;
        }),
        catchError(err => {
          this.logout();
          return throwError(() => err);
        })
      );
  }

  /**
   * Logout
   */
  public logout(): void {
    localStorage.removeItem(environment.authLocalStorageKey);
    this.username = '';
    this.fullName = '';
    this.permissions = {};

    setTimeout(() => {
      this.isLoginSubject.next(false);
      this._token.next('');
    });
  }

  /**
   * Returns true if user is authenticated
   */
  private authenticated(): boolean {
    const token = this.getToken();
    if (token) {
      if (this._token) {
        this._token.next(token);
      }
      return true;
    }
    return false;
  }

  /**
   * Returns stored user token (if any)
   */
  public getToken(): string {
    const currentUser = JSON.parse(localStorage.getItem(environment.authLocalStorageKey) || '{}');
    const token = currentUser && currentUser.token;
    return token;
  }

  /**
   * Returns an Observable that can be used across the application to know if the user is logged in
   */
  public isLoggedIn(): Observable<boolean> {
    return this.isLoginSubject.asObservable();
  }

  /**
   * Get user information from IRIS and load attributes as needed
   */
  public getUserInfo(): Observable<any> {
    return this.http
      .get<any>(
        environment.urlIRISApi + '/getUserInfo',
      ).pipe(
        tap(data => {
          // load user attributes
          this.username = data.username;
          this.fullName = data.fullName;
          this.permissions = data.permissions;

          return data;
        }),
        catchError(err => {
          this.logout();
          return throwError(() => err);
        })
      );
  }

  /**
   * Check that user has a permission with a given level
   * @param permission
   * @param level
   * @returns
   */
  public checkPermission(permission: string, level: string): boolean {
    let permitted: boolean = false;

    if (this.permissions[permission]) {
      let permissions = this.permissions[permission].toUpperCase();
      permitted = permissions.includes(level.toUpperCase());
    }
    return permitted;
  }

}
