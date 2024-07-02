import { Injectable } from '@angular/core';
import { PlatformLocation } from '@angular/common';
import { AuthService } from './auth.service';
import { Router, Route, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';

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
    let canActivate = false;
    if (this.authService.authenticated()) {
      if (state.url.startsWith("/datapipe")) {
          canActivate = this.authService.checkPermission("DP_MENU_SEARCH", "R") 
      }
      else if (state.url.startsWith("/dashboard")) {
          canActivate = this.authService.checkPermission("DP_MENU_DASHBOARD", "R")
      }
      if (!canActivate) {
        // optionally redirect to error page
      }
      return canActivate;
    }
    
    // user not logged-in, redirect to login
    this.router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url }});
    return false;
  }
  
}