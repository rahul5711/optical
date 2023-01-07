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
export class PurchaseService {

  constructor(private httpClient: HttpClient) { }
  private url = 'http://localhost:3000/purchase';

 savePurchase( Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/create', Body, httpOptions )
    .pipe(catchError(this.handleError));
  }

 updatePurchase( Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/update', Body, httpOptions )
    .pipe(catchError(this.handleError));
  }

  getList(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/list', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getPurchaseById(ID:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getPurchaseById', {ID: ID}, httpOptions )
    .pipe(catchError(this.handleError));
  }

  deleteProduct(ID:any,PurchaseMaster:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/deleteProduct', {ID: ID, PurchaseMaster: PurchaseMaster},  httpOptions)
    .pipe(catchError(this.handleError));
  }

  deleteCharge(ID:any,PurchaseMaster:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/deleteCharge', {ID: ID, PurchaseMaster: PurchaseMaster}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  deleteData(ID:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/delete', {ID: ID}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  searchByFeild(searchQuery: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/searchByFeild', searchQuery,httpOptions)
    .pipe(catchError(this.handleError));
  }

  paymentHistory(ID:any,InvoiceNo:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/paymentHistory', {ID: ID, InvoiceNo: InvoiceNo}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  barCodeListBySearchString( ShopMode:any, ProductName:any, searchString:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/barCodeListBySearchString', {ShopMode:ShopMode, ProductName:ProductName, searchString:searchString}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  productDataByBarCodeNo(Req:any, PreOrder:any, ShopMode:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/productDataByBarCodeNo', {Req:Req, PreOrder:PreOrder, ShopMode:ShopMode}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  transferProduct(Body:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/transferProduct', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getTransferList(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getTransferList',Body , httpOptions)
    .pipe(catchError(this.handleError));
  }

  cancelTransfer(Body:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/cancelTransfer', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }

  acceptTransfer(Body:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/acceptTransfer', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }

  barcodeDataByBarcodeNo(Barcode:any, mode:any, ShopMode:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/barcodeDataByBarcodeNo', {Barcode:Barcode, mode:mode, ShopMode:ShopMode}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  updateBarcode(Body:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/updateBarcode', Body, httpOptions)
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
