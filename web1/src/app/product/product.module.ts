import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductRoutingModule } from './product-routing.module';
import { ProductManageComponent } from './product-manage/product-manage.component';
import { ProductMasterComponent } from './product-master/product-master.component';
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
import { AddManageComponent } from './add-manage/add-manage.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { ProductTypeNameFilter} from './../filterDropDown/nameFilter';
import { ProductMasterItemFilter} from './../filterDropDown/nameFilter';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { DiscountComponent } from './discount/discount.component';

@NgModule({
  declarations: [
    ProductManageComponent,
    ProductMasterComponent,
    AddManageComponent,
    ProductTypeNameFilter,
    ProductMasterItemFilter,
    DiscountComponent
  ],
  imports: [
    CommonModule,
    ProductRoutingModule,
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
export class ProductModule { }
