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
import { NgxSpinnerModule } from 'ngx-spinner';
import { AdminDashboradComponent } from './admin-dashborad/admin-dashborad.component';
import { UserUpdatePasswordComponent } from './user-update-password/user-update-password.component';
import { ProductManageComponent } from './product-manage/product-manage.component';
import { AddTypeComponent } from './add-type/add-type.component';
import { CompanyLoginHistoryComponent } from './company-login-history/company-login-history.component';
import { ProductMasterComponent } from './product-master/product-master.component';
import { DeactiveListComponent } from './deactive-list/deactive-list.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { SmsSettingComponent } from './sms-setting/sms-setting.component';
import { SharedModule } from "../shared/shared.module";
import { SummaryComponent } from './summary/summary.component';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { ReminderComponent } from './reminder/reminder.component';
import { BulkSmsComponent } from './bulk-sms/bulk-sms.component';
import { RecycleComponent } from './recycle/recycle.component';
import { CompanyOptionHideComponent } from './company-option-hide/company-option-hide.component';

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
        EmpolyeeListComponent,
        AdminDashboradComponent,
        UserUpdatePasswordComponent,
        ProductManageComponent,
        AddTypeComponent,
        CompanyLoginHistoryComponent,
        ProductMasterComponent,
        DeactiveListComponent,
        SmsSettingComponent,
        SummaryComponent,
        ReminderComponent,
        BulkSmsComponent,
        RecycleComponent,
        CompanyOptionHideComponent,
    ],
    exports: [
        FormsModule, ReactiveFormsModule,
        NgxSpinnerModule
    ],
    imports: [
        CommonModule,
        AdminRoutingModule,
        NgxSpinnerModule,
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
        NgSelectModule,
        SharedModule,
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule,
    ]
})

export class AdminModule { }
