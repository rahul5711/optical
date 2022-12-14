import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BillingComponent } from './billing/billing.component';
import { CustomerListComponent } from './customer-list/customer-list.component';
import { DoctorListComponent } from './doctor-list/doctor-list.component';
import { DoctorComponent } from './doctor/doctor.component';

const routes: Routes = [ { path: '',
children: [
  { path: 'billing/:id', component: BillingComponent },  
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
