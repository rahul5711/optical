import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Company } from '../interface/Company';

@Injectable({
  providedIn: 'root'
})

export class CompanyService {

  loggedInUser:any = localStorage.getItem('LoggedINUser');

  constructor(private httpClient: HttpClient) { }
  private url = 'http://localhost:3000/company';
  
  
  createCompany( Body: any): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const params = new HttpParams()
    return this.httpClient.post<any>(this.url + '/create', Body, { headers, params })
    .pipe(catchError(this.handleError));
  }

  updateCompany( Body: any): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const params = new HttpParams()
    return this.httpClient.post<any>(this.url + '/update', Body, { headers, params })
    .pipe(catchError(this.handleError));
  }

  getCompanyById(ID:any): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const params = new HttpParams();
    return this.httpClient.post<any>(this.url + '/getCompanyById', {ID: ID},  { headers, params })
    .pipe(catchError(this.handleError));
  }

  deleteData(ID:any): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const params = new HttpParams();
    return this.httpClient.post<any>(this.url + '/delete', {ID: ID},  { headers, params })
    .pipe(catchError(this.handleError));
  }

  getList(Body: any): Observable<any> {
    const params = new HttpParams()
    return this.httpClient.post<any>(this.url + '/list', Body, { params })
    .pipe(catchError(this.handleError));
  }

  getUserList(Body: any): Observable<any> {
    const params = new HttpParams()
    return this.httpClient.post<any>(this.url + '/user', Body, { params })
    .pipe(catchError(this.handleError));
  }
  
  getLoginList(Body: any): Observable<any> {
    const params = new HttpParams()
    return this.httpClient.post<any>(this.url + '/LoginHistory', Body, { params })
    .pipe(catchError(this.handleError));
  }


  updatePassword(Body:any): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const params = new HttpParams()
    return this.httpClient.post<any>(this.url + '/updatePassword',  Body, { headers, params })
    .pipe(catchError(this.handleError));
  }

  updatecompanysetting(Body:any): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const params = new HttpParams()
    return this.httpClient.post<any>(this.url + '/updatecompanysetting',  Body, { headers, params })
    .pipe(catchError(this.handleError));
  }

  private handleError(errorResponse: HttpErrorResponse) {
    if (errorResponse.error instanceof ErrorEvent) {
      console.error('Client Side Error: ', errorResponse.error.message);
    } else {
      console.error('Server Side Error: ', errorResponse);
    }
    return throwError(errorResponse);
  }


}