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
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'app-role',
  templateUrl: './role.component.html',
  styleUrls: ['./role.component.css']
})
export class RoleComponent implements OnInit {
  company: any = (localStorage.getItem('company') || '');
  user = (localStorage.getItem('user') || '');

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private role: RoleService,
    public as: AlertService,
    private sp: NgxSpinnerService,
  ) { }

  selectedRole: any = { ID: null, Name: "", CompanyID: '', Permission: "[]", Status: 1 };
  roleList: any = []
  showAdd = false;
  displayModule: any;

  moduleList: any = [
    // Administration Permission
    { ModuleName: 'CompanyInfo', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'Employee', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'EmployeeList', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'Shop', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'ShopList', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'RolePermission', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'CompanySetting', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'SmsSetting', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'LoginHistory', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'RecycleBin', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'Reminder', MView: true, Edit: true, Add: true, View: true, Delete: true },

    // Product Permission
    { ModuleName: 'ProductType', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'ProductMaster', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'AddManagement', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'ChargeManagement', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'ServiceManagement', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'DiscountSetting', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'Quotation', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'QuotationList', MView: true, Edit: true, Add: true, View: true, Delete: true },

    // Purchasing Permission
    { ModuleName: 'Supplier', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'SupplierList', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'Purchase', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'PurchaseList', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'PurchaseReturn', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'PurchaseReturnList', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'ProductTransfer', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'BulkTransfer', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'BulkTransferList', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'OrderPrice', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'OrderPriceList', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'SearchOrderPriceList', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'StockAdjustment', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'BrandNonBrandAssign', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'LensGrid', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'LensGridList', MView: true, Edit: true, Add: true, View: true, Delete: true },

    // Billing Permissions
    { ModuleName: 'CustomerBill', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'BillingSearch', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'Customer', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'CustomerSearch', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'CustomerPower', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'Doctor', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'DoctorList', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'Loyalty', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'LoyaltyInvoice', MView: true, Edit: true, Add: true, View: true, Delete: true },

    // Lens order Permissions
    { ModuleName: 'SupplierOrder', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'PurchaseConvert', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'SupplierOrderList', MView: true, Edit: true, Add: true, View: true, Delete: true },

    // Lens order Permissions
    { ModuleName: 'Fitter', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'FitterList', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'FitterOrder', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'FitterInvoice', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'FitterInvoiceList', MView: true, Edit: true, Add: true, View: true, Delete: true },

    // Payment Permissions
    { ModuleName: 'Payment', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'PaymentList', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'Payroll', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'payrollList', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'Expense', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'ExpenseList', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'PettyCashReport', MView: true, Edit: true, Add: true, View: true, Delete: true },

    // Security  Permissions
    { ModuleName: 'LocationTracker', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'Physical', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'PhysicalList', MView: true, Edit: true, Add: true, View: true, Delete: true },

    // Report Permissions
    { ModuleName: 'SaleReport', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'SaleProductReport', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'SaleServiceReport', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'ProductPendingReport', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'ProductExpiryReport', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'CashCollectionReport', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'PurchaseReport', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'PurchaseProductReport', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'PurchaseChargeReport', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'PurchaseProductExpiryReport', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'SupplierDueAmonutReport', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'ExpensesReport', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'InventoryReport', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'OpeningClosingStockQTY', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'OpeningClosingStockAMT', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'ProductSummaryReport', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'CustomerReport', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'CustomerLedgerReport', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'SupplierLedgerReport', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'FitterLedgerReport', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'EmployeeLedgerReport', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'DoctorLedgerReport', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'ProductTransferReport', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'ProductReturnReport', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'ProductReturnProductTypeReport', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'SupplierCreditReport', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'EyeTestReport', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'LoyalityReport', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'LoyalityDetailReport', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'OldSaleReport', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'OldSaleDetailReport', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'GSTFilingReport', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'PettyCashCashCounterReport', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'OpeningClosingReport', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'CustomerRewardReport', MView: true, Edit: true, Add: true, View: true, Delete: true },
    // Excel Import
    { ModuleName: 'SupplierExcelImport', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'InventoryExcelImport', MView: true, Edit: true, Add: true, View: true, Delete: true },
    { ModuleName: 'CustomerExcelImport', MView: true, Edit: true, Add: true, View: true, Delete: true },
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
            this.getRoleById(res.data[0].ID)
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
              this.getRoleById(res.data.ID)
              this.getRoleList();
              this.selectedRole = { ID: null, Name: "", CompanyID: '', Permission: "[]", Status: 1 }
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
    if (this.selectedRole.ID === null && this.selectedRole.ID === undefined) {
      this.selectedRole.Permission = JSON.stringify(this.moduleList);
      this.displayModule = this.moduleList;
    } else {
      for (var i = 0; i < this.roleList.length; i++ ) {
        if (this.roleList[i].ID === this.selectedRole.ID){
          if (this.roleList[i].Permission == ""){
            this.roleList[i].Name = this.selectedRole.Name
        this.displayModule = this.moduleList;
      } else {
        this.selectedRole.Name = this.roleList[i].Name 
        this.displayModule = JSON.parse(this.roleList[i].Permission);
      }
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

  addRole(){
    this.sp.show()
    // this.selectedRole = { ID: null, Name: "", CompanyID: '', Permission: "[]", Status: 1 }
    this.sp.hide()
  }

  savePermission(){
    this.sp.show()
    this.selectedRole.Name = 
    this.selectedRole.Permission = JSON.stringify(this.displayModule);

    const subs: Subscription = this.role.update(this.selectedRole).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.getRoleList();
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Your file has been Save Permission.',
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
          this.moduleList =  res.data[0].Permission 
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
