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
  selectedShop:any =JSON.parse(localStorage.getItem('selectedShop') || '') ;

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
    private sp: NgxSpinnerService,
  ) { }

  supplierList :any;
  shopList :any;
  selectsShop :any;
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

  ProductExpiryList:any
  specList1:any
  ExpirytotalQty :any 
  ExpirytotalDiscount :any 
  ExpirytotalUnitPrice :any
  ExpirytotalGstAmount :any
  ExpirytotalAmount :any 
  gstExpirys :any 
  todaydate: any;


  inventory: any =  {
    FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, SupplierID: 0, Barcode:'', CurrentStatus:'Available', PaymentStatus: 0,  ProductCategory : 0, ProductName:'', GSTType: 0, GSTPercentage: 0
  };

  data: any =  {
    FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'),SupplierID:0, ShopID: 0, 
  };

  ProductExpiry: any =  {
    FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, SupplierID: 0,  
    PaymentStatus: 0,  ProductCategory : 0, ProductName:'', GSTType: 0, GSTPercentage: 0
  };

  ngOnInit(): void {
    this.dropdownShoplist();
    this.dropdownSupplierlist();
    this.getProductList();
    this.getGSTList();
    this.inventory.FromDate = moment().format('YYYY-MM-DD');
    this.inventory.ToDate = moment().format('YYYY-MM-DD');
    this.getInventory()

    this.ProductExpiry.FromDate = moment().format('YYYY-MM-DD');
    this.ProductExpiry.ToDate = moment().format('YYYY-MM-DD');
    this.purchaseProductExpiry();
  }

  dropdownShoplist(){
    this.sp.show()
    const subs: Subscription = this.ss.dropdownShoplist('').subscribe({
      next: (res: any) => {
        if(res.success){
          this.shopList  = res.data
          let shop = res.data
          this.selectsShop = shop.filter((s:any) => s.ID === Number(this.selectedShop[0]));
          this.selectsShop =  '/ ' + this.selectsShop[0].Name + ' (' + this.selectsShop[0].AreaName + ')'
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
    this.sp.hide()
  }

  dropdownSupplierlist(){
    this.sp.show()
    const subs: Subscription = this.sup.dropdownSupplierlist('').subscribe({
      next: (res: any) => {
        if(res.success){
          this.supplierList  = res.data
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
    this.sp.hide()
  }

  getProductList(){
    this.sp.show()
    const subs: Subscription =  this.ps.getList().subscribe({
      next: (res: any) => {
        if(res.success){
          this.prodList = res.data;
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
    this.sp.hide()
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
          if(res.success){
            this.specList = res.data;
            this.getSptTableData();
          }else{
            this.as.errorToast(res.message)
          }
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
          if(res.success){
            element.SptTableData = res.data;   
            element.SptFilterData = res.data;  
          }else{
            this.as.errorToast(res.message)
          }
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
          if(res.success){
            element.SptTableData = res.data; 
            element.SptFilterData = res.data;   
          }else{
            this.as.errorToast(res.message)
          }
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
        if(res.success){
          this.gstList = res.data
        }else{
          this.as.errorToast(res.message)
        }
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
    this.sp.show()
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
        if(res.success){
          this.as.successToast(res.message)
          this.inventoryList = res.data
          this.DetailtotalQty = res.calculation[0].totalQty;
          this.DetailtotalDiscount = res.calculation[0].totalDiscount.toFixed(2);
          this.DetailtotalUnitPrice = res.calculation[0].totalUnitPrice.toFixed(2);
          this.DetailtotalGstAmount = res.calculation[0].totalGstAmount.toFixed(2);
          this.DetailtotalAmount = res.calculation[0].totalAmount.toFixed(2);
          this.gstdetails = res.calculation[0].gst_details
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
    this.sp.hide()
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
      FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, SupplierID: 0, Barcode:'', CurrentStatus:'Available', PaymentStatus: 0,  ProductCategory : 0, ProductName:'', GSTType: 0, GSTPercentage: 0
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

    // purchase product expiry

    getFieldList1(){
      if(this.ProductExpiry.ProductCategory !== 0){
        this.prodList.forEach((element: any) => {
          if (element.ID === this.ProductExpiry.ProductCategory) {
            this.selectedProduct = element.Name;
          }
        })
        const subs: Subscription =  this.ps.getFieldList(this.selectedProduct).subscribe({
          next: (res: any) => {
            if(res.success){
              this.specList1 = res.data;
              this.getSptTableData1();
            }else{
              this.as.errorToast(res.message)
            }
         },
         error: (err: any) => console.log(err.message),
         complete: () => subs.unsubscribe(),
       });
      }
      else {
        this.specList1 = [];
        this.ProductExpiry.ProductName = '';
        this.ProductExpiry.ProductCategory = 0;
      }
    }
  
    getSptTableData1() { 
      this.specList1.forEach((element: any) => {
       if (element.FieldType === 'DropDown' && element.Ref === '0') {
         const subs: Subscription =  this.ps.getProductSupportData('0', element.SptTableName).subscribe({
           next: (res: any) => {
            if(res.success){
              element.SptTableData = res.data;   
              element.SptFilterData = res.data;  
            }else{
              this.as.errorToast(res.message)
            }
           },
           error: (err: any) => console.log(err.message),
           complete: () => subs.unsubscribe(),
         });
       }
      });
    }
  
    getFieldSupportData1(index:any) {
      this.specList1.forEach((element: any) => {
       if (element.Ref === this.specList1[index].FieldName.toString() ) {
         const subs: Subscription =  this.ps.getProductSupportData( this.specList1[index].SelectedValue,element.SptTableName).subscribe({
           next: (res: any) => {
            if(res.success){
              element.SptTableData = res.data; 
              element.SptFilterData = res.data; 
            }else{
              this.as.errorToast(res.message)
            }
           },
           error: (err: any) => console.log(err.message),
           complete: () => subs.unsubscribe(),
         });
        }
       });
    }
  
    filter1() {
      let productName = '';
      this.specList1.forEach((element: any) => {
       if (productName === '') {
          productName = element.SelectedValue;
       } else if (element.SelectedValue !== '') {
          productName += '/' + element.SelectedValue;
       }
      });
      this.ProductExpiry.ProductName = productName;
    }
  
    purchaseProductExpiry(){
      this.sp.show()
      this.todaydate = moment(new Date()).format('YYYY-MM-DD');
      let Parem = '';
  
      if (this.ProductExpiry.FromDate !== '' && this.ProductExpiry.FromDate !== null){
        let FromDate =  moment(this.ProductExpiry.FromDate).format('YYYY-MM-DD')
        Parem = Parem + ' and purchasedetailnew.ProductExpDate between ' +  `'${FromDate}'`; }
  
      if (this.ProductExpiry.ToDate !== '' && this.ProductExpiry.ToDate !== null){
        let ToDate =  moment(this.ProductExpiry.ToDate).format('YYYY-MM-DD')
        Parem = Parem + ' and ' +  `'${ToDate}'`; }
  
      if (this.ProductExpiry.ProductCategory  !== 0){
        Parem = Parem + ' and purchasedetailnew.ProductTypeID = ' +  this.ProductExpiry.ProductCategory;
        this.filter1();}
  
      if (this.ProductExpiry.ProductName !== '' ) {
        Parem = Parem + ' and purchasedetailnew.ProductName Like ' + "'" + this.ProductExpiry.ProductName + "%'"; }
  
      if (this.ProductExpiry.ShopID != 0){
        Parem = Parem + ' and purchasemasternew.ShopID IN ' +  `(${this.ProductExpiry.ShopID})`;}
  
      if (this.ProductExpiry.SupplierID !== 0){
        Parem = Parem + ' and purchasemasternew.SupplierID = ' +  this.ProductExpiry.SupplierID; }
  
      if (this.ProductExpiry.GSTPercentage !== 0){
        Parem = Parem + ' and purchasedetailnew.GSTPercentage = '  + `'${this.ProductExpiry.GSTPercentage}'`; }
  
      if (this.ProductExpiry.GSTType !== 0){
        Parem = Parem + ' and purchasedetailnew.GSTType = '  + `'${this.ProductExpiry.GSTType}'`; }
  
      const subs: Subscription =  this.purchaseService.getPurchasereportsDetail(Parem).subscribe({
        next: (res: any) => {
          if(res.success){
            this.ProductExpiryList = res.data
            this.ProductExpiryList.forEach((element: any) => {
              if(element.ProductExpDate < this.todaydate) {
                element.Color = true;
              } else {
                element.Color = false;
              }
            });
            this.ExpirytotalQty = res.calculation[0].totalQty;
            this.ExpirytotalDiscount = res.calculation[0].totalDiscount.toFixed(2);
            this.ExpirytotalUnitPrice = res.calculation[0].totalUnitPrice.toFixed(2);
            this.ExpirytotalGstAmount = res.calculation[0].totalGstAmount.toFixed(2);
            this.ExpirytotalAmount = res.calculation[0].totalAmount.toFixed(2);
            this.gstExpirys = res.calculation[0].gst_details
          }else{
            this.as.errorToast(res.message)
          }
          this.sp.hide()
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
      this.sp.hide()
    }
  
    openModal2(content2: any) {
      this.modalService.open(content2, { centered: true , backdrop : 'static', keyboard: false,size: 'sm'});
    }
    
    exportAsXLSXExpiry(): void {
      let element = document.getElementById('ProductExpiry');
      const ws: XLSX.WorkSheet =XLSX.utils.table_to_sheet(element);
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      XLSX.writeFile(wb, 'PurchaseProductExpiry_Report.xlsx');
    }
  
    productExpiryFromReset(){
      this.ProductExpiry =  {
        FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, SupplierID: 0,  
        PaymentStatus: 0,  ProductCategory : 0, ProductName:'', GSTType: 0, GSTPercentage: 0
      };
      this.ProductExpiryList= [];
      this.ExpirytotalQty = '';
      this.ExpirytotalDiscount = '';
      this.ExpirytotalUnitPrice = '';
      this.ExpirytotalGstAmount = '';
      this.ExpirytotalAmount = '';
      this.gstExpirys = '' ;
    }

}
