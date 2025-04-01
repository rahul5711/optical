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
import { QuotationService } from 'src/app/service/quotation.service';


@Component({
  selector: 'app-quotation-list',
  templateUrl: './quotation-list.component.html',
  styleUrls: ['./quotation-list.component.css']
})
export class QuotationListComponent implements OnInit {

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
    private purchaseService: QuotationService,
    private modalService: NgbModal,
    private supps: SupportService,
    private payment: PaymentService,

  ) {
    
  }

  applyPayment: any = {
    ID: null, CustomerID: null, CompanyID: null, ShopID: null, CreditType: 'Debit', PaymentDate: null, PayableAmount: 0, PaidAmount: 0,
    CustomerCredit: 0, PaymentMode: null, CardNo: '', PaymentReferenceNo: '', Comments: 0, Status: 1,
    pendingPaymentList: {}, RewardPayment: 0, ApplyReward: false, ApplyReturn: false, CreditNumber: ''
  };

  PaymentModesList: any = [];
  invoiceList: any = [];
  paidList: any = [];



  ngOnInit(): void {
    this.getList()
  }

  getList() {
    this.sp.show()
    const dtm = {
      currentPage: this.currentPage,
      itemsPerPage: this.itemsPerPage
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

  dateFormat(date: any): string {
    if (date == null || date == "") {
      return '0000-00-00'; // Default Value
    }
    return moment(date).format(this.companySetting?.DateFormat || 'YYYY-MM-DD');
  }

  ngAfterViewInit() {
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
}
