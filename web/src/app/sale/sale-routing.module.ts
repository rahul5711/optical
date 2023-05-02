import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BillingComponent } from './billing/billing.component';
import { CustomerListComponent } from './customer-list/customer-list.component';
import { DoctorListComponent } from './doctor-list/doctor-list.component';
import { DoctorComponent } from './doctor/doctor.component';
import { BillListComponent } from './bill-list/bill-list.component';

const routes: Routes = [ { path: '',
children: [
  { path: 'billing/:id2/:id', component: BillingComponent },  
  { path: 'billinglist/:id', component: BillListComponent },
  { path: 'customerList', component: CustomerListComponent },  
  { path: 'doctor/:id', component: DoctorComponent },  
  { path: 'doctorList', component: DoctorListComponent },  
 ]}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SaleRoutingModule { }
