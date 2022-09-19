import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminRoutingModule } from './admin-routing.module';
import { CompanyComponent } from './company.component';
import { CompanyListComponent } from './company-list.component';
import { DashboradComponent } from './dashborad.component';
import { WelcomeComponent } from './welcome.component';
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
import { ShopComponent } from './shop/shop.component';
import { EmployeeComponent } from './employee/employee.component';
import { RoleComponent } from './role/role.component';
import { LoginHistoryComponent } from './login-history/login-history.component';
import { CompanySettingComponent } from './company-setting/company-setting.component';
import { ShopListComponent } from './shop-list/shop-list.component';
import { EmpolyeeListComponent } from './empolyee-list/empolyee-list.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgCircleProgressModule } from 'ng-circle-progress';


@NgModule({
  declarations: [
    CompanyComponent,
    CompanyListComponent,
    DashboradComponent,
    WelcomeComponent,
    ShopComponent,
    EmployeeComponent,
    RoleComponent,
    LoginHistoryComponent,
    CompanySettingComponent,
    ShopListComponent,
    EmpolyeeListComponent
  ],
  imports: [
  
    CommonModule,
    AdminRoutingModule,
    MatRadioModule,
    AdminRoutingModule,
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
    AdminRoutingModule,
    NgbModule,
    NgCircleProgressModule.forRoot({
      // set defaults here
      radius: 100,
      outerStrokeWidth: 16,
      innerStrokeWidth: 8,
      outerStrokeColor: "#78C000",
      innerStrokeColor: "#C7E596",
      animationDuration: 300,
    }),
  ],
  exports: [
    FormsModule, ReactiveFormsModule,
  ],
})

export class AdminModule { }
