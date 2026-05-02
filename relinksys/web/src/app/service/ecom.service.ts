import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class EcomService {

  constructor(private httpClient: HttpClient) { }
  private url = environment.apiUrl + '/ecom';


  save(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/save', Body, httpOptions)
      .pipe(catchError(this.handleError));
  }

  getDataByID(ID: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getDataByID', { ID: ID }, httpOptions)
      .pipe(catchError(this.handleError));
  }

  getList(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getList', Body, httpOptions)
      .pipe(catchError(this.handleError));
  }

  saveOrUpdateShipmentRate(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/saveOrUpdateShipmentRate', Body, httpOptions)
      .pipe(catchError(this.handleError));
  }

  shipmentRate(): Observable<any> {
    return this.httpClient.get<any>(this.url + '/shipmentRate', httpOptions)
      .pipe(catchError(this.handleError));
  }

  getOrderList(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getOrderList', Body, httpOptions)
      .pipe(catchError(this.handleError));
  }

  getOrderDetailByID(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getOrderDetailByID', Body, httpOptions)
      .pipe(catchError(this.handleError));
  }

  orderProcess(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/orderProcess', Body, httpOptions)
      .pipe(catchError(this.handleError));
  }

  searchByString(Req: any, PreOrder: any, ShopMode: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/searchByString', { Req: Req, PreOrder: PreOrder, ShopMode: ShopMode }, httpOptions)
      .pipe(catchError(this.handleError));
  }

  searchByBarcodeNo(Req: any, PreOrder: any, ShopMode: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/searchByBarcodeNo', { Req: Req, PreOrder: PreOrder, ShopMode: ShopMode }, httpOptions)
      .pipe(catchError(this.handleError));
  }


  saleServiceReport(Parem: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/saleServiceReport', { Parem: Parem }, httpOptions)
      .pipe(catchError(this.handleError));
  }

  getSalereport(Parem: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getSalereport', { Parem: Parem }, httpOptions)
      .pipe(catchError(this.handleError));
  }


  getSalereportExport(data: any) {
    return this.httpClient.post(`${this.url}/getSalereportExport`, { Parem: data }, {
      observe: 'response',
      responseType: 'arraybuffer'
    });
  }

  getSalereportsDetail(Parem: any, Productsearch: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getSalereportsDetail', { Parem: Parem, Productsearch: Productsearch }, httpOptions)
      .pipe(catchError(this.handleError));
  }

  getSalereportsDetailExport(Parem: any, Productsearch: any) {
    return this.httpClient.post(`${this.url}/getSalereportsDetailExport`, { Parem: Parem, Productsearch: Productsearch }, {
      observe: 'response',
      responseType: 'arraybuffer'
    });
  }

  orderReport(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/orderReport', Body, httpOptions)
      .pipe(catchError(this.handleError));
  }

  orderDetailReport(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/orderDetailReport', Body, httpOptions)
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
