import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SaleRoutingModule } from './sale-routing.module';
import { DoctorComponent } from './doctor/doctor.component';
import { FormsModule, ReactiveFormsModule, } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSortModule } from '@angular/material/sort';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatRadioModule} from '@angular/material/radio';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTabsModule } from '@angular/material/tabs';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerModule } from 'ngx-spinner';
import { DoctorListComponent } from './doctor-list/doctor-list.component';
import { BillingComponent } from './billing/billing.component';
import { CustomerListComponent } from './customer-list/customer-list.component';
import { CustomerPowerListComponent } from './customer-power-list/customer-power-list.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { BillComponent } from './bill/bill.component';
import { BillListComponent } from './bill-list/bill-list.component';
import { CommissionComponent } from './commission/commission.component';
import { CommissionListComponent } from './commission-list/commission-list.component';
import { CommissionDetailComponent } from './commission-detail/commission-detail.component';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { NameFilterS} from './../filterDropDown/nameFilter';
import { TrayName} from './../filterDropDown/nameFilter';

import { ProductItemFilterBill} from './../filterDropDown/nameFilter';
import { OldBillListComponent } from './old-bill-list/old-bill-list.component';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {NgTinyUrlModule} from 'ng-tiny-url';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { CustomerReturnComponent } from './customer-return/customer-return.component';
import { OrderSaleComponent } from './order-sale/order-sale.component';
import { CustomerRetrunListComponent } from './customer-retrun-list/customer-retrun-list.component';
import { OldBillComponent } from './old-bill/old-bill.component';

@NgModule({
  declarations: [
    DoctorComponent,
    DoctorListComponent,
    BillingComponent,
    CustomerListComponent,
    CustomerPowerListComponent,
    BillComponent,
    BillListComponent,
    CommissionComponent,
    CommissionListComponent,
    CommissionDetailComponent,
    NameFilterS,
    TrayName,
    ProductItemFilterBill,
    OldBillListComponent,
    CustomerReturnComponent,
    OrderSaleComponent,
    CustomerRetrunListComponent,
    OldBillComponent
  ],
  imports: [
    CommonModule,
    SaleRoutingModule,
    NgxSpinnerModule,
    MatRadioModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatSlideToggleModule,
    FormsModule,
    MatInputModule,
    MatSnackBarModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSortModule,
    MatToolbarModule,
    MatSelectModule,
    MatDatepickerModule,
    MatCheckboxModule,
    MatTabsModule,
    NgbModule,
    NgSelectModule,
    NgxMatSelectSearchModule,
    MatAutocompleteModule,
    NgTinyUrlModule,
    PdfViewerModule
  ]
})
export class SaleModule { }
