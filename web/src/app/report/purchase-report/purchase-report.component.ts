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
import { jsPDF } from "jspdf";
import { SupportService } from 'src/app/service/support.service';
import html2canvas from 'html2canvas';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-purchase-report',
  templateUrl: './purchase-report.component.html',
  styleUrls: ['./purchase-report.component.css']
})
export class PurchaseReportComponent implements OnInit {
  selectedShop:any =JSON.parse(localStorage.getItem('selectedShop') || '') ;

  supplierList :any;
  shopList :any;
  selectsShop :any;
  PurchaseMasterList:any
  totalQty: any;
  totalDiscount: any;
  totalUnitPrice: any;
  totalAmount: any;
  totalGstAmount: any;
  gstMaster: any;

  PurchaseDetailList:any
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

  v :any = []
  PurchaseChargeList :any;
  ChargeAmount:any
  ChargetotalAmount: any;
  ChargetotalGstAmount: any;
  gstCharge:any


  ProductExpiryList:any
  specList1:any
  ExpirytotalQty :any 
  ExpirytotalDiscount :any 
  ExpirytotalUnitPrice :any
  ExpirytotalGstAmount :any
  ExpirytotalAmount :any 
  gstExpirys :any 
  todaydate: any;

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

  PurchaseMaster: any =  { 
    FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, SupplierID: 0,  
    SupplierGSTNo:'All', PaymentStatus: 0,
  };

  PurchaseDetail: any =  {
    FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, SupplierID: 0,  
    PaymentStatus: 0,  ProductCategory : 0, ProductName:'', GSTType: 0, GSTPercentage: 0
  };

  charge: any =  { 
    FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0
  };

  ProductExpiry: any =  {
    FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, SupplierID: 0,  
    PaymentStatus: 0,  ProductCategory : 0, ProductName:'', GSTType: 0, GSTPercentage: 0
  };


  ngOnInit(): void {
    this.sp.show()
    this.dropdownShoplist();
    this.dropdownSupplierlist();
    this.getProductList();
    this.getGSTList();
    // PurchaseMaster Today Data
    this.PurchaseMaster.FromDate = moment().format('YYYY-MM-DD');
    this.PurchaseMaster.ToDate = moment().format('YYYY-MM-DD');
    this.getPurchaseMaster();
    // PurchaseMaster Today Data
    this.PurchaseDetail.FromDate = moment().format('YYYY-MM-DD');
    this.PurchaseDetail.ToDate = moment().format('YYYY-MM-DD');
    this.getPurchaseDetails();
    // PurchaseMaster Today Data
    this.charge.FromDate = moment().format('YYYY-MM-DD');
    this.charge.ToDate = moment().format('YYYY-MM-DD');
    this.purchaseCharge();
    // PurchaseMaster Today Data
    this.ProductExpiry.FromDate = moment().format('YYYY-MM-DD');
    this.ProductExpiry.ToDate = moment().format('YYYY-MM-DD');
    this.purchaseProductExpiry();
    this.sp.hide()
  }

  dropdownShoplist(){
    const subs: Subscription = this.ss.dropdownShoplist('').subscribe({
      next: (res: any) => {
        this.shopList  = res.data
        let shop = res.data
        this.selectsShop = shop.filter((s:any) => s.ID === Number(this.selectedShop[0]));
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

  getPurchaseMaster(){

    let Parem = '';

    if (this.PurchaseMaster.FromDate !== '' && this.PurchaseMaster.FromDate !== null){
      let FromDate =  moment(this.PurchaseMaster.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and purchasemasternew.PurchaseDate between ' +  `'${FromDate}'`; }

    if (this.PurchaseMaster.ToDate !== '' && this.PurchaseMaster.ToDate !== null){
      let ToDate =  moment(this.PurchaseMaster.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' +  `'${ToDate}'`; }
      
    if (this.PurchaseMaster.ShopID != 0  ){
      Parem = Parem + ' and purchasemasternew.ShopID IN ' +  `(${this.PurchaseMaster.ShopID})`;}

    if (this.PurchaseMaster.SupplierID !== 0){
      Parem = Parem + ' and purchasemasternew.SupplierID = ' +  this.PurchaseMaster.SupplierID ; }

    if (this.PurchaseMaster.PaymentStatus !== 0 && this.PurchaseMaster.PaymentStatus !== null &&  this.PurchaseMaster.PaymentStatus !== 'All'){
      Parem = Parem + ' and purchasemasternew.PaymentStatus = '  + `'${this.PurchaseMaster.PaymentStatus}'`; }

    const subs: Subscription =  this.purchaseService.getPurchasereports(Parem).subscribe({
      next: (res: any) => {
        if(res.success){
          this.as.successToast(res.message)
          this.PurchaseMasterList = res.data;
 
          this.PurchaseMasterList.forEach((e: any) => {
            let g :any = {type: 'iGST' , amt : 0}
            let gs : any = {type: 'cGST-sGST' , amt : 0}
            let c: any[] = []

            e.gst_details.forEach((el: any) => {
              if(el.InvoiceNo === e.InvoiceNo){
                if(el.GSTType === 'IGST'){
                  g.amt =  g.amt + el.GSTAmount;
                }else if(el.GSTType === 'CGST-SGST'){
                  gs.amt =  gs.amt + el.GSTAmount;
                }
              }
            })
            c.push(g)
            c.push(gs)
            e.gst_detailssss.push(c)
          })

          this.totalQty = res.calculation[0].totalQty;
          this.totalDiscount = res.calculation[0].totalDiscount.toFixed(2);
          this.totalUnitPrice = res.calculation[0].totalUnitPrice.toFixed(2);
          this.totalGstAmount = res.calculation[0].totalGstAmount.toFixed(2);
          this.totalAmount = res.calculation[0].totalAmount.toFixed(2);
          this.gstMaster = res.calculation[0].gst_details
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

  purchaseFromReset(){
    this.PurchaseMaster =  { 
        FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, SupplierID: 0,  
        SupplierGSTNo:'All', PaymentStatus: 0,
    };
    this.PurchaseMasterList = [];
    this.totalQty = ''
    this.totalDiscount = ''
    this.totalUnitPrice = ''
    this.totalGstAmount =''
    this.totalAmount = ''
  }

  exportAsXLSXMaster(): void {
      let element = document.getElementById('purchaseExcel');
      const ws: XLSX.WorkSheet =XLSX.utils.table_to_sheet(element);
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      XLSX.writeFile(wb, 'Purchase Report.xlsx');
  }

  openModal3(content3: any) {
    this.modalService.open(content3, { centered: true , backdrop : 'static', keyboard: false,size: 'sm'});
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
      this.PurchaseDetail.ProductName = '';
      this.PurchaseDetail.ProductCategory = 0;
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
    this.PurchaseDetail.ProductName = productName;
  }

  getPurchaseDetails(){
    this.sp.show()
    let Parem = '';

    if (this.PurchaseDetail.FromDate !== '' && this.PurchaseDetail.FromDate !== null){
      let FromDate =  moment(this.PurchaseDetail.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and purchasemasternew.PurchaseDate between ' +  `'${FromDate}'`; }

    if (this.PurchaseDetail.ToDate !== '' && this.PurchaseDetail.ToDate !== null){
      let ToDate =  moment(this.PurchaseDetail.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' +  `'${ToDate}'`; }

    if (this.PurchaseDetail.ProductCategory  !== 0){
      Parem = Parem + ' and purchasedetailnew.ProductTypeID = ' +  this.PurchaseDetail.ProductCategory;
      this.filter();}

    if (this.PurchaseDetail.ProductName !== '' ) {
      Parem = Parem + ' and purchasedetailnew.ProductName Like ' + "'" + this.PurchaseDetail.ProductName + "%'"; }

    if (this.PurchaseDetail.ShopID != 0){
      Parem = Parem + ' and purchasemasternew.ShopID IN ' +  `(${this.PurchaseDetail.ShopID})`;}

    if (this.PurchaseDetail.SupplierID !== 0){
      Parem = Parem + ' and purchasemasternew.SupplierID = ' +  this.PurchaseDetail.SupplierID; }

    if (this.PurchaseDetail.GSTPercentage !== 0){
      Parem = Parem + ' and purchasedetailnew.GSTPercentage = '  + `'${this.PurchaseDetail.GSTPercentage}'`; }

    if (this.PurchaseDetail.GSTType !== 0){
      Parem = Parem + ' and purchasedetailnew.GSTType = '  + `'${this.PurchaseDetail.GSTType}'`; }

    const subs: Subscription =  this.purchaseService.getPurchasereportsDetail(Parem).subscribe({
      next: (res: any) => {
        if(res.success){
          this.PurchaseDetailList = res.data
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
    let element = document.getElementById('purchaseDetailExcel');
    const ws: XLSX.WorkSheet =XLSX.utils.table_to_sheet(element);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, 'Purchase ProductType Report.xlsx');
  }

  PDFdetail(){
    let DATA: any = document.getElementById('purchaseDetailExcel');
    html2canvas(DATA).then((canvas) => {
      let fileWidth = 208;
      let fileHeight = (canvas.height * fileWidth) / canvas.width;
      const FILEURI = canvas.toDataURL('image/png');
      let PDF = new jsPDF('p', 'mm', 'a4');
      let position = 0;
      PDF.addImage(FILEURI, 'PNG', 0, position, fileWidth, fileHeight);
      PDF.save('purchaseDetail.pdf');
    });
  }

  purchaseDetailsFromReset(){
    this.PurchaseDetail =  { 
      FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, SupplierID: 0,  
      PaymentStatus: 0,  ProductCategory : 0, ProductName:'', GSTType: 0, GSTPercentage: 0
    };
    this.PurchaseDetailList = [];
    this.DetailtotalQty = ''
    this.DetailtotalDiscount = ''
    this.DetailtotalUnitPrice = ''
    this.DetailtotalGstAmount =''
    this.DetailtotalAmount = ''
  }

  openModal(content: any) {
    this.modalService.open(content, { centered: true , backdrop : 'static', keyboard: false,size: 'sm'});
  }

   // purchaseCharge
  purchaseCharge(){
    this.sp.show()
    let Parem = '';

    if (this.charge.FromDate !== '' && this.charge.FromDate !== null){
      let FromDate =  moment(this.charge.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and purchasemasternew.PurchaseDate between ' +  `'${FromDate}'`; }

    if (this.charge.ToDate !== '' && this.charge.ToDate !== null){
      let ToDate =  moment(this.charge.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' +  `'${ToDate}'`; }

    if (this.charge.ShopID != 0){
      Parem = Parem + ' and purchasemasternew.ShopID IN ' +  `(${this.charge.ShopID})`;}

    const subs: Subscription =  this.purchaseService.getPurchaseChargeReport(Parem).subscribe({
      next: (res: any) => {
        if(res.success){
          this.PurchaseChargeList = res.data
          this.ChargeAmount = res.calculation[0].totalAmount.toFixed(2);
          this.ChargetotalGstAmount = res.calculation[0].totalGstAmount.toFixed(2);
          this.gstCharge = res.calculation[0].gst_details
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    })       
    this.sp.hide()
  }

  exportAsXLSXcharge(): void {
    let element = document.getElementById('purchaseChargeExcel');
    const ws: XLSX.WorkSheet =XLSX.utils.table_to_sheet(element);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, 'PurchaseCharge_Report.xlsx');
  }

  purchaseChargeFromReset(){
    this.charge =  { 
      FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0
    };
    this.PurchaseChargeList = [];
    this.ChargeAmount = ''
    this.ChargetotalGstAmount = ''
    this.gstCharge = ''
  }

  openModal1(content1: any) {
    this.modalService.open(content1, { centered: true , backdrop : 'static', keyboard: false,size: 'sm'});
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
        this.specList1 = res.data;
        this.getSptTableData1();
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
           element.SptTableData = res.data;   
           element.SptFilterData = res.data;  
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
           element.SptTableData = res.data; 
           element.SptFilterData = res.data;   
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
              console.log( element.Color);
              
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
