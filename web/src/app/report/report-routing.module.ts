import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PurchaseReportComponent } from './purchase-report/purchase-report.component';

const routes: Routes = [
  { path: '',
  children: [
    { path: 'purchase', component: PurchaseReportComponent },
  ]}
  ]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportRoutingModule { }
