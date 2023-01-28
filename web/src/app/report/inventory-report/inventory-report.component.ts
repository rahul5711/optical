import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { ProductService } from 'src/app/service/product.service';
import { Subscription } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import { PurchaseService } from 'src/app/service/purchase.service';
import { ShopService } from 'src/app/service/shop.service';
import { SupplierService } from 'src/app/service/supplier.service';
import * as moment from 'moment';
import * as XLSX from 'xlsx';
import { SupportService } from 'src/app/service/support.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-inventory-report',
  templateUrl: './inventory-report.component.html',
  styleUrls: ['./inventory-report.component.css']
})

export class InventoryReportComponent implements OnInit {
 
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private purchaseService: PurchaseService,
    private ss: ShopService,
    private sup: SupplierService,
    private supps: SupportService,
    private ps: ProductService,
    public as: AlertService,
    private modalService: NgbModal,
  ) { }

  supplierList :any;
  shopList :any;
  inventoryList: any;
  selectedProduct: any;
  prodList:any;
  specList: any;
  gstList: any;
  DetailtotalQty: any;
  DetailtotalDiscount: any;
  DetailtotalUnitPrice: any;
  DetailtotalAmount: any;
  DetailtotalGstAmount: any;
  gstdetails:any

  inventory: any =  {
    FromDate: moment().startOf('month').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, SupplierID: 0, Barcode:'', CurrentStatus:'Available', PaymentStatus: 0,  ProductCategory : 0, ProductName:'', GSTType: 0, GSTPercentage: 0
  };

  ngOnInit(): void {
    this.dropdownShoplist();
    this.dropdownSupplierlist();
    this.getProductList();
    this.getGSTList();
  }

  dropdownShoplist(){
    const subs: Subscription = this.ss.dropdownShoplist('').subscribe({
      next: (res: any) => {
        this.shopList  = res.data
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  dropdownSupplierlist(){
    const subs: Subscription = this.sup.dropdownSupplierlist('').subscribe({
      next: (res: any) => {
        this.supplierList  = res.data
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

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
    if(this.inventory.ProductCategory !== 0){
      this.prodList.forEach((element: any) => {
        if (element.ID === this.inventory.ProductCategory) {
          this.selectedProduct = element.Name;
        }
      })
      const subs: Subscription =  this.ps.getFieldList(this.selectedProduct).subscribe({
        next: (res: any) => {
        this.specList = res.data;
        this.getSptTableData();
       },
       error: (err: any) => console.log(err.message),
       complete: () => subs.unsubscribe(),
     });
    }
    else {
      this.specList = [];
      this.inventory.ProductName = '';
      this.inventory.ProductCategory = 0;
    }
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

  getGSTList(){
    const subs: Subscription = this.supps.getList('TaxType').subscribe({
      next: (res: any) => {
        this.gstList = res.data
      },
    error: (err: any) => console.log(err.message),
    complete: () => subs.unsubscribe(),
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
    this.inventory.ProductName = productName;
  }

  getInventory(){
    let Parem = '';

    if (this.inventory.FromDate !== '' && this.inventory.FromDate !== null){
      let FromDate =  moment(this.inventory.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and purchasemasternew.PurchaseDate between ' +  `'${FromDate}'`; }

    if (this.inventory.ToDate !== '' && this.inventory.ToDate !== null){
      let ToDate =  moment(this.inventory.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' +  `'${ToDate}'`; }

    if (this.inventory.SupplierID !== 0){
      Parem = Parem + ' and purchasemasternew.SupplierID = ' +  this.inventory.SupplierID; }
    
    if (this.inventory.ShopID != 0){
      Parem = Parem + ' and barcodemasternew.ShopID IN ' +  `(${this.inventory.ShopID})`;}

    if (this.inventory.Barcode !== '') {
      Parem = Parem + ' and barcodemasternew.Barcode Like ' + '"' + this.inventory.Barcode + '%"';}

    if (this.inventory.CurrentStatus !== 0) {
      Parem = Parem + ' and barcodemasternew.CurrentStatus = ' + '"' + this.inventory.CurrentStatus + '"';}

    if (this.inventory.GSTPercentage !== 0){
      Parem = Parem + ' and purchasedetailnew.GSTPercentage = '  + `'${this.inventory.GSTPercentage}'`; }
  
    if (this.inventory.GSTType !== 0){
      Parem = Parem + ' and purchasedetailnew.GSTType = '  + `'${this.inventory.GSTType}'`; }

    if (this.inventory.ProductCategory  !== 0){
      Parem = Parem + ' and purchasedetailnew.ProductTypeID = ' +  this.inventory.ProductCategory;
      this.filter();}

    if (this.inventory.ProductName !== '' ) {
      Parem = Parem + ' and purchasedetailnew.ProductName Like ' + "'" + this.inventory.ProductName + "%'"; }

    const subs: Subscription =  this.purchaseService.getProductInventoryReport(Parem).subscribe({
      next: (res: any) => {
        if(res.message){
          this.as.successToast(res.message)
          this.inventoryList = res.data
          this.DetailtotalQty = res.calculation[0].totalQty;
          this.DetailtotalDiscount = res.calculation[0].totalDiscount.toFixed(2);
          this.DetailtotalUnitPrice = res.calculation[0].totalUnitPrice.toFixed(2);
          this.DetailtotalGstAmount = res.calculation[0].totalGstAmount.toFixed(2);
          this.DetailtotalAmount = res.calculation[0].totalAmount.toFixed(2);
          this.gstdetails = res.calculation[0].gst_details
        }
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  exportAsXLSXDetail(): void {
    let element = document.getElementById('inventoryExcel');
    const ws: XLSX.WorkSheet =XLSX.utils.table_to_sheet(element);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, 'inventory_Report.xlsx');
  }

  PDFdetail(){
  }

  inventorysFromReset(){
    this.inventory =  { 
      FromDate: moment().startOf('month').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, SupplierID: 0, Barcode:'', CurrentStatus:'Available', PaymentStatus: 0,  ProductCategory : 0, ProductName:'', GSTType: 0, GSTPercentage: 0
    };
    this.inventoryList = [];
    this.DetailtotalQty = ''
    this.DetailtotalDiscount = ''
    this.DetailtotalUnitPrice = ''
    this.DetailtotalGstAmount =''
    this.DetailtotalAmount = ''
  }

  openModal(content: any) {
    this.modalService.open(content, { centered: true , backdrop : 'static', keyboard: false,size: 'sm'});
  }

}
