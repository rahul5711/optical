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
  searchByFeildPreOrder(searchQuery: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/searchByFeildPreOrder', searchQuery,httpOptions)
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

  barCodeListBySearchStringSearch( ShopMode:any, ProductName:any, searchString:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/barCodeListBySearchStringSearch', {ShopMode:ShopMode, ProductName:ProductName, searchString:searchString}, httpOptions)
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

  getproductTransferReport(Parem:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getproductTransferReport', {Parem:Parem}, httpOptions)
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

  getInventorySummary(Parem:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getInventorySummary',{Parem:Parem}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  updateInventorySummary(Body:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/updateInventorySummary',Body, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getPurchasereports(Parem:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getPurchasereports',{Parem:Parem}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getPurchasereportsDetail(Parem:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getPurchasereportsDetail',{Parem:Parem}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getProductExpiryReport(Parem:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getProductExpiryReport',{Parem:Parem}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  createPreOrder( Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/createPreOrder', Body, httpOptions )
    .pipe(catchError(this.handleError));
  }

  getPurchaseByIdPreOrder(ID:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getPurchaseByIdPreOrder', {ID: ID}, httpOptions )
    .pipe(catchError(this.handleError));
  }

  listPreOrder(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/listPreOrder', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }

  deleteProductPreOrder(ID:any,PurchaseMaster:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/deleteProductPreOrder', {ID: ID, PurchaseMaster: PurchaseMaster},  httpOptions)
    .pipe(catchError(this.handleError));
  }

  deletePreOrder(ID:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/deletePreOrder', {ID: ID}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  updatePreOrder( Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/updatePreOrder', Body, httpOptions )
    .pipe(catchError(this.handleError));
  }

 
  getProductInventoryReport(Parem:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getProductInventoryReport',{Parem:Parem}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getPurchaseChargeReport(Parem:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getPurchaseChargeReport',{Parem:Parem}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  barCodeListBySearchStringPR( ShopMode:any, ProductName:any, searchString:any, SupplierID:any, ShopID:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/barCodeListBySearchStringPR', {ShopMode:ShopMode, ProductName:ProductName, searchString:searchString, SupplierID:SupplierID, ShopID:ShopID}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  productDataByBarCodeNoPR(Req:any, PreOrder:any, ShopMode:any , SupplierID:any, ShopID:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/productDataByBarCodeNoPR', {Req:Req, PreOrder:PreOrder, ShopMode:ShopMode, SupplierID:SupplierID, ShopID:ShopID}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  savePurchaseReturn(Body:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/savePurchaseReturn', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getPurchaseReturnById(ID:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getPurchaseReturnById', {ID: ID}, httpOptions )
    .pipe(catchError(this.handleError));
  }

  getPurchaseReturnList(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/purchasereturnlist', Body, httpOptions)
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
