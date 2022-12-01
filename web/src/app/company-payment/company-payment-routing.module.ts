import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ExpenseComponent } from './expense/expense.component';

const routes: Routes = [ { path: '',
children: [
  { path: 'expense', component: ExpenseComponent },  
]}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CompanyPaymentRoutingModule { }
