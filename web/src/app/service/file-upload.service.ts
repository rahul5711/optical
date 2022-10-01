import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Company } from '../interface/Company';

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  loggedInUser:any = localStorage.getItem('LoggedINUser');

  constructor(private httpClient: HttpClient) { }
  private url = 'http://localhost:3000/file';


  uploadFile(Body:any): Observable<any> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    const params = new HttpParams()
    return this.httpClient.post<any>(this.url + '/upload',  Body, { headers, params })
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
