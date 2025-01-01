import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, ViewChild, TemplateRef } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { FileUploadService } from 'src/app/service/helpers/file-upload.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { take } from 'rxjs/operators';
import { CompressImageService } from 'src/app/service/helpers/compress-image.service';
import * as moment from 'moment';
import { CustomerService } from 'src/app/service/customer.service';
import { CustomerPowerCalculationService } from 'src/app/service/helpers/customer-power-calculation.service';
import { BillService } from 'src/app/service/bill.service';
import { ProductService } from 'src/app/service/product.service';
import { BillCalculationService } from 'src/app/service/helpers/bill-calculation.service';
import { SupportService } from 'src/app/service/support.service';
import { trigger, style, animate, transition } from '@angular/animations';
import { SupplierService } from 'src/app/service/supplier.service';
import { FitterService } from 'src/app/service/fitter.service';
import { CalculationService } from 'src/app/service/helpers/calculation.service';
import { PaymentService } from 'src/app/service/payment.service';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { NgTinyUrlService } from 'ng-tiny-url';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PurchaseService } from 'src/app/service/purchase.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-order-sale',
  templateUrl: './order-sale.component.html',
  styleUrls: ['./order-sale.component.css']
})

export class OrderSaleComponent implements OnInit {
  company = JSON.parse(localStorage.getItem('company') || '');
  shop = JSON.parse(localStorage.getItem('shop') || '');
  user = JSON.parse(localStorage.getItem('user') || '');
  companySetting = JSON.parse(localStorage.getItem('companysetting') || '');
  selectedShop = JSON.parse(localStorage.getItem('selectedShop') || '');
  permission = JSON.parse(localStorage.getItem('permission') || '[]');
  @ViewChild('barcodeInput') barcodeInput!: ElementRef;
  searchSubject: Subject<string> = new Subject<string>();


  addCustomerBill = false
  editCustomerBill = false
  deleteCustomerBill = false
  CustomerView = false

  myControl = new FormControl('');
  env = environment;
  id: any = 0;
  id2: any = 0;
  link: any = true
  searchValue: any = ''
  onSubmitFrom = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    public as: AlertService,
    private sp: NgxSpinnerService,
    public calculation: CustomerPowerCalculationService,
    public bill: BillService,
    private ps: ProductService,
    private billCalculation: BillCalculationService,
    private supps: SupportService,
    private cs: CustomerService,
    private modalService: NgbModal,
    private sup: SupplierService,
    private fitters: FitterService,
    public cal: CalculationService,
    public pay: PaymentService,
    private tinyUrlService: NgTinyUrlService,
    private sanitizer: DomSanitizer,
    private purchaseService: PurchaseService,
  ) {
    this.id = this.route.snapshot.params['customerid'];
    this.id2 = this.route.snapshot.params['billid'];
    this.link = true;
    this.searchSubject.pipe(
      debounceTime(500), // Wait for 500ms after the last keystroke
      distinctUntilChanged() // Ensure the value has changed
    ).subscribe((searchKey) => {
      this.performSearch(searchKey);
    });
  }

  disableAddButtons = false;

  BillMaster: any = {
    ID: null, CustomerID: null, CompanyID: null, ShopID: null, Sno: "", RegNo: '', BillDate: null, DeliveryDate: null, PaymentStatus: null, InvoiceNo: null, GSTNo: '', Doctor: null, Employee: null, TrayNo: null, ProductStatus: 'Pending', Balance: 0, Quantity: 0, SubTotal: 0, DiscountAmount: 0, GSTAmount: 0, AddlDiscount: 0, AddlDiscountPercentage: 0, TotalAmount: 0.00, RoundOff: 0.00, DueAmount: 0.00, Invoice: null, Receipt: null, Status: 1, CreatedBy: null,
  }

  BillItem: any = {
    ID: null, CompanyID: null, ProductName: null, ProductTypeID: null, ProductTypeName: null, HSNCode: null, UnitPrice: 0.00, Quantity: 0, SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: 0, GSTAmount: 0.00, GSTType: 'None', TotalAmount: 0.00, WholeSale: false, Manual: false, PreOrder: false, BarCodeCount: null, Barcode: null, BaseBarCode: null, Status: 1, MeasurementID: null, Family: 'Self', Option: null, SupplierID: null, ProductExpDate: '0000-00-00', Remark: '', Warranty: '', RetailPrice: 0.00, WholeSalePrice: 0.00, DuaCal: 'yes', PurchasePrice: 0, UpdateProduct: false, fixwithmanualHS: false
  };

  Service: any = {
    ID: null, CompanyID: null, ServiceType: null, Name: '', Description: null, cost: 0.00, Price: 0.00, SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: 0, GSTAmount: 0.00, GSTType: 'None', TotalAmount: 0.00, Status: 1, MeasurementID: null, DuaCal: 'yes',
  };

  customer: any = {
    ID: null, CompanyID: '', Idd: 0, Name: '', Sno: '', TotalCustomer: '', VisitDate: '', MobileNo1: '', MobileNo2: '', PhoneNo: '', Address: '', GSTNo: '', Email: '', PhotoURL: '', DOB: '', Age: 0, Anniversary: '', RefferedByDoc: '', ReferenceType: '', Gender: '', Category: '', Other: '', Remarks: '', Status: 1, CreatedBy: 0, UpdatedBy: 0, CreatedOn: '', UpdatedOn: '', tablename: '', spectacle_rx: [], contact_lens_rx: [], other_rx: [],
  };

  applyPayment: any = {
    ID: null, CustomerID: null, CompanyID: null, ShopID: null, CreditType: 'Credit', PaymentDate: null, PayableAmount: 0, PaidAmount: 0,
    CustomerCredit: 0, PaymentMode: null, CardNo: '', PaymentReferenceNo: '', Comments: 0, Status: 1,
    pendingPaymentList: {}, RewardPayment: 0, ApplyReward: false, ApplyReturn: false
  };

  applyReward: any = {
    ID: null, RewardCustomerRefID: null, CompanyID: null, ShopID: null, CreditType: 'Credit', PaymentDate: null, PayableAmount: 0, PaidAmount: 0,
    CustomerCredit: 0, PaymentMode: 'Customer Reward', CardNo: '', PaymentReferenceNo: '', Comments: 0, Status: 1,
    pendingPaymentList: {}, RewardPayment: 0, ApplyReward: true, ApplyReturn: false, RewardType: 'Self', RewardBalance: 0, AppliedRewardAmount: 0, RewardPercentage: 0, Otp: null
  };

  Req: any = { SearchBarCode: '', searchString: '', SupplierID: 0 }

  data: any = { billMaseterData: null, billDetailData: null, service: null };
  data1: any = { billMaseterData: null, billDetailData: [] };

  body = {
    customer: null, billMaster: null, billItemList: null, serviceList: null, employeeList: null, paidList: null, unpaidList: null, Shop: null,
    Company: null, CompanySetting: null, User: null, mode: null, ShowPower: false, CustomerCredit: null, zoom: '', BillDatePrint: null, OldDueAmount: 0
  };

  located: any = { ProductTypeID: '', ProductNameType: '', ProductName: '', Barcode: "", TotalQty: 0, Located: 0, Unloacted: 0, LocationID: '', qty: 0 };
  locatedList: any = []
  UnlocatedQty = 0
  TotalQty = 0
  LocatedQty = 0
  locQtyDis = true

  category = 'Product';
  doctorList: any = []
  employeeList: any = []
  trayNoList: any = []
  loginShop: any;
  currentTime: any = '';
  discontSettingBtn = false;
  WholeSaleDisabled = false
  PreOrder = "false";
  ShopMode = false;
  showProductExpDate = false;
  searchList: any = [];
  billItemList: any = [];
  serviceLists: any = [];
  serviceType: any = [];
  familyList: any;
  prodList: any = [];
  specList: any = [];
  selectedProduct: any;
  gstList: any = [];
  gst_detail: any = [];

  BarcodeListShow = false
  BarcodeList: any;
  PurchasePriceInput = false;
  PerOrderBtn = false;
  ProductSrchList: any;

  GstTypeDis = false

  DiscountFix = false;
  FixWithManualValue = ''
  FixWithManualAmt = 0

  ShowPower = false
  billItemCheckList: any
  checked: any = false;
  otpChecked = false;

  OldInvoiceDueAmount: any = 0
  totalpaid: any = 0
  PaymentModesList: any = []
  invoiceList: any = []
  paidList: any = []
  filteredOptions: any = []
  myControl1 = new FormControl('');



  ngAfterViewInit() {
    // Check if Customer ID is 0 and set focus
    if (this.id2 == 0) {
      this.barcodeInput.nativeElement.focus();
    }
  }

  dateFormat(date: any) {
    return moment(new Date(date)).format(`${this.companySetting.DateFormat}`);
  }

  ngOnInit(): void {
    this.permission.forEach((element: any) => {
      if (element.ModuleName === 'CustomerBill') {
        this.CustomerView = element.View;
        this.editCustomerBill = element.Edit;
        this.addCustomerBill = element.Add;
        this.deleteCustomerBill = element.Delete;
      }
    });

    this.BillMaster.Employee = this.user.ID
    this.BillMaster.BillDate = moment().format('YYYY-MM-DD');
    this.BillMaster.DeliveryDate = moment(new Date()).add(this.companySetting.DeliveryDay, 'days').format('YYYY-MM-DD');
    [this.loginShop] = this.shop.filter((s: any) => s.ID === Number(this.selectedShop[0]));
    this.currentTime = new Date().toLocaleTimeString('en-IN', { hourCycle: 'h23' })

    this.getDoctor();
    this.getEmployee();
    this.getProductList();
    this.getGSTList();

    [this.loginShop] = this.shop.filter((s: any) => s.ID === Number(this.selectedShop[0]));
    if (this.loginShop.WholesaleBill === 'true') {
      this.BillItem.WholeSale = true
      this.WholeSaleDisabled = true
    } else {
      this.BillItem.WholeSale = false
    }

    if (this.loginShop.RetailBill === 'true') {
      if (this.loginShop.WholesaleBill === 'true') {
        this.BillItem.WholeSale = false
        this.WholeSaleDisabled = false
      }
    }
  }

  getDoctor() {
    this.sp.show();
    const subs: Subscription = this.bill.getDoctor().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.doctorList = res.data.sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
          this.sp.hide();
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),

    });
  }

  getEmployee() {
    this.sp.show();
    const subs: Subscription = this.bill.getEmployee().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.employeeList = res.data.sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  changeEmployee() {
    if (this.id2 != 0) {
      this.sp.show();
      const dtm = {
        BillMasterID: Number(this.id2),
        UserID: this.BillMaster.Employee
      }
      const subs: Subscription = this.bill.changeEmployee(dtm).subscribe({
        next: (res: any) => {
          if (res.success) {
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

  getTrayNo() {
    this.sp.show();
    const subs: Subscription = this.bill.getTrayNo().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.trayNoList = res.data.sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),

    });
  }

  getGSTList() {
    this.sp.show();
    const subs: Subscription = this.supps.getList('TaxType').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.gstList = res.data
          this.gst_detail = [];
          res.data.forEach((ele: any) => {
            if (ele.Name !== ' ') {
              let obj = { GSTType: '', Amount: 0 };
              obj.GSTType = ele.Name;
              this.gst_detail.push(obj);
            }
          })
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),

    });
    this.sp.hide();
  }

  notifyGst() {
    if ((this.BillItem.GSTType === 'None' && this.BillItem.GSTPercentage !== 0) || (this.BillItem.GSTPercentage === 0 && this.BillItem.GSTType !== 'None') || (this.BillItem.GSTPercentage === null && this.BillItem.GSTType !== 'None')) {
      Swal.fire({
        position: 'center',
        icon: 'warning',
        title: 'Without GSTType, the selected value will not be saved',
        showConfirmButton: true,
        backdrop: false,
      })
      this.GstTypeDis = false
    }
    if ((this.Service.GSTType === 'None' && this.Service.GSTPercentage !== 0) || (this.Service.GSTPercentage === 0 && this.Service.GSTType !== 'None') || (this.Service.GSTPercentage === null && this.Service.GSTType !== 'None')) {
      Swal.fire({
        position: 'center',
        icon: 'warning',
        title: 'Without GSTType, the selected value will not be saved',
        showConfirmButton: true,
        backdrop: false,
      })
      this.GstTypeDis = false
    }
  }

  isValidDate(dateString: any) {
    // First check for the pattern
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;

    // Parse the date parts to integers
    var parts = dateString.split("-");
    var year = parseInt(parts[0], 10);
    var month = parseInt(parts[1], 10);
    var day = parseInt(parts[2], 10);

    // Check the ranges of month and year
    if (year < 1000 || year > 3000 || month == 0 || month > 12) return false;

    var daysInMonth = new Date(year, month, 0).getDate();
    return day > 0 && day <= daysInMonth;
  }

  setValues() {
    this.serviceType.forEach((element: any) => {
      if (element.ID === this.Service.ServiceType) {
        this.Service.ID = null
        this.Service.CompanyID = element.CompanyID
        this.Service.ServiceType = element.ID
        this.Service.Name = element.Name
        this.Service.Description = element.Description;
        this.Service.Cost = element.Cost;
        this.Service.Price = element.Price;
        this.Service.SubTotal = element.SubTotal;
        this.Service.GSTPercentage = element.GSTPercentage;
        this.Service.GSTAmount = element.GSTAmount;
        this.Service.GSTType = element.GSTType;
        this.Service.TotalAmount = element.TotalAmount;
        this.Service.DiscountPercentage = 0
        this.Service.DiscountAmount = 0
      }
    });
  }

  getSearchByBarcodeNo() {
    if (this.Req.SearchBarCode !== '' && this.Req.SearchBarCode != undefined) {
      this.sp.show();
      if (this.BillItem.Manual == false) {
        if (this.BillItem.PreOrder) {
          this.PreOrder = "true"
        } else {
          this.PreOrder = "false"
        }

        const subs: Subscription = this.bill.searchByBarcodeNo(this.Req, this.PreOrder, this.ShopMode).subscribe({
          next: (res: any) => {
            if (res.success) {
              this.searchList = res.data[0];
              if (this.searchList === undefined || this.searchList.Barcode === null || this.searchList.length === 0) {
                Swal.fire({
                  icon: 'warning',
                  title: 'Please Enter Correct Barcode ',
                  text: 'Incorrect Barcode OR Product not available in this Shop.',
                  footer: '',
                  backdrop: false,
                });
                this.sp.hide();
              }

              this.selectedProduct = this.searchList.ProductTypeName;
              this.BillItem.ProductName = this.searchList.ProductName.toUpperCase();
              this.BillItem.ProductTypeID = this.searchList.ProductTypeID;
              this.BillItem.Barcode = this.searchList.Barcode;
              this.BillItem.BarCodeCount = this.searchList.BarCodeCount;
              this.BillItem.BaseBarCode = this.searchList.BaseBarCode;
              this.BillItem.PurchasePrice = this.searchList.UnitPrice;
              this.BillItem.Quantity = 0;
              this.myControl = new FormControl(this.BillItem.ProductName)
              if (this.selectedProduct == 'CONTACT LENS' || this.selectedProduct == 'SOLUTION') {
                this.showProductExpDate = true
              } else {
                this.showProductExpDate = false
              }

              let ProductNameSplitDate = this.searchList.ProductName.split("/")
              if (this.isValidDate(ProductNameSplitDate[ProductNameSplitDate.length - 1])) {
                this.BillItem.ProductExpDate = ProductNameSplitDate[ProductNameSplitDate.length - 1]
                this.showProductExpDate = true
              } else {
                this.BillItem.ProductExpDate = "0000-00-00"
              }

              if (this.searchList !== undefined || this.searchList.Barcode !== null && this.searchList.BarCodeCount !== 0) {
                if (this.billItemList.length !== 0 && this.BillItem.ProductName !== "") {
                  let itemCount = 0;
                  this.billItemList.forEach((element: any) => {
                    if (element.ProductName === this.BillItem.ProductName && element.Barcode === this.BillItem.Barcode && element.ID === null) {
                      itemCount = itemCount + element.Quantity;
                    }
                  })
                  this.searchList.BarCodeCount = this.searchList.BarCodeCount - itemCount;
                }
              }

              this.prodList.forEach((e: any) => {
                if (e.Name === this.searchList.ProductTypeName || e.ID === this.searchList.ProductTypeID) {
                  this.BillItem.ProductTypeID = e.ID;
                  this.BillItem.ProductTypeName = e.Name;
                  this.BillItem.HSNCode = e.HSNCode;
                  this.BillItem.GSTPercentage = e.GSTPercentage;
                  this.BillItem.GSTType = e.GSTType;
                }
              })

              if (this.BillItem.WholeSale === true) {
                this.BillItem.UnitPrice = this.searchList.WholeSalePrice;
              }
              else if (this.BillItem.PreOrder === true) {
                this.BillItem.UnitPrice = this.searchList.RetailPrice;
              }
              else {
                this.BillItem.UnitPrice = this.searchList.RetailPrice;
              }
              if (this.loginShop.DiscountSetting == "true") {
                this.discountSetting(this.BillItem)
              }
              this.BillItem.Quantity = 1;
              // this.calculations('Quantity', 'subTotal')
            } else {
              this.as.errorToast(res.message)
            }
            this.sp.hide();
          },
          error: (err: any) => console.log(err.message),
          complete: () => subs.unsubscribe(),

        });
      } else {
        this.sp.hide();
        Swal.fire({
          icon: 'warning',
          title: 'Not Available',
          text: 'Product Not available in this Shop.',
          footer: '',
          backdrop: false,
        });
      }
    }
  }

  getSearchByString(searchKey: any, mode: any) {
    this.searchSubject.next(searchKey); // Trigger the debounce logic
  }

  performSearch(searchKey: string) {
    this.Req.searchString = searchKey;

    if (this.BillItem.Manual === false) {

      if (this.BillItem.PreOrder && this.Req.searchString !== '') {
        this.PreOrder = "true";
        this.BarcodeListShow = false;

        const subs: Subscription = this.bill.searchByString(this.Req, this.PreOrder, this.ShopMode).subscribe({
          next: (res: any) => {
            if (res.success) {
              this.BarcodeList = res.data;
              this.ProductSrchList = this.BarcodeList;
            } else {
              this.as.errorToast(res.message);
            }
            this.sp.hide();
          },
          error: (err: any) => console.log(err.message),
          complete: () => subs.unsubscribe(),
        });
      }
      // Handle Stock search
      else if (!this.BillItem.PreOrder && this.Req.searchString !== '') {
        this.PreOrder = "false";
        this.BarcodeListShow = true;

        const subs: Subscription = this.bill.searchByString(this.Req, this.PreOrder, this.ShopMode).subscribe({
          next: (res: any) => {
            if (res.success) {
              this.BarcodeList = res.data;
            } else {
              this.as.errorToast(res.message);
            }
          },
          error: (err: any) => console.log(err.message),
          complete: () => subs.unsubscribe(),
        });
      } else {
        this.BarcodeList = [];
      }
    } else {
      this.sp.hide();
      this.BarcodeList = [];
    }
  }

  getSearchByBarcodeNoS(data: any) {
    this.Req.SearchBarCode = data.Barcode
    this.Req.searchString = data.ProductName
    this.Req.SupplierID = data.SupplierID;
    if (this.Req.SearchBarCode !== '' && this.Req.SearchBarCode != undefined) {

      this.sp.show();
      if (this.BillItem.Manual == false) {
        if (this.BillItem.PreOrder) {
          this.PreOrder = "true"
        } else {
          this.PreOrder = "false"
        }

        const subs: Subscription = this.bill.searchByBarcodeNo(this.Req, this.PreOrder, this.ShopMode).subscribe({
          next: (res: any) => {
            if (res.success) {
              this.searchList = res.data[0];
              if (this.searchList === undefined || this.searchList.Barcode === null) {
                this.BarcodeList = res.data[0];
                Swal.fire({
                  icon: 'warning',
                  title: 'Please Enter Correct Barcode ',
                  text: 'Incorrect Barcode OR Product not available in this Shop.',
                  footer: '',
                  backdrop: false,
                });
                this.sp.hide();
              }

              this.selectedProduct = this.searchList.ProductTypeName;
              this.BillItem.ProductTypeName = this.searchList.ProductTypeName;
              this.BillItem.ProductTypeID = this.searchList.ProductTypeID;
              this.BillItem.ProductName = this.searchList.ProductName.toUpperCase();
              this.BillItem.Barcode = this.searchList.Barcode;
              this.BillItem.BarCodeCount = this.searchList.BarCodeCount;
              this.BillItem.BaseBarCode = this.searchList.BaseBarCode;
              this.BillItem.PurchasePrice = this.searchList.UnitPrice;
              this.BillItem.Quantity = 0;

              if (this.selectedProduct == 'CONTACT LENS' || this.selectedProduct == 'SOLUTION') {
                this.showProductExpDate = true
              } else {
                this.showProductExpDate = false
              }

              let ProductNameSplitDate = this.searchList.ProductName.split("/")
              if (this.isValidDate(ProductNameSplitDate[ProductNameSplitDate.length - 1])) {
                this.BillItem.ProductExpDate = ProductNameSplitDate[ProductNameSplitDate.length - 1]
                this.showProductExpDate = true
              } else {
                this.BillItem.ProductExpDate = "0000-00-00"
              }

              if (this.searchList !== undefined || this.searchList.Barcode !== null && this.searchList.BarCodeCount !== 0) {
                if (this.billItemList.length !== 0 && this.BillItem.ProductName !== "") {
                  let itemCount = 0;
                  this.billItemList.forEach((element: any) => {
                    if (element.ProductName === this.BillItem.ProductName && element.ID === null) {
                      itemCount = itemCount + element.Quantity;
                    }
                  })
                  this.searchList.BarCodeCount = this.searchList.BarCodeCount - itemCount;
                }
              }

              this.prodList.forEach((e: any) => {
                if (e.Name === this.searchList.ProductTypeName || e.ID === this.searchList.ProductTypeID) {
                  this.BillItem.ProductTypeID = e.ID;
                  this.BillItem.ProductTypeName = e.Name;
                  this.BillItem.HSNCode = e.HSNCode;
                  this.BillItem.GSTPercentage = e.GSTPercentage;
                  this.BillItem.GSTType = e.GSTType;
                }
              })

              if (this.BillItem.WholeSale === true) {
                this.BillItem.UnitPrice = this.searchList.WholeSalePrice;
              }
              else if (this.BillItem.PreOrder === true) {
                this.BillItem.UnitPrice = this.searchList.RetailPrice;
              }
              else {
                this.BillItem.UnitPrice = this.searchList.RetailPrice;
              }
              if (this.loginShop.DiscountSetting == "true") {
                this.discountSetting(this.BillItem)
              }
              this.BillItem.Quantity = 1;
            } else {
              this.as.errorToast(res.message)
            }
            this.sp.hide();
          },
          error: (err: any) => console.log(err.message),
          complete: () => subs.unsubscribe(),
        });
      } else {
        this.sp.hide();
        Swal.fire({
          icon: 'warning',
          title: 'Not Available',
          text: 'Product Not available in this Shop.',
          footer: '',
          backdrop: false,
        });
      }
    }
  }

  getBarCodeList(index: any) {

    this.searchList.BarCodeCount = 0;
    this.BillItem.ProductName = '';
    this.BillItem.UnitPrice = 0;
    this.BillItem.PurchasePrice = 0;
    this.BillItem.Quantity = 1;
    let searchString = "";

    this.specList.forEach((element: any, i: any) => {
      if (element.SelectedValue !== '') {
        searchString = searchString.concat("/", element.SelectedValue.trim());
      }
    });
    this.Req.searchString = this.selectedProduct + searchString
    // PreOrder select barcodelist
    if (this.BillItem.Manual === false) {
      if (this.BillItem.PreOrder) {
        this.PreOrder = "true"
        this.BarcodeListShow = false

        const subs: Subscription = this.bill.searchByString(this.Req, this.PreOrder, this.ShopMode).subscribe({
          next: (res: any) => {
            if (res.success) {
              this.BarcodeList = res.data;
              this.PurchasePriceInput = this.BarcodeList == '' || this.BarcodeList.length == 0 ? true : false;
              this.showProductExpDate = this.BarcodeList != '' || this.BarcodeList.length != 0 ? true : false;
              if (this.company.ID == 184) {
                if (this.BarcodeList == '' || this.BarcodeList.length == 0) {
                  this.PurchasePriceInput = false
                  this.PerOrderBtn = true
                } else {
                  this.PerOrderBtn = false
                }
              }

            } else {
              this.as.errorToast(res.message)
            }
          },
          error: (err: any) => console.log(err.message),
          complete: () => subs.unsubscribe(),

        });
      }
      else {
        // stock select barcodelist
        this.PreOrder = "false"
        this.BarcodeListShow = true
        const subs: Subscription = this.bill.searchByString(this.Req, this.PreOrder, this.ShopMode).subscribe({
          next: (res: any) => {
            if (res.success) {
              this.BarcodeList = res.data;
            } else {
              this.as.errorToast(res.message)
            }
          },
          error: (err: any) => console.log(err.message),
          complete: () => subs.unsubscribe(),

        });
      }
    } else {
      this.BarcodeList = []
    }
  }

  openModallocal(contentLocal: any, data: any) {
    this.sp.hide()
    if (data.Barcode != undefined) {
      let dtm = {
        Barcode: data.Barcode
      }
      if (dtm.Barcode == undefined) {
        dtm.Barcode = data
      }
      const subs: Subscription = this.purchaseService.getProductLocationByBarcodeNumber(dtm).subscribe({
        next: (res: any) => {
          if (res.success == true) {
            // this.modalService.open(contentLocal, { centered: true, backdrop: 'static', keyboard: false, size: 'lg' });
            this.BillItem.Location = [];
            const m = this.modalService.open(contentLocal, { centered: true, backdrop: 'static', keyboard: false, size: 'lg' });
            this.locatedList = res.data;
            this.UnlocatedQty = res.calculation[0].UnlocatedQty;
            this.TotalQty = res.calculation[0].TotalQty;
            this.LocatedQty = res.calculation[0].LocatedQty;
            this.locatedList.forEach((o: any) => {
              o.sell = 0;
            });

            if (this.UnlocatedQty != 0) {
              m.dismissed.subscribe((reason: any) => {
                if (reason === 'Cross click') {
                  this.BillItem.Location = [];
                  this.BillItem.is_location = false;
                  this.BillItem.Quantity = 1;
                }
              });
            }

          } else {
            this.modalService.dismissAll();

          }
          this.sp.hide();
        },

        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    }
  }

  locationCal(data: any) {
    this.locatedList.forEach((o: any) => {
      if (o.ID === data.ID) {
        if (o.Qty >= Number(o.sell)) {
          this.BillItem.is_location = true;
          // Find existing entry in Location array by LocationMasterID
          const existingLocation = this.BillItem.Location.find(
            (loc: any) => loc.LocationMasterID === o.ID
          );

          if (existingLocation) {
            // Update the saleQty if entry exists
            let av = 0;
            av = o.Qty + existingLocation.saleQty;
            o.Qty = av;
            existingLocation.saleQty = Number(o.sell);
          } else {
            // Check to ensure saleQty is not 0 and LocationMasterID does not already exist
            if (Number(o.sell) !== 0 && !this.BillItem.Location.some((loc: any) => loc.LocationMasterID === o.ID)) {
              o.Qty = o.Qty - Number(o.sell);
              // Add a new entry if it doesn't exist
              this.BillItem.Location.push({
                LocationMasterID: o.ID,
                LocationID: o.LocationID,
                saleQty: Number(o.sell)
              });
            }
          }
        } else {
          o.sell = 0;
          Swal.fire({
            position: 'center',
            icon: 'warning',
            title: 'Not enough available quantity',
            showCancelButton: true,
            backdrop: false,
          });
        }
      }
    });
    // Reset located qty
    this.BillItem.Quantity = 0;
    this.BillItem.Location.forEach((a: any) => {
      this.BillItem.Quantity += a.saleQty;
    });
  }

  AddLocation() {
    this.BillItem.Quantity = 0;
    this.BillItem.Location.forEach((a: any) => {
      this.BillItem.Quantity += a.saleQty
    })
    this.locQtyDis = false
    this.calculations('DiscountPercentage', 'discount');
    this.calculations('Quantity', 'subTotal');
    this.calculations('GSTPercentage', 'gst');
    this.calculations('TotalAmount', 'total')
    this.ProductSrchList = []
    this.BarcodeList = []
    this.modalService.dismissAll()
  }

  checkqtyloaction() {
    if (this.BillItem.Quantity > this.UnlocatedQty) {
      if (this.UnlocatedQty != 0) {
        Swal.fire({
          icon: 'warning',
          title: `Entered quantity exceeds the available unallocated quantity ${this.UnlocatedQty}`,
          text: '',
          footer: '',
          backdrop: false,
        });
        this.BillItem.Quantity = 1;
        this.calculations('Quantity', 'subTotal');
      }
    }


  }

  calculations(fieldName: any, mode: any,) {
    if (!this.BillItem.PreOrder && !this.BillItem.Manual && this.BillItem.Quantity > this.searchList.BarCodeCount) {
      Swal.fire({
        icon: 'warning',
        title: 'Entered Qty is Greater then Available Qty',
        text: '',
        footer: '',
        backdrop: false,
      });
    }

    else if (this.BillItem.Option != null) {
      // Lens option
      this.BillItem.Quantity = 1;
      if (this.BillItem.Option === 'Full Glass' || this.BillItem.Quantity !== 1) {
        this.BillItem.Quantity = this.BillItem.Quantity * 2;
      } else {
        this.BillItem.Quantity = 1;
      }
      this.billCalculation.calculations(fieldName, mode, this.BillItem, this.Service)

      // Lens option
    }

    else {
      this.billCalculation.calculations(fieldName, mode, this.BillItem, this.Service)
    }
    this.GstTypeDis = false
  }

  calculateGrandTotal() {
    this.billCalculation.calculateGrandTotal(this.BillMaster, this.billItemList, this.serviceLists)
  }

  calculateFields1(fieldName: any, mode: any, data: any) {
    this.billCalculation.calculations(fieldName, mode, data, '')
  }

  discountSetting(data: any) {
    // Initialize discount values and reset settings
    this.BillItem.DiscountPercentage = 0;
    this.BillItem.DiscountAmount = 0.00;
    this.BillItem.Quantity = 0;
    this.DiscountFix = false;
    this.FixWithManualValue = '';
    this.FixWithManualAmt = 0;
    // Determine quantity and other settings based on button state
    const quantity = this.discontSettingBtn ? 3 : 1;

    const dtm = {
      Quantity: quantity,
      ProductTypeID: this.BillItem.ProductTypeID || data.ProductTypeID,
      ProductName: this.BillItem.ProductName || data.ProductName || ''
    };

    // Call API to get discount settings
    const subs: Subscription = this.bill.getDiscountSetting(dtm).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.applyDiscount(res.data);  // Call helper function for discount logic
          // Recalculate totals based on discount
          this.billCalculation.calculations('Quantity', 'subTotal', this.BillItem, this.Service);
          this.billCalculation.calculations('GSTPercentage', 'gst', this.BillItem, this.Service);
        } else {
          this.as.errorToast(res.message);
        }
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  applyDiscount(discountData: any) {
    if (discountData.DiscountType === 'rupees') {
      this.BillItem.DiscountAmount = discountData.DiscountValue;
      this.BillItem.Quantity = 1;
      this.BillItem.DiscountPercentage = 100 * +this.BillItem.DiscountAmount / (+this.BillItem.Quantity * +this.BillItem.UnitPrice);
      this.BillItem.DiscountPercentage = parseFloat(this.BillItem.DiscountPercentage.toFixed(3));
    }
    else if (discountData.DiscountType === "fixed") {
      this.BillItem.fixwithmanualHS = true;
      this.BillItem.DiscountPercentage = discountData.DiscountValue;
      this.BillItem.Quantity = 1;
      this.BillItem.DiscountAmount = +this.BillItem.Quantity * +this.BillItem.UnitPrice * +this.BillItem.DiscountPercentage / 100;
      this.DiscountFix = true;
    }
    else if (discountData.DiscountType === "no discount") {
      this.BillItem.fixwithmanualHS = true;
      this.BillItem.DiscountPercentage = 0;
      this.BillItem.DiscountAmount = 0;
      this.BillItem.Quantity = 1;
      this.DiscountFix = true;
    }
    else if (discountData.DiscountType === "fixed with manual") {
      this.FixWithManualAmt = discountData.DiscountValue;
      this.BillItem.fixwithmanualHS = true;
      this.FixWithManualValue = discountData.DiscountType;
      this.BillItem.DiscountPercentage = 0;
      this.BillItem.DiscountAmount = 0;
      this.BillItem.Quantity = 1;
    }
    else {
      this.BillItem.DiscountPercentage = discountData.DiscountValue;
      this.BillItem.Quantity = 1;
      this.BillItem.DiscountAmount = +this.BillItem.Quantity * +this.BillItem.UnitPrice * +this.BillItem.DiscountPercentage / 100;
    }
  }

  fixwithmanual(ManualType: any, manualdisconut: any) {
    if (this.FixWithManualValue == 'fixed with manual') {

      if (ManualType === 'DiscountPercentage') {
        if (Number(manualdisconut) > this.FixWithManualAmt) {
          Swal.fire({
            icon: 'warning',
            title: `You can't give more than ${this.FixWithManualAmt} discount`,
            text: ``,
            footer: '',
            backdrop: false,
          });
          this.BillItem.DiscountPercentage = 0
          this.BillItem.DiscountAmount = 0
        } else {
          this.BillItem.DiscountAmount = +this.BillItem.Quantity * +this.BillItem.UnitPrice * +this.BillItem.DiscountPercentage / 100;
        }
      }


      if (ManualType === 'DiscountAmount') {
        this.BillItem.DiscountPercentage = 100 * +manualdisconut / (+this.BillItem.Quantity * +this.BillItem.UnitPrice);
        if (Number(this.BillItem.DiscountPercentage) > this.FixWithManualAmt) {
          Swal.fire({
            icon: 'warning',
            title: `You can't give more than ${this.FixWithManualAmt} discount`,
            text: ``,
            footer: '',
            backdrop: false,
          });
          this.BillItem.DiscountPercentage = 0
          this.BillItem.DiscountAmount = 0
        }
      }

      this.billCalculation.calculations('Quantity', 'subTotal', this.BillItem, this.Service);
      this.billCalculation.calculations('GSTPercentage', 'gst', this.BillItem, this.Service);
    }
  }

  AddDiscalculate(fieldName: any, mode: any) {
    let PaidAmount = 0

    if (this.id2 == 0) { this.billCalculation.AddDiscalculate(fieldName, mode, this.BillMaster) }
    else {
      if (this.BillMaster.DueAmount >= this.BillMaster.AddlDiscountPercentage) {
        PaidAmount = this.BillMaster.TotalAmount - this.BillMaster.DueAmount
        this.billCalculation.AddDiscalculate(fieldName, mode, this.BillMaster)
        this.BillMaster.DueAmount = + this.BillMaster.TotalAmount - PaidAmount
      }
      else if (this.BillMaster.DueAmount >= this.BillMaster.AddlDiscount) {
        PaidAmount = this.BillMaster.TotalAmount - this.BillMaster.DueAmount
        this.billCalculation.AddDiscalculate(fieldName, mode, this.BillMaster)
        this.BillMaster.DueAmount = + this.BillMaster.TotalAmount - PaidAmount
      }
      else {
        this.BillMaster.AddlDiscount = 0
        this.BillMaster.AddlDiscountPercentage = 0
        PaidAmount = this.BillMaster.TotalAmount - this.BillMaster.DueAmount
        this.billCalculation.AddDiscalculate(fieldName, mode, this.BillMaster)
        this.BillMaster.DueAmount = + this.BillMaster.TotalAmount - PaidAmount
        Swal.fire({
          icon: 'warning',
          title: 'You cannot give an additional discount greater than the due amount (0).',
          text: '',
          footer: '',
          backdrop: false,
        });
      }
    }


  }


  getProductList() {
    this.sp.show();
    const subs: Subscription = this.ps.getList().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.prodList = res.data.sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));

          this.BillItem.Quantity = 1
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),

    });
  }

  getFieldList() {
    if (this.selectedProduct !== null || this.selectedProduct !== '') {
      this.prodList.forEach((element: any) => {
        if (element.Name === this.selectedProduct) {
          this.BillItem.ProductTypeID = element.ID;
          this.BillItem.HSNCode = element.HSNCode;
          this.BillItem.GSTPercentage = element.GSTPercentage;
          this.BillItem.GSTType = element.GSTType;
          this.searchList.ProductTypeID = element.ID;
          this.searchList.HSNCode = element.HSNCode;
          this.searchList.GSTPercentage = element.GSTPercentage;
          this.searchList.GSTType = element.GSTType;
        }
      });
      if (this.selectedProduct == 'CONTACT LENS' || this.selectedProduct == 'SOLUTION') {
        this.showProductExpDate = true
      } else {
        this.showProductExpDate = false
      }
    }
    const subs: Subscription = this.ps.getFieldList(this.selectedProduct).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.specList = res.data;
          if (res.data.length) {
            this.getSptTableData();
          }
        } else {
          this.as.errorToast(res.message)
        }
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getSptTableData() {
    this.specList.forEach((element: any) => {
      if (element.FieldType === 'DropDown' && element.Ref === '0') {
        const subs: Subscription = this.ps.getProductSupportData('0', element.SptTableName).subscribe({
          next: (res: any) => {
            if (res.success) {
              element.SptTableData = res.data.sort((a: { TableValue: string; }, b: { TableValue: any; }) => (a.TableValue.trim()).localeCompare(b.TableValue));
              element.SptFilterData = res.data.sort((a: { TableValue: string; }, b: { TableValue: any; }) => (a.TableValue.trim()).localeCompare(b.TableValue));
            } else {
              this.as.errorToast(res.message)
            }
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
            if (res.success) {
              element.SptTableData = res.data.sort((a: { TableValue: string; }, b: { TableValue: any; }) => (a.TableValue.trim()).localeCompare(b.TableValue));
              element.SptFilterData = res.data.sort((a: { TableValue: string; }, b: { TableValue: any; }) => (a.TableValue.trim()).localeCompare(b.TableValue));
            } else {
              this.as.errorToast(res.message)
            }
          },
          error: (err: any) => console.log(err.message),
          complete: () => subs.unsubscribe(),
        });
      }
    });
  }

  displayAddField(i: any) {
    this.specList[i].DisplayAdd = 1;
    this.specList[i].SelectedValue = '';
  }

  saveFieldData(i: any) {

    this.specList[i].DisplayAdd = 0;
    let count = 0;
    this.specList[i].SptTableData.forEach((element: { TableValue: string; }) => {
      if (element.TableValue.toLowerCase() === this.specList[i].SelectedValue.toLowerCase().trim()) { count = count + 1; }
    });
    if (count !== 0 || this.specList[i].SelectedValue === '') {
      //  alert ("Duplicate or Empty Values are not allowed");
      Swal.fire({
        icon: 'error',
        title: 'Duplicate or Empty values are not allowed',
        footer: ''
      });
    } else {
      const Ref = this.specList[i].Ref;
      let RefValue = 0;
      if (Ref !== 0) {
        this.specList.forEach((element: any, j: any) => {
          if (element.FieldName === Ref) { RefValue = element.SelectedValue; }
        });
      }
      this.sp.show()
      const subs: Subscription = this.ps.saveProductSupportData(this.specList[i].SptTableName, RefValue, this.specList[i].SelectedValue).subscribe({
        next: (res: any) => {
          const subss: Subscription = this.ps.getProductSupportData(RefValue, this.specList[i].SptTableName).subscribe({
            next: (res: any) => {
              if (res.success) {
                this.specList[i].SptTableData = res.data;
                this.specList[i].SptFilterData = res.data;
                this.as.successToast(res.message)
              } else {
                this.as.errorToast(res.message)
              }
              this.sp.hide()
            },
            error: (err: any) => console.log(err.message),
            complete: () => subss.unsubscribe(),
          });
          if (res.success) { }
          else { this.as.errorToast(res.message) }
        },
        error: (err: any) => {
          console.log(err.msg);
        },
        complete: () => subs.unsubscribe(),
      });
    }
  }

  onChange(event: { toUpperCase: () => any; toTitleCase: () => any; }) {
    if (this.companySetting.DataFormat === '1') {
      event = event.toUpperCase()
    } else if (this.companySetting.DataFormat == '2') {
      event = event.toTitleCase()
    }
    return event;
  }

  productSelect(data: any) {
    this.Req.searchString = data.ProductName
    if (data !== undefined) {
      this.Req.SupplierID = data.SupplierID;
    } else {
      this.Req.SupplierID = 0
    }
    this.getSearchByBarcodeNo()
  }

  addProductItem() {
    if (this.BillMaster.ID !== null) {
      this.BillItem.Status = 2;
      this.BillItem.DuaCal = 'yes';
    } else {
      this.BillItem.DuaCal = 'yes'
    }

    if (!this.BillItem.PreOrder && !this.BillItem.Manual && this.BillItem.Quantity > this.searchList.BarCodeCount) {
      Swal.fire({
        icon: 'warning',
        title: 'Entered Qty is Greater then Available Qty',
        text: '',
        footer: '',
        backdrop: false,
      });
      this.BillItem.Quantity = 0;
      this.BillItem.SubTotal = 0;
      this.BillItem.DiscountAmount = 0;
      this.BillItem.GSTAmount = 0;
      this.BillItem.TotalAmount = 0;
      this.billCalculation.calculations('', '', this.BillItem, this.Service)
    } else {

      // LENS POWER LAST INDEXING REMOVE CONDITION 
      if (this.BillItem.PreOrder === true && this.BillItem.ProductTypeName.toLowerCase() === 'lens') {
        if (this.specList && Array.isArray(this.specList) && this.specList.length > 0) {
          this.specList.forEach((s: any) => {
            if (s.FieldName && s.FieldName.toLowerCase() === 'power range') {
              const lastSlashIndex = this.BillItem.ProductName.lastIndexOf('/');
              if (lastSlashIndex !== -1) {
                const newProductName = this.BillItem.ProductName.substring(0, lastSlashIndex);
                this.BillItem.ProductName = newProductName;
              }
            }
          });
        } else {
          const lastSlashIndex = this.BillItem.ProductName.lastIndexOf('/');
          if (lastSlashIndex !== -1) {
            const newProductName = this.BillItem.ProductName.substring(0, lastSlashIndex);
            this.BillItem.ProductName = newProductName;
          }
        }
      }

      this.billItemList.unshift(this.BillItem);
      this.calculateGrandTotal()
      console.log(this.billItemList);
      this.myControl = new FormControl('')
      this.BillItem = {
        ID: null, CompanyID: null, ProductName: null, ProductTypeID: null, ProductTypeName: null, HSNCode: null, UnitPrice: 0.00, Quantity: 0, SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: 0, GSTAmount: 0.00, GSTType: 'None', TotalAmount: 0.00, WholeSale: this.BillItem.WholeSale, Manual: this.BillItem.Manual, PreOrder: false, BarCodeCount: null, Barcode: null, BaseBarCode: null, Status: 1, MeasurementID: null, Family: 'Self', Option: null, SupplierID: null, ProductExpDate: '0000-00-00', Remark: '', Warranty: '', RetailPrice: 0.00, WholeSalePrice: 0.00, DuaCal: 'yes', PurchasePrice: 0, UpdateProduct: false
      };
      this.locQtyDis = true
      this.searchList.BarCodeCount = 0;
      this.selectedProduct = "";
      this.specList = [];
      this.BarcodeList = [];
      this.Req = { SearchBarCode: '', searchString: '', SupplierID: 0 };

    }
    this.barcodeInput.nativeElement.focus();
  }

  addItem() {
    // additem Services
    this.DiscountFix = false;
    if (this.category === 'Services') {
      if (this.BillMaster.ID !== null) {
        this.Service.Status = 2; this.Service.DuaCal = 'yes'
      }
      else {
        this.Service.DuaCal = 'yes'
      }

      // Handle GST conditions
      if (this.Service.GSTPercentage === 0 || this.Service.GSTAmount === 0) {
        this.Service.GSTType = 'None'
        this.GstTypeDis = false
      }
      else if (this.Service.GSTType !== 'None') {
        if (this.Service.GSTPercentage === 0 || this.Service.GSTAmount === 0) {
          this.GstTypeDis = false
        }
      }
      else if (this.Service.GSTType === 'None') {
        if (this.Service.GSTPercentage !== 0 || this.Service.GSTAmount !== 0) {
          this.GstTypeDis = false
        }
      }


      // Check if the service name contains 'eye' (case insensitive)
      if (this.Service.Name.toLowerCase().includes('eye')) {
        let type = 'Lens';

        const subs: Subscription = this.cs.getMeasurementByCustomer(this.id, type).subscribe({
          next: (res: any) => {
            console.log(res);
            if (res.data.length !== 0) {
              if (res.success) {
                this.Service.MeasurementID = JSON.stringify(res.data);
                this.serviceLists.push(this.Service);
                console.log('==== came the word eye =====>');

                this.calculateGrandTotal()
                this.Service = {
                  ID: null, CompanyID: null, ServiceType: null, Name: '', Description: null, cost: 0.00, Price: 0.00, SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: 0, GSTAmount: 0.00, GSTType: 'None', TotalAmount: 0.00, Status: 1, MeasurementID: null
                };
              } else {
                this.as.errorToast(res.message);
                Swal.fire({
                  position: 'center',
                  icon: 'warning',
                  title: 'Opps !!',
                  text: res.message,
                  showConfirmButton: true,
                  backdrop: false,
                });
              }
            } else {
              this.Service.MeasurementID = [];
            }

            this.sp.hide();
          },
          error: (err: any) => console.log(err.message),
          complete: () => subs.unsubscribe(),
        });
      } else {
        this.Service.MeasurementID = [];
        this.serviceLists.push(this.Service);
        console.log('No eye word came!!!!!!');

        this.calculateGrandTotal()
        this.Service = {
          ID: null, CompanyID: null, ServiceType: null, Name: '', Description: null, cost: 0.00, Price: 0.00, SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: 0, GSTAmount: 0.00, GSTType: 'None', TotalAmount: 0.00, Status: 1, MeasurementID: null
        };
      }




    }

    // additem Product
    if (this.category === 'Product' && this.BillItem.ProductTypeID !== '') {

      // GSTType disable condition
      if (this.BillItem.GSTPercentage === 0 || this.BillItem.GSTAmount === 0) {
        this.BillItem.GSTType = 'None'
        this.GstTypeDis = false
      }

      else if (this.BillItem.GSTType !== 'None') {
        if (this.BillItem.GSTPercentage === 0) {
          this.GstTypeDis = false
        }
      }

      else if (this.BillItem.GSTType === 'None') {
        if (this.BillItem.GSTPercentage !== 0 || this.BillItem.GSTAmount !== 0) {
          this.GstTypeDis = false
        }
      }

      if ((this.BillItem.GSTType === 'None' && this.BillItem.GSTPercentage !== 0) || (this.BillItem.GSTPercentage === 0 && this.BillItem.GSTType !== 'None')) {
        Swal.fire({
          position: 'center',
          icon: 'warning',
          title: 'Without GSTType, the selected value will not be saved',
          showConfirmButton: true,
          backdrop: false,
        })
        this.GstTypeDis = false
      }
      // GSTType disable condition

      // additem Manual
      if (this.BillItem.Manual) {

        let searchString = "";
        this.prodList.forEach((e: any) => {
          if (e.Name === this.selectedProduct) {
            this.BillItem.ProductTypeID = e.ID;
            this.BillItem.ProductTypeName = e.ProductTypeName;
            this.BillItem.HSNCode = e.HSNCode;
          }
        })
        this.specList.forEach((element: any, i: any) => {
          if (element.SelectedValue !== '') {
            searchString = searchString.concat(element.SelectedValue, "/");
          }
          if (element.FieldType === "Date") {
            this.BillItem.ProductExpDate = element.SelectedValue;
          }
        });
        this.BillItem.ProductExpDate = this.BillItem.ProductExpDate === '' ? "0000-00-00" : this.BillItem.ProductExpDate;
        this.BillItem.ProductTypeName = this.selectedProduct
        this.BillItem.ProductName = searchString.slice(0, -1);
        this.BillItem.Barcode = 'ManualProduct';
        this.billCalculation.calculations('', '', this.BillItem, this.Service)
      }
      // additem Pre order
      if (this.BillItem.Barcode === null || this.BillItem.Barcode === '') {
        if (this.BillItem.PreOrder) {
          let searchString = "";
          this.prodList.forEach((e: any) => {
            if (e.Name === this.selectedProduct) {
              this.BillItem.ProductTypeID = e.ID;
              this.BillItem.HSNCode = e.HSNCode;
            }
          })
          this.specList.forEach((element: any, i: any) => {
            if (element.SelectedValue !== '') {
              searchString = searchString.concat(element.SelectedValue, "/");
            }
            if (element.FieldType === "Date") {
              this.BillItem.ProductExpDate = element.SelectedValue;
            }
          });
          this.BillItem.ProductExpDate = this.BillItem.ProductExpDate === '' ? "0000-00-00" : this.BillItem.ProductExpDate;
          this.BillItem.ProductTypeName = this.selectedProduct
          this.BillItem.ProductName = searchString.slice(0, -1)
          this.BillItem.Barcode = '0'
          this.BillItem.BaseBarCode = '0'


          if (this.BillItem.WholeSale === true) {
            this.BillItem.WholeSalePrice = this.BillItem.UnitPrice
          } else if (this.BillItem.Barcode === 0) {
            this.BillItem.PurchasePrice = this.BillItem.PurchasePrice
          } else {
            this.BillItem.RetailPrice = this.BillItem.UnitPrice
          }
        }
        this.billCalculation.calculations('', '', this.BillItem, this.Service)
      }

      if (this.BillItem.ProductTypeName) {
        let type = ''
        if (this.BillItem.ProductTypeName !== 'CONTACT LENS') {
          type = 'Lens'
        } else {
          type = 'ContactLens'
        }
        this.sp.show()
        const subs: Subscription = this.cs.getMeasurementByCustomer(this.id, type).subscribe({
          next: (res: any) => {
            console.log(res);
            if (res.data.length !== 0) {
              if (res.success) {
                this.BillItem.MeasurementID = JSON.stringify(res.data);
                this.addProductItem();
              } else {
                this.as.errorToast(res.message)
                Swal.fire({
                  position: 'center',
                  icon: 'warning',
                  title: 'Opps !!',
                  text: res.message,
                  showConfirmButton: true,
                  backdrop: false,
                })
              }
            } else {
              this.BillItem.MeasurementID = []
              this.addProductItem();
            }
            this.sp.hide()
          },
          error: (err: any) => console.log(err.message),
          complete: () => subs.unsubscribe(),

        });
      } else {
        this.addProductItem();
      }
    }

    // this.BillMaster.Quantity = 0;
    // this.BillMaster.SubTotal = 0;
    // this.BillMaster.DiscountAmount = 0;
    // this.BillMaster.GSTAmount = 0;
    // this.BillMaster.TotalAmount = 0;
    // this.cgst = 0;
    // this.sgst = 0;
    // this.calculateGrandTotal()
  }

  deleteItem(category: any, i: any) {

    if (category === "Product") {
      if (this.billItemList[i].ID === null) {
        this.billItemList[i].DuaCal = 'delete';
        this.calculateGrandTotal();
        this.billItemList.splice(i, 1);
        this.calculateGrandTotal();

      } else {
        Swal.fire({
          title: 'Are you sure?',
          text: "You won't be able to revert this!",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Yes, delete it!',
          backdrop: false,
        }).then((result) => {

          if (result.isConfirmed) {
            this.sp.show();
            let billlIst: any[] = this.billItemList
            this.billItemList.forEach((ele: any) => {
              if (ele.Status === 2) {
                ele.Status = 0;
                ele.DuaCal = 'delete2';
              }
            })
            this.serviceLists.forEach((ele: any) => {
              if (ele.Status === 2) {
                ele.Status = 0;
                ele.DuaCal = 'delete2';
              }
            })
            this.billItemList = billlIst
            this.billItemList[i].Status = 0;
            this.billItemList[i].DuaCal = 'delete';

            this.data.billMaseterData = this.BillMaster;
            this.data.billDetailData = this.billItemList[i];
            this.calculateGrandTotal();
            if (this.data.billMaseterData.TotalAmount === 0) {
              this.data.billMaseterData.AddlDiscountPercentage = 0
              this.data.billMaseterData.AddlDiscount = 0
            } else {
              //  this.AddDiscalculate('AddlDiscountPercentage', 'discount')
            }
            delete this.data.service

            //  this.sp.show()
            //  const subs: Subscription = this.bill.deleteProduct(this.data).subscribe({
            //    next: (res: any) => {
            //      if (res.success) {
            //       //  this.getBillById(res.data[0].BillMasterID);
            //      } else {
            //        this.as.errorToast(res.message)
            //      }
            //      this.sp.hide()
            //    },
            //    error: (err: any) => console.log(err.message),
            //    complete: () => subs.unsubscribe(),

            //  });
          }
        })
      }
    }
    else if (category === "Service") {
      if (this.serviceLists[i].ID === null) {
        this.serviceLists[i].DuaCal = 'delete';
        this.calculateGrandTotal();
        this.serviceLists.splice(i, 1);
        this.calculateGrandTotal();
      } else {
        Swal.fire({
          title: 'Are you sure?',
          text: "You won't be able to revert this!",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Yes, delete it!',
          backdrop: false,
        }).then((result) => {
          if (result.isConfirmed) {
            //  this.sp.show();
            let billlIst: any[] = this.serviceLists
            this.serviceLists.forEach((ele: any) => {
              if (ele.Status === 2) {
                ele.Status = 0;
                ele.DuaCal = 'delete2';
              }
            })
            this.billItemList.forEach((ele: any) => {
              if (ele.Status === 2) {
                ele.Status = 0;
                ele.DuaCal = 'delete2';
              }
            })
            this.serviceLists = billlIst
            this.serviceLists[i].Status = 0;
            this.serviceLists[i].DuaCal = 'delete';
            this.data.service = this.serviceLists[i];
            this.data.billMaseterData = this.BillMaster;
            this.calculateGrandTotal();
            delete this.data.billDetailData
            //  const subs: Subscription = this.bill.deleteProduct(this.data).subscribe({
            //    next: (res: any) => {
            //      if (res.success) {
            //        this.getBillById(res.data[0].BillMasterID)
            //      } else {
            //        this.as.errorToast(res.message)
            //      }
            //      this.sp.hide()
            //    },
            //    error: (err: any) => console.log(err.message),
            //    complete: () => subs.unsubscribe(),

            //  });
          }
        })

      }
    }
  }

  updataEditProdcut(fieldName: any, mode: any, data: any) {

    if ((data.GSTType === 'None' && data.GSTPercentage !== 0) || (data.GSTPercentage === 0 && data.GSTType !== 'None')) {
      Swal.fire({
        position: 'center',
        icon: 'warning',
        title: 'Without GSTType, the selected value will not be saved',
        showConfirmButton: true,
        backdrop: false,
      })
      data.UpdateProduct = true
    } else {
      if (data.ID !== null) {
        this.sp.show()
        this.calculateFields1(fieldName, mode, data)
        let totalPaid = 0
        totalPaid = +this.BillMaster.TotalAmount - this.BillMaster.DueAmount
        this.calculateGrandTotal();
        this.BillMaster.DueAmount = this.BillMaster.TotalAmount - totalPaid
        this.data1.billMaseterData = this.BillMaster
        this.data1.billDetailData.push(data)

        //  const subs: Subscription = this.bill.updateProduct(this.data1).subscribe({
        //    next: (res: any) => {
        //      if (res.success) {
        //        this.data1.billDetailData = []
        //        this.data1.billMaseterData = null
        //        this.getBillById(this.id2)
        //        this.update()
        //      } else {
        //        this.as.errorToast(res.message)
        //      }
        //      this.sp.hide()
        //    },
        //    error: (err: any) => console.log(err.message),
        //    complete: () => subs.unsubscribe(),
        //  });
      } else {
        this.calculateFields1(fieldName, mode, data)
        let totalPaid = 0
        totalPaid = +this.BillMaster.TotalAmount - this.BillMaster.DueAmount
        this.calculateGrandTotal();
        this.BillMaster.DueAmount = this.BillMaster.TotalAmount - totalPaid
        this.data1.billMaseterData = this.BillMaster
      }
    }
  }

  onSubmit(content1: TemplateRef<any>) {
    this.sp.show();
    this.BillMaster.ShopID = this.loginShop.ID;
    this.BillMaster.CustomerID = this.id;
    this.BillMaster.BillDate = this.BillMaster.BillDate + ' ' + this.currentTime;
    this.BillMaster.DeliveryDate = this.BillMaster.DeliveryDate + ' ' + this.currentTime;
    this.data.billMaseterData = this.BillMaster;
    this.data.billDetailData = this.billItemList;
    this.data.service = this.serviceLists;
    console.log(this.data)
    if (!this.onSubmitFrom) {
      this.onSubmitFrom = true;
      // const subs: Subscription = this.bill.saveBill(this.data).subscribe({
      //   next: (res: any) => {
      //     if (res.success) {
      //       // Reset data if needed
      //       this.BillMaster.ID = res.data.ID;
      //       this.id2 = res.data.ID;
      //       this.id = res.data.CustomerID;
      //       if (this.id2 != 0) {
      //         this.getBillById(this.id2);

      //         // this.billByCustomer(this.id, this.id2);
      //       }
      //       this.openModal1(content1);
      //       this.router.navigate(['/sale/billing', this.id, this.id2]);

      //       this.as.successToast(res.message);

      //     } else {
      //       this.as.errorToast(res.message);
      //     }
      //     this.sp.hide();
      //   },
      //   error: (err: any) => {
      //     console.log(err.message);
      //     this.as.errorToast('An error occurred');
      //   },
      //   complete: () => {
      //     subs.unsubscribe();
      //     this.onSubmitFrom = this.id2 === 0 ? false : true;

      //   },
      // });
    }
  }

  update() {

    this.BillMaster.ShopID = this.loginShop.ID;
    this.BillMaster.CustomerID = this.id;
    this.BillMaster.BillDate = this.BillMaster.BillDate + ' ' + this.currentTime;
    this.BillMaster.DeliveryDate = this.BillMaster.DeliveryDate + ' ' + this.currentTime;

    this.BillMaster.PaymentStatus = this.BillMaster.DueAmount !== 0 ? 'Unpaid' : 'Paid';

    this.data.billMaseterData = this.BillMaster;
    let items: any = [];
    this.billItemList.forEach((ele: any) => {
      if (ele.ID === null || ele.Status == 2) {
        ele.UpdatedBy = this.user.ID;
        items.push(ele);
      }
    })
    this.data.billDetailData = items;
    this.data.service = this.serviceLists;
    console.log(this.data);
    this.sp.show()
    // const subs: Subscription = this.bill.updateBill(this.data).subscribe({
    //   next: (res: any) => {
    //     if (res.success) {
    //       this.BillMaster = []
    //       this.billItemList = []
    //       this.serviceLists = []
    //       this.id2 = res.data.ID;
    //       this.billByCustomer(this.id, this.id2)
    //       this.getCustomerById1();
    //       // this.getBillById(this.id2)
    //       Swal.fire({
    //         position: 'center',
    //         icon: 'success',
    //         title: 'Your file has been update.',
    //         showConfirmButton: false,
    //         timer: 1000
    //       })

    //     } else {
    //       this.as.errorToast(res.message)
    //       Swal.fire({
    //         position: 'center',
    //         icon: 'error',
    //         title: res.message,
    //         showConfirmButton: true,
    //       })
    //     }
    //     this.sp.hide()
    //   },
    //   error: (err: any) => console.log(err.message),
    //   complete: () => subs.unsubscribe(),
    // });
  }

  // update payment 

  openModal1(content1: TemplateRef<any>) {
    this.modalService.open(content1, { centered: true, backdrop: 'static', keyboard: false, size: 'md' });
    this.getPaymentModesList()
    this.billByCustomer(this.id, this.id2)
    this.paymentHistoryByMasterID(this.id, this.id2)
    // this.RewardType()
  }

  getPaymentModesList() {
    this.sp.show()
    const subs: Subscription = this.supps.getList('PaymentModeType').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.PaymentModesList = res.data.filter((p: { Name: string }) => p.Name !== 'AMOUNT RETURN').sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),

    });
  }

  billByCustomer(CustomerID: any, BillMasterID: any) {
    this.sp.show()
    CustomerID = Number(this.id)
    BillMasterID = Number(this.id2)
    // const subs: Subscription = this.bill.billByCustomer(CustomerID, BillMasterID).subscribe({
    //   next: (res: any) => {
    //     if (res.success) {
    //       this.invoiceList = res.data

    //       if (this.invoiceList.length === 0) {
    //         this.invoiceList = [{ InvoiceNo: 'No Pending Invoice', TotalAmount: 0.00, DueAmount: 0.00 }];
    //       }
    //       this.applyPayment.PayableAmount = res.totalDueAmount.toFixed(2) ? res.totalDueAmount.toFixed(2) : 0;
    //       this.applyReward.PayableAmount = res.totalDueAmount.toFixed(2) ? res.totalDueAmount.toFixed(2) : 0;

    //       this.applyPayment.CustomerCredit = res.creditAmount.toFixed(2) ? res.creditAmount.toFixed(2) : 0;
    //       this.OldInvoiceDueAmount = res.oldInvoiceDueAmount.toFixed(2) ? res.oldInvoiceDueAmount.toFixed(2) : 0;

    //       this.BillMaster.InvoiceNo = res.data[0].InvoiceNo
    //       this.RewardType() 
    //     } else {
    //       this.as.errorToast(res.message)
    //       // Swal.fire({
    //       //   position: 'center',
    //       //   icon: 'warning',
    //       //   title: 'Opps !!',
    //       //   text: res.message,
    //       //   showConfirmButton: true,
    //       //   backdrop: false,
    //       // })
    //     }
    //     this.sp.hide()
    //   },
    //   error: (err: any) => console.log(err.message),
    //   complete: () => subs.unsubscribe(),

    // });
  }

  paymentHistoryByMasterID(CustomerID: any, BillMasterID: any) {
    this.sp.show()
    this.totalpaid = 0
    CustomerID = Number(this.id)
    BillMasterID = Number(this.id2)
    // const subs: Subscription = this.bill.paymentHistoryByMasterID(CustomerID, BillMasterID).subscribe({
    //   next: (res: any) => {
    //     if (res.success) {
    //       this.paidListPDF = res.data
    //       this.paidList = this.paidListPDF
    //       //  this.paidListPDF.forEach((ele: any) => {
    //       //   ele.Amount = ele.Type === 'Debit' ? '-' + ele.Amount : '+' + ele.Amount;
    //       // });
    //       this.paidList.forEach((e: any) => {
    //         this.totalpaid = + this.totalpaid + e.Amount
    //       });
    //     } else {
    //       this.as.errorToast(res.message)
    //       Swal.fire({
    //         position: 'center',
    //         icon: 'warning',
    //         title: 'Opps !!',
    //         text: res.message,
    //         showConfirmButton: true,
    //         backdrop: false,
    //       })
    //     }
    //     this.sp.hide()
    //   },
    //   error: (err: any) => console.log(err.message),
    //   complete: () => subs.unsubscribe(),
    // });
  }

  onPaymentSubmit() {
    if (this.applyPayment.PayableAmount < this.applyPayment.PaidAmount) {
      Swal.fire({
        position: 'center',
        icon: 'warning',
        title: 'Opps !!',
        showConfirmButton: true,
        backdrop: false,
      })
      this.applyPayment.PaidAmount = 0
    }

    if (this.applyPayment.ApplyReturn === true) {
      if (this.applyPayment.CustomerCredit < this.applyPayment.PaidAmount) {
        Swal.fire({
          position: 'center',
          icon: 'warning',
          title: 'Opps !!',
          showConfirmButton: true,
          backdrop: false,
        })
        this.applyPayment.PaidAmount = 0
      }
    }
    if (this.applyPayment.PaidAmount !== 0) {
      this.sp.show()
      this.applyPayment.CustomerID = this.BillMaster.CustomerID;

      this.applyPayment.CompanyID = this.company.ID;
      this.applyPayment.ShopID = Number(this.selectedShop);
      this.applyPayment.PaymentDate = moment().format('YYYY-MM-DD') + ' ' + this.currentTime;
      this.applyPayment.pendingPaymentList = this.invoiceList;
      let data = this.applyPayment
      this.applyPayment = {
        ID: null, RewardCustomerRefID: null, CompanyID: null, ShopID: null, CreditType: 'Credit', PaymentDate: null, PayableAmount: 0, PaidAmount: 0,
        CustomerCredit: 0, PaymentMode: null, CardNo: '', PaymentReferenceNo: '', Comments: 0, Status: 1,
        pendingPaymentList: {}, RewardPayment: 0, ApplyReward: false, ApplyReturn: false
      };
      // const subs: Subscription = this.pay.customerPayment(data).subscribe({
      //   next: (res: any) => {
      //     if (res.success) {
      //       this.invoiceList = []
      //       this.paymentHistoryByMasterID(this.id, this.id2)
      //       this.billByCustomer(this.id, this.id2)
      //       this.getBillById(this.id2)
      //       this.applyPayment.PaidAmount = 0; this.applyPayment.PaymentMode = ''; this.applyPayment.ApplyReturn = false;
      //     } else {
      //       this.as.errorToast(res.message)
      //       Swal.fire({
      //         position: 'center',
      //         icon: 'warning',
      //         title: 'Opps !!',
      //         text: res.message,
      //         showConfirmButton: true,
      //         backdrop: false,
      //       })
      //     }
      //     this.sp.hide()
      //   },
      //   error: (err: any) => console.log(err.message),
      //   complete: () => subs.unsubscribe(),

      // });
    }
  }


  // reward payment 
  openModal5(content5: any) {
    this.modalService.open(content5, { centered: true, backdrop: 'static', keyboard: false, size: 'md' });
    this.getPaymentModesList()
    this.billByCustomer(this.id, this.id2)
    this.paymentHistoryByMasterID(this.id, this.id2)
  }


  RewardType() {
    if (this.applyReward.RewardType === 'Self') {
      this.otpChecked = false
      this.applyReward.PaidAmount = 0
      this.applyReward.RewardBalance = 0
      this.applyReward.RewardPercentage = 0
      this.applyReward.AppliedRewardAmount = 0
      this.applyReward.RewardCustomerRefID = Number(this.BillMaster.CustomerID)
      // const subs: Subscription = this.bill.getRewardBalance(this.applyReward.RewardCustomerRefID, this.BillMaster.InvoiceNo).subscribe({
      //   next: (res: any) => {
      //     this.applyReward.RewardBalance = res.data?.RewardAmount
      //     this.applyReward.RewardPercentage = res.data?.RewardPercentage
      //     this.applyReward.AppliedRewardAmount = res.data?.AppliedRewardAmount
      //   },
      //   error: (err: any) => console.log(err.message),
      // });
    } else {
      this.otpChecked = false
      this.applyReward.RewardBalance = 0
      this.applyReward.RewardPercentage = 0
      this.applyReward.AppliedRewardAmount = 0
      this.applyReward.RewardCustomerRefID = 0
      this.applyReward.PaidAmount = 0
    }
  }

  customerSearch(searchKey: string, mode: string, mob: any, type: any) {
    this.filteredOptions = [];
    let param = { Name: '', MobileNo1: '', Address: '', Sno: '' };

    if (searchKey.length >= 3) {
      if (/^\d+$/.test(searchKey)) {
        param.MobileNo1 = searchKey;
      } else {
        param.Name = searchKey.trim();
      }

      // Set a timeout before calling the subscribe function (2000ms = 2 seconds).
      setTimeout(() => {
        const subs: Subscription = this.cs.customerSearch(param).subscribe({
          next: (res: any) => {
            if (res.success) {
              this.filteredOptions = res.data;
            } else {
              this.as.errorToast(res.message);
            }
            this.sp.hide();
          },
          error: (err: any) => console.log(err.message),
          complete: () => subs.unsubscribe(),
        });
      }, 2000);
    }
  }

  CustomerSelection(mode: any, ID: any) {
    switch (mode) {
      case 'data':
        this.applyReward.RewardCustomerRefID = ID;
        this.applyReward.RewardBalance = 0
        this.applyReward.RewardPercentage = 0
        this.applyReward.AppliedRewardAmount = 0
        const subs: Subscription = this.bill.getRewardBalance(this.applyReward.RewardCustomerRefID, this.BillMaster.InvoiceNo).subscribe({
          next: (res: any) => {
            this.applyReward.RewardBalance = res.data.RewardAmount
            this.applyReward.RewardPercentage = res.data.RewardPercentage
            this.applyReward.AppliedRewardAmount = res.data.AppliedRewardAmount
            console.log(res);
          },
          error: (err: any) => console.log(err.message),
        });
        break;
      case 'All':
        this.filteredOptions = [];
        this.applyReward.RewardCustomerRefID = 0;
        break;
      default:
        break;
    }
  }

  sendOtpForAppliedReward() {
    if (this.applyReward.PaidAmount > this.applyReward.AppliedRewardAmount) {
      Swal.fire({
        position: 'center',
        icon: 'warning',
        title: 'Opps !!',
        showConfirmButton: true,
        backdrop: false,
      })
      this.applyReward.PaidAmount = 0
    }

    if (this.applyReward.PaidAmount !== 0) {
      this.sp.show()
      const subs: Subscription = this.bill.sendOtpForAppliedReward(this.applyReward).subscribe({
        next: (res: any) => {
          if (res.success) {
            console.log(res);
            if (res.data.otp !== '' || res.data.otp !== null) {
              this.otpChecked = true
            }
            let WhatsappMsg = `${res.data.otp} is your ${res.data.Name} OTP. Valid for 10 minutes. Please provide the billing person - Redeem Amount: Rs ${this.applyReward.PaidAmount}`
            var msg = `*Hi ${this.customer.Name},*%0A` +
              `${WhatsappMsg}%0A` +
              `%0A` +
              `Thankyou %0A` +
              `*${this.shop[0].Name}* - ${this.shop[0].AreaName}%0A${this.shop[0].MobileNo1}%0A${this.shop[0].Website}`;

            if (res.data.MobileNo != '') {
              var mob = this.company.Code + res.data.MobileNo;
              var url = `https://wa.me/${mob}?text=${msg}`;
              window.open(url, "_blank");
            } else {
              Swal.fire({
                position: 'center',
                icon: 'warning',
                title: '<b>' + res.data.Name + '</b>' + ' Mobile number is not available.',
                showConfirmButton: true,
              })
            }

          } else {
            this.as.errorToast(res.message)
            Swal.fire({
              position: 'center',
              icon: 'warning',
              title: 'Opps !!',
              text: res.message,
              showConfirmButton: true,
              backdrop: false,
            })
          }
          this.sp.hide()
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),

      });
    }
  }

  onRewardSubmit() {
    if (this.applyReward.PayableAmount < this.applyReward.PaidAmount) {
      Swal.fire({
        position: 'center',
        icon: 'warning',
        title: 'Opps !!',
        showConfirmButton: true,
        backdrop: false,
      })
      this.applyReward.PaidAmount = 0
    }

    if (this.applyReward.PaidAmount !== 0) {
      this.sp.show()
      this.otpChecked = false
      this.applyReward.CustomerID = this.BillMaster.CustomerID;
      this.applyReward.Otp = this.applyReward.Otp ? this.applyReward.Otp.trim() : null;
      this.applyReward.CompanyID = this.company.ID;
      this.applyReward.ShopID = Number(this.selectedShop);
      this.applyReward.PaymentDate = moment().format('YYYY-MM-DD') + ' ' + this.currentTime;
      this.applyReward.pendingPaymentList = this.invoiceList;
      let data = this.applyReward
      this.applyReward = {
        ID: null, RewardCustomerRefID: null, CompanyID: null, ShopID: null, CreditType: 'Credit', PaymentDate: null, PayableAmount: 0, PaidAmount: 0, CustomerCredit: 0, PaymentMode: 'Customer Reward', CardNo: '', PaymentReferenceNo: '', Comments: 0, Status: 1, pendingPaymentList: {}, RewardPayment: 0, ApplyReward: true, ApplyReturn: false, RewardType: 'Self', RewardBalance: 0, AppliedRewardAmount: 0, RewardPercentage: 0, Otp: null
      };

      const subs: Subscription = this.pay.customerPayment(data).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.invoiceList = []
            this.paymentHistoryByMasterID(this.id, this.id2)
            this.billByCustomer(this.id, this.id2)
            // this.getBillById(this.id2)
            this.applyReward.PaidAmount = 0; this.applyReward.PaymentMode = 'Customer Reward'; this.applyReward.ApplyReturn = false;
          } else {
            this.applyReward = data
            this.as.errorToast(res.message)
            Swal.fire({
              position: 'center',
              icon: 'warning',
              title: 'Opps !!',
              text: res.message,
              showConfirmButton: true,
              backdrop: false,
            })
          }
          this.sp.hide()
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),

      });
    }
  }
}