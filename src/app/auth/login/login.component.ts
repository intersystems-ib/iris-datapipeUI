import { Component, OnInit } from '@angular/core';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { AuthService } from '../auth.service';
import { map, tap } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertService } from '../../shared/alert.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  form!: FormGroup;
  loading!: boolean;
  returnUrl!: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private authService: AuthService,
    private alertService: AlertService, 
  ) { }

  ngOnInit() {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';

    const formControls = {
      username: ['', Validators.required],
      password: ['', Validators.required]
    };
    this.form = this.fb.group(formControls);
  }

  onLogin() {
    let data = { ...this.form.value }
    const username = data.username;
    const password = data.password;
    
    this.loading = true;
    this.authService.login(username, password, this.returnUrl).subscribe({
      next: (v) => { 
        this.loading = false;
      },
      error: (e) => {
        this.loading = false;
      },
      complete: () => {
      }
    });
  }

}
