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
export class BillService {

  loggedInUser:any = localStorage.getItem('LoggedINUser');
  private url = environment.apiUrl + '/bill';
  constructor(private httpClient: HttpClient) { }
  

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
  saveConvertPurchase(Body:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/saveConvertPurchase', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }

  updateBill(Body:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/updateBillCustomer', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }
  deleteProduct(Body:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/deleteProduct', Body, httpOptions)
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

  billByCustomer(CustomerID:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/billByCustomer',{CustomerID:CustomerID}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  billByCustomerInvoice(CustomerID:any,BillMasterID:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/billByCustomer',{CustomerID:CustomerID, BillMasterID:BillMasterID}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  paymentHistoryByMasterID(CustomerID:any,BillMasterID:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/paymentHistoryByMasterID',{CustomerID:CustomerID,BillMasterID:BillMasterID}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getSupplierPo(ID:any,Parem:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getSupplierPo',{ID:ID, Parem:Parem}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  assignSupplierPo(Body:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/assignSupplierPo',{Body:Body}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getSupplierPoList(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getSupplierPoList', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getSupplierPoPurchaseList(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getSupplierPoPurchaseList', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }

  assignSupplierDoc(Body:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/assignSupplierDoc',{Body:Body}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getFitterPo(ID:any,Parem:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getFitterPo',{ID:ID, Parem:Parem}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  assignFitterPo(Body:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/assignFitterPo',{Body:Body}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getFitterPoList(ID:any,Parem:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getFitterPoList', {ID:ID, Parem:Parem}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  assignFitterDoc(Body:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/assignFitterDoc',{Body:Body}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getFitterPoPurchaseList(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getFitterPoPurchaseList', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }

  AssignSupplierPDF(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/AssignSupplierPDF', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }

  updateProduct(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/updateProduct', Body, httpOptions)
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
