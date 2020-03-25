import { Component, OnInit, AfterViewInit } from '@angular/core';
import { AuthService } from './auth/auth.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'DataPipeUI';

  isLoggedIn$: Observable<boolean>;
  
  constructor(private authService: AuthService) { 
    this.isLoggedIn$ = this.authService.isLoggedIn();
  }  

}
