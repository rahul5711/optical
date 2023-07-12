import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { environment } from 'src/environments/environment';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription, map, startWith } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { SupportService } from 'src/app/service/support.service';
import { ExcelService } from 'src/app/service/helpers/excel.service';
import { SupplierService } from 'src/app/service/supplier.service';
import { EmployeeService } from 'src/app/service/employee.service';
import { FitterService } from 'src/app/service/fitter.service';
import { CustomerService } from 'src/app/service/customer.service';
import { AsyncPipe} from '@angular/common';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css']
})
export class PaymentComponent implements OnInit {

  user = JSON.parse(localStorage.getItem('user') || '');
  companysetting = JSON.parse(localStorage.getItem('companysetting') || '');
  selectedShop = JSON.parse(localStorage.getItem('selectedShop') || '');
  env = environment;
  myControl: any;
  
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    public as: AlertService,
    private sp: NgxSpinnerService,
    private excelService: ExcelService,
    private supps: SupportService,
    private sup: SupplierService,
    public emp: EmployeeService,
    private fitters: FitterService,
    private customer: CustomerService 
  ) { }

  data: any = {
    ID: null,  CompanyID: null, ShopID: null, PaymentType: null,CustomerID: null, PayableAmount: null, CustomerCredit: null, PaidAmount: null,
    PaymentMode: null, CardNo: null, PaymentReferenceNo: null,  CreditType: 'Debit', PaymentDate: null,  Comments: null, Status: 1, CreatedBy: null, 
    CreatedOn: null , UpdatedBy: null, UpdatedOn: null, pendingPaymentList: {} 
  };

  searchValue:any
  PaymentModesList:any = []
  payeeList:any = []

  ngOnInit(): void {
    this.getPaymentModesList() 
  }

  getPaymentModesList() {
    const subs: Subscription = this.supps.getList('PaymentModeType').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.PaymentModesList = res.data
        } else {
          this.as.errorToast(res.message)
        }
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getPayeeList(){
    if (this.data.PaymentType === 'Vendor')
    {
      const subs: Subscription = this.sup.dropdownSupplierlist('').subscribe({
        next: (res: any) => {
          if (res.success) {
            this.payeeList = res.data;
          } else {
            this.as.errorToast(res.message)
          }
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    } 
    else if(this.data.PaymentType === 'Employee')
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
    else if(this.data.PaymentType === 'Fitter')
    { 
      const subs: Subscription = this.fitters.dropdownlist().subscribe({
        next: (res: any) => {
          this.payeeList = res.data
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    }  
    else if(this.data.PaymentType === 'Customer')
    { 
      const subs: Subscription = this.customer.dropdownlist().subscribe({
        next: (res: any) => {
          if(res.success){
            this.payeeList  = res.data
          }else{
            this.as.errorToast(res.message)
          }
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    }  
  }

  onChange(event: { toUpperCase: () => any; toTitleCase: () => any; }) {
    if (this.companysetting.DataFormat === '1') {
      event = event.toUpperCase()
    } else if (this.companysetting.DataFormat == '2') {
      event = event.toTitleCase()
    }
    return event;
  }

}
