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
  cancelProduct(Body:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/cancelProduct', Body, httpOptions)
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
  searchByRegNo(RegNo: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/searchByRegNo', RegNo, httpOptions)
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

  billHistoryByCustomerOld(CustomerID: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/billHistoryByCustomerOld', {CustomerID: CustomerID}, httpOptions)
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
  getSalereport(Parem:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getSalereport',{Parem:Parem}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getSalereportsDetail(Parem:any,Productsearch:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getSalereportsDetail',{Parem:Parem,Productsearch:Productsearch}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getSalereportsDetailExport(Parem:any,Productsearch:any) {
    return this.httpClient.post(`${this.url}/getSalereportsDetailExport`, {Parem:Parem,Productsearch:Productsearch}, {
      observe: 'response',
      responseType: 'arraybuffer'
    });
  }

  getCancelProductReport(Parem:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getCancelProductReport',{Parem:Parem}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  updatePower(ID:any,MeasurementID:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/updatePower',{ID:ID,MeasurementID:MeasurementID}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  billByCustomer(CustomerID:any,BillMasterID:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/billByCustomer',{CustomerID:CustomerID,BillMasterID:BillMasterID}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  billByCustomerInvoice(CustomerID:any,BillMasterID:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/billByCustomer',{CustomerID:CustomerID, BillMasterID:BillMasterID}, httpOptions)
    .pipe(catchError(this.handleError));
  }
  
  getRewardBalance(RewardCustomerRefID:any,InvoiceNo:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getRewardBalance',{RewardCustomerRefID:RewardCustomerRefID, InvoiceNo:InvoiceNo}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  sendOtpForAppliedReward(Body:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/sendOtpForAppliedReward',Body, httpOptions)
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

  AssignFitterPDF(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/AssignFitterPDF', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }

  updateProduct(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/updateProduct', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }

  changeEmployee(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/changeEmployee', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }

  changeProductStatus(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/changeProductStatus', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }

  billPrint(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/billPrint', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }

  orderFormPrint(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/orderFormPrint', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }

  creditNotePrint(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/creditNotePrint', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }

  cashcollectionreport(Body:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/cashcollectionreport',Body, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getOldSaleDetailreport(Parem:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getOldSaleDetailreport',{Parem:Parem}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getOldSalereport(Parem:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getOldSalereport',{Parem:Parem}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getLoyalityReport( UserType:any,UserID:any,FromDate:any,ToDate:any,ShopID:any,PaymentStatus:any,): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getLoyalityReport',{UserType:UserType,UserID:UserID,FromDate:FromDate,ToDate:ToDate,ShopID:ShopID,PaymentStatus:PaymentStatus}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getLoyalityDetailReport( UserType:any,UserID:any,FromDate:any,ToDate:any,ShopID:any,PaymentStatus:any,): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getLoyalityDetailReport',{UserType:UserType,UserID:UserID,FromDate:FromDate,ToDate:ToDate,ShopID:ShopID,PaymentStatus:PaymentStatus}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getGstReport(Parem:any,Productsearch:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getGstReport',{Parem:Parem,Productsearch:Productsearch}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  submitGstFile(GstData:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/submitGstFile',{GstData:GstData}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getRewardReport(Parem:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getRewardReport',{Parem:Parem}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  generateInvoiceNo(Parem:any,Productsearch:any,ShopID:any,FromDate:any,ToDate:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/generateInvoiceNo',{Parem:Parem,Productsearch:Productsearch,ShopID:ShopID,FromDate:FromDate,ToDate:ToDate}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  generateInvoiceNoExcel(Parem:any,Productsearch:any,ShopID:any,FromDate:any,ToDate:any) {
    return this.httpClient.post(`${this.url}/generateInvoiceNoExcel`, {Parem:Parem,Productsearch:Productsearch,ShopID:ShopID,FromDate:FromDate,ToDate:ToDate}, {
      observe: 'response',
      responseType: 'arraybuffer'
    });
  }

  getBillMasterExport(data: any) {
    return this.httpClient.post(`${this.url}/getSalereportExport`, {Parem : data}, {
      observe: 'response',
      responseType: 'arraybuffer'
    });
  }

  getDiscountSetting(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getDiscountSetting', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }

  saveDiscountSetting(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/saveDiscountSetting', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }
  
  updateDiscountSetting(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/updateDiscountSetting', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getDiscountList(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getDiscountList', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }

  searchByFeildDiscountSettig(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/searchByFeildDiscountSettig', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }

  deleteDiscountSetting(ID: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/deleteDiscountSetting', {ID:ID}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  barCodeListBySearchStringSR(searchString: any,ShopMode: any, ProductName: any, ShopID: any, CustomerID: any ): Observable<any> {
    return this.httpClient.post<any>(this.url + '/barCodeListBySearchStringSR', {searchString:searchString,ShopMode:ShopMode,ProductName:ProductName,ShopID:ShopID,CustomerID:CustomerID}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  productDataByBarCodeNoSR(Req: any,  ShopMode: any, ShopID: any,CustomerID: any, ): Observable<any> {
      return this.httpClient.post<any>(this.url + '/productDataByBarCodeNoSR', { Req: Req, ShopMode: ShopMode,  ShopID: ShopID,CustomerID: CustomerID }, httpOptions)
        .pipe(catchError(this.handleError));
    }

  orderformrequest(Body:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/orderformrequest', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }
  
  orderformsubmit(Body:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/orderformsubmit', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }

  orderformAccept(ID:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/orderformAccept', {ID:ID}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  orderformrequestreport(Parem:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/orderformrequestreport',{Parem:Parem}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  ordersearchByString(Req:any, PreOrder:any, ShopMode:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/ordersearchByString', {Req:Req, PreOrder:PreOrder, ShopMode:ShopMode}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getDashBoardReportBI(Body:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getDashBoardReportBI', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }

  saveSaleReturn(Body:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/saveSaleReturn', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }

  
  updateSaleReturn(Body:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/updateSaleReturn', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getSaleReturnById(ID:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getSaleReturnById', {ID:ID}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  salereturnlist(Body:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/salereturnlist', Body, httpOptions)
    .pipe(catchError(this.handleError));
  }

  deleteSR(ID: any): Observable<any> {
      return this.httpClient.post<any>(this.url + '/deleteSR', { ID: ID }, httpOptions)
      .pipe(catchError(this.handleError));
  }

  deleteProductSR(ID: any, SaleMaster: any): Observable<any> {
      return this.httpClient.post<any>(this.url + '/deleteProductSR', { ID: ID, SaleMaster: SaleMaster }, httpOptions)
      .pipe(catchError(this.handleError));
  }

  searchByFeildSR(searchQuery: any): Observable<any> {
      return this.httpClient.post<any>(this.url + '/searchByFeildSR', searchQuery, httpOptions)
      .pipe(catchError(this.handleError));
  }

  customerCnSR(BillDate: any, CustomerCn: any, ID: any): Observable<any> {
      return this.httpClient.post<any>(this.url + '/customerCnSR', { BillDate :BillDate, CustomerCn: CustomerCn, ID: ID }, httpOptions)
      .pipe(catchError(this.handleError));
  }


  getSaleReturnReport(Parem:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getSaleReturnReport',{Parem:Parem}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getSaleReturnDetailReport(Parem:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getSaleReturnDetailReport',{Parem:Parem}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getDashBoardReportOne(filterType:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getDashBoardReportOne',{filterType:filterType}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getDashBoardReportTwo(filterType:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getDashBoardReportTwo',{filterType:filterType}, httpOptions)
    .pipe(catchError(this.handleError));
  }

  getDashBoardReportThree(filterType:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getDashBoardReportThree',{filterType:filterType}, httpOptions)
    .pipe(catchError(this.handleError));
  }
  getRecycleBinData(Body:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getRecycleBinData',Body, httpOptions)
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
