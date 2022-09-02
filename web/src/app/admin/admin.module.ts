import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing.module';
import { CompanyComponent } from './company.component';
import { CompanyListComponent } from './company-list.component';
import { DashboradComponent } from './dashborad.component';


@NgModule({
  declarations: [
    CompanyComponent,
    CompanyListComponent,
    DashboradComponent
  ],
  imports: [
    CommonModule,
    AdminRoutingModule
  ]
})
export class AdminModule { }
