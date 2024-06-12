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
    private purchaseService: PurchaseService,
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
  }

}
