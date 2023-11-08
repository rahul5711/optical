import { Component, OnInit } from '@angular/core';
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
  env = environment;

  user: any = JSON.parse(localStorage.getItem('user') || '');
  permission = JSON.parse(localStorage.getItem('permission') || '[]');

  company: any = {
    ID: null, CompanyID: null, Name: "", UserGroup: "", DOB: null, Anniversary: null, MobileNo1: null, MobileNo2: null, PhoneNo: null, Email: null, Address: null, Branch: null, FaxNo: null, Website: null, PhotoURL: null, LoginName: "", Password: "", Status: 1, CreatedBy: null, UpdatedBy: null, CreatedOn: "", UpdatedOn: null, Document: [], CommissionType: 0, CommissionMode: 0, CommissionValue: 0, CommissionValueNB: 0,
  };

  CompanyAdmindisplsy: any
  SuperAdmindis: any
  x: any = 'none'
  dropShoplist: any;
  selectedShops: any = [];
  searchText: any

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
    viewCompanySetting: true, viewSmsSetting: true, viewLoginHistory: true, viewRecycleBin: true,
    // Product Permission
    viewProductType: true, viewProductMaster: true, viewAddManagement: true, viewChargeManagement: true, viewServiceManagement: true,
    // Purchasing Permission
    viewSupplier: true, viewSupplierList: true, viewPurchase: true, viewPurchaseList: true, viewPurchaseReturn: true, viewPurchaseReturnList: true, viewProductTransfer: true, viewOrderPrice: true, viewOrderPriceList: true, viewSearchOrderPriceList: true, viewStockAdjustment: true,
    viewBrandNonBrandAssign: true,
    // Billing Permissions
    viewCustomerBill: true, viewBillingSearch: true, viewCustomer: true, viewCustomerSearch: true, viewDoctor: true, viewDoctorList: true,
    viewLoyalty: true, viewLoyaltyInvoice: true,
    // Lens order Permissions
    viewSupplierOrder: true, viewPurchaseConvert: true, viewSupplierOrderList: true,
    // Lens order Permissions
    viewFitter: true, viewFitterList: true, viewFitterOrder: true, viewFitterInvoice: true, viewFitterInvoiceList: true,
    // Payment Permissions
    viewPayment: true, viewPaymentList: true, viewPayroll: true, viewpayrollList: true, viewExpense: true, viewExpenseList: true,
    viewPettyCashReport: true,
    // Report Permissions
    viewSaleReport: true, viewSaleProductReport: true, viewSaleServiceReport: true, viewPurchaseReport: true, viewPurchaseProductReport: true,
    viewPurchaseChargeReport: true, viewPurchaseProductExpiryReport: true, viewInventoryReport: true, viewProductSummaryReport: true, viewProductTransferReport: true, viewProductReturnReport: true, viewProductReturnProductTypeReport: true, viewEyeTestReport: true,
    // Excel Import
    viewInventoryExcelImport: true, viewCustomerExcelImport: true,
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

  ngOnInit(): void {
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

  openModal(content: any) {
    this.modalService.open(content, { centered: true, backdrop: 'static', keyboard: false, size: 'sm' });
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

      this.x  = document.getElementById("collapseExample8");
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
    alert('This report is coming soon...')
  }
}
