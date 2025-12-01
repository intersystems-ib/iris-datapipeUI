import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { SharedModule } from './shared/shared.module';
import { AuthModule } from './auth/auth.module';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { ToastContainerComponent } from './shared/toast/toast-container.component';

@NgModule({ declarations: [
        AppComponent
    ],
    bootstrap: [AppComponent], imports: [BrowserModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        MatNativeDateModule,
        SharedModule.forRoot(),
        AuthModule.forRoot(),
        ToastContainerComponent], providers: [
        { provide: MAT_DATE_LOCALE, useValue: 'es-ES' },
        provideHttpClient(withInterceptorsFromDi()),
    ] })
export class AppModule { }
