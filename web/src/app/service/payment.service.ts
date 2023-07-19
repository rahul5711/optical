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
export class PaymentService {

  constructor(private httpClient: HttpClient) { }
  private url = environment.apiUrl + '/payment';

  getCommissionDetail(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getCommissionDetail', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }

  saveCommissionDetail(Body:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/saveCommissionDetail', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getCommissionByID(ID:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getCommissionByID', {ID:ID}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getCommissionDetailList(Body:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getCommissionDetailList', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getInvoicePayment(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getInvoicePayment', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }


  customerPayment(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/customerPayment', Body, httpOptions)
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
