import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, ReplaySubject, Observable, throwError } from 'rxjs';
import { map, distinctUntilChanged, tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

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
  constructor(private http: HttpClient, private router: Router) {
  }

  /**
   * Login into the app (implements Basic HTTP auth with IRIS backend)
   * @param username 
   * @param password 
   */
  public login(username: string, password: string): Observable<string> {
    let basicheader = btoa(encodeURI(username+":"+password));
    let headers = new HttpHeaders();
    headers = headers.set('Authorization', 'Basic ' + basicheader);
    headers = headers.set('Cache-Control', 'no-cache');

    return this.http
      .post<any>(
        environment.urlIRISApi + '/login',
        {},
        {headers}
      ).
      pipe(
        map(data => {
          let token = `Basic ${basicheader}`;
          localStorage.setItem(environment.authLocalStorageKey, JSON.stringify({ username, token }));
          this._token.next(token);
          setTimeout(() => {
            this.isLoginSubject.next(true);
            this.getUserInfo().subscribe();
          });
          return username;
        }),
        catchError(err => {
          this.logout();
          return throwError(err);
        })
      );
  }

  /**
   * Logout
   */
  public logout(): void {
    localStorage.removeItem(environment.authLocalStorageKey);
    setTimeout(() => {
      this.isLoginSubject.next(false);
    });
  }

  /**
   * Returns true if user is authenticated
   */
  public authenticated(): boolean {
    const currentUser = JSON.parse(localStorage.getItem(environment.authLocalStorageKey) || '{}');
    const token = currentUser && currentUser.token;
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
  getToken(): string {
    const currentUser = JSON.parse(localStorage.getItem(environment.authLocalStorageKey) || '{}');
    const token = currentUser && currentUser.token;
    return token;
  }

  /**
   * Returns an Observable that can be used across the application to know if the user is logged in
   */
  isLoggedIn(): Observable<boolean> {
    return this.isLoginSubject.asObservable();
  }


  /**
   * Get user information from IRIS and load attributes as needed 
   */
  public getUserInfo(): Observable<any> {
    return this.http
      .get<any>(
        environment.urlIRISApi + '/getUserInfo',
      ).
      pipe(
        tap(data => {
          // load user attributes
          this.fullName = data.fullName;
          this.permissions = data.permissions;
          
          return data;
        }),
        catchError(err => {
          this.logout();
          return throwError(err);
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