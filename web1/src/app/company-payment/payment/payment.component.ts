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
  companySetting = JSON.parse(localStorage.getItem('companysetting') || '');
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
    ID: null,  CompanyID: null, BillMasterID:null, ShopID: null, PaymentType: null,CustomerID: null, PayableAmount: 0, CustomerCredit: 0, PaidAmount: 0, PaymentMode: null, CardNo: '', PaymentReferenceNo: '',  CreditType: 'Debit', PaymentDate: null,  Comments: 0, Status: 1, pendingPaymentList: {}, ApplyReturn:false,CreditNumber:''
  };

  searchValue:any
  PaymentModesList:any = []
  creditList:any = []
  payeeList:any = []
  invoiceList:any = []
  vendorCredit:any
  currentTime:any; 

  ngOnInit(): void {
    this.getPaymentModesList() 
     this.currentTime = new Date().toLocaleTimeString('en-US', { hourCycle: 'h23'})
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

  getSupplierCreditNote(SupplierID:any) {
    this.sp.show()
    const subs: Subscription = this.pay.getSupplierCreditNote(SupplierID).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.creditList = res.data
        } else {
          this.as.errorToast(res.message)
        }
      this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  vendorCreditValue(){
   this.data.CustomerCredit = this.vendorCredit.Amount
   this.data.CreditNumber = this.vendorCredit.CreditNumber
  }

  // getPayeeList(){
  //   this.data.CreditType = 'Debit'
  //   if (this.data.PaymentType === 'Supplier')
  //   {
  //     const subs: Subscription = this.sup.dropdownSupplierlist('').subscribe({
  //       next: (res: any) => {
  //         if (res.success) {
  //           this.payeeList = res.data;
  //         } else {
  //           this.as.errorToast(res.message)
  //         }
  //       },
  //       error: (err: any) => console.log(err.message),
  //       complete: () => subs.unsubscribe(),
  //     });
  //   } 
  //   else if(this.data.PaymentType === 'Employee')
  //   { 
  //     const subs: Subscription = this.emp.dropdownUserlist('').subscribe({
  //       next: (res: any) => {
  //         if (res.success) {
  //           this.payeeList = res.data
  //         } else {
  //           this.as.errorToast(res.message)
  //         }
  //       },
  //       error: (err: any) => console.log(err.message),
  //       complete: () => subs.unsubscribe(),
  //     });
  //   }
  //   else if(this.data.PaymentType === 'Fitter')
  //   { 
  //     const subs: Subscription = this.fitters.dropdownlist().subscribe({
  //       next: (res: any) => {
  //         this.payeeList = res.data
  //       },
  //       error: (err: any) => console.log(err.message),
  //       complete: () => subs.unsubscribe(),
  //     });
  //   }  
  //   else if(this.data.PaymentType === 'Customer')
  //   { 
  //     const subs: Subscription = this.customer.dropdownlist().subscribe({
  //       next: (res: any) => {
  //         if(res.success){
  //           this.payeeList  = res.data
  //           this.data.CreditType = 'Credit'
  //         }else{
  //           this.as.errorToast(res.message)
  //         }
  //       },
  //       error: (err: any) => console.log(err.message),
  //       complete: () => subs.unsubscribe(),
  //     });
  //   }  
  //   else if(this.data.PaymentType === 'Doctor')
  //   { 
  //     const subs: Subscription = this.doctor.dropdownDoctorlist().subscribe({
  //       next: (res: any) => {
  //         if(res.success){
  //           this.payeeList  = res.data
  //         }else{
  //           this.as.errorToast(res.message)
  //         }
  //       },
  //       error: (err: any) => console.log(err.message),
  //       complete: () => subs.unsubscribe(),
  //     });
  //   } 
  //   this.invoiceList = []
  // }
  
  getPayeeList() {
    this.sp.show()
    this.data.CreditType = 'Debit';
    this.invoiceList = [];
    this.data.CustomerCredit = 0;
    this.data.PayableAmount = 0;
    this.data.PaidAmount = 0;
    this.data.ApplyReturn = false;

    let dropdownObs;
  
    switch (this.data.PaymentType) {
      case 'Supplier':
        dropdownObs = this.sup.dropdownSupplierlist('');
        break;
      case 'Employee':
        dropdownObs = this.emp.dropdownUserlist('');
        break;
      case 'Fitter':
        dropdownObs = this.fitters.dropdownlist();
        break;
      case 'Customer':
        dropdownObs = this.customer.dropdownlist();
        this.data.CreditType = 'Credit';
        break;
      case 'Doctor':
        dropdownObs = this.doctor.dropdownDoctorlist();
        break;
      default:
        this.as.errorToast('Invalid Payment Type');
        return;
    }
  
    const subs: Subscription = dropdownObs.subscribe({
      next: (res: any) => {
        if (res.success) {
          this.payeeList = res.data;
        } else {
          this.as.errorToast(res.message);
        }
      this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getInvoicePayment(PaymentType:any, PayeeName:any) {
    this.sp.show()
    PaymentType = this.data.PaymentType
    PayeeName = this.data.CustomerID
    const subs: Subscription = this.pay.getInvoicePayment(PaymentType,PayeeName).subscribe({
      next: (res: any) => {
        if (res.success) {
          // const filteredData = res.data.filter((el: any) => el.DueAmount !== 0);
          this.invoiceList = res.data;
          this.data.BillMasterID = this.invoiceList[0]?.ID
          this.data.PayableAmount = +res.totalDueAmount.toFixed(2)
          this.data.CustomerCredit = +res.totalCreditAmount.toFixed(2)
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  onSubmit(){
    if(this.data.PayableAmount < this.data.PaidAmount ){
      Swal.fire({
        position: 'center',
        icon: 'warning',
        title: 'The Paid Amount exceeds the Payable Amount. Please verify the amounts.',
        showConfirmButton: true,
        backdrop : false,
      })
      this.data.PaidAmount = 0
    }
    if(this.data.ApplyReturn == true){
      if (this.data.CustomerCredit < this.data.PaidAmount){
        Swal.fire({
          position: 'center',
          icon: 'warning',
          title: 'The Paid Amount exceeds the Customer Credit. Please verify the amounts.',
          showConfirmButton: true,
          backdrop : false,
        })
        this.data.PaidAmount = 0
      }
    }
  
    if(this.data.PaidAmount !== 0){
      this.sp.show()
      this.data.CompanyID = this.company.ID;
      this.data.ShopID = Number(this.selectedShop);
      this.data.PaymentDate =  moment().format('YYYY-MM-DD') +' '+ this.currentTime;
      this.data.pendingPaymentList = this.invoiceList;
      const subs: Subscription = this.pay.applyPayment(this.data).subscribe({
        next: (res: any) => {
            if(res.success ){
              this.getInvoicePayment(res.data.PaymentType, res.data.PayeeName)
              this.data.PaidAmount = 0; this.data.PaymentMode = ''; this.data.CardNo = ''; this.data.PaymentReferenceNo = ''; this.data.ApplyReturn = false
              this.creditList = []
            
            }else{
              this.as.errorToast(res.message)
              Swal.fire({
                position: 'center',
                icon: 'warning',
                title: 'Opps !!',
                text: res.message,
                showConfirmButton: true,
                backdrop : false,
              })
            }
          this.sp.hide()
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    }
  }

  getSupplierCreditNoteByCreditNumber(){
    this.sp.show()
    const subs: Subscription = this.pay.getSupplierCreditNoteByCreditNumber(this.vendorCredit.SupplierID,this.vendorCredit.CreditNumber).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.data.CustomerCredit = res.totalCreditAmount
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  onChange(event: { toUpperCase: () => any; toTitleCase: () => any; }) {
    if (this.companySetting.DataFormat === '1') {
      event = event.toUpperCase()
    } else if (this.companySetting.DataFormat == '2') {
      event = event.toTitleCase()
    }
    return event;
  }

  ApplyReturn(){
    if(this.data.ApplyReturn === false){
      switch (this.data.PaymentType) {
        case 'Supplier':
          this.data.PaymentMode = 'Vendor Credit';
          this.getSupplierCreditNote(this.data.CustomerID) 
          break;
        case 'Employee':
          this.data.PaymentMode = 'Employee Credit';
          break;
        case 'Fitter':
          this.data.PaymentMode = 'Fitter Credit';
          break;
        case 'Customer':
          this.data.PaymentMode = 'Customer Credit';
          break;
        case 'Doctor':
          this.data.PaymentMode = 'Doctor Credit';
          break;
        default:
          this.as.errorToast('Invalid Payment Type');
          return;
      }
    }else{
      this.creditList = []
      this.data.PaymentMode = ''
      this.data.CustomerCredit = 0
      this.getInvoicePayment(this.data.PaymentType,this.data.CustomerID)
    }

  }

  dateFormat(date:any){
    return moment(date).format(`${this.companySetting.DateFormat}`);
  }
}
