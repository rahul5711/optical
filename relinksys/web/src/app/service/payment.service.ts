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

  getInvoicePayment(PaymentType:any,PayeeName: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getInvoicePayment', {PaymentType:PaymentType, PayeeName:PayeeName}, httpOptions)
    .pipe(catchError(this.handleError));
  }


  customerPayment(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/customerPayment', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }

  updateCustomerPaymentMode(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/updateCustomerPaymentMode', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }

  updateCustomerPaymentDate(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/updateCustomerPaymentDate', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }

  customerPaymentDebit(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/customerPaymentDebit', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }

  applyPayment(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/applyPayment', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getCustomerCreditAmount(ID:any, CustomerID:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getCustomerCreditAmount', {ID:ID, CustomerID:CustomerID}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  customerCreditDebit(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/customerCreditDebit', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }
  
  getCommissionDetailByID(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getCommissionDetailByID', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getSupplierCreditNote(SupplierID: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getSupplierCreditNote', {SupplierID:SupplierID}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getCustomerCreditNote(CustomerID: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getCustomerCreditNote', {CustomerID:CustomerID}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getSupplierCreditNoteByCreditNumber(SupplierID: any,CreditNumber:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getSupplierCreditNoteByCreditNumber', {SupplierID:SupplierID,CreditNumber:CreditNumber}, httpOptions)
    .pipe(catchError(this.handleError));
  }


  vendorPayment(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/vendorPayment', Body, httpOptions)
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
