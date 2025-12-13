import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { Subscription } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { map, filter, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { fromEvent } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ExcelService } from 'src/app/service/helpers/excel.service';
import { CustomerService } from 'src/app/service/customer.service';
import { BillService } from 'src/app/service/bill.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, Router } from '@angular/router';
import { SupportService } from 'src/app/service/support.service';
import { PaymentService } from 'src/app/service/payment.service';
import * as moment from 'moment';


@Component({
  selector: 'app-bill-list',
  templateUrl: './bill-list.component.html',
  styleUrls: ['./bill-list.component.css']
})
export class BillListComponent implements OnInit {
  [x: string]: any;


  myControl1 = new FormControl('');
  filteredOptions: any;
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === '+') {
      this.router.navigate(['/sale/billing', 0, 0]);
      event.preventDefault();
    }
  }

  @ViewChild('searching') searching: ElementRef | any;
  @ViewChild('RegNo') RegNo: ElementRef | any;
  company = JSON.parse(localStorage.getItem('company') || '');
  user = JSON.parse(localStorage.getItem('user') || '');
  companySetting = JSON.parse(localStorage.getItem('companysetting') || '');
  selectedShop = JSON.parse(localStorage.getItem('selectedShop') || '');
  permission = JSON.parse(localStorage.getItem('permission') || '[]');
  shop = JSON.parse(localStorage.getItem('shop') || '');

  id: any
  env = environment;
  fortyPercentDisabled = false
  gridview = true
  term = "";
  term1 = "";
  dataList: any = [];
  currentPage = 1;
  itemsPerPage = 10;
  pageSize!: number;
  collectionSize = 0
  page = 4;
  suBtn = false;
  paymentHistoryList: any = []
  PaymentModesList: any = []
  UpdateMode = false;
  CustomerTotal: any
  TotalAmountInv: any
  DueAmountInv: any
  InsuranceCompanyNameList: any = []
  InsuranceList: any = []
  approved: any = false
  Insurance: any = {
    ID: null, CompanyID: null, ShopID: null, BillMasterID: null, InsuranceCompanyName: '', PolicyNumber: '', Remark: '', Other: '', ClaimAmount: '', ApprovedAmount: '', PaidAmount: '', RemainingAmount: '', PaymentStatus: '', RequestDate: '', ApproveDate: ''
  }

  applyDebitPayment: any = {
    ID: null, CustomerID: null, CompanyID: null, ShopID: null, CreditType: 'Debit', PayableAmount: 0, PaidAmount: 0, PaymentReferenceNo: ''
  };

  applyCreditPayment: any = {
    ID: null, CustomerID: null, PayableAmount: 0, PaidAmount: 0, PaymentMode: null, Remark: ''
  };

  applyPayment: any = {
    ID: null, CustomerID: null, CompanyID: null, ShopID: null, CreditType: 'Credit', PaymentDate: null, PayableAmount: 0, PaidAmount: 0,
    CustomerCredit: 0, PaymentMode: null, CardNo: '', PaymentReferenceNo: '', Comments: 0, Status: 1,
    pendingPaymentList: {}, RewardPayment: 0, ApplyReward: false, ApplyReturn: false
  };

  applyReward: any = {
    ID: null, RewardCustomerRefID: null, CompanyID: null, ShopID: null, CreditType: 'Credit', PaymentDate: null, PayableAmount: 0, PaidAmount: 0,
    CustomerCredit: 0, PaymentMode: 'Customer Reward', CardNo: '', PaymentReferenceNo: '', Comments: 0, Status: 1,
    pendingPaymentList: {}, RewardPayment: 0, ApplyReward: true, ApplyReturn: false, RewardType: 'Self', RewardBalance: 0, AppliedRewardAmount: 0, RewardPercentage: 0, Otp: null
  };

  refCusName: any
  otpChecked = false;
  totalManualcreditAmt: any = 0
  paidList: any = []
  invoiceList: any = []

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    public as: AlertService,
    private sp: NgxSpinnerService,
    private excelService: ExcelService,
    public bill: BillService,
    private modalService: NgbModal,
    private supps: SupportService,
    private pay: PaymentService,
    private cs: CustomerService,

  ) {
    this.id = this.route.snapshot.params['customerid'];
  }

  editBillingSearch = false
  addBillingSearch = false
  deleteBillingSearch = false
  currentTime = ''
  roleName: any = ''
  ngOnInit(): void {
    this.permission.forEach((element: any) => {
      if (element.ModuleName === 'BillingSearch') {
        this.editBillingSearch = element.Edit;
        this.addBillingSearch = element.Add;
        this.deleteBillingSearch = element.Delete;
      }
    });
    if (this.id != "0") {
      this.paymentHistory()

    } else {
      this.getList()
    }
    this.currentTime = new Date().toLocaleTimeString('en-US', { hourCycle: 'h23' })
    if (this.user.UserGroup === 'Employee') {
      this.roleName = this.shop[0].RoleName
    }

    this.bill.paymentModes$.subscribe((list: any) => {
      this.PaymentModesList = list.filter((p: { Name: string }) => p.Name !== 'AMOUNT RETURN').sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
    });
  }

  changePagesize(num: number): void {
    this.itemsPerPage = this.pageSize + num;
  }

  getList() {
    this.sp.show()
    const dtm = {
      currentPage: this.currentPage,
      itemsPerPage: this.itemsPerPage
    }
    const subs: Subscription = this.bill.getList(dtm).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.collectionSize = res.count;
          this.dataList = res.data;
          this.dataList.forEach((element: { PhotoURL: any; }) => {
            if (element.PhotoURL !== "null" && element.PhotoURL !== '') {
              element.PhotoURL = (this.env.apiUrl + element.PhotoURL);
            } else {
              element.PhotoURL = "/assets/images/userEmpty.png"
            }
          });
          this.as.successToast(res.message)
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  // showInput(data:any) {
  //   this.UpdateMode = !this.UpdateMode;
  //   this.paymentHistoryList.forEach((ep: any) => {
  //     ep.PaymentDate = moment(ep.PaymentDate).format('YYYY-MM-DD')
  //   })
  // }

  showInput(data: any) {
    // Ensure data has an UpdateMode property
    if (this.roleName != "MANAGER" && this.roleName != "EMPLOYEE" && this.roleName != "ACCOUNTED" && this.roleName != "ACCOUNT") {
      if (!data.hasOwnProperty('UpdateMode')) {
        data.UpdateMode = false;
      }
      data.PaymentDate = moment(data.PaymentDate).format('YYYY-MM-DD')
      data.UpdateMode = !data.UpdateMode;
    }
  }

  // payment history 
  openModal(content: any, Bdata: any) {
    this.sp.show();
    this.applyCreditPayment.CustomerID = Bdata.CustomerID
    this.applyCreditPayment.ID = Bdata.ID
    this.modalService.open(content, { centered: true, backdrop: 'static', keyboard: false, size: 'md' });
    const subs: Subscription = this.bill.paymentHistory(Bdata.ID, Bdata.InvoiceNo).subscribe({
      next: (res: any) => {
        if (res.success && res.data.length != 0) {
          // res.data.forEach((ele: any) => {
          //   ele.Amount = ele.Credit === 'Debit' ? '-' + ele.Amount : '+' + ele.Amount;
          // });
          this.paymentHistoryList = res.data;
          this.applyDebitPayment.PayableAmount = res.totalPaidAmount;
          this.applyPayment.PayableAmount = res.totalCreditAmount;
          this.applyDebitPayment.CustomerID = res.data[0].CustomerID;
          this.applyDebitPayment.ID = res.data[0].BillMasterID;
          this.bill.paymentModes$.subscribe((list: any) => {
            this.PaymentModesList = list.filter((p: { Name: string }) => p.Name !== 'AMOUNT RETURN' && p.Name !== 'AMOUNT RETURN CASH' && p.Name !== 'AMOUNT RETURN UPI').sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
          });
          this.as.successToast(res.message)
        } else if (res.data.length == 0) {
          Swal.fire({
            icon: 'warning',
            title: `The customer's bill is generated at the same shop. You can view the customer's payment history at the same shop.`,
            footer: '',
            backdrop: false,
          });
        }
        else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }


  // payment mode 
  getPaymentModesList() {
    const subs: Subscription = this.supps.getList('PaymentModeType').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.PaymentModesList = res.data
            .filter((p: { Name: string }) => p.Name !== 'AMOUNT RETURN' && p.Name !== 'AMOUNT RETURN CASH' && p.Name !== 'AMOUNT RETURN UPI')
            .sort((a: { Name: string }, b: { Name: string }) => a.Name.localeCompare(b.Name));
        } else {
          this.as.errorToast(res.message)
        }
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }
  getInsuranceCompanyName() {
    const subs: Subscription = this.supps.getList('InsuranceCompanyName').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.InsuranceCompanyNameList = res.data
        } else {
          this.as.errorToast(res.message)
        }
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  updateCustomerPaymentMode(data: any) {
    this.sp.show()
    const subs: Subscription = this.pay.updateCustomerPaymentMode(data).subscribe({
      next: (res: any) => {
        if (res.success) {
          data.UpdateMode = false
          this.as.successToast(res.message)
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  // payment date update 
  updateCustomerPaymentDate(data: any) {

    let dtm = data
    const specific_date = new Date(dtm.PaymentDate);
    const current_date = new Date();
    if (current_date.getTime() > specific_date.getTime()) {
      this.sp.show()
      dtm.PaymentDate = dtm.PaymentDate + ' ' + this.currentTime
      const subs: Subscription = this.pay.updateCustomerPaymentDate(dtm).subscribe({
        next: (res: any) => {
          if (res.success) {
            data.UpdateMode = false
            // this.UpdateMode = false
            this.as.successToast(res.message)
          } else {
            this.as.errorToast(res.message)
          }
          this.sp.hide()
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    }
    else {

      Swal.fire({
        icon: 'warning',
        title: ' Date should be less then or Equal to Current date',
        footer: '',
        backdrop: false,
      });


    }
  }

  // customer payment debit and credit
  openModal12(content: any) {
    this.sp.show();
    this.modalService.open(content, { centered: true, backdrop: 'static', keyboard: false, size: 'sm' });

    this.sp.hide();
  }

  customerPaymentDebit() {
    if (this.applyDebitPayment.PayableAmount < this.applyDebitPayment.PaidAmount) {
      Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        backdrop: false,
      })
    } else {
      const subs: Subscription = this.pay.customerPaymentDebit(this.applyDebitPayment).subscribe({
        next: (res: any) => {
          if (res.success) {
            const subs: Subscription = this.bill.paymentHistory(res.data.ID, res.data.InvoiceNo).subscribe({
              next: (res: any) => {
                if (res.success) {
                  this.paymentHistoryList = res.data;
                  this.applyDebitPayment.PayableAmount = res.totalPaidAmount;
                  this.as.successToast(res.message)
                } else {
                  this.as.errorToast(res.message)
                  Swal.fire({
                    icon: 'warning',
                    title: res.message,
                    showCancelButton: true,
                    backdrop: false,
                  })
                }
              },
              error: (err: any) => console.log(err.message),
              complete: () => subs.unsubscribe(),
            });
            this.modalService.dismissAll()
            this.applyDebitPayment = []
            this.as.successToast(res.message)
          } else {
            this.as.errorToast(res.message)
          }
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    }
  }

  openModal14(content: any,) {
    this.sp.show();
    this.modalService.open(content, { centered: true, backdrop: 'static', keyboard: false, size: 'sm' });

    this.getCustomerCreditAmount(this.applyCreditPayment.ID, this.applyCreditPayment.CustomerID)
    this.sp.hide();
  }

  getCustomerCreditAmount(ID: any, CustomerID: any) {
    this.sp.show();
    const subs: Subscription = this.pay.getCustomerCreditAmount(ID, CustomerID).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.bill.paymentModes$.subscribe((list: any) => {
            this.PaymentModesList = list.map((p: { Name: string }) => ({
              ...p,
              Name: `AMOUNT RETURN (${p.Name})`
            })).sort((a: { Name: string }, b: { Name: string }) => a.Name.localeCompare(b.Name));
          });
          this.applyCreditPayment.PayableAmount = res.totalCreditAmount
          this.as.successToast(res.message)
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  customerCreditDebit() {
    if (this.applyCreditPayment.PayableAmount < this.applyCreditPayment.PaidAmount) {
      Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        backdrop: false,
      })
    } else {
      const subs: Subscription = this.pay.customerCreditDebit(this.applyCreditPayment).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.getCustomerCreditAmount(res.data.ID, res.data.CustomerID)
            this.applyCreditPayment.PaidAmount = 0; this.applyCreditPayment.PaymentMode = ''; this.applyCreditPayment.Remark = '';
            this.as.successToast(res.message)
          } else {
            this.as.errorToast(res.message)
          }
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    }

  }
  // customer payment debit and credit


  // customer payment individual invoice wise
  openModal13(content: any, Bdata: any) {
    this.sp.show();
    this.refCusName = Bdata.CustomerName
    this.modalService.open(content, { centered: true, backdrop: 'static', keyboard: false, size: 'md' });
    this.Insurance = {
      ID: null, CompanyID: null, ShopID: null, BillMasterID: null, InsuranceCompanyName: '', PolicyNumber: '', Remark: '', Other: '', ClaimAmount: '', ApprovedAmount: '', PaidAmount: '', RemainingAmount: '', PaymentStatus: 'Requested',
    }
    this.applyReward = {
      ID: null, RewardCustomerRefID: null, CompanyID: null, ShopID: null, CreditType: 'Credit', PaymentDate: null, PayableAmount: 0, PaidAmount: 0, CustomerCredit: 0, PaymentMode: 'Customer Reward', CardNo: '', PaymentReferenceNo: '', Comments: 0, Status: 1,
      pendingPaymentList: {}, RewardPayment: 0, ApplyReward: true, ApplyReturn: false, RewardType: 'Self', RewardBalance: 0, AppliedRewardAmount: 0, RewardPercentage: 0, Otp: null
    };
    this.bill.paymentModes$.subscribe((list: any) => {
      this.PaymentModesList = list.filter((p: { Name: string }) => p.Name !== 'AMOUNT RETURN' && p.Name !== 'AMOUNT RETURN CASH' && p.Name !== 'AMOUNT RETURN UPI').sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
    });
    this.getCustomerCreditNote(Bdata.CustomerID)
    // this.paymentHistoryByMasterID(data.CustomerID, data.ID)
    // this.billByCustomer(data.CustomerID, data.ID)
    const subs: Subscription = this.bill.getPaymentWindowByBillMasterID(Bdata.ID).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.invoiceList = res.data.billByCustomer.data
          if (this.invoiceList.length === 0) {
            this.invoiceList = [{ InvoiceNo: 'No Pending Invoice', TotalAmount: 0.00, DueAmount: 0.00 }];
          }
          this.applyPayment.PayableAmount = res.data.billByCustomer.totalDueAmount.toFixed(2) ? res.data.billByCustomer.totalDueAmount.toFixed(2) : 0;
          this.applyReward.PayableAmount = res.data.billByCustomer.totalDueAmount.toFixed(2) ? res.data.billByCustomer.totalDueAmount.toFixed(2) : 0;
          this.applyPayment.CustomerCredit = res.data.billByCustomer.creditAmount ? res.data.billByCustomer.creditAmount : 0

          res.data.paymentHistoryByMasterID.data.forEach((ele: any) => {
            ele.Amount = ele.Type === 'Debit' ? '-' + ele.Amount : '+' + ele.Amount;
          });
          this.paidList = res.data.paymentHistoryByMasterID.data

          const rewardData = res?.data?.getRewardBalance;

          if (rewardData.success == true) {
            this.applyReward.RewardBalance = rewardData.data.RewardAmount;
            this.applyReward.RewardPercentage = rewardData.data.RewardPercentage;
            this.applyReward.AppliedRewardAmount = rewardData.data.AppliedRewardAmount;
            this.applyReward.RewardCustomerRefID = Bdata.CustomerID;
          } else {
            this.applyReward.RewardBalance = 0;
            this.applyReward.RewardPercentage = 0;
            this.applyReward.AppliedRewardAmount = 0;
            this.applyReward.RewardCustomerRefID = 0
          }

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
    this.applyPayment.CustomerID = Bdata.CustomerID
    this.applyPayment.BillMasterID = Bdata.ID
    this.Insurance.BillMasterID = Bdata.ID
    this.applyReward.CustomerID = Bdata.CustomerID
    this.applyReward.BillMasterID = Bdata.ID
    this.applyReward.InvoiceNo = Bdata.InvoiceNo
    // this.RewardType()
    this.sp.hide();
  }

  billByCustomer(CustomerID: any, BillMasterID: any) {
    this.sp.show()
    const subs: Subscription = this.bill.billByCustomerInvoice(CustomerID, BillMasterID).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.invoiceList = res.data
          if (this.invoiceList.length === 0) {
            this.invoiceList = [{ InvoiceNo: 'No Pending Invoice', TotalAmount: 0.00, DueAmount: 0.00 }];
          }
          this.applyPayment.PayableAmount = res.totalDueAmount.toFixed(2) ? res.totalDueAmount.toFixed(2) : 0;
          this.applyReward.PayableAmount = res.totalDueAmount.toFixed(2) ? res.totalDueAmount.toFixed(2) : 0;
          this.applyPayment.CustomerCredit = res.creditAmount ? res.creditAmount : 0
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

  paymentHistoryByMasterID(CustomerID: any, BillMasterID: any) {
    this.sp.show()
    const subs: Subscription = this.bill.paymentHistoryByMasterID(CustomerID, BillMasterID).subscribe({
      next: (res: any) => {
        if (res.success) {
          res.data.forEach((ele: any) => {
            ele.Amount = ele.Type === 'Debit' ? '-' + ele.Amount : '+' + ele.Amount;
          });
          this.paidList = res.data

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

  getCustomerCreditNote(CustomerID: any) {
    this.sp.show()
    this.totalManualcreditAmt = 0
    let Parem = ' and customercredit.CustomerID = ' + `${CustomerID}`
    const subs: Subscription = this.cs.customerCreditReport(Parem).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.totalManualcreditAmt = res.calculation[0].totalBalance

        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  onPaymentSubmit() {

    if (this.applyPayment.PayableAmount < this.applyPayment.PaidAmount) {
      Swal.fire({
        position: 'center',
        icon: 'warning',
        title: 'Opps !!',
        showConfirmButton: true,
        backdrop: false,
      })
      this.applyPayment.PaidAmount = 0
    }
    if (this.applyPayment.ApplyReturn === true) {
      if (this.applyPayment.CustomerCredit < this.applyPayment.PaidAmount) {
        Swal.fire({
          position: 'center',
          icon: 'warning',
          title: 'Opps !!',
          showConfirmButton: true,
          backdrop: false,
        })
        this.applyPayment.PaidAmount = 0
      }
    }

    if (this.applyPayment.PaidAmount !== 0) {
      this.sp.show()
      this.applyPayment.CompanyID = this.company.ID;
      this.applyPayment.ShopID = Number(this.selectedShop);
      this.applyPayment.PaymentDate = moment().format('YYYY-MM-DD');
      this.applyPayment.PaymentDate = moment().format('YYYY-MM-DD') + ' ' + this.currentTime;
      this.applyPayment.pendingPaymentList = this.invoiceList;
      let data = this.applyPayment
      this.applyPayment = {
        ID: null, CustomerID: null, CompanyID: null, ShopID: null, CreditType: 'Credit', PaymentDate: null, PayableAmount: 0, PaidAmount: 0,
        CustomerCredit: 0, PaymentMode: null, CardNo: '', PaymentReferenceNo: '', Comments: 0, Status: 1,
        pendingPaymentList: {}, RewardPayment: 0, ApplyReward: false, ApplyReturn: false
      };
      const subs: Subscription = this.pay.customerPayment(data).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.applyPayment = data

            // this.paymentHistoryByMasterID(this.applyPayment.CustomerID, this.applyPayment.BillMasterID)
            // this.billByCustomer(this.applyPayment.CustomerID, this.applyPayment.BillMasterID)
            this.invoiceList = res.data.billByCustomer.data
            if (this.invoiceList.length === 0) {
              this.invoiceList = [{ InvoiceNo: 'No Pending Invoice', TotalAmount: 0.00, DueAmount: 0.00 }];
            }
            this.applyPayment.PayableAmount = res.data.billByCustomer.totalDueAmount.toFixed(2) ? res.data.billByCustomer.totalDueAmount.toFixed(2) : 0;
            this.applyReward.PayableAmount = res.data.billByCustomer.totalDueAmount.toFixed(2) ? res.data.billByCustomer.totalDueAmount.toFixed(2) : 0;
            this.applyPayment.CustomerCredit = res.data.billByCustomer.creditAmount.toFixed(2) ? res.data.billByCustomer.creditAmount.toFixed(2) : 0;
            // this.OldInvoiceDueAmount = res.data.billByCustomer.oldInvoiceDueAmount.toFixed(2) ? res.data.billByCustomer.oldInvoiceDueAmount.toFixed(2) : 0;

            const rewardData = res?.data?.getRewardBalance;

            if (rewardData.success == true) {
              this.applyReward.RewardBalance = rewardData.data.RewardAmount;
              this.applyReward.RewardPercentage = rewardData.data.RewardPercentage;
              this.applyReward.AppliedRewardAmount = rewardData.data.AppliedRewardAmount;
            } else {
              this.applyReward.RewardBalance = 0;
              this.applyReward.RewardPercentage = 0;
              this.applyReward.AppliedRewardAmount = 0;
            }

            this.paidList = res.data.paymentHistoryByMasterID.data

            this.applyPayment.PaidAmount = 0; this.applyPayment.PaymentMode = ''; this.applyPayment.ApplyReturn = false;
            if (this.id != 0) {
              this.paymentHistory()
            } else {
              this.getList()
            }

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
  // customer payment individual invoice wise
  // deleteItem(i:any){
  //   Swal.fire({
  //     title: 'Are you sure?',
  //     text: "You won't be able to revert this!",
  //     icon: 'warning',
  //     showCancelButton: true,
  //     confirmButtonColor: '#3085d6',
  //     cancelButtonColor: '#d33',
  //     confirmButtonText: 'Yes, delete it!'
  //   }).then((result) => {
  //     if (result.isConfirmed) {
  //       this.sp.show()
  //       const subs: Subscription = this.bill.deleteData(this.dataList[i].ID).subscribe({
  //         next: (res: any) => {
  //           if(res.success){
  //             this.dataList.splice(i, 1);
  //             this.as.successToast(res.message)
  //             Swal.fire({
  //               position: 'center',
  //               icon: 'success',
  //               title: 'Your file has been deleted.',
  //               showConfirmButton: false,
  //               timer: 1000
  //             })
  //           }else{
  //             this.as.errorToast(res.message)
  //           }
  //           this.sp.hide()
  //         },
  //         error: (err: any) => console.log(err.message),
  //         complete: () => subs.unsubscribe(),
  //       });
  //     }
  //   })
  //   this.sp.hide()
  // }

  // reward step

  RewardType() {
    if (this.applyReward.RewardType === 'Self') {
      this.otpChecked = false
      this.applyReward.PaidAmount = 0
      this.applyReward.RewardBalance = 0
      this.applyReward.RewardPercentage = 0
      this.applyReward.AppliedRewardAmount = 0
      this.applyReward.RewardCustomerRefID = this.applyReward.CustomerID
      const subs: Subscription = this.bill.getRewardBalance(this.applyReward.RewardCustomerRefID, this.applyReward.InvoiceNo).subscribe({
        next: (res: any) => {
          this.applyReward.RewardBalance = res.data.RewardAmount
          this.applyReward.RewardPercentage = res.data.RewardPercentage
          this.applyReward.AppliedRewardAmount = res.data.AppliedRewardAmount
        },
        error: (err: any) => console.log(err.message),
      });
    } else {
      this.otpChecked = false
      this.applyReward.RewardBalance = 0
      this.applyReward.RewardPercentage = 0
      this.applyReward.AppliedRewardAmount = 0
      this.applyReward.RewardCustomerRefID = 0
      this.applyReward.PaidAmount = 0
    }
  }

  customerSearch(searchKey: string, mode: string, mob: any, type: any) {
    this.filteredOptions = [];
    let param = { Name: '', MobileNo1: '', Address: '', Sno: '' };

    if (searchKey.length >= 3) {
      if (/^\d+$/.test(searchKey)) {
        param.MobileNo1 = searchKey;
      } else {
        param.Name = searchKey.trim();
      }

      // Set a timeout before calling the subscribe function (2000ms = 2 seconds).
      setTimeout(() => {
        const subs: Subscription = this.cs.customerSearch(param).subscribe({
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
      }, 2000);
    }
  }

  CustomerSelection(mode: any, ID: any) {
    switch (mode) {
      case 'data':
        this.applyReward.RewardCustomerRefID = ID;
        this.applyReward.RewardBalance = 0
        this.applyReward.RewardPercentage = 0
        this.applyReward.AppliedRewardAmount = 0
        const subs: Subscription = this.bill.getRewardBalance(this.applyReward.RewardCustomerRefID, this.applyReward.InvoiceNo).subscribe({
          next: (res: any) => {
            this.applyReward.RewardBalance = res.data.RewardAmount
            this.applyReward.RewardBalance = res.data.RewardAmount
            this.applyReward.RewardPercentage = res.data.RewardPercentage
            this.applyReward.AppliedRewardAmount = res.data.AppliedRewardAmount
          },
          error: (err: any) => console.log(err.message),
        });
        break;
      case 'All':
        this.filteredOptions = [];
        this.applyReward.RewardCustomerRefID = 0;
        break;
      default:
        break;
    }
  }

  sendOtpForAppliedReward() {
    if (this.applyReward.PaidAmount > this.applyReward.AppliedRewardAmount) {
      Swal.fire({
        position: 'center',
        icon: 'warning',
        title: 'Opps !!',
        showConfirmButton: true,
        backdrop: false,
      })
      this.applyReward.PaidAmount = 0
    }

    if (this.applyReward.PaidAmount !== 0) {
      this.sp.show()
      this.applyReward.RewardCustomerRefID = Number(this.applyReward.RewardCustomerRefID)
      const subs: Subscription = this.bill.sendOtpForAppliedReward(this.applyReward).subscribe({
        next: (res: any) => {
          if (res.success) {
            if (res.data.otp !== '' || res.data.otp !== null) {
              this.otpChecked = true
            }


            let WhatsappMsg

            if (this.applyReward.RewardType === 'Self') {
              WhatsappMsg = `*Hi ${res.data.Name},*%0A` + `${res.data.otp} is your OTP.%0AValid for 10 minutes.%0APlease provide the billing person - Redeem Amount: Rs ${this.applyReward.PaidAmount}`
            } else (
              WhatsappMsg = `*Hi  ${res.data.Name},*%0A` + `${res.data.otp} is your ${this.refCusName} referral OTP.%0AValid for 10 minutes. %0APlease provide this to the billing person to redeem your referral reward of Rs ${this.applyReward.PaidAmount}`
            )

            var msg = `${WhatsappMsg}%0A` + `%0A` +
              `Thankyou %0A` +
              `*${this.shop[0].Name}* - ${this.shop[0].AreaName}%0A${this.shop[0].MobileNo1}%0A${this.shop[0].Website}`;

            if (res.data.MobileNo != '') {
              var mob = this.company.Code + res.data.MobileNo;
              var url = `https://wa.me/${mob}?text=${msg}`;
              window.open(url, "_blank");
            } else {
              Swal.fire({
                position: 'center',
                icon: 'warning',
                title: '<b>' + res.data.Name + '</b>' + ' Mobile number is not available.',
                showConfirmButton: true,
              })
            }

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

  onRewardSubmit() {
    if (this.applyReward.PayableAmount < this.applyReward.PaidAmount) {
      Swal.fire({
        position: 'center',
        icon: 'warning',
        title: 'Opps !!',
        showConfirmButton: true,
        backdrop: false,
      })
      this.applyReward.PaidAmount = 0
    }

    if (this.applyReward.PaidAmount !== 0) {
      this.sp.show()
      this.otpChecked = false
      this.applyReward.CustomerID = this.applyReward.CustomerID;
      this.applyReward.Otp = this.applyReward.Otp ? this.applyReward.Otp.trim() : null;
      this.applyReward.CompanyID = this.company.ID;
      this.applyReward.ShopID = Number(this.selectedShop);
      this.applyReward.PaymentDate = moment().format('YYYY-MM-DD') + ' ' + this.currentTime;
      this.applyReward.pendingPaymentList = this.invoiceList;
      let data = this.applyReward
      this.applyReward = {
        ID: null, RewardCustomerRefID: null, CompanyID: null, ShopID: null, CreditType: 'Credit', PaymentDate: null, PayableAmount: 0, PaidAmount: 0, CustomerCredit: 0, PaymentMode: 'Customer Reward', CardNo: '', PaymentReferenceNo: '', Comments: 0, Status: 1, pendingPaymentList: {}, RewardPayment: 0, ApplyReward: true, ApplyReturn: false, RewardType: 'Self', RewardBalance: 0, AppliedRewardAmount: 0, RewardPercentage: 0, Otp: null
      };

      const subs: Subscription = this.pay.customerPayment(data).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.invoiceList = []
            this.applyReward = data
            this.paymentHistoryByMasterID(this.applyReward.CustomerID, this.applyReward.BillMasterID)
            this.billByCustomer(this.applyReward.CustomerID, this.applyReward.BillMasterID)
            this.applyReward.PaidAmount = 0; this.applyReward.PaymentMode = 'Customer Reward'; this.applyReward.ApplyReturn = false;
            this.RewardType()
            if (this.id != 0) {
              this.paymentHistory()
            } else {
              this.getList()
            }

          } else {
            this.applyReward = data
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


  ngAfterViewInit() {
    // server-side search

    this.searching?.nativeElement.focus();
    if (this.searching) {
      const nativeElem = this.searching.nativeElement
      fromEvent(nativeElem, 'keyup').pipe(
        map((event: any) => {
          return event.target.value;
        }),
        debounceTime(1000),
        distinctUntilChanged(),
      ).subscribe((text: string) => {
        //  const name = e.target.value;
        let data = {
          searchQuery: text.trim(),
        }

        if (data.searchQuery !== "") {
          const dtm = {
            currentPage: 1,
            itemsPerPage: 50000,
            searchQuery: data.searchQuery
          }
          this.sp.show()
          const subs: Subscription = this.bill.searchByFeild(dtm).subscribe({
            next: (res: any) => {
              if (res.success) {
                this.collectionSize = 1;
                this.page = 1;
                this.dataList = res.data;
                this.as.successToast(res.message)
              } else {
                this.as.errorToast(res.message)
              }
              this.sp.hide();
            },
            error: (err: any) => console.log(err.message),
            complete: () => subs.unsubscribe(),
          });
        } else {
          this.sp.hide()
          this.getList()
        }
      });
    }

    if (this.RegNo) {
      const nativeElem = this.RegNo.nativeElement
      fromEvent(nativeElem, 'keyup').pipe(
        map((event: any) => {
          return event.target.value;
        }),
        debounceTime(1000),
        distinctUntilChanged(),
      ).subscribe((text: string) => {
        //  const name = e.target.value;
        let data = {
          searchQuery: text.trim(),
        }

        if (data.searchQuery !== "") {
          const dtm = {
            currentPage: 1,
            itemsPerPage: 50000,
            RegNo: data.searchQuery
          }
          this.sp.show()
          const subs: Subscription = this.bill.searchByRegNo(dtm).subscribe({
            next: (res: any) => {
              if (res.success) {
                this.collectionSize = 1;
                this.page = 1;
                this.dataList = res.data;
                this.as.successToast(res.message)
              } else {
                this.as.errorToast(res.message)
              }
              this.sp.hide();
            },
            error: (err: any) => console.log(err.message),
            complete: () => subs.unsubscribe(),
          });
        } else {
          this.sp.hide()
          this.getList()
        }
      });
    }
  }

  exportAsXLSX(): void {
    this.excelService.exportAsExcelFile(this.dataList, 'customer_list');
  }

  paymentHistory() {
    this.sp.show();
    let CustomerID = Number(this.id)
    const subs: Subscription = this.bill.billHistoryByCustomer(CustomerID).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.dataList = res.data;
          this.TotalAmountInv = (res.sumData.TotalAmount || 0).toFixed(2);
          this.DueAmountInv = (res.sumData.DueAmount || 0).toFixed(2);
          this.CustomerTotal = (parseFloat(this.TotalAmountInv) - parseFloat(this.DueAmountInv)).toFixed(2);

          this.as.successToast(res.message)
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  deleteItem(i: any) {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.sp.show()
        if (this.dataList[i].Quantity == 0 && this.dataList[i].DueAmount == 0) {
          const subs: Subscription = this.bill.deleteData(this.dataList[i].ID).subscribe({
            next: (res: any) => {
              if (res.success) {
                this.dataList.splice(i, 1);

                this.as.successToast(res.message)
                Swal.fire({
                  position: 'center',
                  icon: 'success',
                  title: 'Your file has been deleted.',
                  showConfirmButton: false,
                  timer: 1000
                })

                if (this.id != 0) {
                  this.router.navigateByUrl('/sale/billinglist/0', { skipLocationChange: true }).then(() => {
                    // After navigating to '0', navigate back to 'this.id'
                    return this.router.navigate(['/sale/billinglist', this.id]);
                  });
                } else {
                  // If the id is already 0, refresh the current route
                  this.router.navigate(['/sale/billinglist', 0], { skipLocationChange: true }).then(() => {
                    this.getList(); // Refresh data or handle any updates required
                  });
                }
              } else {
                this.as.errorToast(res.message)
                Swal.fire({
                  position: 'center',
                  icon: 'warning',
                  title: res.message,
                  showCancelButton: true,
                })
              }
              this.sp.hide()
            },
            error: (err: any) => console.log(err.message),
            complete: () => subs.unsubscribe(),
          });
        } else {
          this.sp.hide()
          Swal.fire({
            title: 'Alert',
            text: "you can not delete this invoice, please delete product first!",
            icon: 'warning',
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'OK!'
          })
        }

      }
    })
  }

  deleteBillPermanent(i: any) {
    Swal.fire({
      title: 'Are you sure Permanent?',
      text: "Delete Bill Permanent",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.sp.show()
        if (this.dataList[i].Quantity == 0 && this.dataList[i].DueAmount == 0) {
          const subs: Subscription = this.bill.deleteBillPermanent(this.dataList[i].ID).subscribe({
            next: (res: any) => {
              if (res.success) {
                this.dataList.splice(i, 1);

                this.as.successToast(res.message)
                Swal.fire({
                  position: 'center',
                  icon: 'success',
                  title: 'Your file has been deleted.',
                  showConfirmButton: false,
                  timer: 1000
                })

                if (this.id != 0) {
                  this.router.navigateByUrl('/sale/billinglist/0', { skipLocationChange: true }).then(() => {
                    // After navigating to '0', navigate back to 'this.id'
                    return this.router.navigate(['/sale/billinglist', this.id]);
                  });
                } else {
                  // If the id is already 0, refresh the current route
                  this.router.navigate(['/sale/billinglist', 0], { skipLocationChange: true }).then(() => {
                    this.getList(); // Refresh data or handle any updates required
                  });
                }
              } else {
                this.as.errorToast(res.message)
                Swal.fire({
                  position: 'center',
                  icon: 'warning',
                  title: res.message,
                  showCancelButton: true,
                })
              }
              this.sp.hide()
            },
            error: (err: any) => console.log(err.message),
            complete: () => subs.unsubscribe(),
          });
        } else {
          this.sp.hide()
          Swal.fire({
            title: 'Alert',
            text: "you can not delete this invoice, please delete product first!",
            icon: 'warning',
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'OK!'
          })
        }

      }
    })
  }

  dateFormat(date: any): string {
    if (date == null || date == "") {
      return '0000-00-00'; // Default Value
    }
    return moment(date).format(this.companySetting?.DateFormat || 'YYYY-MM-DD');
  }

  isDisableds() {
    if (this.company.ID == 84) {
      const minimumPayment = this.applyPayment.PayableAmount * 0.4;

      if (this.paidList?.[1]) {
        this.fortyPercentDisabled = false;

      } else {
        this.fortyPercentDisabled = this.applyPayment.PaidAmount < minimumPayment;
      }
    } else {
      this.fortyPercentDisabled = false;
    }
  }

  getWhatsAppMessage(temp: any, messageName: any) {
    if (temp && temp !== 'null') {
      const foundElement = temp.find((element: { MessageName1: any; }) => element.MessageName1 === messageName);
      return foundElement ? foundElement.MessageText1 : '';
    }
    return '';
  }

  getEmailMessage(temp: any, messageName: any) {
    if (temp && temp !== 'null') {
      const foundElement = temp.find((element: { MessageName2: any; }) => element.MessageName2 === messageName);
      return foundElement ? foundElement.MessageText2 : '';
    }
    return '';
  }

  sendEmail(data: any) {
    if (data.Email != "" && data.Email != null && data.Email != undefined) {
      this.sp.show()
      let temp = JSON.parse(this.companySetting.EmailSetting);
      let dtm = {}

      let emailMsg = this.getEmailMessage(temp, 'Customer_Bill FinalDelivery');
      dtm = {
        mainEmail: data.CustomerEmail,
        mailSubject: `invoice - ${data.InvoiceNo} - ${data.CustomerName}`,
        mailTemplate: ` ${emailMsg} <br>
                        <div style="padding-top: 10px;">
                          <b> ${data.ShopName} (${data.AreaName}) </b> <br>
                          <b> ${data.ShopMobileNo1} </b><br>
                              ${data.ShopWebsite} <br>
                              Please give your valuable Review for us !
                        </div>`,
      }

      const subs: Subscription = this.bill.sendMail(dtm).subscribe({
        next: (res: any) => {
          if (res) {
            Swal.fire({
              position: 'center',
              icon: 'success',
              title: 'Mail Sent Successfully',
              showConfirmButton: false,
              timer: 1200
            })
          } else {
            this.as.errorToast(res.message)
            Swal.fire({
              position: 'center',
              icon: 'warning',
              title: res.message,
              showConfirmButton: true,
              backdrop: false,
            })
          }
          this.sp.hide();
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    } else {
      Swal.fire({
        position: 'center',
        icon: 'warning',
        title: '<b>' + data.Name + '</b>' + ' Email is not available.',
        showConfirmButton: true,
      })
    }
  }



  opneModelI(content: any) {
    // this.sp.show();
    this.getInsuranceByBillMasterID()
    this.getInsuranceCompanyName()
    this.modalService.open(content, { centered: true, backdrop: 'static', keyboard: false, size: 'lg' });
  }

  saveInsuranceQuotation() {
    this.sp.show()
    let dtm = {
      BillMasterID: this.Insurance.BillMasterID,
      InsuranceCompanyName: this.Insurance.InsuranceCompanyName,
      PolicyNumber: this.Insurance.PolicyNumber,
      Remark: this.Insurance.Remark,
      Other: this.Insurance.Other,
      ClaimAmount: this.Insurance.ClaimAmount,
      RequestDate: this.Insurance.RequestDate
    }
    const subs: Subscription = this.bill.saveInsuranceQuotation(dtm).subscribe({
      next: (res: any) => {
        if (res.success) {
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Your file has been Save.',
            showConfirmButton: false,
            timer: 1200
          })
          this.getInsuranceByBillMasterID()
          this.Insurance = {
            ID: null, CompanyID: null, ShopID: null, BillMasterID: null, InsuranceCompanyName: '', PolicyNumber: '', Remark: '', Other: '', ClaimAmount: '', ApprovedAmount: '', PaidAmount: '', RemainingAmount: '', PaymentStatus: '', RequestDate: '', ApproveDate: ''
          }

        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => {
        console.log(err.msg);
      },
      complete: () => subs.unsubscribe(),
    });

  }

  updateInsuranceQuotation() {
    this.sp.show()
    let dtm = {
      InsuranceID: this.Insurance.ID,
      ApprovedAmount: this.Insurance.ApprovedAmount,
      PaymentStatus: this.Insurance.PaymentStatus,
      ApproveDate: this.Insurance.ApproveDate,
    }
    const subs: Subscription = this.bill.updateInsuranceQuotation(dtm).subscribe({
      next: (res: any) => {
        if (res.success) {
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Your file has been Save.',
            showConfirmButton: false,
            timer: 1200
          })
          this.getInsuranceByBillMasterID()
          this.Insurance = {
            ID: null, CompanyID: null, ShopID: null, BillMasterID: null, InsuranceCompanyName: '', PolicyNumber: '', Remark: '', Other: '', ClaimAmount: '', ApprovedAmount: '', PaidAmount: '', RemainingAmount: '', PaymentStatus: '', RequestDate: '', ApproveDate: ''
          }

        } else {
             Swal.fire({
            position: 'center',
            icon: 'warning',
            title: res.message,
            showConfirmButton: true,
          })
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => {
        console.log(err.msg);
      },
      complete: () => subs.unsubscribe(),
    });

  }

  getInsuranceByBillMasterID() {
    this.sp.show()
    const subs: Subscription = this.bill.getInsuranceByBillMasterID(this.Insurance.BillMasterID).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.InsuranceList = res.data
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => {
        console.log(err.msg);
      },
      complete: () => subs.unsubscribe(),
    });
  }


   applyInsuranceQuotation() {
    Swal.fire({
      title: 'Are you sure ?',
      text: "Apply paid amount",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, Apply it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.sp.show()
        let dtm = {
      InsuranceID: this.Insurance.ID,
      PaidAmount: this.Insurance.PaidAmount,
      RemainingAmount: (this.Insurance.ApprovedAmount - this.Insurance.PaidAmount),
    }
    const subs: Subscription = this.bill.applyInsuranceQuotation(dtm).subscribe({
      next: (res: any) => {
        if (res.success) {
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Your file has been Save.',
            showConfirmButton: false,
            timer: 1200
          })
          this.getInsuranceByBillMasterID()
          this.Insurance = {
            ID: null, CompanyID: null, ShopID: null, BillMasterID: null, InsuranceCompanyName: '', PolicyNumber: '', Remark: '', Other: '', ClaimAmount: '', ApprovedAmount: '', PaidAmount: '', RemainingAmount: '', PaymentStatus: '', RequestDate: '', ApproveDate: ''
          }
           this.getList()
        } else {
            Swal.fire({
            position: 'center',
            icon: 'warning',
            title: res.message,
            showConfirmButton: true,
          })
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => {
        console.log(err.msg);
      },
      complete: () => subs.unsubscribe(),
    });
          this.modalService.dismissAll()

      }
    })
  }



  edit(data: any) {
    this.approved = true
    data.RequestDate = moment(data.RequestDate).format('YYYY-MM-DD');
    data.ApproveDate = moment(data.ApproveDate).format('YYYY-MM-DD');
    this.Insurance = data
  }


  
}
