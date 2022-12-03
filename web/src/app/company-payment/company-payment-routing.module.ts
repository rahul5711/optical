import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ExpenseComponent } from './expense/expense.component';
import { PayrollComponent } from './payroll/payroll.component';
import { PettyCashComponent } from './petty-cash/petty-cash.component';

const routes: Routes = [ { path: '',
children: [
  { path: 'expense', component: ExpenseComponent },  
  { path: 'payroll', component: PayrollComponent },  
  { path: 'pettyCash', component: PettyCashComponent },  
]}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CompanyPaymentRoutingModule { }
