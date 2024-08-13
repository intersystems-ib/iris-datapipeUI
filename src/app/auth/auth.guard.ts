import { Injectable } from '@angular/core';
import { PlatformLocation } from '@angular/common';
import { AuthService } from './auth.service';
import { Router, Route, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { map, Observable } from 'rxjs';

@Injectable()
export class AuthGuard  {

  /**
   * Constructor
   */
  constructor(private authService: AuthService, private router: Router) {}

  /**
   * Returns true if a protected URL can be activated
   * This method will be called by every URL that is protected in the application
   */
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | Observable<boolean> {
    return this.authService.isLoggedIn().pipe(
      map(authenticated => { 
        if (authenticated) {
          if (state.url.startsWith("/datapipe/dashboard")) {
            return this.authService.checkPermission("DP_MENU_DASHBOARD", "R")
          }
          else if (state.url.startsWith("/datapipe/admin")) {
            return this.authService.checkPermission("DP_ADMIN", "U")
          }
          else if (state.url.startsWith("/datapipe")) {
            return this.authService.checkPermission("DP_MENU_SEARCH", "R") 
          }
          // optionally redirect to error page
          return false;
        }
        else {
          // user not logged-in, redirect to login
          this.router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url }});
          return false;
        }
      })
    );
  }
}