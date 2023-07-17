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
import { PaymentService } from 'src/app/service/payment.service';
import * as moment from 'moment';
import { DoctorService } from 'src/app/service/doctor.service';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css']
})
export class PaymentComponent implements OnInit {

  user = JSON.parse(localStorage.getItem('user') || '');
  companysetting = JSON.parse(localStorage.getItem('companysetting') || '');
  selectedShop = JSON.parse(localStorage.getItem('selectedShop') || '');
  company = JSON.parse(localStorage.getItem('company') || '');
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
    private customer: CustomerService,
    private doctor: DoctorService,
    private pay: PaymentService,
    
  ) { }

  data: any = {
    ID: null,  CompanyID: null, ShopID: null, PaymentType: null,PayeeName: null, PayableAmount: 0, CustomerCredit: 0, PaidAmount: 0,
    PaymentMode: null, CardNo: null, PaymentReferenceNo: null,  CreditType: 'Debit', PaymentDate: null,  Comments: 0, Status: 1, pendingPaymentList: {}, applyCredit:false
  };

  searchValue:any
  PaymentModesList:any = []
  payeeList:any = []
  invoiceList:any = []

  ngOnInit(): void {
    this.sp.show()
    this.getPaymentModesList() 
    this.sp.hide()
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
    else if(this.data.PaymentType === 'Doctor')
    { 
      const subs: Subscription = this.doctor.dropdownDoctorlist().subscribe({
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
    this.invoiceList = []
  }

  convertToDecimal(num: any, x: any) {
    return Number(Math.round(parseFloat(num + 'e' + x)) + 'e-' + x);
  }
  
  getInvoicePayment(data:any) {
    this.sp.show()
    const subs: Subscription = this.pay.getInvoicePayment(data).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.invoiceList = res.data
          this.data.PayableAmount = this.convertToDecimal(res.totalDueAmount,2)
          this.data.CustomerCredit = this.convertToDecimal(res.totalCreditAmount,2)
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
    this.sp.hide()
  }



  

  onSubmit(){
    if(this.data.PayableAmount < this.data.PaidAmount ){
      Swal.fire({
        position: 'center',
        icon: 'warning',
        title: 'Opps !!',
        showConfirmButton: true,
        backdrop : false,
      })
      this.data.PaidAmount = 0
    }
    if(this.data.applyCredit == true){
      if (this.data.CustomerCredit < this.data.PaidAmount){
        Swal.fire({
          position: 'center',
          icon: 'warning',
          title: 'Opps !!',
          showConfirmButton: true,
          backdrop : false,
        })
        this.data.PaidAmount = 0
      }
    }
    if(this.data.PaidAmount !== 0){
      this.data.CompanyID = this.company.ID;
      this.data.ShopID = Number(this.selectedShop);
      this.data.PaymentDate =  moment().format('YYYY-MM-DD');
      this.data.pendingPaymentList = this.invoiceList;
      console.log(this.data);
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
