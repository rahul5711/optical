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
import { CustomerService } from 'src/app/service/customer.service';
import { BillService } from 'src/app/service/bill.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, Router } from '@angular/router';
import { SupportService } from 'src/app/service/support.service';
import { PaymentService } from 'src/app/service/payment.service';
import * as moment from 'moment';

@Component({
  selector: 'app-old-bill-list',
  templateUrl: './old-bill-list.component.html',
  styleUrls: ['./old-bill-list.component.css']
})
export class OldBillListComponent implements OnInit {

  @ViewChild('searching') searching: ElementRef | any;
  company = JSON.parse(localStorage.getItem('company') || '');
  user = JSON.parse(localStorage.getItem('user') || '');
  companySetting = JSON.parse(localStorage.getItem('companysetting') || '');
  selectedShop = JSON.parse(localStorage.getItem('selectedShop') || '');
  permission = JSON.parse(localStorage.getItem('permission') || '[]');

  id: any
  env = environment;

  gridview = true
  term = "";
  CustomerData: any = [];
  BillMatser: any = [];
  BilldetailList: any = [];
  totalGrandTotal = 0


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

  ) {
    this.id = this.route.snapshot.params['customerOldid'];
  }

  editBillingSearch = false
  addBillingSearch = false
  deleteBillingSearch = false

  ngOnInit(): void {
   this.billHistoryByCustomerOld()
  }


  billHistoryByCustomerOld() {
    this.sp.show();
    let CustomerID = Number(this.id)
    const subs: Subscription = this.bill.billHistoryByCustomerOld(CustomerID).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.CustomerData = res.data.customerData;
          this.BillMatser = res.data.bill;
          this.totalGrandTotal = res.totalGrandTotal
          this.as.successToast(res.message)
        } else {
          Swal.fire({
            position: 'center',
            icon: 'warning',
            title: res.message,
            showCancelButton: true,
          })
          // this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }
}
