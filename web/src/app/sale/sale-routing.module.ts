import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BillingComponent } from './billing/billing.component';
import { CustomerListComponent } from './customer-list/customer-list.component';
import { DoctorListComponent } from './doctor-list/doctor-list.component';
import { DoctorComponent } from './doctor/doctor.component';
import { BillListComponent } from './bill-list/bill-list.component';
import { CommissionComponent } from './commission/commission.component';

const routes: Routes = [ { path: '',
children: [
  { path: 'billing/:customerid/:billid', component: BillingComponent },
  { path: 'billinglist/:customerid', component: BillListComponent },
  { path: 'customerList', component: CustomerListComponent },  
  { path: 'doctor/:id', component: DoctorComponent },  
  { path: 'doctorList', component: DoctorListComponent },  
  { path: 'commission', component: CommissionComponent },  
 ]}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SaleRoutingModule { }
