import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

const httpOptions = {
  headers: new HttpHeaders({'Content-Type': 'application/json'})
};

@Injectable({
  providedIn: 'root'
})

export class ReminderService {

  loggedInUser:any = localStorage.getItem('LoggedINUser');
  private url = environment.apiUrl + '/reminder';
  constructor(private httpClient: HttpClient) { }

  getBirthDayReminder(type:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getBirthDayReminder', {type:type}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getAnniversaryReminder(type:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getAnniversaryReminder', {type:type}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getCustomerOrderPending(type:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getCustomerOrderPending', {type:type}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getEyeTestingReminder(type:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getEyeTestingReminder', {type:type}, httpOptions)
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
