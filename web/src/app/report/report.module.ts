import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReportRoutingModule } from './report-routing.module';
import { PurchaseReportComponent } from './purchase-report/purchase-report.component';


@NgModule({
  declarations: [
    PurchaseReportComponent
  ],
  imports: [
    CommonModule,
    ReportRoutingModule
  ]
})
export class ReportModule { }
