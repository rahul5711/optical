import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { environment } from 'src/environments/environment';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { SupportService } from 'src/app/service/support.service';
import { ExcelService } from 'src/app/service/helpers/excel.service';
import { EmployeeService } from 'src/app/service/employee.service';
import { DoctorService } from 'src/app/service/doctor.service';
import { ShopService } from 'src/app/service/shop.service';

@Component({
  selector: 'app-commission',
  templateUrl: './commission.component.html',
  styleUrls: ['./commission.component.css']
})
export class CommissionComponent implements OnInit {
  user = JSON.parse(localStorage.getItem('user') || '');
  companysetting = JSON.parse(localStorage.getItem('companysetting') || '');
  selectedShop = JSON.parse(localStorage.getItem('selectedShop') || '');
  env = environment;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    public as: AlertService,
    private sp: NgxSpinnerService,
    private excelService: ExcelService,
    private supps: SupportService,
    public emp: EmployeeService,
    private doc: DoctorService,
    private ss: ShopService,

  ) { }

  data: any = {
    ID: null, UserID: null, UserName: null, CompanyID: null, ShopID: null, ShopName: null,  PurchaseDate: null, InvoiceNo: null,
     Quantity: 0, TotalAmount: 0, Status: 1, CreatedBy: null,  CreatedOn: null , UpdatedBy: null, UpdatedOn: null
  };

  shopList:any = []
  payeeList:any = []

  ngOnInit(): void {
    this.dropdownShoplist()
  }

  dropdownShoplist(){
    const subs: Subscription = this.ss.dropdownShoplist('').subscribe({
      next: (res: any) => {
        this.shopList  = res.data
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getPayeeList(){
    if(this.data.PaymentType === 'Employee')
    { 
      const subs: Subscription = this.emp.dropdownUserlist('').subscribe({
        next: (res: any) => {
          if (res.success) {
            this.payeeList = res.data
          } else {
            this.as.errorToast(res.message)
          }
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    }
    else if(this.data.PaymentType === 'Doctor')
    { 
      const subs: Subscription = this.doc.dropdownDoctorlist().subscribe({
        next: (res: any) => {
          this.payeeList = res.data
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    }  
 
  }

}
