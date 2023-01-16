import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PurchaseReportComponent } from './purchase-report/purchase-report.component';
import { TransferProductReportComponent } from './transfer-product-report/transfer-product-report.component';

const routes: Routes = [
  { path: '',
  children: [
    { path: 'purchase', component: PurchaseReportComponent },
    { path: 'product-transfer', component: TransferProductReportComponent },
  ]}
  ]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportRoutingModule { }
