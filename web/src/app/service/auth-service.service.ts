import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthServiceService {

  constructor(    
    private http: HttpClient,
    private router: Router,

    ) { }


    login(data:any) {
      return this.http.post(`${environment.apiUrl}/login`, data);
    }

    // login(data: any): Observable<any> {
    //   console.log(environment.apiUrl);
      
    //   return this.http.post<any>(environment.apiUrl + '/login', data, {
    //     headers: new HttpHeaders({
    //       'Content-type': 'application/json'
    //     })
    //   });
    // }
}
