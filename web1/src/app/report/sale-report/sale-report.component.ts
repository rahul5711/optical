import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { ProductService } from 'src/app/service/product.service';
import { Observable, Subscription, debounceTime, map, startWith } from 'rxjs';
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
import { FormControl } from '@angular/forms';


@Component({
  selector: 'app-sale-report',
  templateUrl: './sale-report.component.html',
  styleUrls: ['./sale-report.component.css']
})
export class SaleReportComponent implements OnInit {
  shop:any =JSON.parse(localStorage.getItem('shop') || '') ;
  user:any =JSON.parse(localStorage.getItem('user') || '') ;
  selectedShop:any =JSON.parse(localStorage.getItem('selectedShop') || '') ;
  permission = JSON.parse(localStorage.getItem('permission') || '[]');
  companySetting:any = JSON.parse(localStorage.getItem('companysetting') || '[]');

  myControl = new FormControl('All');
  myControl1 = new FormControl('All');
  filteredOptions: any ;
  filteredOption2: any ;
  searchValue: any = '';
 
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
  totalAddlDiscount: any;
  totalGstAmount: any;
  totalBalance = 0
  totalPaid = 0
  gstMaster: any;

  selectedProduct: any;
  prodList:any;
  specList: any = [];
  gstList: any;
  BillDetailList:any = [];
  DetailtotalQty: any;
  DetailtotalDiscount: any;
  DetailtotalUnitPrice: any;
  DetailtotalAmount: any;
  DetailtotalGstAmount: any;
  gstdetails:any
  DetailtotalPorfit: any = 0
  DetailtotalPrice: any = 0

  v :any = []
  BillServiceList :any;
  ServiceAmount:any
  ServicetotalAmount: any;
  ServicetotalGstAmount: any;
  ServicetotalSUBTOTAL: any;
  ServiceGtotalAmount: any;
  gstService:any

  BillMaster: any =  { 
    FilterTypes:'BillDate', FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0,  EmployeeID:0,  CustomerID: 0,  CustomerGSTNo:0, PaymentStatus: 0, ProductStatus:'All', BillType:'All'
  };

  Billdetail: any =  { 
    FilterTypes:'BillDate', FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, CustomerID: 0,  CustomerGSTNo:0, PaymentStatus: 0, ProductStatus:'All', ProductCategory:0, ProductName: '', GSTType:0, GSTPercentage:0, Status:0, Option:0, 
  };

  service: any =  { 
    FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0,BillType:'All'
  };

  cancel: any =  { 
    FilterTypes:'BillDate', FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0,  CustomerGSTNo:0,  ProductCategory:0, ProductName: '', GSTType:0, GSTPercentage:0, Status:0, Option:0, CancelStatus:0
  };

  pending: any =  { 
    FilterTypes:'BillDate', FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0,  CustomerGSTNo:0,  ProductCategory:0, ProductName: '', GSTType:0, GSTPercentage:0, Status:0, Option:0, ProductStatus:'pending'
  };

  BillExpiry: any =  { 
FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, CustomerID: 0,  CustomerGSTNo:0, PaymentStatus: 0, ProductStatus:'All', ProductCategory:0, ProductName: '', GSTType:0, GSTPercentage:0, Status:0, Option:0, 
  };

  shopLists:any =[]
  serviceType :any =[]

  viewSaleReport = false
  addSaleReport = false
  editSaleReport = false
  deleteSaleReport = false

  viewSaleProductReport = false
  addSaleProductReport = false
  editSaleProductReport = false
  deleteSaleProductReport = false

  viewSaleServiceReport = false
  addSaleServiceReport = false
  editSaleServiceReport = false
  deleteSaleServiceReport = false

  employeeHide = false

  cancelList:any = [];
  prodList1:any;
  specList1:any =[];
  canceltotalQty: any;
  canceltotalDiscount: any;
  canceltotalUnitPrice: any;
  canceltotalAmount: any;
  canceltotalGstAmount: any;
  gstcancels:any

  pendingList:any = [];
  prodList2:any;
  specList2:any =[];
  pendingtotalQty: any;
  pendingtotalDiscount: any;
  pendingtotalUnitPrice: any;
  pendingtotalAmount: any;
  pendingtotalGstAmount: any;
  gstpending:any

  ExpiryList:any = [];
  prodList3:any;
  specList3:any =[];
  ExpirytotalQty: any;
  ExpirytotalDiscount: any;
  ExpirytotalUnitPrice: any;
  ExpirytotalAmount: any;
  ExpirytotalGstAmount: any;
  gstExpiry:any
  todaydate: any;
  

  ngOnInit(): void {
    this.permission.forEach((element: any) => {
      if (element.ModuleName === 'SaleReport') {
        this.viewSaleReport = element.View;
        this.addSaleReport = element.Add;
        this.editSaleReport = element.Edit;
        this.deleteSaleReport = element.Delete;
      }else if (element.ModuleName === 'SaleProductReport') {
        this.viewSaleProductReport = element.View;
        this.addSaleProductReport = element.Add;
        this.editSaleProductReport = element.Edit;
        this.deleteSaleProductReport = element.Delete;
      }else if (element.ModuleName === 'SaleServiceReport') {
        this.viewSaleServiceReport = element.View;
        this.addSaleServiceReport = element.Add;
        this.editSaleServiceReport = element.Edit;
        this.deleteSaleServiceReport = element.Delete;
      }
    });
    // billmaster
   
    this.dropdownUserlist()
    this.getProductList();
    this.getProductList1();
    this.getProductList2();
    this.getProductList3();
    this.getGSTList();
    // this.dropdownCustomerlist();
    this.dropdownCustomerGSTNo();
    // this.BillMaster.FromDate = moment().format('YYYY-MM-DD');
    // this.BillMaster.ToDate = moment().format('YYYY-MM-DD');
    // this.getBillMaster();
    if(!this.editSaleReport){
      this.employeeHide = true
    }else  if(this.BillMaster.FromDate === moment().format('YYYY-MM-DD')) {
      this.employeeHide = true
    }

    if(this.user.UserGroup === 'Employee'){
      this.shopList  = this.shop;
      this.BillMaster.ShopID = this.shopList[0].ShopID
      this.Billdetail.ShopID = this.shopList[0].ShopID
      this.service.ShopID = this.shopList[0].ShopID
      this.cancel.ShopID = this.shopList[0].ShopID
      this.pending.ShopID = this.shopList[0].ShopID
    }else{
      this.dropdownShoplist()
    }

  }


  
  getChangeDate() {
    const currentDate = moment().format('YYYY-MM-DD');
    if (this.user.UserGroup !== "CompanyAdmin") {
      if(this.editSaleReport === false){
        if (this.BillMaster.FromDate === currentDate) {
            this.employeeHide = true;
            this.BillMaster.PaymentStatus = 0;
        } else {
            this.employeeHide = false;
            this.BillMaster.PaymentStatus = 'Unpaid';276
        }
      }else{
        this.employeeHide = true;
        this.BillMaster.PaymentStatus = 0;
      }
    }
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
            this.shopLists =  '/ ' + this.shopLists[0].Name + ' (' + this.shopLists[0].AreaName + ')'  
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
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
  }

  getBillMaster(){
    this.sp.show()
    let Parem = '';

    if (this.BillMaster.FromDate !== '' && this.BillMaster.FromDate !== null && this.BillMaster.FilterTypes === 'BillDate'){
   
        let FromDate =  moment(this.BillMaster.FromDate).format('YYYY-MM-DD') 
        Parem = Parem + ' and DATE_FORMAT(billmaster.BillDate, "%Y-%m-%d")  between ' +  `'${FromDate}'` ;
    }

    if (this.BillMaster.ToDate !== '' && this.BillMaster.ToDate !== null  && this.BillMaster.FilterTypes === 'BillDate'){
        let ToDate =  moment(this.BillMaster.ToDate).format('YYYY-MM-DD') 
        Parem = Parem + ' and ' + `'${ToDate}'`; 
    }

    if (this.BillMaster.FromDate !== '' && this.BillMaster.FromDate !== null && this.BillMaster.FilterTypes === 'DeliveryDate'){
      let FromDate =  moment(this.BillMaster.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and DATE_FORMAT(billmaster.DeliveryDate, "%Y-%m-%d") between ' +  `'${FromDate}'`; 
    }

    if (this.BillMaster.ToDate !== '' && this.BillMaster.ToDate !== null  && this.BillMaster.FilterTypes === 'DeliveryDate'){
      let ToDate =  moment(this.BillMaster.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'`; 
    }
      
    if (this.BillMaster.ShopID != 0 ){
      Parem = Parem + ' and billmaster.ShopID IN ' +  `(${this.BillMaster.ShopID})`;}

    if (this.BillMaster.EmployeeID !== 0){
      Parem = Parem + ' and billmaster.Employee = ' +  this.BillMaster.EmployeeID ; }

    if (this.BillMaster.CustomerID != 0){
      Parem = Parem + ' and billmaster.CustomerID = ' +  this.BillMaster.CustomerID ; }

    if (this.BillMaster.CustomerGSTNo !== 0){
      Parem = Parem + ' and billmaster.GSTNo = ' +  this.BillMaster.CustomerGSTNo ; }

    if (this.BillMaster.PaymentStatus !== 0 && this.BillMaster.PaymentStatus !== null &&  this.BillMaster.PaymentStatus !== 'All'){
      Parem = Parem + ' and billmaster.PaymentStatus = '  + `'${this.BillMaster.PaymentStatus}'`; }

    if (this.BillMaster.ProductStatus !== '' && this.BillMaster.ProductStatus !== null  && this.BillMaster.ProductStatus !== 'All'){
      Parem = Parem + ' and billmaster.ProductStatus = '  + `'${this.BillMaster.ProductStatus}'`; }

    if (this.BillMaster.BillType !== '' && this.BillMaster.BillType !== null  && this.BillMaster.BillType !== 'All'){
      Parem = Parem + ' and billmaster.BillType = '  + `'${this.BillMaster.BillType}'`; }

    const subs: Subscription =  this.bill.getSalereport(Parem).subscribe({
      next: (res: any) => {
        if(res.success){
          this.as.successToast(res.message)
          this.BillMasterList = res.data;
 
          this.BillMasterList.forEach((e: any) => {
            let g :any = {type: 'iGST' , amt : 0}
            let gs : any = {type: 'cGST-sGST' , amt : 0}
            let c: any[] = []

            e.gst_details.forEach((el: any) => {
              if(el.InvoiceNo === e.InvoiceNo){
                if(el.GSTType === 'IGST'){
                  g.amt =  g.amt + el.Amount;
                }else if(el.GSTType === 'CGST'){
                  gs.amt =  gs.amt + el.Amount;
                }
              }
            })
            c.push(g)
            c.push(gs)
            e.gst_detailssss.push(c)
          })
          this.totalBalance = 0
          this.totalPaid = 0
          for (const billMaster of this.BillMasterList) {
            this.totalBalance = this.totalBalance + billMaster.DueAmount;
          }
          
          this.totalQty = res.calculation[0].totalQty;
          this.totalDiscount = (parseFloat(res.calculation[0].totalDiscount)).toFixed(2);
          this.totalUnitPrice = (parseFloat(res.calculation[0].totalSubTotalPrice)).toFixed(2);
          this.totalGstAmount = (parseFloat(res.calculation[0].totalGstAmount)).toFixed(2);
          this.totalAmount = (parseFloat(res.calculation[0].totalAmount)).toFixed(2);
          this.totalAddlDiscount = (parseFloat(res.calculation[0].totalAddlDiscount)).toFixed(2);
          this.totalPaid = this.totalAmount - this.totalBalance;
          this.gstMaster = res.calculation[0].gst_details
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
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
    this.BillMasterList = []
    this.totalQty = 0;
    this.totalDiscount = 0;
    this.totalUnitPrice = 0;
    this.totalAmount = 0;
    this.totalGstAmount = 0;
    this.gstMaster = [];
  }
  // billmaster

  // billdetails product

  getProductList(){
    const subs: Subscription =  this.ps.getList().subscribe({
      next: (res: any) => {
        this.prodList = res.data.sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
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
          element.SptTableData = res.data.sort((a: { TableValue: string; }, b: { TableValue: any; }) => (a.TableValue.trim()).localeCompare(b.TableValue));
          element.SptFilterData = res.data.sort((a: { TableValue: string; }, b: { TableValue: any; }) => (a.TableValue.trim()).localeCompare(b.TableValue));       
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
          element.SptTableData = res.data.sort((a: { TableValue: string; }, b: { TableValue: any; }) => (a.TableValue.trim()).localeCompare(b.TableValue));
          element.SptFilterData = res.data.sort((a: { TableValue: string; }, b: { TableValue: any; }) => (a.TableValue.trim()).localeCompare(b.TableValue));        
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
        Parem = Parem + ' and DATE_FORMAT(billmaster.BillDate, "%Y-%m-%d") between ' +  `'${FromDate}'`;
    }

    if (this.Billdetail.ToDate !== '' && this.Billdetail.ToDate !== null  && this.Billdetail.FilterTypes === 'BillDate'){
        let ToDate =  moment(this.Billdetail.ToDate).format('YYYY-MM-DD')
        Parem = Parem + ' and ' + `'${ToDate}'`; 
    }

    if (this.Billdetail.FromDate !== '' && this.Billdetail.FromDate !== null && this.Billdetail.FilterTypes === 'DeliveryDate'){
      let FromDate =  moment(this.Billdetail.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and DATE_FORMAT(billmaster.DeliveryDate, "%Y-%m-%d") between ' +  `'${FromDate}'`; 
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
      Parem = Parem + ' and billdetail.ProductName Like ' + "'" + this.Billdetail.ProductName.trim() + "%'"; }

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
    const subs: Subscription =  this.bill.getSalereportsDetail(Parem).subscribe({
      next: (res: any) => {
        if(res.success){
          this.as.successToast(res.message)
          this.BillDetailList = res.data

          this.DetailtotalQty = res.calculation[0].totalQty;
          this.DetailtotalDiscount = res.calculation[0].totalDiscount;
          this.DetailtotalUnitPrice = res.calculation[0].totalUnitPrice;
          this.DetailtotalGstAmount = res.calculation[0].totalGstAmount;
          this.DetailtotalAmount = res.calculation[0].totalAmount;
          this.gstdetails = res.calculation[0].gst_details
          this.DetailtotalPrice = res.calculation[0].totalPurchasePrice;
          this.DetailtotalPorfit = res.calculation[0].totalProfit;
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
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
      FilterTypes:'BillDate', FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, CustomerID: 0,  CustomerGSTNo:0, PaymentStatus: 0, ProductStatus:'All', ProductCategory:0, ProductName: '', GSTType:0, GSTPercentage:0, Status:0, Option:0, 
    };
    this.BillDetailList = [];
    this.DetailtotalQty = 0;
    this.DetailtotalDiscount = 0;
    this.DetailtotalUnitPrice = 0;
    this.DetailtotalGstAmount = 0;
    this.DetailtotalAmount = 0;
    this.specList = [];
  }

  // BillService

  BillService(){
    this.sp.show()
    let Parem = '';

    if (this.service.FromDate !== '' && this.service.FromDate !== null){
      let FromDate =  moment(this.service.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and DATE_FORMAT(billmaster.BillDate, "%Y-%m-%d") between ' +  `'${FromDate}'`; }

    if (this.service.ToDate !== '' && this.service.ToDate !== null){
      let ToDate =  moment(this.service.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' +  `'${ToDate}'`; }

    if (this.service.ShopID != 0){
      Parem = Parem + ' and billmaster.ShopID IN ' +  `(${this.service.ShopID})`;}

    if ( this.service.BillType !== 'All'){
      Parem = Parem + ' and billmaster.BillType = '  + `'${this.service.BillType}'`; }

      
    const subs: Subscription =  this.bill.saleServiceReport(Parem).subscribe({
      next: (res: any) => {
        if(res.success){
          this.as.successToast(res.message)
          this.BillServiceList = res.data
          this.ServiceAmount = (res.calculation[0].totalAmount).toFixed(2);
          this.ServicetotalGstAmount = (res.calculation[0].totalGstAmount).toFixed(2);
          this.ServicetotalSUBTOTAL = (res.calculation[0].totalSubTotal
            ).toFixed(2);
          this.gstService = res.calculation[0].gst_details
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    })       
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

  // bill product cancel

  getProductList1(){
    const subs: Subscription =  this.ps.getList().subscribe({
      next: (res: any) => {
        this.prodList1 = res.data.sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getFieldList1(){
    if(this.cancel.ProductCategory !== 0){
      this.prodList1.forEach((element: any) => {
        if (element.ID === this.cancel.ProductCategory) {
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
      this.cancel.ProductName = '';
      this.cancel.ProductCategory = 0;
    }
  }

  getSptTableData1() { 
    this.specList1.forEach((element: any) => {
     if (element.FieldType === 'DropDown' && element.Ref === '0') {
       const subs: Subscription =  this.ps.getProductSupportData('0', element.SptTableName).subscribe({
         next: (res: any) => {
          element.SptTableData = res.data.sort((a: { TableValue: string; }, b: { TableValue: any; }) => (a.TableValue.trim()).localeCompare(b.TableValue));
          element.SptFilterData = res.data.sort((a: { TableValue: string; }, b: { TableValue: any; }) => (a.TableValue.trim()).localeCompare(b.TableValue));       
         
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
          element.SptTableData = res.data.sort((a: { TableValue: string; }, b: { TableValue: any; }) => (a.TableValue.trim()).localeCompare(b.TableValue));
          element.SptFilterData = res.data.sort((a: { TableValue: string; }, b: { TableValue: any; }) => (a.TableValue.trim()).localeCompare(b.TableValue));       
            
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
    this.cancel.ProductName = productName;
  }

  getProductCancel(){
    this.sp.show()
    let Parem = '';

    if (this.cancel.FromDate !== '' && this.cancel.FromDate !== null && this.cancel.FilterTypes === 'BillDate'){
        let FromDate =  moment(this.cancel.FromDate).format('YYYY-MM-DD')
        Parem = Parem + ' and DATE_FORMAT(billmaster.BillDate, "%Y-%m-%d") between ' +  `'${FromDate}'`;
    }

    if (this.cancel.ToDate !== '' && this.cancel.ToDate !== null  && this.cancel.FilterTypes === 'BillDate'){
        let ToDate =  moment(this.cancel.ToDate).format('YYYY-MM-DD')
        Parem = Parem + ' and ' + `'${ToDate}'`; 
    }

    if (this.cancel.FromDate !== '' && this.cancel.FromDate !== null && this.cancel.FilterTypes === 'DeliveryDate'){
      let FromDate =  moment(this.cancel.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and billmaster.DeliveryDate between ' +  `'${FromDate}'`; 
    }

    if (this.cancel.ToDate !== '' && this.cancel.ToDate !== null  && this.cancel.FilterTypes === 'DeliveryDate'){
      let ToDate =  moment(this.cancel.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'`; 
    }
      
    if (this.cancel.ShopID != 0 ){
      Parem = Parem + ' and billmaster.ShopID IN ' +  `(${this.cancel.ShopID})`;}

    if (this.cancel.CustomerGSTNo !== 0){
      Parem = Parem + ' and billmaster.GSTNo = ' +  this.cancel.CustomerGSTNo ; }

    if (this.cancel.ProductCategory  !== 0){
      Parem = Parem + ' and billdetail.ProductTypeID = ' +  this.cancel.ProductCategory;
      this.filter1();}
  
    if (this.cancel.ProductName !== '' ) {
      Parem = Parem + ' and billdetail.ProductName Like ' + "'" + this.cancel.ProductName.trim() + "%'"; }

    if (this.cancel.Option !== '' && this.cancel.Option !== null && this.cancel.Option !== 0) {
      Parem = Parem + ' and barcodemasternew.Option = ' + `'${this.cancel.Option}'`;
    }
  
    if (this.cancel.GSTPercentage !== 0){
      Parem = Parem + ' and billdetail.GSTPercentage = '  + `'${this.cancel.GSTPercentage}'`; }

    if (this.cancel.GSTType !== 0){
      Parem = Parem + ' and billdetail.GSTType = '  + `'${this.cancel.GSTType}'`; }

    if (this.cancel.Status !== '' && this.cancel.Status !== null && this.cancel.Status !== 0) {
        if (this.cancel.Status === 'Manual' && this.cancel.Status !== 'All') {
          Parem = Parem + ' and billdetail.Manual = ' + '1';
        } else if (this.cancel.Status === 'PreOrder' && this.cancel.Status !== 'All') {
          Parem = Parem + ' and billdetail.PreOrder = ' + '1';
        } else if (this.cancel.Status === 'Barcode' && this.cancel.Status !== 'All') {
          Parem = Parem + ' and billdetail.PreOrder = ' + '0';
          Parem = Parem + ' and billdetail.Manual = ' + '0';
        }
    }

    if (this.cancel.CancelStatus !== 0){
      if (this.cancel.CancelStatus === 'Cancel' && this.cancel.CancelStatus !== 'All') {
        Parem = Parem + ' and billdetail.Status = ' + '0' + ' and billdetail.CancelStatus = ' + '0';
      } else if (this.cancel.CancelStatus === 'Delete' && this.cancel.CancelStatus !== 'All') {
        Parem = Parem + ' and billdetail.Status = ' + '0' + ' and billdetail.CancelStatus = ' + '1';
      }
    }

    const subs: Subscription =  this.bill.getCancelProductReport(Parem).subscribe({
      next: (res: any) => {
        if(res.success){
          this.as.successToast(res.message)
          this.cancelList = res.data
          this.canceltotalQty = res.calculation[0].totalQty;
          this.canceltotalDiscount = res.calculation[0].totalDiscount;
          this.canceltotalUnitPrice = res.calculation[0].totalUnitPrice;
          this.canceltotalGstAmount = res.calculation[0].totalGstAmount;
          this.canceltotalAmount = res.calculation[0].totalAmount;
          this.gstcancels = res.calculation[0].gst_details
console.log(res);

        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  openModalCancel(content4: any) {
    this.modalService.open(content4, { centered: true , backdrop : 'static', keyboard: false,size: 'sm'});
  }

  exportAsXLSXCancel(): void {
    let element = document.getElementById('saleCancelExcel');
    const ws: XLSX.WorkSheet =XLSX.utils.table_to_sheet(element);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, 'BillCancelProduct_Report.xlsx');
  }

  BillCancelFromReset(){
    this.cancel =  { 
      FilterTypes:'BillDate', FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0,  CustomerGSTNo:0,  ProductCategory:0, ProductName: '', GSTType:0, GSTPercentage:0, Status:0, Option:0, CancelStatus:0
    };
    this.cancelList = [];
    this.canceltotalQty = 0;
    this.canceltotalDiscount = 0;
    this.canceltotalUnitPrice = 0;
    this.canceltotalGstAmount = 0;
    this.canceltotalAmount = 0;
    this.specList1 = [];
    this.gstcancels = [];
  }

 // bill product pending

 getProductList2(){
  const subs: Subscription =  this.ps.getList().subscribe({
    next: (res: any) => {
      this.prodList2 = res.data;
    },
    error: (err: any) => console.log(err.message),
    complete: () => subs.unsubscribe(),
  });
}

getFieldList2(){
  if(this.pending.ProductCategory !== 0){
    this.prodList2.forEach((element: any) => {
      if (element.ID === this.pending.ProductCategory) {
        this.selectedProduct = element.Name;
      }
    })
    const subs: Subscription =  this.ps.getFieldList(this.selectedProduct).subscribe({
      next: (res: any) => {
      this.specList2 = res.data;
      this.getSptTableData2();
     },
     error: (err: any) => console.log(err.message),
     complete: () => subs.unsubscribe(),
   });
  }
  else {
    this.specList2 = [];
    this.pending.ProductName = '';
    this.pending.ProductCategory = 0;
  }
}

getSptTableData2() { 
  this.specList2.forEach((element: any) => {
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

getFieldSupportData2(index:any) {
  this.specList2.forEach((element: any) => {
   if (element.Ref === this.specList2[index].FieldName.toString() ) {
     const subs: Subscription =  this.ps.getProductSupportData( this.specList2[index].SelectedValue,element.SptTableName).subscribe({
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

filter2() {
  let productName = '';
  this.specList2.forEach((element: any) => {
   if (productName === '') {
      productName = element.SelectedValue;
   } else if (element.SelectedValue !== '') {
      productName += '/' + element.SelectedValue;
   }
  });
  this.pending.ProductName = productName;
}

getProductPending(){
  this.sp.show()
  let Parem = '';

  if (this.pending.FromDate !== '' && this.pending.FromDate !== null && this.pending.FilterTypes === 'BillDate'){
      let FromDate =  moment(this.pending.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and DATE_FORMAT(billmaster.BillDate, "%Y-%m-%d") between ' +  `'${FromDate}'`;
  }

  if (this.pending.ToDate !== '' && this.pending.ToDate !== null  && this.pending.FilterTypes === 'BillDate'){
      let ToDate =  moment(this.pending.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'`; 
  }

  if (this.pending.FromDate !== '' && this.pending.FromDate !== null && this.pending.FilterTypes === 'DeliveryDate'){
    let FromDate =  moment(this.pending.FromDate).format('YYYY-MM-DD')
    Parem = Parem + ' and billmaster.DeliveryDate between ' +  `'${FromDate}'`; 
  }

  if (this.pending.ToDate !== '' && this.pending.ToDate !== null  && this.pending.FilterTypes === 'DeliveryDate'){
    let ToDate =  moment(this.pending.ToDate).format('YYYY-MM-DD')
    Parem = Parem + ' and ' + `'${ToDate}'`; 
  }
    
  if (this.pending.ShopID != 0 ){
    Parem = Parem + ' and billmaster.ShopID IN ' +  `(${this.pending.ShopID})`;}

  if (this.pending.CustomerGSTNo !== 0){
    Parem = Parem + ' and billmaster.GSTNo = ' +  this.pending.CustomerGSTNo ; }

  if (this.pending.ProductCategory  !== 0){
    Parem = Parem + ' and billdetail.ProductTypeID = ' +  this.pending.ProductCategory;
    this.filter1();}

  if (this.pending.ProductName !== '' ) {
    Parem = Parem + ' and billdetail.ProductName Like ' + "'" + this.pending.ProductName.trim() + "%'"; }

  if (this.pending.Option !== '' && this.pending.Option !== null && this.pending.Option !== 0) {
    Parem = Parem + ' and barcodemasternew.Option = ' + `'${this.pending.Option}'`;
  }

  if (this.pending.GSTPercentage !== 0){
    Parem = Parem + ' and billdetail.GSTPercentage = '  + `'${this.pending.GSTPercentage}'`; }

  if (this.pending.GSTType !== 0){
    Parem = Parem + ' and billdetail.GSTType = '  + `'${this.pending.GSTType}'`; }

  if (this.pending.Status !== '' && this.pending.Status !== null && this.pending.Status !== 0) {
      if (this.pending.Status === 'Manual' && this.pending.Status !== 'All') {
        Parem = Parem + ' and billdetail.Manual = ' + '1';
      } else if (this.pending.Status === 'PreOrder' && this.pending.Status !== 'All') {
        Parem = Parem + ' and billdetail.PreOrder = ' + '1';
      } else if (this.pending.Status === 'Barcode' && this.pending.Status !== 'All') {
        Parem = Parem + ' and billdetail.PreOrder = ' + '0';
        Parem = Parem + ' and billdetail.Manual = ' + '0';
      }
  }

  
  if (this.pending.ProductStatus !== '' && this.pending.ProductStatus !== null  && this.pending.ProductStatus !== 'All'){
    Parem = Parem + ' and billdetail.ProductStatus = '  + `'${this.pending.ProductStatus}'`; }

  const subs: Subscription =  this.bill.getSalereportsDetail(Parem).subscribe({
    next: (res: any) => {
      if(res.success){
        this.as.successToast(res.message)
        this.pendingList = res.data
        this.pendingtotalQty = res.calculation[0].totalQty;
        this.pendingtotalDiscount = res.calculation[0].totalDiscount;
        this.pendingtotalUnitPrice = res.calculation[0].totalUnitPrice;
        this.pendingtotalGstAmount = res.calculation[0].totalGstAmount;
        this.pendingtotalAmount = res.calculation[0].totalAmount;
        this.gstpending = res.calculation[0].gst_details

      }else{
        this.as.errorToast(res.message)
      }
      this.sp.hide()
    },
    error: (err: any) => console.log(err.message),
    complete: () => subs.unsubscribe(),
  });
}

openModalPending(content4: any) {
  this.modalService.open(content4, { centered: true , backdrop : 'static', keyboard: false,size: 'sm'});
}

exportAsXLSXPending(): void {
  let element = document.getElementById('salePendingExcel');
  const ws: XLSX.WorkSheet =XLSX.utils.table_to_sheet(element);
  const wb: XLSX.WorkBook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, 'BillPendingProduct_Report.xlsx');
}

BillPendingFromReset(){
  this.pending =  { 
    FilterTypes:'BillDate', FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0,  CustomerGSTNo:0,  ProductCategory:0, ProductName: '', GSTType:0, GSTPercentage:0, Status:0, Option:0, ProductStatus:'pending'
  };
  this.pendingList = [];
  this.pendingtotalQty = 0;
  this.pendingtotalDiscount = 0;
  this.pendingtotalUnitPrice = 0;
  this.pendingtotalGstAmount = 0;
  this.pendingtotalAmount = 0;
  this.specList2 = [];
  this.gstpending = [];
}

// customer search 
  dateFormat(date:any){
    return moment(date).format(`${this.companySetting.DateFormat}`);
  }

  customerSearch(searchKey: any, mode: any, type:any) {
    this.filteredOptions = []

    let dtm = {Type:'',Name:''}
    if(type === 'Employee'){
      dtm = {
        Type: 'Employee',
        Name: this.BillMaster.EmployeeID
      };
    }
    if(type === 'Customer'){
      dtm = {
        Type: 'Customer',
        Name: this.BillMaster.CustomerID
      };
    }
   
    if (searchKey.length >= 2) {
      if (mode === 'Name') {
        dtm.Name = searchKey;
      } 

      const subs: Subscription =  this.supps.dropdownlistBySearch(dtm).subscribe({
        next: (res: any) => {
          if(res.success){
            this.filteredOptions = res.data
          }else{
            this.as.errorToast(res.message)
          }
          this.sp.hide()
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    }
  
  }

  CustomerSelection(mode:any,ID:any){
    if(mode === 'Value'){
      this.BillMaster.CustomerID = ID
    }
    if(mode === 'Billdetail'){
      this.Billdetail.CustomerID = ID
    }
    if(mode === 'emp'){
      this.Billdetail.EmployeeID = ID
    }
    if(mode === 'All'){
      this.filteredOptions  = []
      this.BillMaster.CustomerID = 0
      this.Billdetail.CustomerID = 0
      this.Billdetail.EmployeeID = 0
    }
  }
// customer search 

// sale prodcut Expiry 
getProductList3(){
  const subs: Subscription =  this.ps.getList().subscribe({
    next: (res: any) => {
      this.prodList3 = res.data;
    },
    error: (err: any) => console.log(err.message),
    complete: () => subs.unsubscribe(),
  });
}

getFieldList3(){
  if(this.BillExpiry.ProductCategory !== 0){
    this.prodList3.forEach((element: any) => {
      if (element.ID === this.BillExpiry.ProductCategory) {
        this.selectedProduct = element.Name;
      }
    })
    const subs: Subscription =  this.ps.getFieldList(this.selectedProduct).subscribe({
      next: (res: any) => {
      this.specList3 = res.data;
      this.getSptTableData3();
     },
     error: (err: any) => console.log(err.message),
     complete: () => subs.unsubscribe(),
   });
  }
  else {
    this.specList3 = [];
    this.BillExpiry.ProductName = '';
    this.BillExpiry.ProductCategory = 0;
  }
}

getSptTableData3() { 
  this.specList3.forEach((element: any) => {
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

getFieldSupportData3(index:any) {
  this.specList3.forEach((element: any) => {
   if (element.Ref === this.specList3[index].FieldName.toString() ) {
     const subs: Subscription =  this.ps.getProductSupportData( this.specList3[index].SelectedValue,element.SptTableName).subscribe({
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


filter3() {
  let productName = '';
  this.specList3.forEach((element: any) => {
   if (productName === '') {
      productName = element.SelectedValue;
   } else if (element.SelectedValue !== '') {
      productName += '/' + element.SelectedValue;
   }
  });
  this.BillExpiry.ProductName = productName;
}

getBillExpiry(){
  this.sp.show()
  let Parem = '';
  this.todaydate = moment(new Date()).format('YYYY-MM-DD');
  if (this.BillExpiry.FromDate !== '' && this.BillExpiry.FromDate !== null){
    let FromDate =  moment(this.BillExpiry.FromDate).format('YYYY-MM-DD')
    Parem = Parem + ' and DATE_FORMAT(billdetail.ProductExpDate, "%Y-%m-%d") between ' +  `'${FromDate}'`; }

  if (this.BillExpiry.ToDate !== '' && this.BillExpiry.ToDate !== null){
    let ToDate =  moment(this.BillExpiry.ToDate).format('YYYY-MM-DD')
    Parem = Parem + ' and ' +  `'${ToDate}'`; }
    
  if (this.BillExpiry.ShopID != 0 ){
    Parem = Parem + ' and billmaster.ShopID IN ' +  `(${this.BillExpiry.ShopID})`;}

  if (this.BillExpiry.CustomerID !== 0){
    Parem = Parem + ' and billmaster.CustomerID = ' +  this.BillExpiry.CustomerID ; }

  if (this.BillExpiry.CustomerGSTNo !== 0){
    Parem = Parem + ' and billmaster.GSTNo = ' +  this.BillExpiry.CustomerGSTNo ; }

  if (this.BillExpiry.PaymentStatus !== 0 && this.BillExpiry.PaymentStatus !== null &&  this.BillExpiry.PaymentStatus !== 'All'){
    Parem = Parem + ' and billmaster.PaymentStatus = '  + `'${this.BillExpiry.PaymentStatus}'`; }

  if (this.BillExpiry.ProductStatus !== '' && this.BillExpiry.ProductStatus !== null  && this.BillExpiry.ProductStatus !== 'All'){
    Parem = Parem + ' and billdetail.ProductStatus = '  + `'${this.BillExpiry.ProductStatus}'`; }

  if (this.BillExpiry.ProductCategory  !== 0){
    Parem = Parem + ' and billdetail.ProductTypeID = ' +  this.BillExpiry.ProductCategory;
    this.filter3();}

  if (this.BillExpiry.ProductName !== '' ) {
    Parem = Parem + ' and billdetail.ProductName Like ' + "'" + this.BillExpiry.ProductName.trim() + "%'"; }

  if (this.BillExpiry.Option !== '' && this.BillExpiry.Option !== null && this.BillExpiry.Option !== 0) {
    Parem = Parem + ' and barcodemasternew.Option = ' + `'${this.BillExpiry.Option}'`;
  }

  if (this.BillExpiry.GSTPercentage !== 0){
    Parem = Parem + ' and billdetail.GSTPercentage = '  + `'${this.BillExpiry.GSTPercentage}'`; }

  if (this.BillExpiry.GSTType !== 0){
    Parem = Parem + ' and billdetail.GSTType = '  + `'${this.BillExpiry.GSTType}'`; }

  
  const subs: Subscription =  this.bill.getSalereportsDetail(Parem).subscribe({
    next: (res: any) => {
      if(res.success){
        this.as.successToast(res.message)
        this.ExpiryList = res.data
        this.ExpiryList.forEach((element: any) => {
          if(element.ProductExpDate < this.todaydate) {
            element.Color = true;
          } else {
            element.Color = false;
          }
        });
        this.ExpirytotalQty = res.calculation[0].totalQty;
        this.ExpirytotalDiscount = res.calculation[0].totalDiscount;
        this.ExpirytotalUnitPrice = res.calculation[0].totalUnitPrice;
        this.ExpirytotalGstAmount = res.calculation[0].totalGstAmount;
        this.ExpirytotalAmount = res.calculation[0].totalAmount;
        this.gstExpiry = res.calculation[0].gst_details
      }else{
        this.as.errorToast(res.message)
      }
      this.sp.hide()
    },
    error: (err: any) => console.log(err.message),
    complete: () => subs.unsubscribe(),
  });
}

exportAsXLSXExpiry(): void {
  let element = document.getElementById('saleExpiryExcel');
  const ws: XLSX.WorkSheet =XLSX.utils.table_to_sheet(element);
  const wb: XLSX.WorkBook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, 'Sale Product Expiry Report.xlsx');
}

openModalExpiry(content: any) {
  this.modalService.open(content, { centered: true , backdrop : 'static', keyboard: false,size: 'sm'});
}

BillExpirysFromReset(){
  this.BillExpiry =  { 
  FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, CustomerID: 0,  CustomerGSTNo:0, PaymentStatus: 0, ProductStatus:'All', ProductCategory:0, ProductName: '', GSTType:0, GSTPercentage:0, Status:0, Option:0, 
  };
  this.ExpiryList = [];
  this.ExpirytotalQty = 0;
  this.ExpirytotalDiscount = 0;
  this.ExpirytotalUnitPrice = 0;
  this.ExpirytotalGstAmount = 0;
  this.ExpirytotalAmount = 0;
  this.specList3 = [];
}

onChange(event: { toUpperCase: () => any; toTitleCase: () => any; }) {
  if (this.companySetting.DataFormat === '1') {
    event = event.toUpperCase()
  } else if (this.companySetting.DataFormat == '2') {
    event = event.toTitleCase()
  }
  return event;
}
}
