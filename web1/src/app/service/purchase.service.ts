import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { catchError } from 'rxjs/operators';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};
@Injectable({
  providedIn: 'root'
})
export class PurchaseService {

  constructor(private httpClient: HttpClient) { }
  private url = environment.apiUrl + '/purchase';

  savePurchase(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/create', Body, httpOptions)
      .pipe(catchError(this.handleError));
  }

  updatePurchase(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/update', Body, httpOptions)
      .pipe(catchError(this.handleError));
  }

  getList(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/list', Body, httpOptions)
      .pipe(catchError(this.handleError));
  }

  getPurchaseById(ID: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getPurchaseById', { ID: ID }, httpOptions)
      .pipe(catchError(this.handleError));
  }

  deleteProduct(ID: any, PurchaseMaster: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/deleteProduct', { ID: ID, PurchaseMaster: PurchaseMaster }, httpOptions)
      .pipe(catchError(this.handleError));
  }

  updateProduct(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/updateProduct', Body, httpOptions)
      .pipe(catchError(this.handleError));
  }

  deleteCharge(ID: any, PurchaseMaster: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/deleteCharge', { ID: ID, PurchaseMaster: PurchaseMaster }, httpOptions)
      .pipe(catchError(this.handleError));
  }

  deleteData(ID: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/delete', { ID: ID }, httpOptions)
      .pipe(catchError(this.handleError));
  }

  searchByFeild(searchQuery: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/searchByFeild', searchQuery, httpOptions)
      .pipe(catchError(this.handleError));
  }

  searchByFeildPreOrder(searchQuery: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/searchByFeildPreOrder', searchQuery, httpOptions)
      .pipe(catchError(this.handleError));
  }

  paymentHistory(ID: any, InvoiceNo: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/paymentHistory', { ID: ID, InvoiceNo: InvoiceNo }, httpOptions)
      .pipe(catchError(this.handleError));
  }

  barCodeListBySearchString(ShopMode: any, ProductName: any, searchString: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/barCodeListBySearchString', { ShopMode: ShopMode, ProductName: ProductName, searchString: searchString }, httpOptions)
      .pipe(catchError(this.handleError));
  }

  barCodeListBySearchStringSearch(ShopMode: any, ProductName: any, searchString: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/barCodeListBySearchStringSearch', { ShopMode: ShopMode, ProductName: ProductName, searchString: searchString }, httpOptions)
      .pipe(catchError(this.handleError));
  }

  productDataByBarCodeNo(Req: any, PreOrder: any, ShopMode: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/productDataByBarCodeNo', { Req: Req, PreOrder: PreOrder, ShopMode: ShopMode }, httpOptions)
      .pipe(catchError(this.handleError));
  }

  transferProduct(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/transferProduct', Body, httpOptions)
      .pipe(catchError(this.handleError));
  }

  getTransferList(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getTransferList', Body, httpOptions)
      .pipe(catchError(this.handleError));
  }

  cancelTransfer(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/cancelTransfer', Body, httpOptions)
      .pipe(catchError(this.handleError));
  }

  acceptTransfer(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/acceptTransfer', Body, httpOptions)
      .pipe(catchError(this.handleError));
  }

  getproductTransferReport(Parem: any, Productsearch: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getproductTransferReport', { Parem: Parem, Productsearch: Productsearch }, httpOptions)
      .pipe(catchError(this.handleError));
  }

  barcodeDataByBarcodeNo(Barcode: any, searchString: any, mode: any, ShopMode: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/barcodeDataByBarcodeNo', { Barcode: Barcode, searchString: searchString, mode: mode, ShopMode: ShopMode }, httpOptions)
      .pipe(catchError(this.handleError));
  }

  updateBarcode(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/updateBarcode', Body, httpOptions)
      .pipe(catchError(this.handleError));
  }

  getInventorySummary(Parem: any, Productsearch: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getInventorySummary', { Parem: Parem, Productsearch: Productsearch }, httpOptions)
      .pipe(catchError(this.handleError));
  }

  updateInventorySummary(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/updateInventorySummary', Body, httpOptions)
      .pipe(catchError(this.handleError));
  }

  getPurchasereports(Parem: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getPurchasereports', { Parem: Parem }, httpOptions)
      .pipe(catchError(this.handleError));
  }

  getPurchasereportsDetail(Parem: any, Productsearch: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getPurchasereportsDetail', { Parem: Parem, Productsearch: Productsearch }, httpOptions)
      .pipe(catchError(this.handleError));
  }

  getProductExpiryReport(Parem: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getProductExpiryReport', { Parem: Parem }, httpOptions)
      .pipe(catchError(this.handleError));
  }

  createPreOrder(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/createPreOrder', Body, httpOptions)
      .pipe(catchError(this.handleError));
  }

  getPurchaseByIdPreOrder(ID: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getPurchaseByIdPreOrder', { ID: ID }, httpOptions)
      .pipe(catchError(this.handleError));
  }

  listPreOrder(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/listPreOrder', Body, httpOptions)
      .pipe(catchError(this.handleError));
  }

  listPreOrderDummy(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/listPreOrderDummy', Body, httpOptions)
      .pipe(catchError(this.handleError));
  }

  deletePreOrderDummy(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/deletePreOrderDummy', Body, httpOptions)
      .pipe(catchError(this.handleError));
  }

  updatePreOrderDummy(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/updatePreOrderDummy', Body, httpOptions)
      .pipe(catchError(this.handleError));
  }

  deleteProductPreOrder(ID: any, PurchaseMaster: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/deleteProductPreOrder', { ID: ID, PurchaseMaster: PurchaseMaster }, httpOptions)
      .pipe(catchError(this.handleError));
  }

  deletePreOrder(ID: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/deletePreOrder', { ID: ID }, httpOptions)
      .pipe(catchError(this.handleError));
  }

  updatePreOrder(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/updatePreOrder', Body, httpOptions)
      .pipe(catchError(this.handleError));
  }


  getProductInventoryReport(Parem: any, Productsearch: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getProductInventoryReport', { Parem: Parem, Productsearch: Productsearch }, httpOptions)
      .pipe(catchError(this.handleError));
  }

  getPurchaseChargeReport(Parem: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getPurchaseChargeReport', { Parem: Parem }, httpOptions)
      .pipe(catchError(this.handleError));
  }

  barCodeListBySearchStringPR(ShopMode: any, ProductName: any, searchString: any, SupplierID: any, ShopID: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/barCodeListBySearchStringPR', { ShopMode: ShopMode, ProductName: ProductName, searchString: searchString, SupplierID: SupplierID, ShopID: ShopID }, httpOptions)
      .pipe(catchError(this.handleError));
  }

  productDataByBarCodeNoPR(Req: any, PreOrder: any, ShopMode: any, SupplierID: any, ShopID: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/productDataByBarCodeNoPR', { Req: Req, PreOrder: PreOrder, ShopMode: ShopMode, SupplierID: SupplierID, ShopID: ShopID }, httpOptions)
      .pipe(catchError(this.handleError));
  }

  savePurchaseReturn(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/savePurchaseReturn', Body, httpOptions)
      .pipe(catchError(this.handleError));
  }

  updatePurchaseReturn(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/updatePurchaseReturn', Body, httpOptions)
      .pipe(catchError(this.handleError));
  }

  getPurchaseReturnById(ID: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getPurchaseReturnById', { ID: ID }, httpOptions)
      .pipe(catchError(this.handleError));
  }

  deleteProductPR(ID: any, PurchaseMaster: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/deleteProductPR', { ID: ID, PurchaseMaster: PurchaseMaster }, httpOptions)
      .pipe(catchError(this.handleError));
  }

  getPurchaseReturnList(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/purchasereturnlist', Body, httpOptions)
      .pipe(catchError(this.handleError));
  }

  searchByFeildPR(searchQuery: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/searchByFeildPR', searchQuery, httpOptions)
      .pipe(catchError(this.handleError));
  }

  deletePR(ID: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/deletePR', { ID: ID }, httpOptions)
      .pipe(catchError(this.handleError));
  }

  supplierCnPR(PurchaseDate: any, SupplierCn: any, ID: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/supplierCnPR', { PurchaseDate: PurchaseDate, SupplierCn: SupplierCn, ID: ID }, httpOptions)
      .pipe(catchError(this.handleError));
  }

  getPurchasereturnreports(Parem: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getPurchasereturnreports', { Parem: Parem }, httpOptions)
      .pipe(catchError(this.handleError));
  }

  getPurchasereturndetailreports(Parem: any, Productsearch: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getPurchasereturndetailreports', { Parem: Parem, Productsearch: Productsearch }, httpOptions)
      .pipe(catchError(this.handleError));
  }

  transferProductPDF(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/transferProductPDF', Body, httpOptions)
      .pipe(catchError(this.handleError));
  }

  purchaseDetailPDF(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/purchaseDetailPDF', Body, httpOptions)
      .pipe(catchError(this.handleError));
  }

  purchaseRetrunPDF(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/purchaseRetrunPDF', Body, httpOptions)
      .pipe(catchError(this.handleError));
  }

  PrintBarcode(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/PrintBarcode', Body, httpOptions)
      .pipe(catchError(this.handleError));
  }

  AllPrintBarcode(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/AllPrintBarcode', Body, httpOptions)
      .pipe(catchError(this.handleError));
  }

  purchaseHistoryBySupplier(SupplierID: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/purchaseHistoryBySupplier', { SupplierID: SupplierID }, httpOptions)
      .pipe(catchError(this.handleError));
  }

  deleteAllPreOrderDummy(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/deleteAllPreOrderDummy', Body, httpOptions)
      .pipe(catchError(this.handleError));
  }

  getInvoicePayment(PaymentType: any, PayeeName: any, PurchaseID: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getInvoicePayment', { PaymentType: PaymentType, PayeeName: PayeeName, PurchaseID: PurchaseID }, httpOptions)
      .pipe(catchError(this.handleError));
  }

  paymentHistoryByPurchaseID(SupplierID: any, PurchaseID: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/paymentHistoryByPurchaseID', { SupplierID: SupplierID, PurchaseID: PurchaseID }, httpOptions)
      .pipe(catchError(this.handleError));
  }

  getCountInventoryReport(ShopID: any, DateParam: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getCountInventoryReport', { ShopID: ShopID, DateParam: DateParam }, httpOptions)
      .pipe(catchError(this.handleError));
  }

  getCountInventoryReportMonthWise(ShopID: any, FromDate: any, ToDate: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getCountInventoryReportMonthWise', { ShopID: ShopID, FromDate: FromDate, ToDate: ToDate }, httpOptions)
      .pipe(catchError(this.handleError));
  }

  getAmountInventoryReport(ShopID: any, DateParam: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getAmountInventoryReport', { ShopID: ShopID, DateParam: DateParam }, httpOptions)
      .pipe(catchError(this.handleError));
  }

  getAmountInventoryReportMonthWise(ShopID: any, FromDate: any, ToDate: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getAmountInventoryReportMonthWise', { ShopID: ShopID, FromDate: FromDate, ToDate: ToDate }, httpOptions)
      .pipe(catchError(this.handleError));
  }

  updateProductPrice(ProductData: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/updateProductPrice', { ProductData: ProductData }, httpOptions)
      .pipe(catchError(this.handleError));
  }

  getProductInventoryReportExport(Parem: any, Productsearch: any) {
    return this.httpClient.post(`${this.url}/getProductInventoryReportExport`, { Parem: Parem, Productsearch: Productsearch }, {
      observe: 'response',
      responseType: 'arraybuffer'
    });
  }

  getPurchaseMasterExport(Parem: any) {
    return this.httpClient.post(`${this.url}/getPurchasereportsExport`, { Parem: Parem }, {
      observe: 'response',
      responseType: 'arraybuffer'
    });
  }

  getPurchasereportsDetailExport(Parem: any, Productsearch: any) {
    return this.httpClient.post(`${this.url}/getPurchasereportsDetailExport`, { Parem: Parem, Productsearch: Productsearch }, {
      observe: 'response',
      responseType: 'arraybuffer'
    });
  }

  getVendorDuePayment(Parem: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getVendorDuePayment', { Parem: Parem }, httpOptions)
      .pipe(catchError(this.handleError));
  }

  bulkTransferProduct(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/bulkTransferProduct', Body, httpOptions)
      .pipe(catchError(this.handleError));
  }

  bulkTransferProductList(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/bulkTransferProductList', Body, httpOptions)
      .pipe(catchError(this.handleError));
  }

  bulkTransferProductByID(ID: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/bulkTransferProductByID', { ID: ID }, httpOptions)
      .pipe(catchError(this.handleError));
  }

  bulkTransferProductCancel(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/bulkTransferProductCancel', Body, httpOptions)
      .pipe(catchError(this.handleError));
  }

  bulkTransferProductAccept(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/bulkTransferProductAccept', Body, httpOptions)
      .pipe(catchError(this.handleError));
  }

  bulkTransferProductPDF(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/bulkTransferProductPDF', Body, httpOptions)
      .pipe(catchError(this.handleError));
  }

  bulkTransferProductUpdate(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/bulkTransferProductUpdate', Body, httpOptions)
      .pipe(catchError(this.handleError));
  }

  getPhysicalStockProductList(Parem: any,Productsearch:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getPhysicalStockProductList', {Parem:Parem,Productsearch:Productsearch}, httpOptions)
      .pipe(catchError(this.handleError));
  }
  
  savePhysicalStockProduct(Body:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/savePhysicalStockProduct', Body, httpOptions)
      .pipe(catchError(this.handleError));
  }
  
  updatePhysicalStockProduct(Body:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/updatePhysicalStockProduct', Body, httpOptions)
      .pipe(catchError(this.handleError));
  }

  getPhysicalStockProductByID(ID:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getPhysicalStockProductByID', { ID: ID }, httpOptions)
      .pipe(catchError(this.handleError));
  }

  getPhysicalStockCheckList(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getPhysicalStockCheckList', Body, httpOptions)
      .pipe(catchError(this.handleError));
  }

  searchByFeildPhysicalStockCheckList(searchQuery: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/searchByFeildPhysicalStockCheckList', searchQuery, httpOptions)
      .pipe(catchError(this.handleError));
  }
  getPhysicalStockCheckReport(Parem: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getPhysicalStockCheckReport', {Parem:Parem}, httpOptions)
      .pipe(catchError(this.handleError));
  }

  getLocationStockProductList(Parem: any,Productsearch:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getLocationStockProductList', {Parem:Parem,Productsearch:Productsearch}, httpOptions)
      .pipe(catchError(this.handleError));
  }

  saveProductLocation(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/saveProductLocation', Body, httpOptions)
      .pipe(catchError(this.handleError));
  }

  updateProductLocation(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/updateProductLocation', Body, httpOptions)
      .pipe(catchError(this.handleError));
  }
  
  deleteProductLocation(ID: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/deleteProductLocation', {ID:ID}, httpOptions)
      .pipe(catchError(this.handleError));
  }

  getProductLocationByBarcodeNumber(Body: any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getProductLocationByBarcodeNumber', Body, httpOptions)
      .pipe(catchError(this.handleError));
  }
  getPurchaseReportMonthYearWise(Parem  :any,Type:any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getPurchaseReportMonthYearWise',{Parem:Parem, Type:Type }, httpOptions)
      .pipe(catchError(this.handleError));
  }
  getPurchaseReportMonthYearWiseDetails(PurchaseMasterIds : any): Observable<any> {
    return this.httpClient.post<any>(this.url + '/getPurchaseReportMonthYearWiseDetails', {PurchaseMasterIds:PurchaseMasterIds }, httpOptions)
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
