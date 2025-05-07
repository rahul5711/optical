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
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';


@Component({
  selector: 'app-transfer-list',
  templateUrl: './transfer-list.component.html',
  styleUrls: ['./transfer-list.component.css']
})

export class TransferListComponent implements OnInit {
  @ViewChild('searching') searching: ElementRef | any;
  user = JSON.parse(localStorage.getItem('user') || '');
  permission = JSON.parse(localStorage.getItem('permission') || '[]');
  companySetting: any = JSON.parse(localStorage.getItem('companysetting') || '[]');
  selectShop: any = JSON.parse(localStorage.getItem('selectedShop') || '[]');

  env = environment;
  id: any

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    public as: AlertService,
    private sp: NgxSpinnerService,
    private excelService: ExcelService,
    private purchaseService: PurchaseService,
  ) {
    this.id = this.route.snapshot.params['id'];
   }

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

  ngOnInit(): void {
    this.getList() 
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
    const subs: Subscription = this.purchaseService.bulkTransferProductList(dtm).subscribe({
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

  dateFormat(date: any): string {
    if (date == null || date == "") {
      return '0000-00-00'; // Default Value
    }
    return moment(date).format(this.companySetting?.DateFormat || 'YYYY-MM-DD');
  }
  
}
