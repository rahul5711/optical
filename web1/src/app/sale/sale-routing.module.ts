import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BillingComponent } from './billing/billing.component';
import { CustomerListComponent } from './customer-list/customer-list.component';
import { DoctorListComponent } from './doctor-list/doctor-list.component';
import { DoctorComponent } from './doctor/doctor.component';
import { BillListComponent } from './bill-list/bill-list.component';
import { CommissionComponent } from './commission/commission.component';
import { CommissionListComponent } from './commission-list/commission-list.component';
import { CommissionDetailComponent } from './commission-detail/commission-detail.component';
import { OldBillListComponent } from './old-bill-list/old-bill-list.component';

const routes: Routes = [ { path: '',
children: [
  { path: 'billing/:customerid/:billid', component: BillingComponent },
  { path: 'billinglist/:customerid', component: BillListComponent },
  { path: 'oldBilllist/:customerOldid', component: OldBillListComponent },
  { path: 'customerList', component: CustomerListComponent },  
  { path: 'doctor/:id', component: DoctorComponent },  
  { path: 'doctorList', component: DoctorListComponent },  
  { path: 'commission', component: CommissionComponent },  
  { path: 'commissionList/:id', component: CommissionListComponent },  
  { path: 'commissionInvoice/:id/:Type/:UserID/:ShopID', component: CommissionDetailComponent },  
 ]}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SaleRoutingModule { }
