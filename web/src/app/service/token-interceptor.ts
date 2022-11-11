import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router, RouterLink } from '@angular/router';
import { AlertService } from './alert.service';
import { TokenService } from './token.service';
import { AuthServiceService } from './auth-service.service';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  constructor(
    public tokenService: TokenService,
    public router: Router,
    private as: AlertService,
    private auth: AuthServiceService
  ) {}
  intercept( req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    this.tokenService.token = localStorage.getItem('auth')|| '';
    if (this.tokenService.getToken()) {
      if (!this.tokenService.isTokenExpired()) {
        const headersConfig:any = {
          Accept: 'application/json'
        };
        const token = this.tokenService.getToken();
       const ip = document.getElementById('ip')!.innerHTML;
        if (token) {
          headersConfig['Authorization'] = `Bearer ${token}`;
          headersConfig['Access-Control-Allow-Headers'] =  'Content-Type';
          headersConfig['ip'] = ip;
          headersConfig['UserGroup'] = this.tokenService.getUser().data?.UserGroup || '';

        }
        req = req.clone({ setHeaders: headersConfig });
      } else {
        this.as.warningToast('Session Expired! Please Login Again');
        this.auth.logout();
      }
    }
    // this.spinner.show();
    return next.handle(req).pipe(
    tap(
        (event: HttpEvent<any>) => {
          return next.handle(req);
        },
        (err: any) => {
          if (err instanceof HttpErrorResponse) {
            if(err.status === 999) {
              localStorage.clear()
              this.router.navigate(['/'])
              
            }
            
            // this.spinner.hide();
              if (err.status === 401) {
              // this.as.errorToast(err.error.error.message);
              const msg = 'You are not authorized to performed this action';
              this.router.navigate([`/401/${msg}`]);
            } else if (err.status === 500) {
              const msg = err.message;
              this.router.navigate([`/500/${msg}`]);
            } else if (err.status === 0) {
              const msg = 'Under maintainance';
              this.router.navigate([`/500/${msg}`]);
              }else if (err.status === 503) {
                var message = err.error.error.message.replaceAll(' ', '_')
      
                this.router.navigate([`/503/${message}`]);
                } else {
                // console.log(err);
                // this.as.errorToast(err.message);
                const error =  err.error.error.message || err.error.message || err.statusText  || err.message;
                console.log(error);
                
                this.as.errorToast(error);
              }
              // const error = err.error.message || err.statusText || err.error.error.message || err.message;

              // return Error(error);
              
          }
        }, () => {
          // this.spinner.hide();
        }
      )
    );
  }
}
