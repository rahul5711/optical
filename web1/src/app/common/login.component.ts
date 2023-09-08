import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import * as  particlesJS from 'angular-particle';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AlertService } from '../service/helpers/alert.service';
import { AuthServiceService } from '../service/auth-service.service';
import { Subscription } from 'rxjs';
import { TokenService } from '../service/token.service';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { Toast } from 'ngx-toastr';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ShopService } from '../service/shop.service';
import { RoleService } from '../service/role.service';
import { DataStorageServiceService } from '../service/helpers/data-storage-service.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  env = environment;

  particlesJS: any;
  data:any = { LoginName: '', Password: '' }

  user:any =localStorage.getItem('user') || '';
  hide = false
  dropShoplist: any;
  roleList: any;
  selectedShop: any;

  moduleList: any = [
    // Administration Permission
    {ModuleName: 'CompanyInfo', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'Employee', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'EmployeeList', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'Shop', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'ShopList', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'RolePermission', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'CompanySetting', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'SmsSetting', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'LoginHistory', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'RecycleBin', MView: true, Edit: true, Add: true, View: true, Delete: true},

    // Product Permission
    {ModuleName: 'ProductType', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'ProductMaster', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'AddManagement', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'ChargeManagement', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'ServiceManagement', MView: true, Edit: true, Add: true, View: true, Delete: true},

    // Purchasing Permission
    {ModuleName: 'Supplier', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'SupplierList', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'Purchase', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'PurchaseList', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'PurchaseReturn', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'PurchaseReturnList', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'ProductTransfer', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'OrderPrice', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'OrderPriceList', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'SearchOrderPriceList', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'StockAdjustment', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'BrandNonBrandAssign', MView: true, Edit: true, Add: true, View: true, Delete: true},

    // Billing Permissions
    {ModuleName: 'CustomerBill', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'BillingSearch', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'Customer', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'CustomerSearch', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'Doctor', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'DoctorList', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'Loyalty', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'LoyaltyInvoice', MView: true, Edit: true, Add: true, View: true, Delete: true},

    // Lens order Permissions
    {ModuleName: 'SupplierOrder', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'PurchaseConvert', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'SupplierOrderList', MView: true, Edit: true, Add: true, View: true, Delete: true},

    // Lens order Permissions
    {ModuleName: 'Fitter', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'FitterList', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'FitterOrder', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'FitterInvoice', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'FitterInvoiceList', MView: true, Edit: true, Add: true, View: true, Delete: true},

    // Payment Permissions
    {ModuleName: 'Payment', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'PaymentList', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'Payroll', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'payrollList', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'Expense', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'ExpenseList', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'PettyCashReport', MView: true, Edit: true, Add: true, View: true, Delete: true},

     // Report Permissions
    {ModuleName: 'SaleReport', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'SaleProductReport', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'SaleServiceReport', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'PurchaseReport', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'PurchaseProductReport', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'PurchaseChargeReport', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'PurchaseProductExpiryReport', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'InventoryReport', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'ProductSummaryReport', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'ProductTransferReport', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'ProductReturnReport', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'ProductReturnProductTypeReport', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'EyeTestReport', MView: true, Edit: true, Add: true, View: true, Delete: true},

    // Excel Import
    {ModuleName: 'InventoryExcelImport', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'CustomerExcelImport', MView: true, Edit: true, Add: true, View: true, Delete: true},
  ];

  constructor(private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    public as: AlertService,
    private auth: AuthServiceService,
    private token: TokenService,
    private sp: NgxSpinnerService,
    private modalService: NgbModal,
    private ss: ShopService,
    private role: RoleService,
    private dataStorageService: DataStorageServiceService,


  ) { }


  ngOnInit(): void {

  }

  rolesList(){
    this.sp.show()
    const subs: Subscription = this.role.getList('').subscribe({
      next: (res: any) => {
        if(res.success){
          this.roleList = res.data
          this.setPermission()
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  onSubmit(content:any) {
    if (this.data.LoginName === "") {
      return this.as.errorToast("please fill up login name")
    }
    if (this.data.Password === "") {
      return this.as.errorToast("please fill up password")
    }
    this.sp.show()
    const subs: Subscription = this.auth.login(this.data).subscribe({
      next: (res: any) => {

        if (res.success == true) {
          this.as.successToast(res.message)
          this.token.setToken(res.accessToken);
          this.token.refreshToken(res.refreshToken);
          localStorage.setItem('user', JSON.stringify(res.data));

            if(res.data.UserGroup  == "SuperAdmin" ){
              localStorage.setItem('user', JSON.stringify(res.data));
              this.router.navigate(['/admin/adminDashborad']);

              let dt = new Date();
              let hours = dt.getHours();
              let min = dt.getMinutes();

              if(hours>=1 || hours<=12){
                Swal.fire({
                  position: 'center',
                  icon: 'success',
                  title:   'Good Morning Sir ' + `${res.data.Name}`,
                  showConfirmButton: false,
                  timer: 1500
                })
              }else if(hours>=12 || hours<=16){
                Swal.fire({
                  position: 'center',
                  icon: 'success',
                  title:   'Good After Sir ' + `${res.data.Name}`,
                  showConfirmButton: false,
                  timer: 1500
                })
              }else if(hours>=16 || hours<=21){
                Swal.fire({
                  position: 'center',
                  icon: 'success',
                  title:   'Good Evning Sir ' + `${res.data.Name}`,
                  showConfirmButton: false,
                  timer: 1500
                })
              }else if(hours>=21 || hours<=24){
                Swal.fire({
                  position: 'center',
                  icon: 'success',
                  title:   'Good Night Sir ' + `${res.data.Name}`,
                  showConfirmButton: false,
                  timer: 1500
                })
              }
            }

            if( res.data.UserGroup == "CompanyAdmin"){
              localStorage.setItem('user', JSON.stringify(res.data));
              localStorage.setItem('company', JSON.stringify(res.Company));
              localStorage.setItem('companysetting', JSON.stringify(res.CompanySetting));
              localStorage.setItem('shop', JSON.stringify(res.shop));
              localStorage.setItem('selectedShop', JSON.stringify([`${res.shop[0]?.ID}`]));
              localStorage.setItem('permission', JSON.stringify(this.moduleList));
              this.dataStorageService.permission = this.moduleList;
               this.router.navigate(['/admin/CompanyDashborad'])
               .then(() => {
                // window.location.reload();
              });
               Swal.fire({
                position: 'center',
                icon: 'success',
                title:   'Welcome TO ' + `${res.data.Name}`,
                showConfirmButton: false,
                timer: 1500
              })
            }

            if( res.data.UserGroup == "Employee"){
                localStorage.setItem('company', JSON.stringify(res.Company));
                localStorage.setItem('companysetting', JSON.stringify(res.CompanySetting));
                localStorage.setItem('user', JSON.stringify(res.data));
                localStorage.setItem('permission', JSON.stringify(this.moduleList));
                this.dataStorageService.permission = this.moduleList;
                this.dropShoplist = res.shop
                this.modalService.open(content, { centered: true , backdrop : 'static', keyboard: false,size: 'sm'});
            }
        }
        else {
          this.as.errorToast(res.message);
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err),
      complete: () => subs.unsubscribe(),
    });

  }

  saveSelectedShop() {
   this.dropShoplist.forEach((element:any) => {
     if (element.ID === this.selectedShop) {
        let shop = []
        shop.push(element)
       localStorage.setItem('selectedShop', JSON.stringify([`${element.ID}`]));
       localStorage.setItem('shop', JSON.stringify(shop));
       this.rolesList()
       this.modalService.dismissAll()
     }
   });
 }

 setPermission() {
  this.sp.show()
  this.roleList.forEach((element: any) => {
    if (element.ID === Number(JSON.parse(localStorage.getItem('shop') || '')[0].RoleID)) {
     localStorage.setItem('permission', element.Permission);
     this.dataStorageService.permission = JSON.parse(element.Permission);
    }
  });
  this.sp.hide()
  this.router.navigate(['/admin/CompanyDashborad']);
  Swal.fire({
    position: 'center',
    icon: 'success',
    title:   'Welcome TO ' + this.user.Name,
    showConfirmButton: false,
    timer: 1200
  })
}
}
