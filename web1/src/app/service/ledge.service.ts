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

  getCustomerLedgeReport(FromDate: any,ToDate: any,CustomerID: any,ShopID: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getCustomerLedgeReport', {FromDate:FromDate,ToDate:ToDate,CustomerID:CustomerID,ShopID:ShopID}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getSupplierLedgeReport(FromDate: any,ToDate: any,SupplierID: any,ShopID: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getSupplierLedgeReport', {FromDate:FromDate,ToDate:ToDate,SupplierID:SupplierID,ShopID:ShopID}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getSupplierLedgeReportPDF(Body:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getSupplierLedgeReportPDF', {Body:Body}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getCustomerLedgeReportPDF(Body:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getCustomerLedgeReportPDF', {Body:Body}, httpOptions)
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
