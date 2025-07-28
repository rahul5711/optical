import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
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
import { PurchaseService } from 'src/app/service/purchase.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, Router } from '@angular/router';
import { MomentInput } from 'moment';
import * as moment from 'moment';
import { SupportService } from 'src/app/service/support.service';
import { PaymentService } from 'src/app/service/payment.service';
import { BillService } from 'src/app/service/bill.service';
@Component({
  selector: 'app-purchase-list',
  templateUrl: './purchase-list.component.html',
  styleUrls: ['./purchase-list.component.css']
})
export class PurchaseListComponent implements OnInit {

  @ViewChild('searching') searching: ElementRef | any;
  user = JSON.parse(localStorage.getItem('user') || '');
  permission = JSON.parse(localStorage.getItem('permission') || '[]');
  companySetting: any = JSON.parse(localStorage.getItem('companysetting') || '[]');
  selectShop: any = JSON.parse(localStorage.getItem('selectedShop') || '[]');

  env = environment;
  id: any

  gridview = true;
  term: any;
  dataList: any = [];
  currentPage = 1;
  itemsPerPage = 10;
  pageSize!: number;
  collectionSize = 0
  page = 4;
  paymentHistoryList: any = [];
  CustomerTotal: any = []
  creditList: any = []
  TotalAmountInv: any
  DueAmountIvn: any
  vendorCredit: any

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    public as: AlertService,
    private sp: NgxSpinnerService,
    private excelService: ExcelService,
    private purchaseService: PurchaseService,
    private modalService: NgbModal,
    private supps: SupportService,
    private payment: PaymentService,
    public bill: BillService,
  ) {
    this.id = this.route.snapshot.params['id'];
  }

  applyPayment: any = {
    ID: null, CustomerID: null, CompanyID: null, ShopID: null, CreditType: 'Debit', PaymentDate: null, PayableAmount: 0, PaidAmount: 0,
    CustomerCredit: 0, PaymentMode: null, CardNo: '', PaymentReferenceNo: '', Comments: 0, Status: 1,
    pendingPaymentList: {}, RewardPayment: 0, ApplyReward: false, ApplyReturn: false, CreditNumber: ''
  };

  PaymentModesList: any = [];
  invoiceList: any = [];
  paidList: any = [];
  editPurchaseList = false
  addPurchaseList = false
  deletePurchaseList = false

  ngOnInit(): void {
    this.permission.forEach((element: any) => {
      if (element.ModuleName === 'PurchaseList') {
        this.editPurchaseList = element.Edit;
        this.addPurchaseList = element.Add;
        this.deletePurchaseList = element.Delete;
      }
    });
    if (this.id != "0") {
      this.purchaseHsitory()
    } else {
      this.getList()
    }

  }

  // payment mode 
  getPaymentModesList() {
    const subs: Subscription = this.supps.getList('PaymentModeType').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.PaymentModesList = res.data .filter((p: { Name: string }) => p.Name !== 'AMOUNT RETURN')
        } else {
          this.as.errorToast(res.message)
        }
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  changePagesize(num: number): void {
    this.itemsPerPage = this.pageSize + num;
  }

  getList() {
    this.sp.show()
    const dtm = {
      currentPage: this.currentPage,
      itemsPerPage: this.itemsPerPage,
      isGrid: 0
    }
    const subs: Subscription = this.purchaseService.getList(dtm).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.collectionSize = res.count;
          this.dataList = res.data;
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
        const subs: Subscription = this.purchaseService.deleteData(this.dataList[i].ID).subscribe({
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
      }
    })
  }

  ngAfterViewInit() {
    this.searching.nativeElement.focus();
    if (this.searching) {
      const nativeElem = this.searching.nativeElement
      fromEvent(nativeElem, 'keyup').pipe(
        map((event: any) => {
          return event.target.value;
        }),
        debounceTime(1000),
        distinctUntilChanged(),
      ).subscribe((text: string) => {
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
          const subs: Subscription = this.purchaseService.searchByFeild(dtm).subscribe({
            next: (res: any) => {
              if (res.success) {
                this.collectionSize = 1;
                this.page = 1;
                this.dataList = res.data
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
          this.getList();
        }
      });
    }
  }

  exportAsXLSX(): void {
    let data = this.dataList.map((e: any) => {
      return {
        SupplierName: e.SupplierName,
        InvoiceNo: e.InvoiceNo,
        ShopName: e.ShopName,
        AreaName: e.AreaName,
        PurchaseDate: e.PurchaseDate,
        PaymentStatus: e.PaymentStatus,
        GSTNo: e.GSTNo,
        Quantity: e.Quantity,
        TotalAmount: e.TotalAmount,
        DiscountAmount: e.DiscountAmount,
        GSTAmount: e.GSTAmount,
        CreatedPerson: e.CreatedPerson,
        UpdatedPerson: e.UpdatedPerson,
      }
    })
    this.excelService.exportAsExcelFile(data, 'purchase_list');
  }

  openModal(content: any, data: any) {
    this.sp.show();
    this.modalService.open(content, { centered: true, backdrop: 'static', keyboard: false, size: 'lg' });
    const subs: Subscription = this.purchaseService.paymentHistory(data.ID, data.InvoiceNo).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.paymentHistoryList = res.data;
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

  purchaseHsitory() {
    this.sp.show();
    let SupplierID = Number(this.id)
    const subs: Subscription = this.purchaseService.purchaseHistoryBySupplier(SupplierID).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.dataList = res.data;
          this.DueAmountIvn = (res.sumData.DueAmount || 0).toFixed(2);
          this.TotalAmountInv = (res.sumData.TotalAmount || 0).toFixed(2);
          this.CustomerTotal = (this.TotalAmountInv - this.DueAmountIvn).toFixed(2);
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

  dateFormat(date: any): string {
    if (date == null || date == "") {
      return '0000-00-00'; // Default Value
    }
    return moment(date).format(this.companySetting?.DateFormat || 'YYYY-MM-DD');
  }

  openModal1(content: any, data: any) {
    this.creditList = []
    this.applyPayment.CreditType = 'Debit';
    this.applyPayment.PaymentMode = ''
    this.applyPayment.CustomerCredit = 0

    this.modalService.open(content, { centered: true, backdrop: 'static', keyboard: false, size: 'md' });
    // this.getPaymentModesList()
     this.bill.paymentModes$.subscribe((list:any) => {
      this.PaymentModesList = list.filter((p: { Name: string }) => p.Name !== 'AMOUNT RETURN')
    });
    this.applyPayment.ApplyReturn = false;

    this.applyPayment.CustomerID = data.SupplierID
    this.applyPayment.ID = data.ID
    this.getInvoicePayment()
    this.paymentHistoryByPurchaseID()
  }

  paymentHistoryByPurchaseID() {
    this.sp.show();
    const subs: Subscription = this.purchaseService.paymentHistoryByPurchaseID(this.applyPayment.CustomerID, this.applyPayment.ID).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.paidList = res.data;
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

  getInvoicePayment() {
    this.sp.show();
    const subs: Subscription = this.purchaseService.getInvoicePayment('Supplier', this.applyPayment.CustomerID, this.applyPayment.ID).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.invoiceList = res.data;
          if (this.invoiceList.length === 0) {
            this.invoiceList = [{ InvoiceNo: 'No Pending Invoice', TotalAmount: 0.00, DueAmount: 0.00 }];
          }
          this.applyPayment.CustomerCredit = (res.totalCreditAmount || 0).toFixed(2);
          this.applyPayment.PayableAmount = (res.totalDueAmount || 0).toFixed(2);
          this.DueAmountIvn = (res.DueAmount || 0).toFixed(2);
          this.TotalAmountInv = (res.TotalAmount || 0).toFixed(2);
          this.CustomerTotal = (this.TotalAmountInv - this.DueAmountIvn).toFixed(2);
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

  getSupplierCreditNote(SupplierID: any) {
    this.sp.show()
    const subs: Subscription = this.payment.getSupplierCreditNote(SupplierID).subscribe({
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

  ApplyReturn() {
    if (this.applyPayment.ApplyReturn === false) {
      this.applyPayment.PaymentMode = 'Vendor Credit';
      this.applyPayment.CreditType = 'Credit';
      this.getSupplierCreditNote(this.applyPayment.CustomerID)
    } else {
      this.creditList = []
      this.applyPayment.CreditType = 'Debit';
      this.applyPayment.PaymentMode = ''
      this.applyPayment.CustomerCredit = 0
      this.getInvoicePayment()
    }
  }

  vendorCreditValue() {
    this.applyPayment.CustomerCredit = this.vendorCredit.Amount
    this.applyPayment.CreditNumber = this.vendorCredit.CreditNumber
  }

  onVendorPaySubmit() {
    if (this.applyPayment.PayableAmount < this.applyPayment.PaidAmount) {
      Swal.fire({
        position: 'center',
        icon: 'warning',
        title: 'The Paid Amount exceeds the Payable Amount. Please verify the amounts.',
        showConfirmButton: true,
        backdrop: false,
      })
      this.applyPayment.PaidAmount = 0
    }
    if (this.applyPayment.ApplyReturn == true) {
      if (this.applyPayment.CustomerCredit < this.applyPayment.PaidAmount) {
        Swal.fire({
          position: 'center',
          icon: 'warning',
          title: 'The Paid Amount exceeds the Customer Credit. Please verify the amounts.',
          showConfirmButton: true,
          backdrop: false,
        })
        this.applyPayment.PaidAmount = 0
      }
    }
    if (this.applyPayment.PaidAmount !== 0) {
      this.sp.show()
      this.applyPayment.pendingPaymentList = this.invoiceList;
      this.applyPayment.ShopID = this.selectShop[0];
      let data = this.applyPayment
      this.applyPayment = {
        ID: null, CustomerID: null, CompanyID: null, ShopID: null, CreditType: 'Credit', PaymentDate: null, PayableAmount: 0, PaidAmount: 0,
        CustomerCredit: 0, PaymentMode: null, CardNo: '', PaymentReferenceNo: '', Comments: 0, Status: 1,
        pendingPaymentList: {}, RewardPayment: 0, ApplyReward: false, ApplyReturn: false
      };
      const subs: Subscription = this.payment.vendorPayment(data).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.applyPayment = data 
            this.getInvoicePayment()
            this.paymentHistoryByPurchaseID()
            this.applyPayment.PaidAmount = 0; this.applyPayment.PaymentMode = ''; this.applyPayment.PaymentReferenceNo = '';
            this.applyPayment.ApplyReturn = false
            this.creditList = []
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



}
