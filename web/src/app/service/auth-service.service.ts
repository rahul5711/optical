import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root'
})
export class AuthServiceService {

  constructor(    
    private http: HttpClient,
    private router: Router,
    private ts: TokenService,

    ) { }


    login(data:any) {
      return this.http.post(`${environment.apiUrl}/login`, data);
    }

    isLoggedIn(): boolean {
      if (this.ts.getToken()) {
        return true;
      } else {
        return false;
      }
    }

    // login(data: any): Observable<any> {
    //   console.log(environment.apiUrl);
      
    //   return this.http.post<any>(environment.apiUrl + '/login', data, {
    //     headers: new HttpHeaders({
    //       'Content-type': 'application/json'
    //     })
    //   });
    // }

    logout() {
      // localStorage.clear();
      localStorage.removeItem('user');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('token');
      this.router.navigate(['/']);
    }
}
