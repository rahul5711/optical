import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PoRoutingModule } from './po-routing.module';
import { SupplierPoComponent } from './supplier-po/supplier-po.component';
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
import { NgSelectModule } from '@ng-select/ng-select';
import { PurchaseConvertComponent } from './purchase-convert/purchase-convert.component';
import { SupplierPoListComponent } from './supplier-po-list/supplier-po-list.component';
import { FitterPoComponent } from './fitter-po/fitter-po.component';
import { FitterInvoiceComponent } from './fitter-invoice/fitter-invoice.component';
import { FitterInvoiceListComponent } from './fitter-invoice-list/fitter-invoice-list.component';
import { FitterInvoiceDetailComponent } from './fitter-invoice-detail/fitter-invoice-detail.component';
import { PoNameFilter} from './../filterDropDown/nameFilter';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { QuotationComponent } from './quotation/quotation.component';
import { QuotationListComponent } from './quotation-list/quotation-list.component';
import { ProductTypeNameq} from './../filterDropDown/nameFilter';
import { ProductItemFilterq} from './../filterDropDown/nameFilter';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
@NgModule({
  declarations: [
    SupplierPoComponent,
    PurchaseConvertComponent,
    SupplierPoListComponent,
    FitterPoComponent,
    FitterInvoiceComponent,
    FitterInvoiceListComponent,
    FitterInvoiceDetailComponent,
    PoNameFilter,
    QuotationComponent,
    QuotationListComponent,
    ProductItemFilterq,
    ProductTypeNameq
  ],
  imports: [
    CommonModule,
    PoRoutingModule,
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
    NgSelectModule,
    NgxMatSelectSearchModule,
    MatAutocompleteModule
  ]
})
export class PoModule { }
