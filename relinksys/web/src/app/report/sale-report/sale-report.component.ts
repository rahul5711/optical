import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { ProductService } from 'src/app/service/product.service';
import { Observable, Subscription, debounceTime, elementAt, map, startWith } from 'rxjs';
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
import Swal from 'sweetalert2';
import * as saveAs from 'file-saver';
import { ExcelService } from 'src/app/service/helpers/excel.service';
import { NgxEchartsModule } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import autoTable from 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: AutoTableOptions) => jsPDF;
  }
}

interface AutoTableOptions {
  startY?: number;
  head?: string[][];
  body?: string[][];
  html?: string | HTMLElement;
  theme?: 'striped' | 'grid' | 'plain';
  styles?: any; // Aap yahan specific styles define kar sakte hain
  headStyles?: any;
  bodyStyles?: any;
  alternateRowStyles?: any;
  // Aur bhi options ho sakte hain jo aap autoTable documentation mein dekh sakte hain
}

@Component({
  selector: 'app-sale-report',
  templateUrl: './sale-report.component.html',
  styleUrls: ['./sale-report.component.css']
})
export class SaleReportComponent implements OnInit {
  chartOptions: EChartsOption = {};
    loading = false;

  env = environment;
  company = JSON.parse(localStorage.getItem('company') || '');
  shop: any = JSON.parse(localStorage.getItem('shop') || '');
  user: any = JSON.parse(localStorage.getItem('user') || '');
  selectedShop: any = JSON.parse(localStorage.getItem('selectedShop') || '');
  permission = JSON.parse(localStorage.getItem('permission') || '[]');
  companySetting: any = JSON.parse(localStorage.getItem('companysetting') || '[]');

  myControl = new FormControl('All');
  myControl1 = new FormControl('All');
  filteredOptions: any;
  filteredOption2: any;
  searchValue: any = '';
  Productsearch: any = '';
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
    private customer: CustomerService,
    private excelService: ExcelService,
  ) { }

  shopList: any = [];
  employeeList: any = [];
  customerList: any = [];
  customerListGST: any = [];
  BillMasterList: any = [];
  maxPaymentDetails = 8;
  totalQty: any = 0;
  totalDiscount: any = 0;
  totalUnitPrice: any = 0;
  totalAmount: any = 0;
  totalAddlDiscount: any;
  totalGstAmount: any;
  totalBalance = 0
  totalPaid = 0
  gstMaster: any;
  multiCheck: any;

  selectedProduct: any;
  prodList: any;
  specList: any = [];
  gstList: any;
  BillDetailList: any = [];
  DetailtotalQty: any;
  DetailtotalDiscount: any;
  DetailtotalUnitPrice: any;
  DetailtotalAmount: any;
  DetailtotalGstAmount: any;
  gstdetails: any
  DetailtotalPorfit: any = 0
  DetailtotalPrice: any = 0
  DetailtotalAddlDiscount: any = 0
  dataProductWise:any

  v: any = []
  BillServiceList: any;
  ServiceAmount: any
  ServicetotalAmount: any;
  ServicetotalDiscountAmount: any;
  ServicetotalGstAmount: any;
  ServicetotalSUBTOTAL: any;
  ServiceGtotalAmount: any;
  ServicetotalAddlDiscount: any = 0;
  gstService: any

  totalQtyM: any;
  totalDiscountM: any;
  totalUnitPriceM: any;
  totalGstAmountM: any;
  totalAmountM: any;
  totalAddlDiscountM: any;
  totalPaidM: any;
  gstMasterM: any;
  totalBalanceM: any;

  BillMaster: any = {
    FilterTypes: 'BillDate', FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, EmployeeID: 0, CustomerID: 0, CustomerGSTNo: 0, PaymentStatus: 0, ProductStatus: 'All', BillType: 'All'
  };

  Billdetail: any = {
    FilterTypes: 'BillDate', FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, CustomerID: 0, CustomerGSTNo: 0, PaymentStatus: 0, ProductStatus: 'All', ProductCategory: 0, ProductName: '', GSTType: 0, GSTPercentage: 0, Status: 0, Option: 0,Barcode:''
  };

  service: any = {
    FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, BillType: 'All'
  };

  cancel: any = {
    FilterTypes: 'BillDate', FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, CustomerGSTNo: 0, ProductCategory: 0, ProductName: '', GSTType: 0, GSTPercentage: 0, Status: 0, Option: 0, CancelStatus: 0
  };

  pending: any = {
    FilterTypes: 'BillDate', FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, CustomerGSTNo: 0, ProductCategory: 0, ProductName: '', GSTType: 0, GSTPercentage: 0, Status: 0, Option: 0, ProductStatus: 'pending'
  };

  BillExpiry: any = {
    FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, CustomerID: 0, CustomerGSTNo: 0, PaymentStatus: 0, ProductStatus: 'All', ProductCategory: 0, ProductName: '', GSTType: 0, GSTPercentage: 0, Status: 0, Option: 0,
  };

  OForm: any = {
    FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, PaymentStatus: 0, ProductStatus: 'All', ProductCategory: 0, ProductName: '', Status: 0, Option: 0,
  };

  MForm: any = {
    FilterTypes: 'OrderDate', FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0,
  };

  dataRegister: any = {
    FromDate: '', ToDate: '',ShopID:0
  }

  RegisterList: any = []
  RegisterDetailList: any = []
  RegisterAmount:any = 0
  RegisterPaid:any = 0
  RegisterBalance:any = 0
  FilterTypeR:any
  shopLists: any = []
  serviceType: any = []
  ManualList: any = []
  MonthYearHead:any
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

  viewProductCancelReport = false
  addProductCancelReport = false
  editProductCancelReport = false
  deleteProductCancelReport = false

  viewSaleProductPendingReport = false
  addSaleProductPendingReport = false
  editSaleProductPendingReport = false
  deleteSaleProductPendingReport = false

  viewSaleProductExpiryReport = false
  addSaleProductExpiryReport = false
  editSaleProductExpiryReport = false
  deleteSaleProductExpiryReport = false

  employeeHide = false

  cancelList: any = [];
  prodList1: any;
  specList1: any = [];
  canceltotalQty: any;
  canceltotalDiscount: any;
  canceltotalUnitPrice: any;
  canceltotalAmount: any;
  canceltotalGstAmount: any;
  gstcancels: any

  pendingList: any = [];
  prodList2: any;
  specList2: any = [];
  pendingtotalQty: any;
  pendingtotalDiscount: any;
  pendingtotalUnitPrice: any;
  pendingtotalAmount: any;
  pendingtotalGstAmount: any;
  gstpending: any

  ExpiryList: any = [];
  prodList3: any;
  specList3: any = [];
  ExpirytotalQty: any;
  ExpirytotalDiscount: any;
  ExpirytotalUnitPrice: any;
  ExpirytotalAmount: any;
  ExpirytotalGstAmount: any;
  gstExpiry: any
  todaydate: any;

  pieChart:any
  orderList: any = [];
  prodList4: any;
  specList4: any = [];
  ordertotalQty: any;
  ordertotalSaleQty: any;



  columnVisibility: any = {
    SNo: true,
    InvoiceDate: true,
    InvoiceNo: true,
    CustomerName: true,
    MobileNo: true,
    PaymentStatus: true,
    Qty: true,
    Discount: true,
    SubTotal: true,
    TAXType: true,
    TAXAmount: true,
    CGSTAmt: true,
    SGSTAmt: true,
    IGSTAmt: true,
    GrandTotal: true,
    AddDiscount: true,
    Paid: true,
    Balance: true,
    ProductStatus: true,
    DeliveryDate: true,
    Cust_GSTNo: true,
    ShopName: true,
  };

  columnVisibility1: any = {
    SNo: true,
    InvoiceDate: true,
    DeliveryDate: true,
    InvoiceNo: true,
    CustomerName: true,
    MobileNo: true,
    ProductTypeName: true,
    Option: true,
    HSNCode: true,
    ProductName: true,
    UnitPrice: true,
    Quantity: true,
    DiscountAmount: true,
    SubTotal: true,
    TAXType: true,
    TAX: true,
    TAXAmount: true,
    CGST: true,
    CGSTAmt: true,
    SGST: true,
    SGSTAmt: true,
    IGST: true,
    IGSTAmt: true,
    GrandTotal: true,
    Barcode: true,
    PaymentStatus: true,
    ProductStatus: true,
    ProductDeliveryDate: true,
    Cust_TAXNo: true,
    Status: true,
    ShopName: true,
    PurchasePrice: true,
    Profit: true,
  };

  columnVisibility2: any = {
    SNo: true,
    InvoiceDate: true,
    ShopName: true,
    CustomerName: true,
    MobileNo: true,
    BillDate: true,
    InvoiceNo: true,
    Description: true,
    SubTotal: true,
    TAXType: true,
    TAX: true,
    TAXAmount: true,
    GrandTotal: true,
  };

  columnVisibility3: any = {
    SNo: true,
    InvoiceDate: true,
    DeliveryDate: true,
    InvoiceNo: true,
    CustomerName: true,
    MobileNo: true,
    ProductTypeName: true,
    Option: true,
    HSNCode: true,
    ProductName: true,
    UnitPrice: true,
    Quantity: true,
    DiscountAmount: true,
    SubTotal: true,
    TAXType: true,
    TAX: true,
    TAXAmount: true,
    GrandTotal: true,
    Barcode: true,
    PaymentStatus: true,
    ProductStatus: true,
    ProductDeliveryDate: true,
    Cust_TAXNo: true,
    Status: true,
    CancelStatus: true,
  };
  columnVisibility4: any = {
    SNo: true,
    InvoiceDate: true,
    DeliveryDate: true,
    InvoiceNo: true,
    CustomerName: true,
    MobileNo: true,
    ProductTypeName: true,
    Option: true,
    HSNCode: true,
    ProductName: true,
    UnitPrice: true,
    Quantity: true,
    DiscountAmount: true,
    SubTotal: true,
    TAXType: true,
    TAX: true,
    TAXAmount: true,
    GrandTotal: true,
    Barcode: true,
    ProductStatus: true,
    Cust_TAXNo: true,
    Status: true,
    CancelStatus: true,
  };

  columnVisibility5: any = {
    SNo: true,
    InvoiceNo: true,
    CustomerName: true,
    MobileNo: true,
    ProductTypeName: true,
    ProductName: true,
    UnitPrice: true,
    Quantity: true,
    DiscountAmount: true,
    SubTotal: true,
    TAXType: true,
    TAX: true,
    TAXAmount: true,
    GrandTotal: true,
    Barcode: true,
    PaymentStatus: true,
    ProductStatus: true,
    ProductDeliveryDate: true,
    ProductExpiryDate: true,
    ShopName: true,
  };

  gstdividelist: any = []
  IGstShow = false

  ids: any
  ngOnInit(): void {

    this.permission.forEach((element: any) => {
      if (element.ModuleName === 'SaleReport') {
        this.viewSaleReport = element.View;
        this.addSaleReport = element.Add;
        this.editSaleReport = element.Edit;
        this.deleteSaleReport = element.Delete;
      } else if (element.ModuleName === 'SaleProductReport') {
        this.viewSaleProductReport = element.View;
        this.addSaleProductReport = element.Add;
        this.editSaleProductReport = element.Edit;
        this.deleteSaleProductReport = element.Delete;
      } else if (element.ModuleName === 'SaleServiceReport') {
        this.viewSaleServiceReport = element.View;
        this.addSaleServiceReport = element.Add;
        this.editSaleServiceReport = element.Edit;
        this.deleteSaleServiceReport = element.Delete;
      } else if (element.ModuleName === 'ProductCancelReport') {
        this.viewProductCancelReport = element.View;
        this.addProductCancelReport = element.Add;
        this.editProductCancelReport = element.Edit;
        this.deleteProductCancelReport = element.Delete;
      } else if (element.ModuleName === 'ProductPendingReport') {
        this.viewSaleProductPendingReport = element.View;
        this.addSaleProductPendingReport = element.Add;
        this.editSaleProductPendingReport = element.Edit;
        this.deleteSaleProductPendingReport = element.Delete;
      } else if (element.ModuleName === 'ProductExpiryReport') {
        this.viewSaleProductExpiryReport = element.View;
        this.addSaleProductExpiryReport = element.Add;
        this.editSaleProductExpiryReport = element.Edit;
        this.deleteSaleProductExpiryReport = element.Delete;
      }
    });

    this.bill.employeeList$.subscribe((list:any) => {
      this.employeeList = list
    });

    this.bill.gstCustomerList$.subscribe((list:any) => {
      this.customerListGST = list
    });

    this.bill.taxList$.subscribe((list:any) => {
     this.gstList = list
    });

    this.bill.productList$.subscribe((list:any) => {
      this.prodList = list
      this.prodList1 = list
      this.prodList2 = list
      this.prodList3 = list
      this.prodList4 = list
    });

    // this.dropdownUserlist()
    // this.getProductList();
    // this.getProductList1();
    // this.getProductList2();
    // this.getProductList3();
    // this.getProductList4();
    // this.getGSTList();

    // this.dropdownCustomerlist();
    // this.dropdownCustomerGSTNo();
    // this.BillMaster.FromDate = moment().format('YYYY-MM-DD');
    // this.BillMaster.ToDate = moment().format('YYYY-MM-DD');
    // this.getBillMaster();

    if (!this.editSaleReport) {
      this.employeeHide = true
    } else if (this.BillMaster.FromDate === moment().format('YYYY-MM-DD')) {
      this.employeeHide = true
    }

    if (this.user.UserGroup === 'Employee') {
      this.shopList = this.shop;
      this.BillMaster.ShopID = this.shopList[0].ShopID
      this.Billdetail.ShopID = this.shopList[0].ShopID
      this.service.ShopID = this.shopList[0].ShopID
      this.cancel.ShopID = this.shopList[0].ShopID
      this.pending.ShopID = this.shopList[0].ShopID
      this.dataRegister.ShopID = this.shopList[0].ShopID
    } else {
      // this.dropdownShoplist()
       this.bill.shopList$.subscribe((list:any) => {
       this.shopList = list
       let shop = list
       this.shopLists = shop.filter((s: any) => s.ID === Number(this.selectedShop[0]));
       this.shopLists = '/ ' + this.shopLists[0].Name + ' (' + this.shopLists[0].AreaName + ')'
    });
    }

  }

  getChangeDate() {
    const currentDate = moment().format('YYYY-MM-DD');
    if (this.user.UserGroup !== "CompanyAdmin") {
      if (this.editSaleReport === false) {
        if (this.BillMaster.FromDate === currentDate) {
          this.employeeHide = true;
          this.BillMaster.PaymentStatus = 0;
        } else {
          this.employeeHide = false;
          this.BillMaster.PaymentStatus = 'Unpaid'; 276
        }
      } else {
        this.employeeHide = true;
        this.BillMaster.PaymentStatus = 0;
      }
    }
  }

  // billmaster
  dropdownShoplist() {
    this.sp.show()
    const subs: Subscription = this.ss.dropdownShoplist('').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.shopList = res.data
          let shop = res.data
          this.shopLists = shop.filter((s: any) => s.ID === Number(this.selectedShop[0]));
          this.shopLists = '/ ' + this.shopLists[0].Name + ' (' + this.shopLists[0].AreaName + ')'
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  dropdownCustomerlist() {
    this.sp.show()
    const subs: Subscription = this.customer.dropdownlist().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.customerList = res.data
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  dropdownCustomerGSTNo() {
    this.sp.show()
    const subs: Subscription = this.customer.customerGSTNumber(this.customerList).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.customerListGST = res.data
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  dropdownUserlist() {
    this.sp.show()
    const subs: Subscription = this.emp.dropdownUserlist('').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.employeeList = res.data
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getBillMaster() {
    this.sp.show()
    let Parem = '';

    if (this.BillMaster.FromDate !== '' && this.BillMaster.FromDate !== null && this.BillMaster.FilterTypes === 'All') {

      let FromDate = moment(this.BillMaster.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ( DATE_FORMAT(billmaster.BillDate, "%Y-%m-%d")  between ' + `'${FromDate}'`;
    }

    if (this.BillMaster.ToDate !== '' && this.BillMaster.ToDate !== null && this.BillMaster.FilterTypes === 'All') {
      let ToDate = moment(this.BillMaster.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'`;
    }

    if (this.BillMaster.FromDate !== '' && this.BillMaster.FromDate !== null && this.BillMaster.FilterTypes === 'BillDate') {

      let FromDate = moment(this.BillMaster.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and DATE_FORMAT(billmaster.BillDate, "%Y-%m-%d")  between ' + `'${FromDate}'`;
    }

    if (this.BillMaster.ToDate !== '' && this.BillMaster.ToDate !== null && this.BillMaster.FilterTypes === 'BillDate') {
      let ToDate = moment(this.BillMaster.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'`;
    }

    if (this.BillMaster.FromDate !== '' && this.BillMaster.FromDate !== null && this.BillMaster.FilterTypes === 'DeliveryDate') {
      let FromDate = moment(this.BillMaster.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and DATE_FORMAT(billmaster.DeliveryDate, "%Y-%m-%d") between ' + `'${FromDate}'`;
    }

    if (this.BillMaster.ToDate !== '' && this.BillMaster.ToDate !== null && this.BillMaster.FilterTypes === 'DeliveryDate') {
      let ToDate = moment(this.BillMaster.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'`;
    }

    if (this.BillMaster.FromDate !== '' && this.BillMaster.FromDate !== null && this.BillMaster.FilterTypes === 'All') {
      let FromDate = moment(this.BillMaster.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' OR DATE_FORMAT(billmaster.OrderDate, "%Y-%m-%d") between ' + `'${FromDate}'`;
    }

    if (this.BillMaster.ToDate !== '' && this.BillMaster.ToDate !== null && this.BillMaster.FilterTypes === 'All') {
      let ToDate = moment(this.BillMaster.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'` + ') ';
    }

    if (this.BillMaster.FromDate !== '' && this.BillMaster.FromDate !== null && this.BillMaster.FilterTypes === 'OrderDate') {
      let FromDate = moment(this.BillMaster.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and DATE_FORMAT(billmaster.OrderDate, "%Y-%m-%d") between ' + `'${FromDate}'`;
    }

    if (this.BillMaster.ToDate !== '' && this.BillMaster.ToDate !== null && this.BillMaster.FilterTypes === 'OrderDate') {
      let ToDate = moment(this.BillMaster.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'` + ' and billmaster.IsConvertInvoice = 0';
    }

    if (this.BillMaster.ShopID != 0) {
      Parem = Parem + ' and billmaster.ShopID IN ' + `(${this.BillMaster.ShopID})`;
    }

    if (this.BillMaster.EmployeeID !== 0) {
      Parem = Parem + ' and billmaster.Employee = ' + this.BillMaster.EmployeeID;
    }

    if (this.BillMaster.CustomerID != 0) {
      Parem = Parem + ' and billmaster.CustomerID = ' + this.BillMaster.CustomerID;
    }

    if (this.BillMaster.CustomerGSTNo !== 0) {
      Parem = Parem + ' and customer.GSTNo = ' + this.BillMaster.CustomerGSTNo;
    }

    if (this.BillMaster.PaymentStatus !== 0 && this.BillMaster.PaymentStatus !== null && this.BillMaster.PaymentStatus !== 'All') {
      Parem = Parem + ' and billmaster.PaymentStatus = ' + `'${this.BillMaster.PaymentStatus}'`;
    }

    if (this.BillMaster.ProductStatus !== '' && this.BillMaster.ProductStatus !== null && this.BillMaster.ProductStatus !== 'All') {
      Parem = Parem + ' and billmaster.ProductStatus = ' + `'${this.BillMaster.ProductStatus}'`;
    }

    if (this.BillMaster.BillType !== '' && this.BillMaster.BillType !== null && this.BillMaster.BillType !== 'All') {
      Parem = Parem + ' and billmaster.BillType = ' + `'${this.BillMaster.BillType}'`;
    }

    const subs: Subscription = this.bill.getSalereport(Parem).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.as.successToast(res.message)
          this.BillMasterList = res.data;
          this.totalBalance = 0
          this.totalPaid = 0

          for (const billMaster of this.BillMasterList) {
            let totalDueAmountPlus = 0;
            this.BillMasterList.forEach((e: any) => {

              if (e.CustomerID === billMaster.CustomerID) {
                totalDueAmountPlus += e.DueAmount;
              }
            });
            billMaster.TotalDueAmount = totalDueAmountPlus;
            this.totalBalance = this.totalBalance + billMaster.DueAmount;
          }

          this.totalQty = res.calculation[0].totalQty;
          this.totalDiscount = (parseFloat(res.calculation[0].totalDiscount)).toFixed(2);
          this.totalUnitPrice = (parseFloat(res.calculation[0].totalSubTotalPrice)).toFixed(2);
          this.totalGstAmount = (parseFloat(res.calculation[0].totalGstAmount)).toFixed(2);
          this.totalAmount = (parseFloat(res.calculation[0].totalAmount)).toFixed(2);
          this.totalAddlDiscount = (parseFloat(res.calculation[0].totalAddlDiscount)).toFixed(2);
          let p = + this.totalAmount - this.totalBalance;
          this.totalPaid = this.convertToDecimal(p, 2);
          this.gstMaster = res.calculation[0].gst_details
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }


  getBillMasterAllBalance() {
    this.sp.show()
    let Parem = '';

    Parem = Parem + ' and  DATE_FORMAT(billmaster.BillDate, "%Y-%m-%d")  between ' + '0001-01-01';
    Parem = Parem + ' and ' + '9000-01-01';
    Parem = Parem + ' and billmaster.PaymentStatus = ' + `'Unpaid'`;
    if (this.BillMaster.ShopID != 0) {
      Parem = Parem + ' and billmaster.ShopID IN ' + `(${this.BillMaster.ShopID})`;
    }

    if (this.BillMaster.EmployeeID !== 0) {
      Parem = Parem + ' and billmaster.Employee = ' + this.BillMaster.EmployeeID;
    }

    if (this.BillMaster.CustomerID != 0) {
      Parem = Parem + ' and billmaster.CustomerID = ' + this.BillMaster.CustomerID;
    }

    if (this.BillMaster.CustomerGSTNo !== 0) {
      Parem = Parem + ' and customer.GSTNo = ' + this.BillMaster.CustomerGSTNo;
    }

    if (this.BillMaster.ProductStatus !== '' && this.BillMaster.ProductStatus !== null && this.BillMaster.ProductStatus !== 'All') {
      Parem = Parem + ' and billmaster.ProductStatus = ' + `'${this.BillMaster.ProductStatus}'`;
    }

    if (this.BillMaster.BillType !== '' && this.BillMaster.BillType !== null && this.BillMaster.BillType !== 'All') {
      Parem = Parem + ' and billmaster.BillType = ' + `'${this.BillMaster.BillType}'`;
    }

    const subs: Subscription = this.bill.getSalereport(Parem).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.as.successToast(res.message)
          this.BillMasterList = res.data;
          this.totalBalance = 0
          this.totalPaid = 0

          for (const billMaster of this.BillMasterList) {
            let totalDueAmountPlus = 0;
            this.BillMasterList.forEach((e: any) => {

              if (e.CustomerID === billMaster.CustomerID) {
                totalDueAmountPlus += e.DueAmount;
              }
            });
            billMaster.TotalDueAmount = totalDueAmountPlus;
            this.totalBalance = this.totalBalance + billMaster.DueAmount;
          }

          this.totalQty = res.calculation[0].totalQty;
          this.totalDiscount = (parseFloat(res.calculation[0].totalDiscount)).toFixed(2);
          this.totalUnitPrice = (parseFloat(res.calculation[0].totalSubTotalPrice)).toFixed(2);
          this.totalGstAmount = (parseFloat(res.calculation[0].totalGstAmount)).toFixed(2);
          this.totalAmount = (parseFloat(res.calculation[0].totalAmount)).toFixed(2);
          this.totalAddlDiscount = (parseFloat(res.calculation[0].totalAddlDiscount)).toFixed(2);
          let p = + this.totalAmount - this.totalBalance;
          this.totalPaid = this.convertToDecimal(p, 2);
          this.gstMaster = res.calculation[0].gst_details
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }


  getBillMasterExport() {
    this.sp.show()
    let Parem = '';

    if (this.BillMaster.FromDate !== '' && this.BillMaster.FromDate !== null && this.BillMaster.FilterTypes === 'All') {
      let FromDate = moment(this.BillMaster.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ( DATE_FORMAT(billmaster.BillDate, "%Y-%m-%d")  between ' + `'${FromDate}'`;
    }

    if (this.BillMaster.ToDate !== '' && this.BillMaster.ToDate !== null && this.BillMaster.FilterTypes === 'All') {
      let ToDate = moment(this.BillMaster.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'`;
    }

    if (this.BillMaster.FromDate !== '' && this.BillMaster.FromDate !== null && this.BillMaster.FilterTypes === 'All') {
      let FromDate = moment(this.BillMaster.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' OR DATE_FORMAT(billmaster.OrderDate, "%Y-%m-%d") between ' + `'${FromDate}'`;
    }

    if (this.BillMaster.ToDate !== '' && this.BillMaster.ToDate !== null && this.BillMaster.FilterTypes === 'All') {
      let ToDate = moment(this.BillMaster.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'` + ') ';
    }
    if (this.BillMaster.FromDate !== '' && this.BillMaster.FromDate !== null && this.BillMaster.FilterTypes === 'BillDate') {
      let FromDate = moment(this.BillMaster.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and DATE_FORMAT(billmaster.BillDate, "%Y-%m-%d")  between ' + `'${FromDate}'`;
    }

    if (this.BillMaster.ToDate !== '' && this.BillMaster.ToDate !== null && this.BillMaster.FilterTypes === 'BillDate') {
      let ToDate = moment(this.BillMaster.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'`;
    }

    if (this.BillMaster.FromDate !== '' && this.BillMaster.FromDate !== null && this.BillMaster.FilterTypes === 'DeliveryDate') {
      let FromDate = moment(this.BillMaster.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and DATE_FORMAT(billmaster.DeliveryDate, "%Y-%m-%d") between ' + `'${FromDate}'`;
    }

    if (this.BillMaster.ToDate !== '' && this.BillMaster.ToDate !== null && this.BillMaster.FilterTypes === 'DeliveryDate') {
      let ToDate = moment(this.BillMaster.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'`;
    }

    if (this.BillMaster.FromDate !== '' && this.BillMaster.FromDate !== null && this.BillMaster.FilterTypes === 'OrderDate') {
      let FromDate = moment(this.BillMaster.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and DATE_FORMAT(billmaster.OrderDate, "%Y-%m-%d") between ' + `'${FromDate}'`;
    }

    if (this.BillMaster.ToDate !== '' && this.BillMaster.ToDate !== null && this.BillMaster.FilterTypes === 'OrderDate') {
      let ToDate = moment(this.BillMaster.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'` + ' and billmaster.IsConvertInvoice = 0';
    }

    if (this.BillMaster.ShopID != 0) {
      Parem = Parem + ' and billmaster.ShopID IN ' + `(${this.BillMaster.ShopID})`;
    }

    if (this.BillMaster.EmployeeID !== 0) {
      Parem = Parem + ' and billmaster.Employee = ' + this.BillMaster.EmployeeID;
    }

    if (this.BillMaster.CustomerID != 0) {
      Parem = Parem + ' and billmaster.CustomerID = ' + this.BillMaster.CustomerID;
    }

    if (this.BillMaster.CustomerGSTNo !== 0) {
      Parem = Parem + ' and billmaster.GSTNo = ' + this.BillMaster.CustomerGSTNo;
    }

    if (this.BillMaster.PaymentStatus !== 0 && this.BillMaster.PaymentStatus !== null && this.BillMaster.PaymentStatus !== 'All') {
      Parem = Parem + ' and billmaster.PaymentStatus = ' + `'${this.BillMaster.PaymentStatus}'`;
    }

    if (this.BillMaster.ProductStatus !== '' && this.BillMaster.ProductStatus !== null && this.BillMaster.ProductStatus !== 'All') {
      Parem = Parem + ' and billmaster.ProductStatus = ' + `'${this.BillMaster.ProductStatus}'`;
    }

    if (this.BillMaster.BillType !== '' && this.BillMaster.BillType !== null && this.BillMaster.BillType !== 'All') {
      Parem = Parem + ' and billmaster.BillType = ' + `'${this.BillMaster.BillType}'`;
    }

    const subs: Subscription = this.bill.getBillMasterExport(Parem).subscribe({
      next: (res: any) => {
        this.downloadFile(res);
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  public downloadFile(response: any, fileName: any = '') {
    const blob = new Blob([response.body], { type: response.headers.get('content-type') });
    fileName = fileName || response.headers.get('Content-Disposition').split(';')[1].split('=')[1].replace(/\"/g, '')
    const file = new File([blob], fileName, { type: response.headers.get('content-type') });
    saveAs(file);
  }

  convertToDecimal(num: any, x: any) {
    return Number(Math.round(parseFloat(num + 'e' + x)) + 'e-' + x);
  }
  openModalSale(content3: any) {
    this.modalService.open(content3, { centered: true, backdrop: 'static', keyboard: false, size: 'sm' });
  }
  openModalAdd(content88: any) {
    this.modalService.open(content88, { centered: true, backdrop: 'static', keyboard: false, size: 'sm' });
  }

  exportAsXLSXMaster(): void {
    let element = document.getElementById('SaleExcel');
    const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(element);
    delete ws['A2'];
    // Initialize column widths array
    const colWidths: number[] = [];

    // Iterate over all cells to determine maximum width for each column
    XLSX.utils.sheet_to_json(ws, { header: 1 }).forEach((row: any = []) => {
      row.forEach((cell: any, index: number) => {
        const cellValue = cell ? String(cell) : '';
        colWidths[index] = Math.max(colWidths[index] || 0, cellValue.length);
      });
    });

    // Set column widths in the worksheet
    ws['!cols'] = colWidths.map((width: number) => ({ wch: width + 2 }));

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, 'Sale Report.xlsx');
  }

  billMasterFromReset() {
    if(this.user.UserGroup == 'CompanyAdmin'){
        this.BillMaster = {
      FilterTypes: 'BillDate', FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, EmployeeID: 0, CustomerID: 0, CustomerGSTNo: 0, PaymentStatus: 0, ProductStatus: 'All', BillType: 'All'
    };
    }else{
    this.BillMaster = {
      FilterTypes: 'BillDate', FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: this.shopList[0].ShopID, EmployeeID: 0, CustomerID: 0, CustomerGSTNo: 0, PaymentStatus: 0, ProductStatus: 'All', BillType: 'All'
    };
    }

    this.BillMasterList = []
    this.totalQty = 0;
    this.totalDiscount = 0;
    this.totalUnitPrice = 0;
    this.totalAmount = 0;
    this.totalGstAmount = 0;
    this.gstMaster = [];
    this.totalBalance = 0
    this.totalPaid = 0;
    this.totalAddlDiscount = 0;
    this.maxPaymentDetails = 8;
  }
  // billmaster

  // billdetails product

  getProductList() {
    const subs: Subscription = this.ps.getList().subscribe({
      next: (res: any) => {
        this.prodList = res.data.sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getFieldList() {
    if (this.Billdetail.ProductCategory !== 0) {
      this.prodList.forEach((element: any) => {
        if (element.ID === this.Billdetail.ProductCategory) {
          this.selectedProduct = element.Name;
        }
      })
      const subs: Subscription = this.ps.getFieldList(this.selectedProduct).subscribe({
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
        const subs: Subscription = this.ps.getProductSupportData('0', element.SptTableName).subscribe({
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

  getFieldSupportData(index: any) {
    this.specList.forEach((element: any) => {
      if (element.Ref === this.specList[index].FieldName.toString()) {
        const subs: Subscription = this.ps.getProductSupportData(this.specList[index].SelectedValue, element.SptTableName).subscribe({
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

  getGSTList() {
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
        let valueToAdd = element.SelectedValue;
        valueToAdd = valueToAdd.replace(/^\d+_/, "");
        productName = valueToAdd;
      } else if (element.SelectedValue !== '') {
        let valueToAdd = element.SelectedValue;
            valueToAdd = valueToAdd.replace(/^\d+_/, "");
        productName += '/' + valueToAdd;
      }
    });
     this.Billdetail.ProductName = productName;
  }

  getBillDetails() {
    this.sp.show()
    let Parem = '';

    if (this.Billdetail.FromDate !== '' && this.Billdetail.FromDate !== null && this.Billdetail.FilterTypes === 'All') {
      let FromDate = moment(this.Billdetail.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ( DATE_FORMAT(billmaster.BillDate, "%Y-%m-%d") between ' + `'${FromDate}'`;
    }

    if (this.Billdetail.ToDate !== '' && this.Billdetail.ToDate !== null && this.Billdetail.FilterTypes === 'All') {
      let ToDate = moment(this.Billdetail.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'`;
    }

    if (this.Billdetail.FromDate !== '' && this.Billdetail.FromDate !== null && this.Billdetail.FilterTypes === 'BillDate') {
      let FromDate = moment(this.Billdetail.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and DATE_FORMAT(billmaster.BillDate, "%Y-%m-%d") between ' + `'${FromDate}'`;
    }

    if (this.Billdetail.ToDate !== '' && this.Billdetail.ToDate !== null && this.Billdetail.FilterTypes === 'BillDate') {
      let ToDate = moment(this.Billdetail.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'`;
    }

    if (this.Billdetail.FromDate !== '' && this.Billdetail.FromDate !== null && this.Billdetail.FilterTypes === 'DeliveryDate') {
      let FromDate = moment(this.Billdetail.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and DATE_FORMAT(billmaster.DeliveryDate, "%Y-%m-%d") between ' + `'${FromDate}'`;
    }

    if (this.Billdetail.ToDate !== '' && this.Billdetail.ToDate !== null && this.Billdetail.FilterTypes === 'DeliveryDate') {
      let ToDate = moment(this.Billdetail.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'`;
    }

    if (this.Billdetail.FromDate !== '' && this.Billdetail.FromDate !== null && this.Billdetail.FilterTypes === 'OrderDate') {
      let FromDate = moment(this.Billdetail.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and DATE_FORMAT(billmaster.OrderDate, "%Y-%m-%d") between ' + `'${FromDate}'`;
    }

    if (this.Billdetail.ToDate !== '' && this.Billdetail.ToDate !== null && this.Billdetail.FilterTypes === 'OrderDate') {
      let ToDate = moment(this.Billdetail.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'` + ' and billmaster.IsConvertInvoice = 0';
    }
    if (this.Billdetail.FromDate !== '' && this.Billdetail.FromDate !== null && this.Billdetail.FilterTypes === 'All') {
      let FromDate = moment(this.Billdetail.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' OR DATE_FORMAT(billmaster.OrderDate, "%Y-%m-%d") between ' + `'${FromDate}'`;
    }

    if (this.Billdetail.ToDate !== '' && this.Billdetail.ToDate !== null && this.Billdetail.FilterTypes === 'All') {
      let ToDate = moment(this.Billdetail.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'` + ' )';
    }



    if (this.Billdetail.ShopID != 0) {
      Parem = Parem + ' and billmaster.ShopID IN ' + `(${this.Billdetail.ShopID})`;
    }

    if (this.Billdetail.CustomerID !== 0) {
      Parem = Parem + ' and billmaster.CustomerID = ' + this.Billdetail.CustomerID;
    }

    if (this.Billdetail.CustomerGSTNo !== 0) {
      Parem = Parem + ' and billmaster.GSTNo = ' + this.Billdetail.CustomerGSTNo;
    }

    if (this.Billdetail.PaymentStatus !== 0 && this.Billdetail.PaymentStatus !== null && this.Billdetail.PaymentStatus !== 'All') {
      Parem = Parem + ' and billmaster.PaymentStatus = ' + `'${this.Billdetail.PaymentStatus}'`;
    }

    if (this.Billdetail.ProductStatus !== '' && this.Billdetail.ProductStatus !== null && this.Billdetail.ProductStatus !== 'All') {
      Parem = Parem + ' and billdetail.ProductStatus = ' + `'${this.Billdetail.ProductStatus}'`;
    }

    if (this.Billdetail.ProductCategory !== 0) {
      Parem = Parem + ' and billdetail.ProductTypeID = ' + this.Billdetail.ProductCategory;
      this.filter();
    }

    if (this.Billdetail.ProductName !== '') {
      Parem = Parem + ' and billdetail.ProductName Like ' + "'" + this.Billdetail.ProductName.trim() + "%'";
    }

    if (this.Billdetail.Option !== '' && this.Billdetail.Option !== null && this.Billdetail.Option !== 0) {
      Parem = Parem + ' and barcodemasternew.Option = ' + `'${this.Billdetail.Option}'`;
    }

    if (this.Billdetail.GSTPercentage !== 0) {
      Parem = Parem + ' and billdetail.GSTPercentage = ' + `'${this.Billdetail.GSTPercentage}'`;
    }

    if (this.Billdetail.GSTType !== 0) {
      Parem = Parem + ' and billdetail.GSTType = ' + `'${this.Billdetail.GSTType}'`;
    }

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

    if (this.Billdetail.Barcode !== '') {
      Parem = Parem + ' and billdetail.Barcode = ' + `'${this.Billdetail.Barcode}'`;
    }

    const subs: Subscription = this.bill.getSalereportsDetail(Parem, this.Productsearch).subscribe({
      next: (res: any) => {
        if (res.success) {
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
          this.DetailtotalAddlDiscount = res.calculation[0].totalAddlDiscount;
          this.dataProductWise = res.dataProductWise;
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getBillDetailsExport() {
    this.sp.show()
    let Parem = '';

       if (this.Billdetail.FromDate !== '' && this.Billdetail.FromDate !== null && this.Billdetail.FilterTypes === 'All') {
      let FromDate = moment(this.Billdetail.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ( DATE_FORMAT(billmaster.BillDate, "%Y-%m-%d") between ' + `'${FromDate}'`;
    }

    if (this.Billdetail.ToDate !== '' && this.Billdetail.ToDate !== null && this.Billdetail.FilterTypes === 'All') {
      let ToDate = moment(this.Billdetail.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'`;
    }

      if (this.Billdetail.FromDate !== '' && this.Billdetail.FromDate !== null && this.Billdetail.FilterTypes === 'All') {
      let FromDate = moment(this.Billdetail.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' OR DATE_FORMAT(billmaster.OrderDate, "%Y-%m-%d") between ' + `'${FromDate}'`;
    }

    if (this.Billdetail.ToDate !== '' && this.Billdetail.ToDate !== null && this.Billdetail.FilterTypes === 'All') {
      let ToDate = moment(this.Billdetail.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'` + ' )';
    }
    if (this.Billdetail.FromDate !== '' && this.Billdetail.FromDate !== null && this.Billdetail.FilterTypes === 'BillDate') {
      let FromDate = moment(this.Billdetail.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and DATE_FORMAT(billmaster.BillDate, "%Y-%m-%d") between ' + `'${FromDate}'`;
    }

    if (this.Billdetail.ToDate !== '' && this.Billdetail.ToDate !== null && this.Billdetail.FilterTypes === 'BillDate') {
      let ToDate = moment(this.Billdetail.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'`;
    }

    if (this.Billdetail.FromDate !== '' && this.Billdetail.FromDate !== null && this.Billdetail.FilterTypes === 'DeliveryDate') {
      let FromDate = moment(this.Billdetail.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and DATE_FORMAT(billmaster.DeliveryDate, "%Y-%m-%d") between ' + `'${FromDate}'`;
    }

    if (this.Billdetail.ToDate !== '' && this.Billdetail.ToDate !== null && this.Billdetail.FilterTypes === 'DeliveryDate') {
      let ToDate = moment(this.Billdetail.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'`;
    }

    if (this.Billdetail.FromDate !== '' && this.Billdetail.FromDate !== null && this.Billdetail.FilterTypes === 'OrderDate') {
      let FromDate = moment(this.Billdetail.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and DATE_FORMAT(billmaster.OrderDate, "%Y-%m-%d") between ' + `'${FromDate}'`;
    }

    if (this.Billdetail.ToDate !== '' && this.Billdetail.ToDate !== null && this.Billdetail.FilterTypes === 'OrderDate') {
      let ToDate = moment(this.Billdetail.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'` + ' and billmaster.IsConvertInvoice = 0';
    }

    if (this.Billdetail.ShopID != 0) {
      Parem = Parem + ' and billmaster.ShopID IN ' + `(${this.Billdetail.ShopID})`;
    }

    if (this.Billdetail.CustomerID !== 0) {
      Parem = Parem + ' and billmaster.CustomerID = ' + this.Billdetail.CustomerID;
    }

    if (this.Billdetail.CustomerGSTNo !== 0) {
      Parem = Parem + ' and billmaster.GSTNo = ' + this.Billdetail.CustomerGSTNo;
    }

    if (this.Billdetail.PaymentStatus !== 0 && this.Billdetail.PaymentStatus !== null && this.Billdetail.PaymentStatus !== 'All') {
      Parem = Parem + ' and billmaster.PaymentStatus = ' + `'${this.Billdetail.PaymentStatus}'`;
    }

    if (this.Billdetail.ProductStatus !== '' && this.Billdetail.ProductStatus !== null && this.Billdetail.ProductStatus !== 'All') {
      Parem = Parem + ' and billdetail.ProductStatus = ' + `'${this.Billdetail.ProductStatus}'`;
    }

    if (this.Billdetail.ProductCategory !== 0) {
      Parem = Parem + ' and billdetail.ProductTypeID = ' + this.Billdetail.ProductCategory;
      this.filter();
    }

    if (this.Billdetail.ProductName !== '') {
      Parem = Parem + ' and billdetail.ProductName Like ' + "'" + this.Billdetail.ProductName.trim() + "%'";
    }

    if (this.Billdetail.Option !== '' && this.Billdetail.Option !== null && this.Billdetail.Option !== 0) {
      Parem = Parem + ' and barcodemasternew.Option = ' + `'${this.Billdetail.Option}'`;
    }

    if (this.Billdetail.GSTPercentage !== 0) {
      Parem = Parem + ' and billdetail.GSTPercentage = ' + `'${this.Billdetail.GSTPercentage}'`;
    }

    if (this.Billdetail.GSTType !== 0) {
      Parem = Parem + ' and billdetail.GSTType = ' + `'${this.Billdetail.GSTType}'`;
    }

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
    const subs: Subscription = this.bill.getSalereportsDetailExport(Parem, this.Productsearch).subscribe({
      next: (res: any) => {
        this.downloadFile(res);
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }


  exportAsXLSXDetail(): void {
    let element = document.getElementById('saleDetailExcel');
    const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(element);
    delete ws['A2'];
    // Initialize column widths array
    const colWidths: number[] = [];

    // Iterate over all cells to determine maximum width for each column
    XLSX.utils.sheet_to_json(ws, { header: 1 }).forEach((row: any = []) => {
      row.forEach((cell: any, index: number) => {
        const cellValue = cell ? String(cell) : '';
        colWidths[index] = Math.max(colWidths[index] || 0, cellValue.length);
      });
    });

    // Set column widths in the worksheet
    ws['!cols'] = colWidths.map((width: number) => ({ wch: width + 2 }));

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, 'Sale ProductType Report.xlsx');
  }

  openModalDetail(content: any) {
    this.modalService.open(content, { centered: true, backdrop: 'static', keyboard: false, size: 'sm' });
  }

  BillDetailsFromReset() {

    if(this.user.UserGroup == 'CompanyAdmin'){
      this.Billdetail = {
      FilterTypes: 'BillDate', FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, CustomerID: 0, CustomerGSTNo: 0, PaymentStatus: 0, ProductStatus: 'All', ProductCategory: 0, ProductName: '', GSTType: 0, GSTPercentage: 0, Status: 0, Option: 0,
    };
    }else{
      this.Billdetail = {
      FilterTypes: 'BillDate', FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: this.shopList[0].ShopID, CustomerID: 0, CustomerGSTNo: 0, PaymentStatus: 0, ProductStatus: 'All', ProductCategory: 0, ProductName: '', GSTType: 0, GSTPercentage: 0, Status: 0, Option: 0,
      };
    }

    this.BillDetailList = [];
    this.DetailtotalQty = 0;
    this.DetailtotalDiscount = 0;
    this.DetailtotalUnitPrice = 0;
    this.DetailtotalGstAmount = 0;
    this.DetailtotalAmount = 0;
    this.specList = [];
    this.DetailtotalPorfit = 0
    this.DetailtotalPrice = 0
    this.dataProductWise = '';
  }

  // BillService

  BillService() {
    this.sp.show()
    let Parem = '';

    if (this.service.FromDate !== '' && this.service.FromDate !== null) {
      let FromDate = moment(this.service.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and DATE_FORMAT(billmaster.BillDate, "%Y-%m-%d") between ' + `'${FromDate}'`;
    }

    if (this.service.ToDate !== '' && this.service.ToDate !== null) {
      let ToDate = moment(this.service.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'`;
    }

    if (this.service.ShopID != 0) {
      Parem = Parem + ' and billmaster.ShopID IN ' + `(${this.service.ShopID})`;
    }

    if (this.service.BillType !== 'All') {
      Parem = Parem + ' and billmaster.BillType = ' + `'${this.service.BillType}'`;
    }


    const subs: Subscription = this.bill.saleServiceReport(Parem).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.as.successToast(res.message)
          this.BillServiceList = res.data
          this.ServiceAmount = (res.calculation[0].totalAmount).toFixed(2);
          this.ServicetotalGstAmount = (res.calculation[0].totalGstAmount).toFixed(2);
          this.ServicetotalDiscountAmount = (res.calculation[0].totalDiscountAmount).toFixed(2);
          this.ServicetotalSUBTOTAL = (res.calculation[0].totalSubTotal).toFixed(2);
          this.ServicetotalAddlDiscount = res.calculation[0].totalAddlDiscount;
          this.gstService = res.calculation[0].gst_details
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    })
  }

    openModalAdds(content98: any) {
    this.modalService.open(content98, { centered: true, backdrop: 'static', keyboard: false, size: 'sm' });
  }

  openModalService(content1: any) {
    this.modalService.open(content1, { centered: true, backdrop: 'static', keyboard: false, size: 'sm' });
  }

  exportAsXLSXcharge(): void {
    let element = document.getElementById('billServiceExcel');
    const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(element);
    delete ws['A2'];
    // Initialize column widths array
    const colWidths: number[] = [];

    // Iterate over all cells to determine maximum width for each column
    XLSX.utils.sheet_to_json(ws, { header: 1 }).forEach((row: any = []) => {
      row.forEach((cell: any, index: number) => {
        const cellValue = cell ? String(cell) : '';
        colWidths[index] = Math.max(colWidths[index] || 0, cellValue.length);
      });
    });

    // Set column widths in the worksheet
    ws['!cols'] = colWidths.map((width: number) => ({ wch: width + 2 }));

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, 'BillService_Report.xlsx');
  }

  BillServiceFromReset() {
    this.service = {
      FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, BillType: 'All'
    };
    this.BillServiceList = [];
    this.ServiceAmount = '';
    this.ServicetotalGstAmount = '';
    this.gstService = '';
    this.ServicetotalAmount = 0;
    this.ServicetotalSUBTOTAL = 0;
    this.ServiceGtotalAmount = 0;

  }

  // bill product cancel

  getProductList1() {
    const subs: Subscription = this.ps.getList().subscribe({
      next: (res: any) => {
        this.prodList1 = res.data.sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getFieldList1() {
    if (this.cancel.ProductCategory !== 0) {
      this.prodList1.forEach((element: any) => {
        if (element.ID === this.cancel.ProductCategory) {
          this.selectedProduct = element.Name;
        }
      })
      const subs: Subscription = this.ps.getFieldList(this.selectedProduct).subscribe({
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
        const subs: Subscription = this.ps.getProductSupportData('0', element.SptTableName).subscribe({
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

  getFieldSupportData1(index: any) {
    this.specList1.forEach((element: any) => {
      if (element.Ref === this.specList1[index].FieldName.toString()) {
        const subs: Subscription = this.ps.getProductSupportData(this.specList1[index].SelectedValue, element.SptTableName).subscribe({
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
        let valueToAdd = element.SelectedValue;
        valueToAdd = valueToAdd.replace(/^\d+_/, "");
        productName = valueToAdd;
      } else if (element.SelectedValue !== '') {
        let valueToAdd = element.SelectedValue;
            valueToAdd = valueToAdd.replace(/^\d+_/, "");
        productName += '/' + valueToAdd;
      }
    });
     this.cancel.ProductName = productName;
  }
  getProductCancel() {
    this.sp.show()
    let Parem = '';

    if (this.cancel.FromDate !== '' && this.cancel.FromDate !== null && this.cancel.FilterTypes === 'BillDate') {
      let FromDate = moment(this.cancel.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and DATE_FORMAT(billmaster.BillDate, "%Y-%m-%d") between ' + `'${FromDate}'`;
    }

    if (this.cancel.ToDate !== '' && this.cancel.ToDate !== null && this.cancel.FilterTypes === 'BillDate') {
      let ToDate = moment(this.cancel.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'`;
    }

    if (this.cancel.FromDate !== '' && this.cancel.FromDate !== null && this.cancel.FilterTypes === 'DeliveryDate') {
      let FromDate = moment(this.cancel.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and billmaster.DeliveryDate between ' + `'${FromDate}'`;
    }

    if (this.cancel.ToDate !== '' && this.cancel.ToDate !== null && this.cancel.FilterTypes === 'DeliveryDate') {
      let ToDate = moment(this.cancel.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'`;
    }

    if (this.cancel.FromDate !== '' && this.cancel.FromDate !== null && this.cancel.FilterTypes === 'OrderDate') {
      let FromDate = moment(this.cancel.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and billmaster.OrderDate between ' + `'${FromDate}'`;
    }

    if (this.cancel.ToDate !== '' && this.cancel.ToDate !== null && this.cancel.FilterTypes === 'OrderDate') {
      let ToDate = moment(this.cancel.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'` + ' and billmaster.IsConvertInvoice = 0';
    }

    if (this.cancel.ShopID != 0) {
      Parem = Parem + ' and billmaster.ShopID IN ' + `(${this.cancel.ShopID})`;
    }

    if (this.cancel.CustomerGSTNo !== 0) {
      Parem = Parem + ' and billmaster.GSTNo = ' + this.cancel.CustomerGSTNo;
    }

    if (this.cancel.ProductCategory !== 0) {
      Parem = Parem + ' and billdetail.ProductTypeID = ' + this.cancel.ProductCategory;
      this.filter1();
    }

    if (this.cancel.ProductName !== '') {
      Parem = Parem + ' and billdetail.ProductName Like ' + "'" + this.cancel.ProductName.trim() + "%'";
    }

    if (this.cancel.Option !== '' && this.cancel.Option !== null && this.cancel.Option !== 0) {
      Parem = Parem + ' and barcodemasternew.Option = ' + `'${this.cancel.Option}'`;
    }

    if (this.cancel.GSTPercentage !== 0) {
      Parem = Parem + ' and billdetail.GSTPercentage = ' + `'${this.cancel.GSTPercentage}'`;
    }

    if (this.cancel.GSTType !== 0) {
      Parem = Parem + ' and billdetail.GSTType = ' + `'${this.cancel.GSTType}'`;
    }

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

    if (this.cancel.CancelStatus !== 0) {
      if (this.cancel.CancelStatus === 'Cancel' && this.cancel.CancelStatus !== 'All') {
        Parem = Parem + ' and billdetail.Status = ' + '0' + ' and billdetail.CancelStatus = ' + '0';
      } else if (this.cancel.CancelStatus === 'Delete' && this.cancel.CancelStatus !== 'All') {
        Parem = Parem + ' and billdetail.Status = ' + '0' + ' and billdetail.CancelStatus = ' + '1';
      }
    }

    const subs: Subscription = this.bill.getCancelProductReport(Parem).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.as.successToast(res.message)
          this.cancelList = res.data
          this.canceltotalQty = res.calculation[0].totalQty;
          this.canceltotalDiscount = res.calculation[0].totalDiscount;
          this.canceltotalUnitPrice = res.calculation[0].totalUnitPrice;
          this.canceltotalGstAmount = res.calculation[0].totalGstAmount;
          this.canceltotalAmount = res.calculation[0].totalAmount;
          this.gstcancels = res.calculation[0].gst_details
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  openModalCancel(content4: any) {
    this.modalService.open(content4, { centered: true, backdrop: 'static', keyboard: false, size: 'sm' });
  }

  exportAsXLSXCancel(): void {
    let element = document.getElementById('saleCancelExcel');
    const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(element);
    delete ws['A2'];
    // Initialize column widths array
    const colWidths: number[] = [];

    // Iterate over all cells to determine maximum width for each column
    XLSX.utils.sheet_to_json(ws, { header: 1 }).forEach((row: any = []) => {
      row.forEach((cell: any, index: number) => {
        const cellValue = cell ? String(cell) : '';
        colWidths[index] = Math.max(colWidths[index] || 0, cellValue.length);
      });
    });

    // Set column widths in the worksheet
    ws['!cols'] = colWidths.map((width: number) => ({ wch: width + 2 }));

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, 'BillCancelProduct_Report.xlsx');
  }

  BillCancelFromReset() {
    this.cancel = {
      FilterTypes: 'BillDate', FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, CustomerGSTNo: 0, ProductCategory: 0, ProductName: '', GSTType: 0, GSTPercentage: 0, Status: 0, Option: 0, CancelStatus: 0
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

  getProductList2() {
    const subs: Subscription = this.ps.getList().subscribe({
      next: (res: any) => {
        this.prodList2 = res.data;
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getFieldList2() {
    if (this.pending.ProductCategory !== 0) {
      this.prodList2.forEach((element: any) => {
        if (element.ID === this.pending.ProductCategory) {
          this.selectedProduct = element.Name;
        }
      })
      const subs: Subscription = this.ps.getFieldList(this.selectedProduct).subscribe({
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
        const subs: Subscription = this.ps.getProductSupportData('0', element.SptTableName).subscribe({
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

  getFieldSupportData2(index: any) {
    this.specList2.forEach((element: any) => {
      if (element.Ref === this.specList2[index].FieldName.toString()) {
        const subs: Subscription = this.ps.getProductSupportData(this.specList2[index].SelectedValue, element.SptTableName).subscribe({
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
        let valueToAdd = element.SelectedValue;
        valueToAdd = valueToAdd.replace(/^\d+_/, "");
        productName = valueToAdd;
      } else if (element.SelectedValue !== '') {
        let valueToAdd = element.SelectedValue;
            valueToAdd = valueToAdd.replace(/^\d+_/, "");
        productName += '/' + valueToAdd;
      }
    });
    this.pending.ProductName = productName;
  }

  getProductPending() {
    this.sp.show()
    let Parem = '';

   if (this.pending.FromDate !== '' && this.pending.FromDate !== null && this.pending.FilterTypes === 'All') {
      let FromDate = moment(this.pending.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ( DATE_FORMAT(billmaster.BillDate, "%Y-%m-%d") between ' + `'${FromDate}'`;
    }

    if (this.pending.ToDate !== '' && this.pending.ToDate !== null && this.pending.FilterTypes === 'All') {
      let ToDate = moment(this.pending.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'`;
    }

      if (this.pending.FromDate !== '' && this.pending.FromDate !== null && this.pending.FilterTypes === 'All') {
      let FromDate = moment(this.pending.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' OR DATE_FORMAT(billmaster.OrderDate, "%Y-%m-%d") between ' + `'${FromDate}'`;
    }

    if (this.pending.ToDate !== '' && this.pending.ToDate !== null && this.pending.FilterTypes === 'All') {
      let ToDate = moment(this.pending.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'` + ' )';
    }

    if (this.pending.FromDate !== '' && this.pending.FromDate !== null && this.pending.FilterTypes === 'BillDate') {
      let FromDate = moment(this.pending.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and DATE_FORMAT(billmaster.BillDate, "%Y-%m-%d") between ' + `'${FromDate}'`;
    }

    if (this.pending.ToDate !== '' && this.pending.ToDate !== null && this.pending.FilterTypes === 'BillDate') {
      let ToDate = moment(this.pending.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'`;
    }

    if (this.pending.FromDate !== '' && this.pending.FromDate !== null && this.pending.FilterTypes === 'DeliveryDate') {
      let FromDate = moment(this.pending.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and billmaster.DeliveryDate between ' + `'${FromDate}'`;
    }

    if (this.pending.ToDate !== '' && this.pending.ToDate !== null && this.pending.FilterTypes === 'DeliveryDate') {
      let ToDate = moment(this.pending.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'`;
    }

    if (this.pending.FromDate !== '' && this.pending.FromDate !== null && this.pending.FilterTypes === 'OrderDate') {
      let FromDate = moment(this.pending.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and billmaster.OrderDate between ' + `'${FromDate}'`;
    }

    if (this.pending.ToDate !== '' && this.pending.ToDate !== null && this.pending.FilterTypes === 'OrderDate') {
      let ToDate = moment(this.pending.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'` + ' and billmaster.IsConvertInvoice = 0';
    }

    if (this.pending.ShopID != 0) {
      Parem = Parem + ' and billmaster.ShopID IN ' + `(${this.pending.ShopID})`;
    }

    if (this.pending.CustomerGSTNo !== 0) {
      Parem = Parem + ' and billmaster.GSTNo = ' + this.pending.CustomerGSTNo;
    }

    if (this.pending.ProductCategory !== 0) {
      Parem = Parem + ' and billdetail.ProductTypeID = ' + this.pending.ProductCategory;
      this.filter1();
    }

    if (this.pending.ProductName !== '') {
      Parem = Parem + ' and billdetail.ProductName Like ' + "'" + this.pending.ProductName.trim() + "%'";
    }

    if (this.pending.Option !== '' && this.pending.Option !== null && this.pending.Option !== 0) {
      Parem = Parem + ' and barcodemasternew.Option = ' + `'${this.pending.Option}'`;
    }

    if (this.pending.GSTPercentage !== 0) {
      Parem = Parem + ' and billdetail.GSTPercentage = ' + `'${this.pending.GSTPercentage}'`;
    }

    if (this.pending.GSTType !== 0) {
      Parem = Parem + ' and billdetail.GSTType = ' + `'${this.pending.GSTType}'`;
    }

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


    if (this.pending.ProductStatus !== '' && this.pending.ProductStatus !== null && this.pending.ProductStatus !== 'All') {
      Parem = Parem + ' and billdetail.ProductStatus = ' + `'${this.pending.ProductStatus}'`;
    }

    const subs: Subscription = this.bill.getSalereportsDetail(Parem, this.Productsearch).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.as.successToast(res.message)
          this.pendingList = res.data
          this.pendingtotalQty = res.calculation[0].totalQty;
          this.pendingtotalDiscount = res.calculation[0].totalDiscount;
          this.pendingtotalUnitPrice = res.calculation[0].totalUnitPrice;
          this.pendingtotalGstAmount = res.calculation[0].totalGstAmount;
          this.pendingtotalAmount = res.calculation[0].totalAmount;
          this.gstpending = res.calculation[0].gst_details

        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  updateProductStatusAll() {
    this.sp.show()
    let Ids: any = []
    this.pendingList.forEach((e: any) => {
      Ids.push(e.ID)
    })
    const subs: Subscription = this.bill.updateProductStatusAll(Ids).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.as.successToast(res.message)
          this.getProductPending()
        } else {
          this.as.errorToast(res.message)
        }
        // this.pendingList = res.data;
        this.sp.hide()
      },

      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  openModalPending(content4: any) {
    this.modalService.open(content4, { centered: true, backdrop: 'static', keyboard: false, size: 'sm' });
  }

  exportAsXLSXPending(): void {
    let element = document.getElementById('salePendingExcel');
    const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(element);
    delete ws['A2'];
    // Initialize column widths array
    const colWidths: number[] = [];

    // Iterate over all cells to determine maximum width for each column
    XLSX.utils.sheet_to_json(ws, { header: 1 }).forEach((row: any = []) => {
      row.forEach((cell: any, index: number) => {
        const cellValue = cell ? String(cell) : '';
        colWidths[index] = Math.max(colWidths[index] || 0, cellValue.length);
      });
    });

    // Set column widths in the worksheet
    ws['!cols'] = colWidths.map((width: number) => ({ wch: width + 2 }));

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, 'BillPendingProduct_Report.xlsx');
  }

  BillPendingFromReset() {

    if(this.user.UserGroup == 'CompanyAdmin'){
       this.pending = {
      FilterTypes: 'BillDate', FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, CustomerGSTNo: 0, ProductCategory: 0, ProductName: '', GSTType: 0, GSTPercentage: 0, Status: 0, Option: 0, ProductStatus: 'pending'
    };
    }else{
        this.pending = {
      FilterTypes: 'BillDate', FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: this.shopList[0].ShopID, CustomerGSTNo: 0, ProductCategory: 0, ProductName: '', GSTType: 0, GSTPercentage: 0, Status: 0, Option: 0, ProductStatus: 'pending'
    };
    }

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
  dateFormat(date: any): string {
    if (date == null || date == "") {
      return '0000-00-00'; // Default Value
    }
    return moment(date).format(this.companySetting?.DateFormat || 'YYYY-MM-DD');
  }

  customerSearch(searchKey: any, mode: any, type: any) {
    this.filteredOptions = []

    let dtm = { Type: '', Name: '' }
    if (type === 'Employee') {
      dtm = {
        Type: 'Employee',
        Name: this.BillMaster.EmployeeID
      };
    }
    if (type === 'Customer') {
      dtm = {
        Type: 'Customer',
        Name: this.BillMaster.CustomerID
      };
    }

    if (searchKey.length >= 2) {
      if (mode === 'Name') {
        dtm.Name = searchKey;
      }

      const subs: Subscription = this.supps.dropdownlistBySearch(dtm).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.filteredOptions = res.data
          } else {
            this.as.errorToast(res.message)
          }
          this.sp.hide()
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    }

  }

  CustomerSelection(mode: any, ID: any) {
    if (mode === 'Value') {
      this.BillMaster.CustomerID = ID
    }
    if (mode === 'Billdetail') {
      this.Billdetail.CustomerID = ID
    }
    if (mode === 'emp') {
      this.Billdetail.EmployeeID = ID
    }
    if (mode === 'All') {
      this.filteredOptions = []
      this.BillMaster.CustomerID = 0
      this.Billdetail.CustomerID = 0
      this.Billdetail.EmployeeID = 0
    }
  }
  // customer search

  // sale prodcut Expiry
  getProductList3() {
    const subs: Subscription = this.ps.getList().subscribe({
      next: (res: any) => {
        this.prodList3 = res.data;
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getFieldList3() {
    if (this.BillExpiry.ProductCategory !== 0) {
      this.prodList3.forEach((element: any) => {
        if (element.ID === this.BillExpiry.ProductCategory) {
          this.selectedProduct = element.Name;
        }
      })
      const subs: Subscription = this.ps.getFieldList(this.selectedProduct).subscribe({
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
        const subs: Subscription = this.ps.getProductSupportData('0', element.SptTableName).subscribe({
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

  getFieldSupportData3(index: any) {
    this.specList3.forEach((element: any) => {
      if (element.Ref === this.specList3[index].FieldName.toString()) {
        const subs: Subscription = this.ps.getProductSupportData(this.specList3[index].SelectedValue, element.SptTableName).subscribe({
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
        let valueToAdd = element.SelectedValue;
        valueToAdd = valueToAdd.replace(/^\d+_/, "");
        productName = valueToAdd;
      } else if (element.SelectedValue !== '') {
        let valueToAdd = element.SelectedValue;
            valueToAdd = valueToAdd.replace(/^\d+_/, "");
        productName += '/' + valueToAdd;
      }
    });
 this.BillExpiry.ProductName = productName;
  }

  getBillExpiry() {
    this.sp.show()
    let Parem = '';
    this.todaydate = moment(new Date()).format('YYYY-MM-DD');
    if (this.BillExpiry.FromDate !== '' && this.BillExpiry.FromDate !== null) {
      let FromDate = moment(this.BillExpiry.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and DATE_FORMAT(billdetail.ProductExpDate, "%Y-%m-%d") between ' + `'${FromDate}'`;
    }

    if (this.BillExpiry.ToDate !== '' && this.BillExpiry.ToDate !== null) {
      let ToDate = moment(this.BillExpiry.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'`;
    }

    if (this.BillExpiry.ShopID != 0) {
      Parem = Parem + ' and billmaster.ShopID IN ' + `(${this.BillExpiry.ShopID})`;
    }

    if (this.BillExpiry.CustomerID !== 0) {
      Parem = Parem + ' and billmaster.CustomerID = ' + this.BillExpiry.CustomerID;
    }

    if (this.BillExpiry.CustomerGSTNo !== 0) {
      Parem = Parem + ' and billmaster.GSTNo = ' + this.BillExpiry.CustomerGSTNo;
    }

    if (this.BillExpiry.PaymentStatus !== 0 && this.BillExpiry.PaymentStatus !== null && this.BillExpiry.PaymentStatus !== 'All') {
      Parem = Parem + ' and billmaster.PaymentStatus = ' + `'${this.BillExpiry.PaymentStatus}'`;
    }

    if (this.BillExpiry.ProductStatus !== '' && this.BillExpiry.ProductStatus !== null && this.BillExpiry.ProductStatus !== 'All') {
      Parem = Parem + ' and billdetail.ProductStatus = ' + `'${this.BillExpiry.ProductStatus}'`;
    }

    if (this.BillExpiry.ProductCategory !== 0) {
      Parem = Parem + ' and billdetail.ProductTypeID = ' + this.BillExpiry.ProductCategory;
      this.filter3();
    }

    if (this.BillExpiry.ProductName !== '') {
      Parem = Parem + ' and billdetail.ProductName Like ' + "'" + this.BillExpiry.ProductName.trim() + "%'";
    }

    if (this.BillExpiry.Option !== '' && this.BillExpiry.Option !== null && this.BillExpiry.Option !== 0) {
      Parem = Parem + ' and barcodemasternew.Option = ' + `'${this.BillExpiry.Option}'`;
    }

    if (this.BillExpiry.GSTPercentage !== 0) {
      Parem = Parem + ' and billdetail.GSTPercentage = ' + `'${this.BillExpiry.GSTPercentage}'`;
    }

    if (this.BillExpiry.GSTType !== 0) {
      Parem = Parem + ' and billdetail.GSTType = ' + `'${this.BillExpiry.GSTType}'`;
    }


    const subs: Subscription = this.bill.getSalereportsDetail(Parem, this.Productsearch).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.as.successToast(res.message)
          this.ExpiryList = res.data
          this.ExpiryList.forEach((element: any) => {
            if (element.ProductExpDate < this.todaydate) {
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
        } else {
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
    const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(element);
    delete ws['A2'];
    // Initialize column widths array
    const colWidths: number[] = [];

    // Iterate over all cells to determine maximum width for each column
    XLSX.utils.sheet_to_json(ws, { header: 1 }).forEach((row: any = []) => {
      row.forEach((cell: any, index: number) => {
        const cellValue = cell ? String(cell) : '';
        colWidths[index] = Math.max(colWidths[index] || 0, cellValue.length);
      });
    });

    // Set column widths in the worksheet
    ws['!cols'] = colWidths.map((width: number) => ({ wch: width + 2 }));

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, 'Sale Product Expiry Report.xlsx');
  }

  openModalExpiry(content: any) {
    this.modalService.open(content, { centered: true, backdrop: 'static', keyboard: false, size: 'sm' });
  }

  BillExpirysFromReset() {
    this.BillExpiry = {
      FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, CustomerID: 0, CustomerGSTNo: 0, PaymentStatus: 0, ProductStatus: 'All', ProductCategory: 0, ProductName: '', GSTType: 0, GSTPercentage: 0, Status: 0, Option: 0,
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

  print(mode: any) {

    let printContent: any = '';
    let printTitle: any = '';
    let shopID = '';

    if (mode === 'sale-content') {
      printContent = document.getElementById('sale-content');
      printTitle = 'Sale Report'
      shopID = this.BillMaster.ShopID
    }
    if (mode === 'SaleM-content') {
      printContent = document.getElementById('SaleM-content');
      printTitle = 'Manual Sale Convert Report'
      shopID = this.MForm.ShopID
    }
    if (mode === 'saleDetail-content') {
      printContent = document.getElementById('saleDetail-content');
      printTitle = 'Sale Detail Report'
      shopID = this.Billdetail.ShopID
    }
    if (mode === 'saleService-content') {
      printContent = document.getElementById('saleService-content');
      printTitle = 'Sale Service Report'
      shopID = this.service.ShopID
    }
    if (mode === 'ProductCancel-content') {
      printContent = document.getElementById('ProductCancel-content');
      printTitle = 'Product Cancel Report'
      shopID = this.cancel.ShopID
    }
    if (mode === 'ProductPending-content') {
      printContent = document.getElementById('ProductPending-content');
      printTitle = 'Product Pending Report'
      shopID = this.pending.ShopID
    }
    if (mode === 'ProductExpiry-content') {
      printContent = document.getElementById('ProductExpiry-content');
      printTitle = 'Sale (Product Expiry) Report'
      shopID = this.BillExpiry.ShopID
    }

    let shop = this.shopList
    this.shopLists = shop.filter((s: any) => s.ID === Number(shopID));
    if (this.shopLists == '' || this.shopLists == undefined) {
      this.shopLists = shop.filter((s: any) => s.ID === Number(this.selectedShop[0]));
    }

    let printWindow: any = window.open('pp', '_blank');
    printWindow.document.write(`
    <html>
      <head>
      <title> ${printTitle}</title>
        <style>
          @media print {

            body {
              margin:0;
              padding:0;
              zoom:100%;
              width:100%;
              font-family: 'Your Font Family', sans-serif;
            }
            .header-body{
              width:100%;
              height:120px;
            }
            .main-body{
              width:100%;
            }
            .header-body .print-title {
              width:60%;
              text-align: left;
              margin-bottom: 20px;
              float:right;
            }
            .header-body .print-logo {
              width:20%;
              text-align: center;
              margin-bottom: 0px;
              float:left;
            }
            .print-logo img{
              width: 100%;
              height: 110px;
            object-fit: contain;
            }
            thead{
              background-color: #dcdcdc;
              height:50px;
            }
            thead tr{
              height:30px;
            }
            th{
              padding:0px;
              margin:0px;

            }
            table  {
              width:100%;
              padding:0px;
              margin:0px;
              text-align: center;
            }
            td  {
              padding:0px;
              margin:0px;
            }
            tr:nth-child(even) {
              background-color: #f2f2f2;
          }
          th.hide-on-print,button-container,
          td.hide-on-print {
            display: none;
          }
          tfoot.hide-on-print, {
            display: block;
          }
          .totolRow  td{
            color:red !important;
            font-weight: 600 !important;
          }
          .button-container
           {
            display: none;
          }
          }
        </style>
      </head>
      <body>
      <div class="header-body">
        <div class="print-logo ">
          <img src="${this.env.apiUrl + this.shopLists[0].LogoURL}" alt="Logo" >
        </div>
        <div class="print-title">
        <h3>${this.shopLists[0].Name + ' (' + this.shopLists[0].AreaName + ')'}</h3>
        <h4 style="font-weight: 300; letter-spacing: 1px;">${this.shopLists[0].Address}</h4>
        </div>
      </div>
      <div class="main-body">
        ${printContent.innerHTML}
      </div>
      </body>
    </html>
  `);

    printWindow.document.querySelectorAll('.hide-on-print').forEach((element: any) => {
      element.classList.add('hide-on-print');
    });

    printWindow.document.close();
    printWindow.print();
  }

  toggleColumnVisibility(column: string): void {
    this.columnVisibility[column] = !this.columnVisibility[column];
  }
  toggleColumnVisibility1(column: string): void {
    this.columnVisibility1[column] = !this.columnVisibility1[column];
  }
  toggleColumnVisibility2(column: string): void {
    this.columnVisibility2[column] = !this.columnVisibility2[column];
  }
  toggleColumnVisibility3(column: string): void {
    this.columnVisibility3[column] = !this.columnVisibility3[column];
  }
  toggleColumnVisibility4(column: string): void {
    this.columnVisibility4[column] = !this.columnVisibility4[column];
  }
  toggleColumnVisibility5(column: string): void {
    this.columnVisibility5[column] = !this.columnVisibility5[column];
  }

  sendWhatsapp(data: any, mode: any) {

    let shoplist = this.shopList
    let shop = shoplist.filter((s: any) => s.ID === Number(this.selectedShop[0]));

    let temp = JSON.parse(this.companySetting.WhatsappSetting);
    let WhatsappMsg = '';
    let msg = '';
    let Cusmob = ''

    // let billDate = new Date(data.BillDate as string);
    // let daysPending: number = Math.floor((new Date().getTime() - billDate.getTime()) / (1000 * 60 * 60 * 24));

    
    let daysPending: number = 0;
      
    if (data.BillDate) {
      let billDate = new Date(data.BillDate as string);
      daysPending = Math.floor((new Date().getTime() - billDate.getTime()) / (1000 * 60 * 60 * 24));
    } else if (data.OrderDate) {
      let orderDate = new Date(data.OrderDate as string);
      daysPending = Math.floor((new Date().getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    if (mode === 'bill') {
      Cusmob = data.MobileNo1
      WhatsappMsg = this.getWhatsAppMessage(temp, 'Customer_Credit Noteaa') || 'This is a gentle reminder that your balance amount of' + ` ${data.TotalDueAmount}` + '/- has been pending for the last' + ` ${daysPending} ` +'days. Kindly clear the payment today.';
      msg = `*Hi ${data.Title} ${data.CustomerName},*%0A` +
        `${WhatsappMsg}%0A` +
        `*${shop[0].Name}* - ${shop[0].AreaName}%0A${shop[0].MobileNo1}%0A${shop[0].Website}`;
    }

    if (mode === 'Fbill') {
      Cusmob = data.CustomerMoblieNo1
      WhatsappMsg = this.getWhatsAppMessage(temp, 'Customer_Bill OrderReady');
      msg = `*Hi ${data.Title} ${data.CustomerName},*%0A` +
        `${WhatsappMsg}%0A` +
        `*${shop[0].Name}* - ${shop[0].AreaName}%0A` +
        `${shop[0].MobileNo1}%0A` +
        `${shop[0].Website}%0A` +
        `*Please give your valuable Review for us !*`
    }


    if (data.MobileNo1 != '') {
      var mob = this.company.Code + Cusmob;
      var url = `https://wa.me/${mob}?text=${msg}`;
      window.open(url, "_blank");
    } else {
      Swal.fire({
        position: 'center',
        icon: 'warning',
        title: '<b>' + data.CustomerName + '</b>' + ' Mobile number is not available.',
        showConfirmButton: true,
      })
    }
  }

  getWhatsAppMessage(temp: any, messageName: any) {
    if (temp && temp !== 'null') {
      const foundElement = temp.find((element: { MessageName1: any; }) => element.MessageName1 === messageName);
      return foundElement ? foundElement.MessageText1 : '';
    }
    return '';
  }



  // sale prodcut Expiry
  getProductList4() {
    const subs: Subscription = this.ps.getList().subscribe({
      next: (res: any) => {
        this.prodList4 = res.data;
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getFieldList4() {
    if (this.OForm.ProductCategory !== 0) {
      this.prodList4.forEach((element: any) => {
        if (element.ID === this.OForm.ProductCategory) {
          this.selectedProduct = element.Name;
        }
      })
      const subs: Subscription = this.ps.getFieldList(this.selectedProduct).subscribe({
        next: (res: any) => {
          this.specList4 = res.data;
          this.getSptTableData4();
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    }
    else {
      this.specList4 = [];
      this.OForm.ProductName = '';
      this.OForm.ProductCategory = 0;
    }
  }

  getSptTableData4() {
    this.specList4.forEach((element: any) => {
      if (element.FieldType === 'DropDown' && element.Ref === '0') {
        const subs: Subscription = this.ps.getProductSupportData('0', element.SptTableName).subscribe({
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

  getFieldSupportData4(index: any) {
    this.specList4.forEach((element: any) => {
      if (element.Ref === this.specList4[index].FieldName.toString()) {
        const subs: Subscription = this.ps.getProductSupportData(this.specList4[index].SelectedValue, element.SptTableName).subscribe({
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




    filter4() {
    let productName = '';
    this.specList4.forEach((element: any) => {
      if (productName === '') {
        let valueToAdd = element.SelectedValue;
        valueToAdd = valueToAdd.replace(/^\d+_/, "");
        productName = valueToAdd;
      } else if (element.SelectedValue !== '') {
        let valueToAdd = element.SelectedValue;
            valueToAdd = valueToAdd.replace(/^\d+_/, "");
        productName += '/' + valueToAdd;
      }
    });
   this.OForm.ProductName = productName;
  }

  getBillOrderForm() {
    this.sp.show()
    let Parem = '';
    this.todaydate = moment(new Date()).format('YYYY-MM-DD');
    if (this.OForm.FromDate !== '' && this.OForm.FromDate !== null) {
      let FromDate = moment(this.OForm.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and DATE_FORMAT(orderrequest.CreatedOn, "%Y-%m-%d") between ' + `'${FromDate}'`;
    }

    if (this.OForm.ToDate !== '' && this.OForm.ToDate !== null) {
      let ToDate = moment(this.OForm.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'`;
    }

    if (this.OForm.ShopID != 0) {
      Parem = Parem + ' and orderrequest.ShopID IN ' + `(${this.OForm.ShopID})`;
    }

    if (this.OForm.ProductStatus !== '' && this.OForm.ProductStatus !== null && this.OForm.ProductStatus !== 'All') {
      Parem = Parem + ' and orderrequest.ProductStatus = ' + `'${this.OForm.ProductStatus}'`;
    }

    if (this.OForm.ProductCategory !== 0) {
      Parem = Parem + ' and orderrequest.ProductTypeID = ' + this.OForm.ProductCategory;
      this.filter4();
    }

    if (this.OForm.ProductName !== '') {
      Parem = Parem + ' and orderrequest.ProductName Like ' + "'" + this.OForm.ProductName.trim() + "%'";
    }

    // if (this.OForm.Option !== '' && this.OForm.Option !== null && this.OForm.Option !== 0) {
    //   Parem = Parem + ' and barcodemasternew.Option = ' + `'${this.OForm.Option}'`;
    // }


    const subs: Subscription = this.bill.orderformrequestreport(Parem).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.as.successToast(res.message)
          this.orderList = res.data
          this.ordertotalSaleQty = res.calculation[0].totalSaleQty
          this.ordertotalQty = res.calculation[0].totalQty

        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getAIDASHExport() {
    let data = this.BillDetailList.map((e: any) => {
      return {
        InvoiceDate: e.BillDate,
        InvoiceNo: e.BillInvoiceNo,
        CustomerName: e.CustomerName,
        MRDNo: e.MrdNo,
        ProductTypeName: e.ProductTypeName,
        ProductName: e.ProductName,
        UnitPrice: e.UnitPrice,
        Quantity: e.Quantity,
        DiscountAmount: e.DiscountAmount,
        SubTotal: e.SubTotal,
        TaxAmount: e.GSTAmount,
        GrandTotal: e.TotalAmount,
        Status: e.PaymentStatus,
        EmployeeName: e.EmployeeName,
        ShopName: e.ShopName,
        PurchasePrice: e.PurchasePrice,
      }
    })
    this.excelService.exportAsExcelFile(data, 'Sale_Product_Report');
  }


  getManualConvertList() {
    this.sp.show()
    let Parem = '';

    if (this.MForm.FromDate !== '' && this.MForm.FromDate !== null && this.MForm.FilterTypes === 'DeliveryDate') {
      let FromDate = moment(this.MForm.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and DATE_FORMAT(billmaster.DeliveryDate, "%Y-%m-%d") between ' + `'${FromDate}'`;
    }

    if (this.MForm.ToDate !== '' && this.MForm.ToDate !== null && this.MForm.FilterTypes === 'DeliveryDate') {
      let ToDate = moment(this.MForm.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'`;
    }
    if (this.MForm.FromDate !== '' && this.MForm.FromDate !== null && this.MForm.FilterTypes === 'OrderDate') {
      let FromDate = moment(this.MForm.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and DATE_FORMAT(billmaster.OrderDate, "%Y-%m-%d") between ' + `'${FromDate}'`;
    }

    if (this.MForm.ToDate !== '' && this.MForm.ToDate !== null && this.MForm.FilterTypes === 'OrderDate') {
      let ToDate = moment(this.MForm.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'` + ' and billmaster.IsConvertInvoice = 0' + " and billmaster.PaymentStatus = 'Paid'";
    }

    if (this.MForm.ShopID != 0) {
      Parem = Parem + ' and billmaster.ShopID IN ' + `(${this.MForm.ShopID})`;
    }


    const subs: Subscription = this.bill.getSalereport(Parem).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.as.successToast(res.message)
          this.ManualList = res.data;
          this.totalBalanceM = 0
          this.totalPaidM = 0

          for (const billManual of this.ManualList) {
            let totalDueAmountPlus = 0;
            this.ManualList.forEach((e: any) => {

              if (e.CustomerID === billManual.CustomerID) {
                totalDueAmountPlus += e.DueAmount;
              }
            });
            billManual.TotalDueAmount = totalDueAmountPlus;
            this.totalBalanceM = this.totalBalanceM + billManual.DueAmount;
          }

          this.totalQtyM = res.calculation[0].totalQty;
          this.totalDiscountM = (parseFloat(res.calculation[0].totalDiscount)).toFixed(2);
          this.totalUnitPriceM = (parseFloat(res.calculation[0].totalSubTotalPrice)).toFixed(2);
          this.totalGstAmountM = (parseFloat(res.calculation[0].totalGstAmount)).toFixed(2);
          this.totalAmountM = (parseFloat(res.calculation[0].totalAmount)).toFixed(2);
          this.totalAddlDiscountM = (parseFloat(res.calculation[0].totalAddlDiscount)).toFixed(2);
          let p = + this.totalAmountM - this.totalBalanceM;
          this.totalPaidM = this.convertToDecimal(p, 2);
          this.gstMasterM = res.calculation[0].gst_details
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }


  multicheck($event: any) {
    for (var i = 0; i < this.ManualList.length; i++) {
      const index = this.ManualList.findIndex(((x: any) => x === this.ManualList[i]));
      if (this.ManualList[index].Sel === 0 || this.ManualList[index].Sel === null || this.ManualList[index].Sel === undefined) {
        this.ManualList[index].Sel = 1;
      } else {
        this.ManualList[index].Sel = 0;
      }
    }
  }

  validate(v: any, event: any) {
    if (v.Sel === 0 || v.Sel === null || v.Sel === undefined) {
      v.Sel = 1;
    } else {
      v.Sel = 0;
    }
  }


  ConvartBill() {
    this.sp.show();
    let OrderList: any = []
    this.ManualList.filter((e: any) => Number(e.Sel) === 1) // Filter first
      .map((e: any) => {
        OrderList.push(e)
      });

    const subs: Subscription = this.bill.convertOrderIntoInvoiceNo(OrderList).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.as.successToast(res.message)
          this.ManualList = res.data;
          this.totalQtyM = 0;
          this.totalDiscountM = 0;
          this.totalUnitPriceM = 0;
          this.totalGstAmountM = 0;
          this.totalAmountM = 0;
          this.totalAddlDiscountM = 0;
          this.totalPaidM = 0;
          this.gstMasterM = 0;
          this.totalBalanceM = 0;
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  exportAsXLSXMasterM(): void {
    let element = document.getElementById('saleExcelM');
    const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(element);
    delete ws['A2'];
    // Initialize column widths array
    const colWidths: number[] = [];

    // Iterate over all cells to determine maximum width for each column
    XLSX.utils.sheet_to_json(ws, { header: 1 }).forEach((row: any = []) => {
      row.forEach((cell: any, index: number) => {
        const cellValue = cell ? String(cell) : '';
        colWidths[index] = Math.max(colWidths[index] || 0, cellValue.length);
      });
    });

    // Set column widths in the worksheet
    ws['!cols'] = colWidths.map((width: number) => ({ wch: width + 2 }));

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, 'Manual Sale Convert Report.xlsx');
  }

  getRegisterSale() {
    let Parem = '';

    let FromDate = moment(this.dataRegister.FromDate).format('YYYY-MM-DD')
    Parem = Parem + ' and DATE_FORMAT(billmaster.BillDate, "%Y-%m-%d") between ' + `'${FromDate}'`;

    let ToDate =  moment(this.dataRegister.ToDate).endOf('month').format('YYYY-MM-DD');
    Parem = Parem + ' and ' + `'${ToDate}'`;

    if (this.dataRegister.ShopID != 0){
      Parem = Parem + ' and billmaster.ShopID IN ' +  `(${this.dataRegister.ShopID})`;}

    const subs: Subscription = this.bill.getSaleReportMonthYearWise(Parem,this.FilterTypeR).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.as.successToast(res.message)
          this.RegisterList = res.data
          this.RegisterAmount = res.calculation.Amount
          this.RegisterBalance = res.calculation.Balance
          this.RegisterPaid = res.calculation.Paid

    const xAxisData: string[] = [];
    const totalAmountData: number[] = [];
    const paidData: number[] = [];
    const balanceData: number[] = [];

    // Loop through your 'this.data' array and populate the ECharts specific arrays
    this.RegisterList.forEach((item:any) => {
      if(item.MonthYear != undefined){
        xAxisData.push(item.MonthYear);
      }
      if(item.YEAR != undefined){
        xAxisData.push(item.YEAR);
      }
      totalAmountData.push(item.Amount);  // Push the total amount
      paidData.push(item.Paid);        // Push the paid amount
      balanceData.push(item.Balance);    // Push the balance amount
    });

    // Now, assign these processed arrays to your chartOptions
    this.chartOptions = {
      legend: {
        data: ['Total Amount', 'Paid', 'Balance'],
        align: 'left',
        top: 'bottom'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: (params: any) => {
          let tooltipContent = params[0].name + '<br/>';
          params.forEach((item: any) => {
            tooltipContent += `${item.marker} ${item.seriesName}: ${item.value}<br/>`;
          });
          return tooltipContent;
        }
      },
      xAxis: {
        data: xAxisData, // Dynamic MonthYear data
        axisLabel: {
          interval: 0,
          rotate: 30
        },
        silent: false,
        axisLine: {
          onZero: true,
        },
      },
      yAxis: {
        type: 'value',
        name: 'Amount',
        inverse: false,
        splitArea: {
          show: false,
        },
      
      },
      series: [
        {
          name: 'Total Amount', // Make sure this matches the legend data
          type: 'bar',
          data: totalAmountData, // Dynamic Total Amount data
          animationDelay: (idx: number) => idx * 12,
          itemStyle: {
            color: '#1e2672',   // Example color for Total Amount
               borderColor: '#1e2672',
               borderWidth: 1, 
                borderRadius: [5, 5, 0, 0],
                shadowBlur: 10, 
                shadowColor: 'rgba(0, 0, 0, 0.3)', 
                 shadowOffsetX: 0, 
                  shadowOffsetY: 5   
          }
        },
        
      ],
      animationEasing: 'elasticOut',
      animationDelayUpdate: (idx: number) => idx * 5,
    };
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });

  }

  ChangeDate(){
    if(this.FilterTypeR == "YearMonthWise"){
            this.dataRegister.FromDate =  moment(this.dataRegister.FromDate).startOf('month').format('YYYY-MM-DD');
            this.dataRegister.ToDate =  moment(this.dataRegister.ToDate).endOf('month').format('YYYY-MM-DD');
    }
    if(this.FilterTypeR == "YearWise"){
            this.dataRegister.FromDate =  moment(this.dataRegister.FromDate).startOf('year').format('YYYY-MM-DD');
            this.dataRegister.ToDate =  moment(this.dataRegister.ToDate).endOf('year').format('YYYY-MM-DD');
    }
  }
 
  
  
  
  openModalR(contentR: any, data: any) {
     if(data.MonthYear){
      this.sp.show();
      this.MonthYearHead = data.MonthYear
      this.modalService.open(contentR, { centered: true, backdrop: 'static', keyboard: false, size: 'md' });
      const subs: Subscription = this.bill.getSaleReportMonthYearWiseDetails(data.BillMasterIds).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.RegisterDetailList = res.data;
            this.as.successToast(res.message)
          } else {
            this.as.errorToast(res.message)
          }
          this.sp.hide();
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    }
    }
   

   
  generateManualPdfTable(): void {
     const doc = new jsPDF();
     let shops:any = []
   
     shops = this.shop.filter((s: any) => s.ID === Number(this.BillMaster.ShopID));
     
     const tableHeader = ['SNo.','InvoiceDate', 'InvoiceNo',  'Cust_Name', 'Qty', 'SubTotal', 'Dis_Amt', 'Total', 'Tax_Amt', 'GrandTotal', 'AddDis',];
     const tableBody = this.BillMasterList.map((item: any, index: number) => [ 
       (index + 1).toString(),
       item.BillDate ? moment(item.BillDate).format('DD-MM-YYYY') : '',
       String(item.InvoiceNo || ''),
       String(item.CustomerName || ''),
       String(item.Quantity || ''),
       String((item.SubTotal + item.DiscountAmount)?.toFixed(2) || ''),
       String(item.DiscountAmount?.toFixed(2) || ''),
       String(item.SubTotal?.toFixed(2) || ''),
       String(item.GSTAmount?.toFixed(2) || ''),
       String(item.TotalAmount?.toFixed(2) || ''),
       String(item.AddlDiscount?.toFixed(2) || ''),
     ]);
   

     const totalQty = this.totalQty || 0;
     const totalSub = Number(this.totalUnitPrice || 0) + Number(this.totalDiscount || 0);;
     const totalDiscount = this.totalDiscount || 0;
     const totalSubTotalPrice = this.totalUnitPrice || 0;
     const totalGstAmount = this.totalGstAmount || 0;
     const totalAmount = this.totalAmount || 0;
     const totalAddlDiscount = this.totalAddlDiscount || 0;
  
       tableBody.push([
    'Total', '', '', '',
    totalQty.toString(),
    totalSub,
    totalDiscount,
    totalSubTotalPrice,
    totalGstAmount,
    totalAmount,
    totalAddlDiscount,
  ]);
   
     const shopName = `${shops[0]?.Name || ''} (${shops[0]?.AreaName || ''})`;
     const shopAddress = shops[0]?.Address || '';
     const shopPhone = shops[0]?.MobileNo1 || '';
     const shopEmail = shops[0]?.Email || '';
     const reportTitle = "Sale Report";
     const fromDate = this.BillMaster.FromDate;
     const toDate = this.BillMaster.ToDate;
   
     // --- Shop header (only first page) ---
   const boxX = 5;
   const boxY = 5;
   const boxWidth = doc.internal.pageSize.getWidth() - 2 * boxX;
   let contentY = boxY + 8;
   
   doc.setDrawColor(0); // black border
   doc.setLineWidth(0.5);
   if(this.BillMaster.ShopID != 0){
     doc.rect(boxX, boxY, boxWidth, 45, 'S'); // fixed height box
   }else{
   doc.rect(boxX, boxY, boxWidth, 25, 'S');
   }
   
   // Shop name
   if(this.BillMaster.ShopID != 0){
   
   doc.setFontSize(16);
   doc.setFont('helvetica', 'bold');
   doc.text(shopName, doc.internal.pageSize.getWidth() / 2, contentY, { align: 'center' });
   contentY += 7;
   
   // Address
   doc.setFontSize(10);
   doc.setFont('helvetica', 'normal');
   doc.text(shopAddress, doc.internal.pageSize.getWidth() / 2, contentY, { align: 'center' });
   contentY += 6;
   
   // Phone
   doc.text(`Phone: ${shopPhone}`, doc.internal.pageSize.getWidth() / 2, contentY, { align: 'center' });
   contentY += 6;
   
   // Email
   doc.text(`Email: ${shopEmail}`, doc.internal.pageSize.getWidth() / 2, contentY, { align: 'center' });
   contentY += 8;
   }else{
     doc.setFontSize(16);
   doc.setFont('helvetica', 'bold');
   doc.text('All Shop', doc.internal.pageSize.getWidth() / 2, contentY, { align: 'center' });
   contentY += 7;
   }
   // Title
   doc.setFontSize(12);
   doc.setFont('helvetica', 'bold');
   doc.text(reportTitle, doc.internal.pageSize.getWidth() / 2, contentY, { align: 'center' });
   contentY += 6;
   
   // Dates
   doc.setFontSize(10);
   doc.setFont('helvetica', 'normal');
   doc.text(`From Date: ${fromDate ? moment(this.BillMaster.FromDate).format('DD-MM-YYYY') : ''}`, boxX + 2, contentY);
   doc.text(`To Date: ${toDate ? moment(this.BillMaster.toDate).format('DD-MM-YYYY') : ''}`, boxX + boxWidth - 2, contentY, { align: 'right' });
   
     // --- Main Invoice Table ---
     let finalY = 0;
     if(this.BillMaster.ShopID != 0){
       finalY = 58
     }else{
       finalY = 35
     }
     autoTable(doc, {
    head: [tableHeader],
    body: tableBody,
    startY: finalY,
    styles: {
      fontSize: 9,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [230, 230, 230], // red header
      textColor: 0,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    didParseCell: function (data) {
      if (data.section === 'body' && data.row.index === tableBody.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = [255, 0, 0]; // red for total row
      }
    },
    margin: { left: 5, right: 5 },
    theme: 'grid',
    didDrawPage: function (data) {
      const pageHeight = doc.internal.pageSize.getHeight();
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.setFontSize(9);
        doc.text(`Page ${data.pageNumber}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
    }
  });
     
     // --- Output ---
     const pdfBlob = doc.output('blob');
     const pdfUrl = URL.createObjectURL(pdfBlob);
     const newWindow = window.open(pdfUrl, '_blank');
     if (newWindow) {
       newWindow.onload = () => newWindow.print();
     }
   }
}
