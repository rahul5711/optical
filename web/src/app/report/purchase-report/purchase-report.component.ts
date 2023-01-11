import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { ProductService } from 'src/app/service/product.service';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { NgxSpinnerService } from 'ngx-spinner';
import { PurchaseService } from 'src/app/service/purchase.service';
import { ShopService } from 'src/app/service/shop.service';
import { SupplierService } from 'src/app/service/supplier.service';
import { ExcelService } from 'src/app/service/helpers/excel.service';
import * as moment from 'moment';
import * as XLSX from 'xlsx';



@Component({
  selector: 'app-purchase-report',
  templateUrl: './purchase-report.component.html',
  styleUrls: ['./purchase-report.component.css']
})
export class PurchaseReportComponent implements OnInit {


  supplierList :any;
  shopList :any;
  PurchaseMasterList:any
  totalQty: any;
  totalDiscount: any;
  totalUnitPrice: any;
  totalAmount: any;
  totalGstAmount: any;

  PurchaseDetailList:any
  selectedProduct: any;
  prodList:any;
  specList: any;
 

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private purchaseService: PurchaseService,
    private ss: ShopService,
    private sup: SupplierService,
    private excelService: ExcelService,
    private ps: ProductService,
    public as: AlertService,
  ) { }

  PurchaseMaster: any =  { 
    FromDate: moment().startOf('month').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, SupplierID: 0,  
    SupplierGSTNo:'All', PaymentStatus: 0,
  };

  PurchaseDetail: any =  {
    FromDate: moment().startOf('month').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, SupplierID: 0,  
    SupplierGSTNo:'All', PaymentStatus: 0,  ProductCategory : 0, ProductName:'',
  };

  ngOnInit(): void {
    this.dropdownShoplist();
    this.dropdownSupplierlist();
    this.getProductList();
  }

  dropdownShoplist(){
    const subs: Subscription = this.ss.dropShoplist().subscribe({
      next: (res: any) => {
        this.shopList  = res.data
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  dropdownSupplierlist(){
    const subs: Subscription = this.sup.dropdownSupplierlist().subscribe({
      next: (res: any) => {
        this.supplierList  = res.data
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getPurchaseMaster(){
    let Parem = '';

    if (this.PurchaseMaster.FromDate !== '' && this.PurchaseMaster.FromDate !== null){
      let FromDate =  moment(this.PurchaseMaster.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and purchasemasternew.PurchaseDate between ' +  `'${FromDate}'`; }

    if (this.PurchaseMaster.ToDate !== '' && this.PurchaseMaster.ToDate !== null){
      let ToDate =  moment(this.PurchaseMaster.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' +  `'${ToDate}'`; }
      
    if (this.PurchaseMaster.ShopID !== 0){
      Parem = Parem + ' and purchasemasternew.ShopID = ' +  this.PurchaseMaster.ShopID; }

    if (this.PurchaseMaster.SupplierID !== 0){
      Parem = Parem + ' and purchasemasternew.SupplierID = ' +  this.PurchaseMaster.SupplierID ; }

    if (this.PurchaseMaster.PaymentStatus !== 0 && this.PurchaseMaster.PaymentStatus !== null &&  this.PurchaseMaster.PaymentStatus !== 'All'){
      Parem = Parem + ' and purchasemasternew.PaymentStatus = '  + `'${this.PurchaseMaster.PaymentStatus}'`; }

    const subs: Subscription =  this.purchaseService.getPurchasereports(Parem).subscribe({
      next: (res: any) => {
        if(res.message){
          this.as.successToast(res.message)
          this.PurchaseMasterList = res.data;
          this.totalQty = res.calculation[0].totalQty;
          this.totalDiscount = res.calculation[0].totalDiscount.toFixed(2);
          this.totalUnitPrice = res.calculation[0].totalUnitPrice.toFixed(2);
          this.totalGstAmount = res.calculation[0].totalGstAmount.toFixed(2);
          this.totalAmount = res.calculation[0].totalAmount.toFixed(2);
        }
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  purchaseFromReset(){
    this.PurchaseMaster =  { 
        FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, SupplierID: 0,  
        SupplierGSTNo:'All', PaymentStatus: 0,
    };
    this.PurchaseMasterList = [];
  }

  exportAsXLSXMaster(): void {

    this.excelService.exportAsExcelFile(this.PurchaseMasterList, 'purchase_List');
  }

  // purchase details code start
  getProductList(){
    const subs: Subscription =  this.ps.getList().subscribe({
      next: (res: any) => {
        this.prodList = res.data;
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getFieldList(){
    if(this.PurchaseDetail.ProductCategory !== 0){
      this.prodList.forEach((element: any) => {
        if (element.ID === this.PurchaseDetail.ProductCategory) {
          this.selectedProduct = element.Name;
        }
      })
    }
    const subs: Subscription =  this.ps.getFieldList(this.selectedProduct).subscribe({
       next: (res: any) => {
       this.specList = res.data;
       this.getSptTableData();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
   
  }

  getSptTableData() { 
    this.specList.forEach((element: any) => {
     if (element.FieldType === 'DropDown' && element.Ref === '0') {
       const subs: Subscription =  this.ps.getProductSupportData('0', element.SptTableName).subscribe({
         next: (res: any) => {
           element.SptTableData = res.data;   
           element.SptFilterData = res.data;  
         },
         error: (err: any) => console.log(err.message),
         complete: () => subs.unsubscribe(),
       });
     }
    });
  }

  getFieldSupportData(index:any) {
    this.specList.forEach((element: any) => {
     if (element.Ref === this.specList[index].FieldName.toString() ) {
       const subs: Subscription =  this.ps.getProductSupportData( this.specList[index].SelectedValue,element.SptTableName).subscribe({
         next: (res: any) => {
           element.SptTableData = res.data; 
           element.SptFilterData = res.data;   
         },
         error: (err: any) => console.log(err.message),
         complete: () => subs.unsubscribe(),
       });
      }
     });
  }


  filter() {
    let productName = '';
    this.specList.forEach((element: any) => {
     if (productName === '') {
        productName = element.SelectedValue;
     } else if (element.SelectedValue !== '') {
        productName += '/' + element.SelectedValue;
     }
    });
    this.PurchaseDetail.ProductName = productName;
  }

  getPurchaseDetails(){
    let Parem = '';

    if (this.PurchaseDetail.FromDate !== '' && this.PurchaseDetail.FromDate !== null){
      let FromDate =  moment(this.PurchaseDetail.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and purchasemasternew.PurchaseDate between ' +  `'${FromDate}'`; }

    if (this.PurchaseDetail.ToDate !== '' && this.PurchaseDetail.ToDate !== null){
      let ToDate =  moment(this.PurchaseDetail.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' +  `'${ToDate}'`; }

    if (this.PurchaseDetail.ProductCategory  !== 0){
      Parem = Parem + ' and purchasedetailnew.ProductTypeID = ' +  this.PurchaseDetail.ProductCategory ;
      this.filter();}

    if (this.PurchaseDetail.ProductName !== '' ) {
      Parem = Parem + ' and purchasedetailnew.ProductName Like ' + "'" + this.PurchaseDetail.ProductName + "%'";}

    if (this.PurchaseDetail.ShopID !== 0){
      Parem = Parem + ' and purchasemasternew.ShopID = ' +  this.PurchaseDetail.ShopID; }

    if (this.PurchaseDetail.SupplierID !== 0){
      Parem = Parem + ' and purchasemasternew.SupplierID = ' +  this.PurchaseDetail.SupplierID ; }

    const subs: Subscription =  this.purchaseService.getPurchasereportsDetail(Parem).subscribe({
      next: (res: any) => {
        if(res.message){
          this.as.successToast(res.message)
          this.PurchaseDetailList = res.data
        }
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }



}
