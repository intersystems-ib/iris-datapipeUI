import { Component } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AuthService } from './auth/auth.service';
import { InfoService } from './shared/info.service';
import { environment } from '../environments/environment';

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

  constructor(
    private authService: AuthService,
    private infoService: InfoService
    ) { 
    this.isLoggedIn$ = this.authService.isLoggedIn();
  }
  
  /**
   * Init
   */
  ngOnInit() {
    this.info = this.infoService.getAppInfo();
  }

}
