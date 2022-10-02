import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminDashboradComponent } from './admin-dashborad/admin-dashborad.component';
import { CompanyListComponent } from './company-list.component';
import { CompanyComponent } from './company.component';
import { DashboradComponent } from './dashborad.component';
import { EmployeeComponent } from './employee/employee.component';
import { EmpolyeeListComponent } from './empolyee-list/empolyee-list.component';
import { LoginHistoryComponent } from './login-history/login-history.component';
import { ShopListComponent } from './shop-list/shop-list.component';
import { ShopComponent } from './shop/shop.component';
import { UserUpdatePasswordComponent } from './user-update-password/user-update-password.component';


const routes: Routes = [
{ path: '',
children: [
  { path: 'adminDashborad', component: AdminDashboradComponent },
  { path: 'CompanyDashborad', component: DashboradComponent },
  { path: 'company/:id', component: CompanyComponent },
  { path: 'companyList', component: CompanyListComponent },
  { path: 'userList', component: UserUpdatePasswordComponent },
  { path: 'loginHistory', component: LoginHistoryComponent },
  { path: 'shop', component: ShopComponent },
  { path: 'shopList', component: ShopListComponent },
  { path: 'employee', component: EmployeeComponent },
  { path: 'employeeList', component: EmpolyeeListComponent },
   
]}
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
