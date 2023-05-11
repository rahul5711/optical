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
import { EmployeeService } from 'src/app/service/employee.service';
import { BillService } from 'src/app/service/bill.service';
import { CustomerService } from 'src/app/service/customer.service';

@Component({
  selector: 'app-sale-report',
  templateUrl: './sale-report.component.html',
  styleUrls: ['./sale-report.component.css']
})
export class SaleReportComponent implements OnInit {
  selectedShop:any =JSON.parse(localStorage.getItem('selectedShop') || '') ;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private ss: ShopService,
    private bill: BillService,
    private emp: EmployeeService,
    private supps: SupportService,
    private ps: ProductService,
    public as: AlertService,
    private modalService: NgbModal,
    private sp: NgxSpinnerService,
    private customer: CustomerService 
  ) { }

  shopList :any = [];
  employeeList :any = [];
  customerList :any = [];
  customerListGST :any = [];
  BillMasterList:any = [];
  totalQty: any;
  totalDiscount: any;
  totalUnitPrice: any;
  totalAmount: any;
  totalGstAmount: any;
  gstMaster: any;

  selectedProduct: any;
  prodList:any;
  specList: any;
  gstList: any;
  BillDetailList:any = [];
  DetailtotalQty: any;
  DetailtotalDiscount: any;
  DetailtotalUnitPrice: any;
  DetailtotalAmount: any;
  DetailtotalGstAmount: any;
  gstdetails:any

  v :any = []
  BillServiceList :any;
  ServiceAmount:any
  ServicetotalAmount: any;
  ServicetotalGstAmount: any;
  gstService:any

  BillMaster: any =  { 
    FilterTypes:'BillDate', FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0,  EmployeeID:0,  CustomerID: 0,  CustomerGSTNo:0, PaymentStatus: 0, ProductStatus:'All'
  };

  Billdetail: any =  { 
    FilterTypes:'BillDate', FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, CustomerID: 0,  CustomerGSTNo:0, PaymentStatus: 0, ProductStatus:'All', ProductCategory:0, ProductName: '', GSTType:0, GSTPercentage:0, Status:0, Option:0, 
  };

  service: any =  { 
    FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0
  };

  shopLists:any =[]

  ngOnInit(): void {
    // billmaster
    this.dropdownShoplist()
    this.dropdownUserlist()
    this.getProductList();
    this.getGSTList();
    this.dropdownCustomerlist();
    this.dropdownCustomerGSTNo();

  }

  // billmaster
  dropdownShoplist(){
    this.sp.show()
    const subs: Subscription = this.ss.dropdownShoplist('').subscribe({
      next: (res: any) => {
        if(res.success){
          this.shopList  = res.data
          let shop = res.data
          this.shopLists = shop.filter((s:any) => s.ID === Number(this.selectedShop[0]));
          this.shopLists = 'Bill Service' + '/ ' + this.shopLists[0].Name + ' (' + this.shopLists[0].AreaName + ')'
          console.log(this.shopLists);
          
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

  dropdownCustomerlist(){
    this.sp.show()
    const subs: Subscription = this.customer.dropdownlist().subscribe({
      next: (res: any) => {
        if(res.success){
          this.customerList  = res.data
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

  dropdownCustomerGSTNo(){
    this.sp.show()
    const subs: Subscription = this.customer.customerGSTNumber(this.customerList).subscribe({
      next: (res: any) => {
        if(res.success){
          this.customerListGST  = res.data
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

  dropdownUserlist(){
    this.sp.show()
    const subs: Subscription = this.emp.dropdownUserlist('').subscribe({
      next: (res: any) => {
        if(res.success){
          this.employeeList  = res.data
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

  getBillMaster(){
    this.sp.show()
    let Parem = '';

    if (this.BillMaster.FromDate !== '' && this.BillMaster.FromDate !== null && this.BillMaster.FilterTypes === 'BillDate'){
        let FromDate =  moment(this.BillMaster.FromDate).format('YYYY-MM-DD')
        Parem = Parem + ' and billmaster.BillDate between ' +  `'${FromDate}'`;
    }

    if (this.BillMaster.ToDate !== '' && this.BillMaster.ToDate !== null  && this.BillMaster.FilterTypes === 'BillDate'){
        let ToDate =  moment(this.BillMaster.ToDate).format('YYYY-MM-DD')
        Parem = Parem + ' and ' + `'${ToDate}'`; 
    }

    if (this.BillMaster.FromDate !== '' && this.BillMaster.FromDate !== null && this.BillMaster.FilterTypes === 'DeliveryDate'){
      let FromDate =  moment(this.BillMaster.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and billmaster.DeliveryDate between ' +  `'${FromDate}'`; 
    }

    if (this.BillMaster.ToDate !== '' && this.BillMaster.ToDate !== null  && this.BillMaster.FilterTypes === 'DeliveryDate'){
      let ToDate =  moment(this.BillMaster.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'`; 
    }
      
    if (this.BillMaster.ShopID != 0 ){
      Parem = Parem + ' and billmaster.ShopID IN ' +  `(${this.BillMaster.ShopID})`;}

    if (this.BillMaster.EmployeeID !== 0){
      Parem = Parem + ' and billmaster.EmployeeID = ' +  this.BillMaster.EmployeeID ; }

    if (this.BillMaster.CustomerID !== 0){
      Parem = Parem + ' and billmaster.CustomerID = ' +  this.BillMaster.CustomerID ; }

    if (this.BillMaster.CustomerGSTNo !== 0){
      Parem = Parem + ' and billmaster.GSTNo = ' +  this.BillMaster.CustomerGSTNo ; }

    if (this.BillMaster.PaymentStatus !== 0 && this.BillMaster.PaymentStatus !== null &&  this.BillMaster.PaymentStatus !== 'All'){
      Parem = Parem + ' and billmaster.PaymentStatus = '  + `'${this.BillMaster.PaymentStatus}'`; }

    if (this.BillMaster.ProductStatus !== '' && this.BillMaster.ProductStatus !== null  && this.BillMaster.ProductStatus !== 'All'){
      Parem = Parem + ' and BillDetail.ProductStatus = '  + `'${this.BillMaster.ProductStatus}'`; }

      console.log(Parem,'BillMaster');
      
    // const subs: Subscription =  this.purchaseService.getPurchasereports(Parem).subscribe({
    //   next: (res: any) => {
    //     if(res.success){
    //       this.as.successToast(res.message)
    //       this.PurchaseMasterList = res.data;
 
    //       this.PurchaseMasterList.forEach((e: any) => {
    //         let g :any = {type: 'iGST' , amt : 0}
    //         let gs : any = {type: 'cGST-sGST' , amt : 0}
    //         let c: any[] = []

    //         e.gst_details.forEach((el: any) => {
    //           if(el.InvoiceNo === e.InvoiceNo){
    //             if(el.GSTType === 'IGST'){
    //               g.amt =  g.amt + el.GSTAmount;
    //             }else if(el.GSTType === 'CGST-SGST'){
    //               gs.amt =  gs.amt + el.GSTAmount;
    //             }
    //           }
    //         })
    //         c.push(g)
    //         c.push(gs)
    //         e.gst_detailssss.push(c)
    //       })

    //       this.totalQty = res.calculation[0].totalQty;
    //       this.totalDiscount = res.calculation[0].totalDiscount.toFixed(2);
    //       this.totalUnitPrice = res.calculation[0].totalUnitPrice.toFixed(2);
    //       this.totalGstAmount = res.calculation[0].totalGstAmount.toFixed(2);
    //       this.totalAmount = res.calculation[0].totalAmount.toFixed(2);
    //       this.gstMaster = res.calculation[0].gst_details
    //     }else{
    //       this.as.errorToast(res.message)
    //     }
    //     this.sp.hide()
    //   },
    //   error: (err: any) => console.log(err.message),
    //   complete: () => subs.unsubscribe(),
    // });
    this.sp.hide()
  }

  openModalSale(content3: any) {
    this.modalService.open(content3, { centered: true , backdrop : 'static', keyboard: false,size: 'sm'});
  }

  exportAsXLSXMaster(): void {
    let element = document.getElementById('SaleExcel');
    const ws: XLSX.WorkSheet =XLSX.utils.table_to_sheet(element);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, 'Sale Report.xlsx');
}

  billMasterFromReset(){
    this.BillMaster =  { 
      FilterTypes:'BillDate', FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0,  EmployeeID:0,  CustomerID: 0,  CustomerGSTNo:0, PaymentStatus: 0, ProductStatus:'All'
    };
  }
  // billmaster

  // billdetails product

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
    if(this.Billdetail.ProductCategory !== 0){
      this.prodList.forEach((element: any) => {
        if (element.ID === this.Billdetail.ProductCategory) {
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
      this.Billdetail.ProductName = '';
      this.Billdetail.ProductCategory = 0;
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
    this.Billdetail.ProductName = productName;
  }

  getBillDetails(){
    this.sp.show()
    let Parem = '';

    if (this.Billdetail.FromDate !== '' && this.Billdetail.FromDate !== null && this.Billdetail.FilterTypes === 'BillDate'){
        let FromDate =  moment(this.Billdetail.FromDate).format('YYYY-MM-DD')
        Parem = Parem + ' and billmaster.BillDate between ' +  `'${FromDate}'`;
    }

    if (this.Billdetail.ToDate !== '' && this.Billdetail.ToDate !== null  && this.Billdetail.FilterTypes === 'BillDate'){
        let ToDate =  moment(this.Billdetail.ToDate).format('YYYY-MM-DD')
        Parem = Parem + ' and ' + `'${ToDate}'`; 
    }

    if (this.Billdetail.FromDate !== '' && this.Billdetail.FromDate !== null && this.Billdetail.FilterTypes === 'DeliveryDate'){
      let FromDate =  moment(this.Billdetail.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and billmaster.DeliveryDate between ' +  `'${FromDate}'`; 
    }

    if (this.Billdetail.ToDate !== '' && this.Billdetail.ToDate !== null  && this.Billdetail.FilterTypes === 'DeliveryDate'){
      let ToDate =  moment(this.Billdetail.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'`; 
    }
      
    if (this.Billdetail.ShopID != 0 ){
      Parem = Parem + ' and billmaster.ShopID IN ' +  `(${this.Billdetail.ShopID})`;}

    if (this.Billdetail.CustomerID !== 0){
      Parem = Parem + ' and billmaster.CustomerID = ' +  this.Billdetail.CustomerID ; }

    if (this.Billdetail.CustomerGSTNo !== 0){
      Parem = Parem + ' and billmaster.GSTNo = ' +  this.Billdetail.CustomerGSTNo ; }

    if (this.Billdetail.PaymentStatus !== 0 && this.Billdetail.PaymentStatus !== null &&  this.Billdetail.PaymentStatus !== 'All'){
      Parem = Parem + ' and billmaster.PaymentStatus = '  + `'${this.Billdetail.PaymentStatus}'`; }

    if (this.Billdetail.ProductStatus !== '' && this.Billdetail.ProductStatus !== null  && this.Billdetail.ProductStatus !== 'All'){
      Parem = Parem + ' and billdetail.ProductStatus = '  + `'${this.Billdetail.ProductStatus}'`; }

    if (this.Billdetail.ProductCategory  !== 0){
      Parem = Parem + ' and billdetail.ProductTypeID = ' +  this.Billdetail.ProductCategory;
      this.filter();}
  
    if (this.Billdetail.ProductName !== '' ) {
      Parem = Parem + ' and billdetail.ProductName Like ' + "'" + this.Billdetail.ProductName + "%'"; }

    if (this.Billdetail.Option !== '' && this.Billdetail.Option !== null && this.Billdetail.Option !== 0) {
      Parem = Parem + ' and barcodemasternew.Option = ' + `'${this.Billdetail.Option}'`;
    }
  
    if (this.Billdetail.GSTPercentage !== 0){
      Parem = Parem + ' and billdetail.GSTPercentage = '  + `'${this.Billdetail.GSTPercentage}'`; }

    if (this.Billdetail.GSTType !== 0){
      Parem = Parem + ' and billdetail.GSTType = '  + `'${this.Billdetail.GSTType}'`; }

    if (this.Billdetail.Status !== '' && this.Billdetail.Status !== null && this.Billdetail.Status !== 0) {
        if (this.Billdetail.Status === 'Manual' && this.Billdetail.Status !== 'All') {
          Parem = Parem + ' and billdetail.Manual = ' + '1';
        } else if (this.Billdetail.Status === 'PreOrder' && this.Billdetail.Status !== 'All') {
          Parem = Parem + ' and billdetail.PreOrder = ' + '1';
        } else if (this.Billdetail.Status === 'Barcode' && this.Billdetail.Status !== 'All') {
          Parem = Parem + ' and billdetail.PreOrder = ' + '0';
          Parem = Parem + ' and billdetail.Manual = ' + '0';
        }
    }

      console.log(Parem,'Billdetail');
    this.sp.hide()
  }

  exportAsXLSXDetail(): void {
    let element = document.getElementById('saleDetailExcel');
    const ws: XLSX.WorkSheet =XLSX.utils.table_to_sheet(element);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, 'Sale ProductType Report.xlsx');
  }

  openModalDetail(content: any) {
    this.modalService.open(content, { centered: true , backdrop : 'static', keyboard: false,size: 'sm'});
  }

  BillDetailsFromReset(){
    this.Billdetail =  { 
      FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, SupplierID: 0,  
      PaymentStatus: 0,  ProductCategory : 0, ProductName:'', GSTType: 0, GSTPercentage: 0
    };
    this.BillDetailList = [];
    this.DetailtotalQty = ''
    this.DetailtotalDiscount = ''
    this.DetailtotalUnitPrice = ''
    this.DetailtotalGstAmount =''
    this.DetailtotalAmount = ''
  }

  // BillService

  BillService(){
    this.sp.show()
    let Parem = '';

    if (this.service.FromDate !== '' && this.service.FromDate !== null){
      let FromDate =  moment(this.service.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and billmaster.BillDate between ' +  `'${FromDate}'`; }

    if (this.service.ToDate !== '' && this.service.ToDate !== null){
      let ToDate =  moment(this.service.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' +  `'${ToDate}'`; }

    if (this.service.ShopID != 0){
      Parem = Parem + ' and billmaster.ShopID IN ' +  `(${this.service.ShopID})`;}

      console.log(Parem,'service');
      
    const subs: Subscription =  this.bill.saleServiceReport(Parem).subscribe({
      next: (res: any) => {
        if(res.success){
          this.as.successToast(res.message)
          this.BillServiceList = res.data
          this.ServiceAmount = res.calculation[0].totalAmount;
          this.ServicetotalGstAmount = res.calculation[0].totalGstAmount;
          this.gstService = res.calculation[0].gst_details
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

  openModalService(content1: any) {
    this.modalService.open(content1, { centered: true , backdrop : 'static', keyboard: false,size: 'sm'});
  }


  exportAsXLSXcharge(): void {
    let element = document.getElementById('billServiceExcel');
    const ws: XLSX.WorkSheet =XLSX.utils.table_to_sheet(element);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, 'BillService_Report.xlsx');
  }

  BillServiceFromReset(){
    this.service =  { 
      FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0
    };
    this.BillServiceList = [];
    this.ServiceAmount = ''
    this.ServicetotalGstAmount = ''
    this.gstService = ''
  }
}
