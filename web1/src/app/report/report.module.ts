import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReportRoutingModule } from './report-routing.module';
import { PurchaseReportComponent } from './purchase-report/purchase-report.component';

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
import { SharedModule } from "../shared/shared.module";
import { TransferProductReportComponent } from './transfer-product-report/transfer-product-report.component';
import { InventoryReportComponent } from './inventory-report/inventory-report.component';
import { EyetestReportComponent } from './eyetest-report/eyetest-report.component';
import { ProductReturnComponent } from './product-return/product-return.component';
import { NgxPrintModule } from 'ngx-print';
import { SaleReportComponent } from './sale-report/sale-report.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { ExpenseComponent } from './expense/expense.component';
import { VendorCreditComponent } from './vendor-credit/vendor-credit.component';
import { CashCollectionComponent } from './cash-collection/cash-collection.component';
import { OldSaleComponent } from './old-sale/old-sale.component';
import {MatAutocompleteModule} from '@angular/material/autocomplete';


@NgModule({
  declarations: [
    PurchaseReportComponent,
    TransferProductReportComponent,
    InventoryReportComponent,
    EyetestReportComponent,
    ProductReturnComponent,
    SaleReportComponent,
    ExpenseComponent,
    VendorCreditComponent,
    CashCollectionComponent,
    OldSaleComponent,


  ],
  imports: [
    CommonModule,
    ReportRoutingModule,
    CommonModule,
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
    SharedModule,
    NgxPrintModule,
    NgSelectModule,
    MatAutocompleteModule
  ]
})
export class ReportModule { }
