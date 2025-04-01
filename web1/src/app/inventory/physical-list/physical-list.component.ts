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
  selector: 'app-physical-list',
  templateUrl: './physical-list.component.html',
  styleUrls: ['./physical-list.component.css']
})
export class PhysicalListComponent implements OnInit {
  companySetting: any = JSON.parse(localStorage.getItem('companysetting') || '[]');
  @ViewChild('searching') searching: ElementRef | any;
 id:any

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
    this.id = this.route.snapshot.params['id'];
  }
  term:any
  dataList:any=[]
  currentPage = 1;
  itemsPerPage = 10;
  pageSize!: number;
  collectionSize = 0
  page = 4;

  ngOnInit(): void {
    this.getList()
  }
  
  dateFormat(date: any): string {
    if (date == null || date == "") {
      return '0000-00-00'; // Default Value
    }
    return moment(date).format(this.companySetting?.DateFormat || 'YYYY-MM-DD');
  }

  getList() {
    this.sp.show()
    const dtm = {
      currentPage: this.currentPage,
      itemsPerPage: this.itemsPerPage,
      isGrid: 0
    }
    const subs: Subscription = this.purchaseService.getPhysicalStockCheckList(dtm).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.collectionSize = res.count;
          res.data.forEach((e: any) => {
            e.InvoiceDate = moment(e.InvoiceDate).format('DD-MM-YYYY');
          });
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
          const subs: Subscription = this.purchaseService.searchByFeildPhysicalStockCheckList(dtm).subscribe({
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
