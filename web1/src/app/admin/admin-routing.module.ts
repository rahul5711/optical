import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddTypeComponent } from './add-type/add-type.component';
import { AdminDashboradComponent } from './admin-dashborad/admin-dashborad.component';
import { CompanyListComponent } from './company-list.component';
import { CompanyLoginHistoryComponent } from './company-login-history/company-login-history.component';
import { CompanySettingComponent } from './company-setting/company-setting.component';
import { CompanyComponent } from './company.component';
import { DashboradComponent } from './dashborad.component';
import { DeactiveListComponent } from './deactive-list/deactive-list.component';
import { EmployeeComponent } from './employee/employee.component';
import { EmpolyeeListComponent } from './empolyee-list/empolyee-list.component';
import { LoginHistoryComponent } from './login-history/login-history.component';
import { ProductManageComponent } from './product-manage/product-manage.component';
import { ProductMasterComponent } from './product-master/product-master.component';
import { RoleComponent } from './role/role.component';
import { ShopListComponent } from './shop-list/shop-list.component';
import { ShopComponent } from './shop/shop.component';
import { SmsSettingComponent } from './sms-setting/sms-setting.component';
import { UserUpdatePasswordComponent } from './user-update-password/user-update-password.component';
import { SummaryComponent } from './summary/summary.component';
import { ReminderComponent } from './reminder/reminder.component';


const routes: Routes = [
{ path: '',
children: [
  // SuperAdmin start routes
  { path: 'adminDashborad', component: AdminDashboradComponent },
  { path: 'company/:id', component: CompanyComponent },
  { path: 'companyList', component: CompanyListComponent },
  { path: 'userList', component: UserUpdatePasswordComponent },
  { path: 'loginHistory', component: LoginHistoryComponent },
  { path: 'addTypeAssign', component: AddTypeComponent },
  { path: 'productMasterAssign', component: ProductMasterComponent },
  { path: 'productManageAssign', component: ProductManageComponent },
  { path: 'deactiveList', component: DeactiveListComponent },
  { path: 'reminder', component: ReminderComponent },
  // SuperAdmin end routes
  
  // CompanyAdmin start routes
  { path: 'CompanyDashborad', component: DashboradComponent },
  { path: 'employee/:id', component: EmployeeComponent },
  { path: 'employeeList', component: EmpolyeeListComponent },
  { path: 'shop/:id', component: ShopComponent },
  { path: 'shopList', component: ShopListComponent },
  { path: 'rolePermission', component: RoleComponent },
  { path: 'companySetting', component: CompanySettingComponent },
  { path: 'smsSetting', component: SmsSettingComponent },
  { path: 'companyLoginHistory', component: CompanyLoginHistoryComponent },
  { path: 'dashboardSummary', component: SummaryComponent },
  // ComapnyAdmin end routes 
]}
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
