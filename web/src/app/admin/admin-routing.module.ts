import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminDashboradComponent } from './admin-dashborad/admin-dashborad.component';
import { CompanyListComponent } from './company-list.component';
import { CompanyComponent } from './company.component';
import { DashboradComponent } from './dashborad.component';
import { EmployeeComponent } from './employee/employee.component';
import { EmpolyeeListComponent } from './empolyee-list/empolyee-list.component';
import { ShopListComponent } from './shop-list/shop-list.component';
import { ShopComponent } from './shop/shop.component';


const routes: Routes = [
{ path: '',
children: [
  { path: 'adminDashborad', component: AdminDashboradComponent },
  { path: 'CompanyDashborad', component: DashboradComponent },
  { path: 'company/:id', component: CompanyComponent },
  { path: 'shop', component: ShopComponent },
  { path: 'shopList', component: ShopListComponent },
  { path: 'employee', component: EmployeeComponent },
  { path: 'employeeList', component: EmpolyeeListComponent },
  { path: 'companyList', component: CompanyListComponent },
   
]}
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
