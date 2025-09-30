import { ChangeDetectorRef, Component,HostListener, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
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
import { PettycashService } from 'src/app/service/pettycash.service';
import { BillService } from 'src/app/service/bill.service';

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

  myControl1 = new FormControl('');
  filteredOptions: any;

  @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
      if (event.altKey && event.key === 'a' || event.altKey && event.key === 'A'  ) {
         this.onSubmit();
         event.preventDefault();
      }
  
    }

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
    private petty: PettycashService,
    private cdr: ChangeDetectorRef,
            public bill: BillService,
  ) { }

  data: any = {
    ID: null, CompanyID: null, BillMasterID: null, ShopID: null, PaymentType: null, CustomerID: null, PayableAmount: 0, CustomerCredit: 0, PaidAmount: 0, PaymentMode: null, CardNo: '', PaymentReferenceNo: '', CreditType: 'Debit', PaymentDate: null, Comments: 0, Status: 1, pendingPaymentList: {}, ApplyReturn: false, CreditNumber: '',CashType:'', totalManualCreditAmount :0,  ApplyCustomerManualCredit: false
  };

  searchValue: any
  PaymentModesList: any = []
  creditList: any = []
  creditManualList: any = []
  payeeList: any = []
  invoiceList: any = []
  vendorCredit: any
  customerCredit: any
  currentTime: any;

  PettyCashBalance = 0;
  CashCounterBalance=0;

  ngOnInit(): void {
    // this.getPaymentModesList()
     this.bill.paymentModes$.subscribe((list:any) => {
      this.PaymentModesList = list.filter((p: { Name: string }) => p.Name !== 'AMOUNT RETURN').sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
    });
    this.currentTime = new Date().toLocaleTimeString('en-US', { hourCycle: 'h23' })
  }


  getPaymentModesList() {
    const subs: Subscription = this.supps.getList('PaymentModeType').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.PaymentModesList =  res.data.filter((p: { Name: string }) => p.Name !== 'AMOUNT RETURN').sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
        } else {
          this.as.errorToast(res.message)
        }
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  paymodeCash(){
    if(this.data.PaymentType !== 'Customer' && this.data.PaymentMode === 'CASH'){
      this.getPettyCashBalance();
      this.getCashCounterCashBalance();
    }
  }

  
  getPettyCashBalance(){
    this.PettyCashBalance = 0;
    this.data.CashType = 'PettyCash'
    this.data.CreditType = 'Deposit'
    const subs: Subscription = this.petty.getPettyCashBalance(this.data).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.PettyCashBalance = res.data
           this.data.CreditType = 'Debit'
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
        this.cdr.detectChanges();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getCashCounterCashBalance(){
    this.CashCounterBalance = 0;
    this.data.CashType = 'CashCounter'
    this.data.CreditType = 'Deposit'
    const subs: Subscription = this.petty.getCashCounterCashBalance(this.data).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.CashCounterBalance = res.data
           this.data.CreditType = 'Debit'
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
        this.cdr.detectChanges();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getSupplierCreditNote(SupplierID: any) {
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

  getCustomerCreditNote(CustomerID: any) {
    this.sp.show()
    const subs: Subscription = this.pay.getCustomerCreditNote(CustomerID).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.creditManualList = res.data
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  vendorCreditValue() {
    this.data.CustomerCredit = this.vendorCredit.Amount
    this.data.CreditNumber = this.vendorCredit.CreditNumber
  }

  manualCreditValue() {
    this.data.CustomerCredit = this.customerCredit.Amount
    this.data.CreditNumber = this.customerCredit.CreditNumber
  }

  getPayeeList(){
    this.data.CreditType = 'Debit'
    this.invoiceList = [];
    this.data.CustomerCredit = 0;
    this.data.totalManualCreditAmount = 0;
    this.data.PayableAmount = 0;
    this.data.PaidAmount = 0;
    this.data.ApplyReturn = false;
    this.data.ApplyCustomerManualCredit = false;
    this.data.PaymentMode = '';
    this.payeeList = [];
    this.filteredOptions = [];
    this.myControl1 = new FormControl('');

    if (this.data.PaymentType === 'Supplier')
    {
      const subs: Subscription = this.sup.dropdownSupplierlist('').subscribe({
        next: (res: any) => {
          if (res.success) {
            this.payeeList = res.data.sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
            this.filteredOptions = this.payeeList;
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
            this.payeeList = res.data.sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
            this.filteredOptions = this.payeeList;
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
          this.payeeList = res.data.sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
          this.filteredOptions = this.payeeList;
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
            this.payeeList = res.data.sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
            this.filteredOptions = this.payeeList;
            this.data.CreditType = 'Credit'
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
            this.payeeList = res.data.sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
            this.filteredOptions = this.payeeList;
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

  // getPayeeList() {
  //   this.data.CreditType = 'Debit';
  //   this.invoiceList = [];
  //   this.data.CustomerCredit = 0;
  //   this.data.PayableAmount = 0;
  //   this.data.PaidAmount = 0;
  //   this.data.ApplyReturn = false;
  //   this.data.PaymentMode = '';
  //   this.filteredOptions = [];
  //   this.myControl1 = new FormControl('');
  // }

  getInvoicePayment(PaymentType: any, PayeeName: any) {
    this.sp.show()
    PaymentType = this.data.PaymentType
    PayeeName = this.data.CustomerID
    const subs: Subscription = this.pay.getInvoicePayment(PaymentType, PayeeName).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.invoiceList = res.data;
          this.data.BillMasterID = this.invoiceList[0]?.ID;
          this.data.PayableAmount = +(res.totalDueAmount ?? 0).toFixed(2);
          this.data.CustomerCredit = +(res.totalCreditAmount ?? 0).toFixed(2);
          this.data.totalManualCreditAmount = +(res.totalManualCreditAmount ?? 0).toFixed(2);
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  onSubmit() {
    if (this.data.PayableAmount < this.data.PaidAmount) {
      Swal.fire({
        position: 'center',
        icon: 'warning',
        title: 'The Paid Amount exceeds the Payable Amount. Please verify the amounts.',
        showConfirmButton: true,
        backdrop: false,
      })
      this.data.PaidAmount = 0
    }
    if (this.data.ApplyReturn == true) {
      if (this.data.CustomerCredit < this.data.PaidAmount) {
        Swal.fire({
          position: 'center',
          icon: 'warning',
          title: 'The Paid Amount exceeds the Customer Credit. Please verify the amounts.',
          showConfirmButton: true,
          backdrop: false,
        })
        this.data.PaidAmount = 0
      }
    }
    if (this.data.ApplyCustomerManualCredit == true) {
      if (this.data.CustomerCredit < this.data.PaidAmount) {
        Swal.fire({
          position: 'center',
          icon: 'warning',
          title: 'The Paid Amount exceeds the Customer Credit. Please verify the amounts.',
          showConfirmButton: true,
          backdrop: false,
        })
        this.data.PaidAmount = 0
      }
    }

    if (this.data.PaidAmount !== 0) {
      this.sp.show()
      this.data.CompanyID = this.company.ID;
      this.data.ShopID = Number(this.selectedShop);
      this.data.PaymentDate = moment().format('YYYY-MM-DD') + ' ' + this.currentTime;
      this.data.pendingPaymentList = this.invoiceList;

      const subs: Subscription = this.pay.applyPayment(this.data).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.getInvoicePayment(res.data.PaymentType, res.data.PayeeName)
            this.data.PaidAmount = 0; this.data.PaymentMode = ''; this.data.CardNo = ''; this.data.PaymentReferenceNo = ''; this.data.ApplyReturn = false; this.data.ApplyCustomerManualCredit = false
            this.creditList = []
            this.creditManualList = []

          } else {
            this.as.errorToast(res.message)
            Swal.fire({
              position: 'center',
              icon: 'warning',
              title: 'Opps !!',
              text: res.message,
              showConfirmButton: true,
              backdrop: false,
            })
          }
          this.sp.hide()
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    }
  }

  getSupplierCreditNoteByCreditNumber() {
    this.sp.show()
    const subs: Subscription = this.pay.getSupplierCreditNoteByCreditNumber(this.vendorCredit.SupplierID, this.vendorCredit.CreditNumber).subscribe({
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

  ApplyReturn() {
    if (this.data.ApplyReturn === false) {
      this.data.ApplyCustomerManualCredit = false
      this.creditManualList = [];
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
    }else {
      this.creditManualList = [];
      this.data.totalManualCreditAmount = 0;
      this.creditList = [];
      this.data.PaymentMode = '';
      this.data.CustomerCredit = 0;
      this.getInvoicePayment(this.data.PaymentType, this.data.CustomerID);
    }
  }

  ApplyCustomerManualCredit() {
    if(this.data.ApplyCustomerManualCredit == true){
      this.data.ApplyReturn = false
        this.creditList = [];
        
      this.data.PaymentMode = 'Manual Customer Credit';
      this.getCustomerCreditNote(this.data.CustomerID);
    } else {
      this.creditList = [];
      this.creditManualList = [];
      this.data.PaymentMode = '';
      this.data.CustomerCredit = 0;
      this.data.totalManualCreditAmount = 0;
      this.getInvoicePayment(this.data.PaymentType, this.data.CustomerID);
    }
  }

  dateFormat(date: any): string {
    if (date == null || date == "") {
      return '0000-00-00'; // Default Value
    }
    return moment(date).format(this.companySetting?.DateFormat || 'YYYY-MM-DD');
  }

  customerSearch(searchKey: any, mode: any, type: any) {
    this.filteredOptions = [];
    let payeeNames = 0;

    switch (mode) {
      case 'data':
        payeeNames = this.data.CustomerID;
        break;
      default:
        break;
    }

    let dtm = {
      Type: this.data.PaymentType,
      Name: payeeNames.toString()
    };

    dtm.Name = searchKey;

    // Set a timeout of 5000 milliseconds (5 seconds) before calling the subscribe function.
    setTimeout(() => {
      const subs: Subscription = this.supps.dropdownlistBySearch(dtm).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.filteredOptions = res.data;
          } else {
            this.as.errorToast(res.message);
          }
          this.sp.hide();
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    }, 2000); // 5000 milliseconds = 5 seconds
  }

  CustomerSelection(mode: any, ID: any) {
    switch (mode) {
      case 'data':
        this.data.CustomerID = ID;
        this.getInvoicePayment(this.data.PaymentType, this.data.PayeeName);
        break;
      case 'All':
        this.filteredOptions = [];
        this.data.CustomerID = 0;
        break;
      default:
        break;
    }
  }
}
