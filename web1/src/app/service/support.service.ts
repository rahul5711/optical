import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupportService {

  constructor(private httpClient: HttpClient) { }
  private url = environment.apiUrl + '/support';
  private url1 = environment.apiUrl + '/charge';

  saveData( TableName:any,Name:any, ): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const params = new HttpParams()
    return this.httpClient.post<any>(this.url + '/save', {TableName: TableName,Name:Name})
    .pipe(catchError(this.handleError));
  }

  getList( TableName:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/list' , {TableName: TableName})
    .pipe(catchError(this.handleError));
  }


  deleteSupport(TableName:any,Name:any,  ): Observable<any> {
    return this.httpClient.post<any>(this.url + '/delete', {TableName: TableName,Name:Name})
    .pipe(catchError(this.handleError));
  }

  chargesave( Body:any ): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const params = new HttpParams()
    return this.httpClient.post<any>(this.url + '/chargesave', Body)
    .pipe(catchError(this.handleError));
  }

  chargedelete( Name:any ): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const params = new HttpParams()
    return this.httpClient.post<any>(this.url + '/chargedelete', {Name:Name})
    .pipe(catchError(this.handleError));
  }

  chargelist( Body:any ): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const params = new HttpParams()
    return this.httpClient.post<any>(this.url + '/chargelist', Body)
    .pipe(catchError(this.handleError));
  }

  servicesave( Body:any ): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const params = new HttpParams()
    return this.httpClient.post<any>(this.url + '/servicesave', Body)
    .pipe(catchError(this.handleError));
  }

  servicedelete( Name:any ): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const params = new HttpParams()
    return this.httpClient.post<any>(this.url + '/servicedelete', {Name:Name})
    .pipe(catchError(this.handleError));
  }

  servicelist( Body:any ): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const params = new HttpParams()
    return this.httpClient.post<any>(this.url + '/servicelist', Body)
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
