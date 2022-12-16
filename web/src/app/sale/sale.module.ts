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


@NgModule({
  declarations: [
    DoctorComponent,
    DoctorListComponent,
    BillingComponent,
    CustomerListComponent,
    CustomerPowerListComponent
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
  ]
})
export class SaleModule { }
