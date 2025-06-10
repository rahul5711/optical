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
import {ProductTypeName} from './../filterDropDown/nameFilter';
import {ProductItemFilter} from './../filterDropDown/nameFilter';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { CustomerReportComponent } from './customer-report/customer-report.component';
import { LoyalityReportComponent } from './loyality-report/loyality-report.component';
import { LedgeReportComponent } from './ledge-report/ledge-report.component';
import { GstReportComponent } from './gst-report/gst-report.component';
import { PettycashReportComponent } from './pettycash-report/pettycash-report.component';
import { RewardReportComponent } from './reward-report/reward-report.component';
import { SupplierName } from './../filterDropDown/nameFilter';
import { CustomerReturnComponent } from './customer-return/customer-return.component';


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
    ProductTypeName,
    ProductItemFilter,
    CustomerReportComponent,
    LoyalityReportComponent,
    LedgeReportComponent,
    GstReportComponent,
    PettycashReportComponent,
    RewardReportComponent,
    SupplierName,
    CustomerReturnComponent,
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
    MatAutocompleteModule,
    NgxMatSelectSearchModule,
   
  ]
})
export class ReportModule { }
