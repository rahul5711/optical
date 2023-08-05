import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs';
import { map, filter, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { NgxSpinnerService } from 'ngx-spinner';
import { ShopService } from '../service/shop.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DataStorageServiceService } from '../service/helpers/data-storage-service.service';

@Component({
  selector: 'app-common',
  templateUrl: './common.component.html',
  styleUrls: ['./common.component.css']
})
export class CommonComponent implements OnInit {

  user: any = JSON.parse(localStorage.getItem('user') || '');
  permission = JSON.parse(localStorage.getItem('permission') || '[]');

  company: any = {
    ID: null, CompanyID: null, Name: "", UserGroup: "", DOB: null, Anniversary: null, MobileNo1: null, MobileNo2: null, PhoneNo: null, Email: null, Address: null, Branch: null, FaxNo: null, Website: null, PhotoURL: null, LoginName: "", Password: "", Status: 1, CreatedBy: null, UpdatedBy: null, CreatedOn: "", UpdatedOn: null, Document: [], CommissionType: 0, CommissionMode: 0, CommissionValue: 0, CommissionValueNB: 0,
  };

  CompanyAdmindisplsy: any
  SuperAdmindis: any
  x: any;
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
          console.log(this.viewFlag[`view${element.ModuleName}`]);
        }
      });
    }
    this.sp.hide()

  }

  openModal(content: any) {
    this.modalService.open(content, { centered: true, backdrop: 'static', keyboard: false, size: 'sm' });
  }

  myFunction() {
    this.x = document.getElementById("myTopnav");
    if (this.x.className === "topnav") {
      this.x.className += " responsive";
    } else {
      this.x.className = "topnav";
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

}
