import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { RoleService } from 'src/app/service/role.service';

@Component({
  selector: 'app-role',
  templateUrl: './role.component.html',
  styleUrls: ['./role.component.css']
})
export class RoleComponent implements OnInit {
  loggedInCompany: any = (localStorage.getItem('LoggedINCompany') || '');
  user = (localStorage.getItem('user') || '');

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private role: RoleService,
    public as: AlertService,
    private sp: NgxSpinnerService,
  ) { }

  selectedRole: any = { ID: null, Name: "", CompanyID: this.loggedInCompany, Permission: "[]", Status: 1 };
  roleList: any = []
  showAdd = false;
  displayModule: any = [];

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

  ngOnInit(): void {
    this.getRoleList();
  }


  saveRole() {
    this.sp.show();
      this.selectedRole.Permission = JSON.stringify(this.moduleList)
      const subs: Subscription = this.role.roleSave(this.selectedRole.Name, this.selectedRole.Permission).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.roleList = res.data;
            this.getRoleList();
            Swal.fire({
              position: 'center',
              icon: 'success',
              title: 'Your file has been Save.',
              showConfirmButton: false,
              timer: 1200
            })
          } else {
            this.as.errorToast(res.message)
            Swal.fire({
              position: 'center',
              icon: 'error',
              title: 'Already exist' + res.message ,
              showConfirmButton: true,
              backdrop: 'static'
            })
          }
          this.sp.hide();
        },
        error: (err: any) => {
          console.log(err.msg);
        },
        complete: () => subs.unsubscribe(),
      });
  }

  deleteRole() {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      backdrop:'static'
    }).then((result) => {
      if (result.isConfirmed) {
        this.sp.show();
        const subs: Subscription = this.role.deleteRole(this.selectedRole.ID).subscribe({
          next: (res: any) => {
            if (res.success) {
              this.getRoleList();
              this.as.successToast(res.message)
              Swal.fire({
                position: 'center',
                icon: 'success',
                title: 'Your file has been deleted.',
                showConfirmButton: false,
                timer: 1000
              })
            } else {
              this.as.errorToast(res.message)
            }
            this.sp.hide();
          },
          error: (err: any) => console.log(err.message),
          complete: () => subs.unsubscribe(),
        });

      }
    })
  }

  getRoleList() {
    this.sp.show();
    const subs: Subscription = this.role.getList('').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.roleList = res.data
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  setdata() {
    if (this.selectedRole.ID === null || this.selectedRole.ID === undefined) {
      this.selectedRole.Permission = JSON.stringify(this.moduleList);
      this.displayModule = this.moduleList;
    } else {
      for (let i = 0; i < this.roleList.length; i++) {
        if (this.roleList[i].ID === this.selectedRole.ID) {
          this.getRoleById(this.selectedRole.ID)
          this.selectedRole.Name = this.roleList[i].Name
          this.displayModule = this.roleList[i].Permission === "" ? this.moduleList : JSON.parse(this.roleList[i].Permission);
          break; 
          // No need to continue the loop once the matching role is found.
        }
      }
    }
   
  }

  setPermissionValue(i: any) {
    const module = this.displayModule[i];
    if (module.MView === true) {
      module.View = module.Edit = module.Add = module.Delete = false;
    } else {
      module.View = module.Edit = module.Add = module.Delete = true;
    }
  }

  savePermission(){
    this.selectedRole.Permission = JSON.stringify(this.displayModule);
    console.log(this.selectedRole.Permission);
    const subs: Subscription = this.role.update(this.selectedRole).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.getRoleList();
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Your file has been Save.',
            showConfirmButton: false,
            timer: 1200
          })
        } else {
          this.as.errorToast(res.message)
          Swal.fire({
            position: 'center',
            icon: 'error',
            title:  res.message ,
            showConfirmButton: true,
            backdrop: 'static'
          })
        }
        this.sp.hide();
      },
      error: (err: any) => {
        console.log(err.msg);
      },
      complete: () => subs.unsubscribe(),
    });
  }

  getRoleById(ID:any) {
    this.sp.show();
    const subs: Subscription = this.role.getRoleById(ID).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.moduleList = res.data[0].Permission
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
