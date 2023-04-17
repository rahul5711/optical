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

  private handleError(errorResponse: HttpErrorResponse) {
    if (errorResponse.error instanceof ErrorEvent) {
      console.error('Client Side Error: ', errorResponse.error.message);
    } else {
      console.error('Server Side Error: ', errorResponse);
    }
    return throwError(errorResponse);
  }

}
