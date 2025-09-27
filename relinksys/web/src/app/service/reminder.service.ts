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

  getBirthDayReminder(type:any,dateType:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getBirthDayReminder', {type:type,dateType:dateType}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getAnniversaryReminder(type:any,dateType:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getAnniversaryReminder', {type:type,dateType:dateType}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getCustomerOrderPending(dateType:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getCustomerOrderPending', {dateType:dateType}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getEyeTestingReminder(dateType:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getEyeTestingReminder', {dateType:dateType}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getFeedBackReminder(dateType:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getFeedBackReminder', {dateType:dateType}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getServiceMessageReminder(dateType:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getServiceMessageReminder', {dateType:dateType}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getSolutionExpiryReminder(type:any,dateType:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getSolutionExpiryReminder', {type:type,dateType:dateType}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getContactLensExpiryReminder(type:any,dateType:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getContactLensExpiryReminder', {type:type,dateType:dateType}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getReminderCount(Body:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getReminderCount', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }
  
  sendWpMessage(Body:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/sendWpMessage', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }
  
  sendCustomerCreditNoteWpMessage(Body:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/sendCustomerCreditNoteWpMessage', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }



  // sendEmail(Body:any,Mode:any): Observable<any> {
  //   return this.httpClient.post<any>(this.url + '/mail', {Body:Body,Mode:Mode}, httpOptions)
  //   .pipe(catchError(this.handleError));
  // }


  private handleError(errorResponse: HttpErrorResponse) {
    if (errorResponse.error instanceof ErrorEvent) {
      console.error('Client Side Error: ', errorResponse.error.message);
    } else {
      console.error('Server Side Error: ', errorResponse);
    }
    return throwError(errorResponse);
  }
}
