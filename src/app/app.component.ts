import { Component, OnInit, AfterViewInit } from '@angular/core';
import { AuthService } from './auth/auth.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { InfoService } from './shared/info.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'DataPipeUI';
  isLoggedIn$: Observable<boolean>;
  info: any;
  
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
