import { Component } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AuthService } from './auth/auth.service';
import { InfoService } from './shared/info.service';
import { environment } from '../environments/environment';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'DataPipeUI';
  isLoggedIn$: Observable<boolean>;
  info: any;

  envDescription: string = environment.description;
  envTooltip: string = environment.tooltip;
  envToolbarClass: string = 'mat-toolbar-' + environment.name;

  /**
   * Application constructor
   * This is used whether the app is loaded / reloaded
   * @param authService
   * @param infoService 
   */
  constructor(
    public authService: AuthService,
    private infoService: InfoService,
    private router: Router
  ) { 
      // retrieve user information
      authService.getUserInfo().subscribe({});

      // get whether the user is logged in
      this.isLoggedIn$ = this.authService.isLoggedIn();
  }
  
  /**
   * Init
   */
  ngOnInit() {
    this.info = this.infoService.getAppInfo();
  }

  /** 
   * Navigate to some URL 
   */
  navigate(route: string) {
    this.router.navigate([route]).then();
  }

}
