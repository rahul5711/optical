import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

const httpOptions = {
  headers: new HttpHeaders({'Content-Type': 'application/json'})
};

@Injectable({
  providedIn: 'root'
})
export class BillService {

  loggedInUser:any = localStorage.getItem('LoggedINUser');

  constructor(private httpClient: HttpClient) { }
  private url = 'http://localhost:3000/bill';


  getDoctor(): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getDoctor',  httpOptions)
    .pipe(catchError(this.handleError));
  }

  getEmployee(): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getEmployee',  httpOptions)
    .pipe(catchError(this.handleError));
  }

  getTrayNo(): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getTrayNo',  httpOptions)
    .pipe(catchError(this.handleError));
  }

  searchByBarcodeNo(Req:any, PreOrder:any, ShopMode:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/searchByBarcodeNo', {Req:Req, PreOrder:PreOrder, ShopMode:ShopMode}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  searchByString(Req:any, PreOrder:any, ShopMode:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/searchByString', {Req:Req, PreOrder:PreOrder, ShopMode:ShopMode}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  saveBill(Body:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/saveBill', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }

  updateBill(Body:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/updateBill', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }
  getList(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/list', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }

  searchByFeild(searchQuery: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/searchByFeild', searchQuery, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getBillById(ID:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getBillById', {ID: ID}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  paymentHistory(ID: any,InvoiceNo:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/paymentHistory', {ID: ID, InvoiceNo: InvoiceNo}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  billHistoryByCustomer(CustomerID: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/billHistoryByCustomer', {CustomerID: CustomerID}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  deleteData(ID:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/deleteBill', {ID: ID}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  saleServiceReport(Parem:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/saleServiceReport',{Parem:Parem}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getSalereports(Parem:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getSalereports',{Parem:Parem}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getSalereportsDetail(Parem:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getSalereportsDetail',{Parem:Parem}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  updatePower(ID:any,MeasurementID:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/updatePower',{ID:ID,MeasurementID:MeasurementID}, httpOptions)
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
