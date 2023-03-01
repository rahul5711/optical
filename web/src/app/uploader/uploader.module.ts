import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UploaderRoutingModule } from './uploader-routing.module';
import { PurchaseBlukComponent } from './purchase-bluk/purchase-bluk.component';
import { ParticlesModule } from 'angular-particle';
import { FormsModule, ReactiveFormsModule} from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import {MatSelectModule} from '@angular/material/select';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import { ToastrModule } from 'ngx-toastr';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerModule } from 'ngx-spinner';
import { ModalModule } from 'ngb-modal';
import { CustomerBlukComponent } from './customer-bluk/customer-bluk.component';



@NgModule({
  declarations: [
    PurchaseBlukComponent,
    CustomerBlukComponent
  ],
  imports: [
    
    CommonModule,
    UploaderRoutingModule,
    CommonModule,
    MatSnackBarModule,
    MatSelectModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    MatListModule,
    MatSnackBarModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatNativeDateModule,
    MatDatepickerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatListModule,
    MatSelectModule,
    MatSidenavModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    MatMenuModule,
    ToastrModule.forRoot(),
    NgbModule,
    NgxSpinnerModule,

  ]
})
export class UploaderModule { }
