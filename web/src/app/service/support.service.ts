import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SupportService {

  constructor(private httpClient: HttpClient) { }
  private url = 'http://localhost:3000/support';

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

  private handleError(errorResponse: HttpErrorResponse) {
    if (errorResponse.error instanceof ErrorEvent) {
      console.error('Client Side Error: ', errorResponse.error.message);
    } else {
      console.error('Server Side Error: ', errorResponse);
    }
    return throwError(errorResponse);
  }
}
