import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventoryRoutingModule } from './inventory-routing.module';
import { SupplierComponent } from './supplier/supplier.component';
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
import { FitterComponent } from './fitter/fitter.component';
import { FitterListComponent } from './fitter-list/fitter-list.component';
import { PurchaseComponent } from './purchase/purchase.component';
import { PurchaseListComponent } from './purchase-list/purchase-list.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { ProductTransferComponent } from './product-transfer/product-transfer.component';
import { SearchBarcodeComponent } from './search-barcode/search-barcode.component';
import { InventorySummaryComponent } from './inventory-summary/inventory-summary.component';
import { PreOrderComponent } from './pre-order/pre-order.component';
import { PreorderListComponent } from './preorder-list/preorder-list.component';
import { PurchaseReturnComponent } from './purchase-return/purchase-return.component';
import { PurchaseReturnListComponent } from './purchase-return-list/purchase-return-list.component';
import { PerorderDummyListComponent } from './perorder-dummy-list/perorder-dummy-list.component';
import { ProductNameFilter} from './../filterDropDown/nameFilter';
import { ProductItemFilterPurchase} from './../filterDropDown/nameFilter';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { PhysicalStockComponent } from './physical-stock/physical-stock.component';
import { LocationTrackerComponent } from './location-tracker/location-tracker.component';
import { LensGridViewComponent } from './lens-grid-view/lens-grid-view.component';


@NgModule({
  declarations: [
    SupplierComponent,
    FitterComponent,
    FitterListComponent,
    PurchaseComponent,
    PurchaseListComponent,
    ProductTransferComponent,
    SearchBarcodeComponent,
    InventorySummaryComponent,
    PreOrderComponent,
    PreorderListComponent,
    PurchaseReturnComponent,
    PurchaseReturnListComponent,
    PerorderDummyListComponent,
    ProductNameFilter,
    ProductItemFilterPurchase,
    PhysicalStockComponent,
    LocationTrackerComponent,
    LensGridViewComponent
  ],
  imports: [
    CommonModule,
    InventoryRoutingModule,
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
    NgxMatSelectSearchModule
  ]
})
export class InventoryModule { }
