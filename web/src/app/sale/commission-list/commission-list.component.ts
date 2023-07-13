import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { NgxSpinnerService } from 'ngx-spinner';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { BillService } from 'src/app/service/bill.service';
import { CalculationService } from 'src/app/service/helpers/calculation.service';
import { FitterService } from 'src/app/service/fitter.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ExcelService } from 'src/app/service/helpers/excel.service';
import { SupportService } from 'src/app/service/support.service';
import Swal from 'sweetalert2';
import { PaymentService } from 'src/app/service/payment.service';

@Component({
  selector: 'app-commission-list',
  templateUrl: './commission-list.component.html',
  styleUrls: ['./commission-list.component.css']
})
export class CommissionListComponent implements OnInit {
  user = JSON.parse(localStorage.getItem('user') || '');
  selectedShop = JSON.parse(localStorage.getItem('selectedShop') || '');
  evn = environment
  id :any

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    public as: AlertService,
    private sp: NgxSpinnerService,
    public bill: BillService,
    private fitters: FitterService,
    public calculation: CalculationService,
    private modalService: NgbModal,
    private excelService: ExcelService,
    private supps: SupportService,
    private pay: PaymentService,

  ) {
    this.id = this.route.snapshot.params['id'];
   }

  currentPage = 1;
  itemsPerPage = 10;
  pageSize!: number;
  collectionSize = 0
  page = 4;
  term:any
  dataList:any =[]

  TotalAmountInv:any 
  TotalGSTAmount:any 
  gst_details:any =[]
  gst_detail: any = [];
  gstList: any;

  UpdateProduct = false

  ngOnInit(): void {
    if(this.id == 0){
      this.getList();
    }else{
      this.getCommissionByID()
    }
  }



  changePagesize(num: number): void {
    this.itemsPerPage = this.pageSize + num;
  }

  getList() {
    this.sp.show()

    const dtm = {
      currentPage: this.currentPage,
      itemsPerPage: this.itemsPerPage,
    }

    const subs: Subscription = this.pay.getCommissionDetailList(dtm).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.collectionSize = res.count;
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
    this.sp.hide()
  }

  getCommissionByID() {
    this.sp.show();
    const subs: Subscription = this.pay.getCommissionByID(this.id).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.dataList = res.data;
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => {
        console.log(err.message);
      },
      complete: () => subs.unsubscribe(),
    })
    this.sp.hide();
  }

  

  openModal(content: any) {
    this.modalService.open(content, { centered: true , backdrop : 'static', keyboard: false,size: 'sm'});
  }

  exportAsXLSX(): void {
    let data = this.dataList.map((e: any) => {
      return{
        Name: e.CustomerName,
        MobileNo1 : e.CustomerMob,
        InvoiceNo : e.InvoiceNo,
        PurchaseDate : e.PurchaseDate,
        PaymentStatus : e.PaymentStatus,
        TotalAmount : e.TotalAmount,
        ShopName : e.ShopName,
        AreaName : e.AreaName,
      }
    })
    this.excelService.exportAsExcelFile(data, 'fitter_Invocielist');
  }

}
