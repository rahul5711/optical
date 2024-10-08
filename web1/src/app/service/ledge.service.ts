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
export class LedgeService {

  constructor(private httpClient: HttpClient) { }
  private url = environment.apiUrl + '/ledge';

  getCustomerLedgeReport(FromDate: any,ToDate: any,CustomerID: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getCustomerLedgeReport', {FromDate:FromDate,ToDate:ToDate,CustomerID:CustomerID}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getSupplierLedgeReport(FromDate: any,ToDate: any,SupplierID: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getSupplierLedgeReport', {FromDate:FromDate,ToDate:ToDate,SupplierID:SupplierID}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getFitterLedgeReport(FromDate: any,ToDate: any,FitterID: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getFitterLedgeReport', {FromDate:FromDate,ToDate:ToDate,FitterID:FitterID}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getEmployeeLedgeReport(FromDate: any,ToDate: any,UserID: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getEmployeeLedgeReport', {FromDate:FromDate,ToDate:ToDate,UserID:UserID}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getDoctorLedgeReport(FromDate: any,ToDate: any,DoctorID: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getDoctorLedgeReport', {FromDate:FromDate,ToDate:ToDate,DoctorID:DoctorID}, httpOptions)
    .pipe(catchError(this.handleError));
  }
  getRecycleData(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getRecycleData', Body, httpOptions)
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
