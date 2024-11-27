import { Component, HostListener, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs';
import { map, filter, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { NgxSpinnerService } from 'ngx-spinner';
import { ShopService } from '../service/shop.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DataStorageServiceService } from '../service/helpers/data-storage-service.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-common',
  templateUrl: './common.component.html',
  styleUrls: ['./common.component.css']
})
export class CommonComponent implements OnInit {
  @ViewChild('content1')
  content1!: TemplateRef<any>;
  @HostListener('document:keydown', ['$event']) 
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.altKey && event.key === 'f' || event.altKey && event.key === 'F'  ) {
      event.preventDefault();
      this.openModal(this.content1); // Make sure to pass the correct content
    }
    if (event.ctrlKey && event.key === 'D' || event.ctrlKey && event.key === 'd' ) {
      this.router.navigate(['/admin/CompanyDashborad']);  
        event.preventDefault();
    }
    if (event.ctrlKey && event.key === 'c' || event.ctrlKey && event.key === 'C' ) {
        event.preventDefault();
        this.router.navigate(['/report/cashCollection']);  
    }
    if (event.ctrlKey && event.key === 'S' || event.ctrlKey && event.key === 's' ) {
        event.preventDefault();
        this.router.navigate(['/report/sale']);  
    }
    if (event.ctrlKey && event.key === 'P' || event.ctrlKey && event.key === 'p' ) {
        event.preventDefault();
        this.router.navigate(['/report/purchase']);  
    }
    if (event.ctrlKey && event.key === 'e' || event.ctrlKey && event.key === 'E' ) {
        event.preventDefault();
        this.router.navigate(['/report/expenes']);  
    }
    if (event.ctrlKey && event.key === 'I' || event.ctrlKey && event.key === 'i' ) {
        event.preventDefault();
        this.router.navigate(['/report/inventory']);  
    }
      // if (event.altKey && event.key === 'Backspace') {
      //   // const userToken = localStorage.getItem('token'); 
      //     event.preventDefault();
      //     window.history.back(); 
      // } 
  }

  env = environment;

  user: any = JSON.parse(localStorage.getItem('user') || '');
  permission = JSON.parse(localStorage.getItem('permission') || '[]');
  companysetting = JSON.parse(localStorage.getItem('companysetting') || '[]');

  company: any = {
    ID: null, CompanyID: null, Name: "", UserGroup: "", DOB: null, Anniversary: null, MobileNo1: null, MobileNo2: null, PhoneNo: null, Email: null, Address: null, Branch: null, FaxNo: null, Website: null, PhotoURL: null, LoginName: "", Password: "", Status: 1, CreatedBy: null, UpdatedBy: null, CreatedOn: "", UpdatedOn: null, Document: [], CommissionType: 0, CommissionMode: 0, CommissionValue: 0, CommissionValueNB: 0,
  };

  CompanyAdmindisplsy: any
  SuperAdmindis: any
  x: any = 'none'
  dropShoplist: any;
  selectedShops: any = [];
  searchText: any
  showProfileBox= false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ss: ShopService,
    private sp: NgxSpinnerService,
    private modalService: NgbModal,
    private dataStorage: DataStorageServiceService,
  ) { }




  viewFlag: any = {
    viewCompanyInfo: true, viewEmployee: true, viewEmployeeList: true, viewShop: true, viewShopList: true, viewRolePermission: true,
    viewCompanySetting: true, viewSmsSetting: true, viewLoginHistory: true, viewRecycleBin: true,viewReminder: true,
    // Product Permission
    viewProductType: true, viewProductMaster: true, viewAddManagement: true, viewChargeManagement: true, viewServiceManagement: true,viewQuotation: true,viewQuotationList: true,
    // Purchasing Permission
    viewSupplier: true, viewSupplierList: true, viewPurchase: true, viewPurchaseList: true, viewPurchaseReturn: true, viewPurchaseReturnList: true, viewProductTransfer: true, viewBulkTransfer: true, viewBulkTransferList: true, viewOrderPrice: true, viewOrderPriceList: true, viewSearchOrderPriceList: true, viewStockAdjustment: true,  viewLensGrid: true,  viewLensGridList: true,
    viewBrandNonBrandAssign: true,
    // Billing Permissions
    viewCustomerBill: true,viewCustomerPower:true, viewBillingSearch: true, viewCustomer: true, viewCustomerSearch: true, viewDoctor: true, viewDoctorList: true,
    viewLoyalty: true, viewLoyaltyInvoice: true,
    // Lens order Permissions
    viewSupplierOrder: true, viewPurchaseConvert: true, viewSupplierOrderList: true,
    // Lens order Permissions
    viewFitter: true, viewFitterList: true, viewFitterOrder: true, viewFitterInvoice: true, viewFitterInvoiceList: true,
    // Payment Permissions
    viewPayment: true, viewPaymentList: true, viewPayroll: true, viewpayrollList: true, viewExpense: true, viewExpenseList: true,
    viewPettyCashReport: true,
    // Security Permissions
    viewLocationTracker: true, viewPhysicalList: true, viewPhysical: true,
    // Report Permissions
    viewSaleReport: true, viewSaleProductReport: true, viewSaleServiceReport: true,
    viewProductCancelReport: true,viewProductPendingReport: true,viewProductExpiryReport: true,
    viewCashCollectionReport: true,
    viewPurchaseReport: true, viewPurchaseProductReport: true,
    viewPurchaseChargeReport: true, viewPurchaseProductExpiryReport: true, viewSupplierDueAmonutReportReport: true, 
    viewExpensesReport: true, 
    viewInventoryReport: true, viewOpeningClosingStockQTY: true, viewOpeningClosingStockAMT: true, viewProductSummaryReport: true,
    viewCustomerReport: true,
    viewCustomerLedgerReport: true, viewSupplierLedgerReport: true, viewFitterLedgerReport: true, viewEmployeeLedgerReport: true, viewDoctorLedgerReport: true,
    viewProductTransferReport: true, viewProductReturnReport: true, viewProductReturnProductTypeReport: true,
    viewSupplierCreditReport: true,
    viewEyeTestReport: true,
    viewLoyaltyReport: true, viewLoyalityDetailReport: true,
    viewOldSaleReport: true,viewOldSaleDetailReport: true,
    viewCustomerRewardReport: true, 
    viewGSTFilingReport: true, 
    viewPettyCashCashCounterReport: true, 
    viewOpeningClosingReport: true, 

    // Excel Import
    viewInventoryExcelImport: true, viewCustomerExcelImport: true,viewSupplierExcelImport: true,
  }
  heroes: any = []

  element:any
  element1:any
  element2:any
  element3:any
  element4:any
  element5:any
  element6:any
  element7:any
  element8:any

  animateIcon :any;
  iconColor = '#fff';

  isClicked = false;

  onClick() {
    this.isClicked = true;
    this.animateIcon = false
    // Add logic to handle the update when the button is clicked
  }
  ngOnInit(): void {
    
    this.isClicked = true;
    this.sp.show()
    this.user = JSON.parse(localStorage.getItem('user') || '')
    if (this.user.UserGroup !== 'SuperAdmin') {
      this.company = JSON.parse(localStorage.getItem('company') || '');
      this.selectedShops = Number(JSON.parse(localStorage.getItem('selectedShop') || '')[0]);
      this.dropShoplist = JSON.parse(localStorage.getItem('shop') || '')
    } else {
      this.company.ID = this.user.CompanyID
    }

    // search for all option 
    this.heroes = [
      {
        "Name": "Company",
        "routersLinks": `/admin/company/${this.company.ID}`
      },
      {
        "Name": "Employee ",
        "routersLinks": `/admin/employee/0`
      },
      {
        "Name": "Employee List",
        "routersLinks": `/admin/employeeList`
      },
      {
        "Name": "Shop List",
        "routersLinks": `/admin/shopList`
      },
      {
        "Name": "Role Permission ",
        "routersLinks": `/admin/rolePermission`
      },
      {
        "Name": "Company Setting ",
        "routersLinks": `/admin/companySetting`
      },
    ];

    // role permission access
    if (this.user.UserGroup === 'CompanyAdmin') {
      // this.getShopList();
    } else if (this.user.UserGroup === 'Employee') {
      this.permission.forEach((element: { ModuleName: any; MView: any; }) => {
        const viewFlags = this.viewFlag[`view${element.ModuleName}`];
        if (viewFlags !== undefined) {
          this.viewFlag[`view${element.ModuleName}`] = element.MView;
        }
      });
    }
    this.sp.hide()

  }

 
  openModal(content:  TemplateRef<any>) {
    this.modalService.open(content, { centered: true, backdrop: 'static', keyboard: false, size: 'sm' });
    this.searchText = ''
  }

 

  myFunctionS(mode:any) {
    
    if(mode == 'A0'){
        this.x = document.getElementById("collapseExample");
        if (this.x.style.display == "block" ) {
          this.x.style.display = "none";
        }
        this.x = document.getElementById("collapseExample1");
        if (this.x.style.display == "block" ) {
          this.x.style.display = "none";
        }
  
        this.x = document.getElementById("collapseExample2");
        if (this.x.style.display == "block" ) {
          this.x.style.display = "none";
        }
  
        this.x = document.getElementById("collapseExample3");
        if (this.x.style.display == "block" ) {
          this.x.style.display = "none";
        }
        this.x = document.getElementById("collapseExample4");
        if (this.x.style.display == "block" ) {
          this.x.style.display = "none";
        }
        this.x = document.getElementById("collapseExample5");
        if (this.x.style.display == "block" ) {
          this.x.style.display = "none";
        }
        this.x = document.getElementById("collapseExample6");
        if (this.x.style.display == "block" ) {
          this.x.style.display = "none";
        }
        this.x = document.getElementById("collapseExample7");
        if (this.x.style.display == "block" ) {
          this.x.style.display = "none";
        }
  
        this.x = document.getElementById("collapseExample8");
        if (this.x.style.display == "block" ) {
          this.x.style.display = "none";
        }
        this.x = document.getElementById("collapseExampleLs");
        if (this.x.style.display == "block" ) {
          this.x.style.display = "none";
        }
    }
    if(mode == 'A'){
      this.x = document.getElementById("collapseExample1");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }

      this.x = document.getElementById("collapseExample2");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }

      this.x = document.getElementById("collapseExample3");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample4");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample5");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample6");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample7");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }

      this.x = document.getElementById("collapseExample8");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExampleLs");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample");
      if (this.x.style.display == "none" || this.x.style.display == "" ) {
        this.x.style.display = "block";
      } else {
        this.x.style.display = "none";
      }
    }
    if(mode == 'B'){
      this.x = document.getElementById("collapseExample");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample2");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }

      this.x = document.getElementById("collapseExample3");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample4");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample5");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample6");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample7");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }

      this.x = document.getElementById("collapseExample8");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }

      this.x = document.getElementById("collapseExampleLs");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }

      this.x  = document.getElementById("collapseExample1");
      if (this.x.style.display == "none" ||  this.x.style.display == ""  ) {
          this.x.style.display = "block";
      } else {
        this.x.style.display = "none";
      }
    }
    if(mode == 'C'){
      this.x = document.getElementById("collapseExample");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample1");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }

      this.x = document.getElementById("collapseExample3");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample4");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample5");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample6");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample7");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }

      this.x = document.getElementById("collapseExample8");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }

      this.x = document.getElementById("collapseExampleLs");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }

      this.x  = document.getElementById("collapseExample2");
      if (this.x.style.display == "none" ||  this.x.style.display == "" ) {
        this.x.style.display = "block";
      } else {
        this.x.style.display = "none";
      }
    }
    if(mode == 'D'){
      this.x = document.getElementById("collapseExample");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample1");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample2");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }

      this.x = document.getElementById("collapseExample4");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample5");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample6");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }

      this.x = document.getElementById("collapseExample7");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample8");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExampleLs");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x  = document.getElementById("collapseExample3");
      if (this.x.style.display == "none" ||  this.x.style.display == "" ) {
        this.x.style.display = "block";
      } else {
        this.x.style.display = "none";
      }
    }
    if(mode == 'E'){
      this.x = document.getElementById("collapseExample");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample1");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample2");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample3");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample5");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }

      this.x = document.getElementById("collapseExample6");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample7");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample8");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExampleLs");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x  = document.getElementById("collapseExample4");
      if (this.x.style.display == "none" ||  this.x.style.display == "" ) {
        this.x.style.display = "block";
      } else {
        this.x.style.display = "none";
      }
    }
    if(mode == 'F'){
      this.x = document.getElementById("collapseExample");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample1");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample2");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample3");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample4");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample6");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample7");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample8");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExampleLs");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x  = document.getElementById("collapseExample5");
      if (this.x.style.display == "none" ||  this.x.style.display == "" ) {
        this.x.style.display = "block";
      } else {
        this.x.style.display = "none";
      }
    }
    if(mode == 'G'){
      this.x = document.getElementById("collapseExample");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample1");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample2");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample3");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample4");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample5");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }

      this.x = document.getElementById("collapseExample7");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample8");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExampleLs");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x  = document.getElementById("collapseExample6");
      if (this.x.style.display == "none" || this.x.style.display == "" ) {
        this.x.style.display = "block";
      } else {
        this.x.style.display = "none";
      }
    }
    if(mode == 'H'){
      this.x = document.getElementById("collapseExample");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample1");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample2");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample3");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample4");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample5");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample6");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample8");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExampleLs");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x  = document.getElementById("collapseExample7");
      if (this.x.style.display == "none" ||  this.x.style.display == "" ) {
        this.x.style.display = "block";
      } else {
        this.x.style.display = "none";
      }
    }
    if(mode == 'I'){
      this.x = document.getElementById("collapseExample");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample1");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample2");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample3");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample4");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample5");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample6");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample7");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExampleLs");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x  = document.getElementById("collapseExample8");
      if (this.x.style.display == "none" ||  this.x.style.display == "" ) {
        this.x.style.display = "block";
      } else {
        this.x.style.display = "none";
      }
    }
    if(mode == 'Ls'){
      this.x = document.getElementById("collapseExample");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample1");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample2");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample3");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample4");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample5");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample6");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample7");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExample8");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x  = document.getElementById("collapseExampleLs");
      if (this.x.style.display == "none" ||  this.x.style.display == "" ) {
        this.x.style.display = "block";
      } else {
        this.x.style.display = "none";
      }
    }
    if(mode == 'S1'){
      this.x = document.getElementById("collapseExampleS2");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }

      this.x  = document.getElementById("collapseExampleS1");
      if (this.x.style.display == "none" ||  this.x.style.display == "" ) {
        this.x.style.display = "block";
      } else {
        this.x.style.display = "none";
      }
    }
    if(mode == 'S2'){
      this.x = document.getElementById("collapseExampleS1");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x  = document.getElementById("collapseExampleS2");
      if (this.x.style.display == "none" ||  this.x.style.display == "" ) {
        this.x.style.display = "block";
      } else {
        this.x.style.display = "none";
      }
    }
    if(mode == 'S3'){
      this.x = document.getElementById("collapseExampleS1");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
      this.x = document.getElementById("collapseExampleS2");
      if (this.x.style.display == "block" ) {
        this.x.style.display = "none";
      }
    }

  }
 

  saveSelectedShop() {
    localStorage.removeItem('selectedShop');
    localStorage.setItem('selectedShop', JSON.stringify([`${this.selectedShops}`]));
    this.router.navigate(['/admin/CompanyDashborad']);
  }

  logout() {
    localStorage.removeItem('LoggedINUser');
    localStorage.removeItem('LoggedINCompany');
    localStorage.removeItem('LoggedINShop');
    window.localStorage.setItem('isLoggedIn', 'false');
    localStorage.clear();
    this.router.navigate(['/login']).then(() => {
      window.location.reload();
    });
  }

  refresh(mode: any) {

    if (mode === 'purchaseList') {
      this.router.navigateByUrl('/inventory/purchaseList', { skipLocationChange: true }).then(() => {
        this.router.navigate(['/inventory/purchaseList', 0]); 
      });

    } else if (mode === 'fitterInvoiceList') {
      this.router.navigateByUrl('/po/fitterInvoiceList', { skipLocationChange: true }).then(() => {
        this.router.navigate(['/po/fitterInvoiceList', 0]);
      });
    }else if (mode === 'billinglist' || mode === 'commissionList') {
      const route = mode === 'billinglist' ? '/sale/billinglist' : '/sale/commissionList';
      this.router.navigateByUrl(route, { skipLocationChange: true }).then(() => {
        this.router.navigate([route, 0]);
      });
    }
  }
  
  ComingSoon(){
    alert('This is coming soon...')
  }

  userd(){
    this.showProfileBox = !this.showProfileBox
  }
}
