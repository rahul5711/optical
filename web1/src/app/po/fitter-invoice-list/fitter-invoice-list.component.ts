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


@Component({
  selector: 'app-fitter-invoice-list',
  templateUrl: './fitter-invoice-list.component.html',
  styleUrls: ['./fitter-invoice-list.component.css']
})
export class FitterInvoiceListComponent implements OnInit {

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
      this.getFitterInvoiceListByID()
    }
    this.getGSTList()
  }

  getGSTList() {
    this.sp.show();
    const subs: Subscription = this.supps.getList('TaxType').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.gstList = res.data
          this.gst_detail = [];
          res.data.forEach((ele: any) => {
            if (ele.Name !== '') {
              let obj = { GSTType: '', Amount: 0 };
              obj.GSTType = ele.Name;
              this.gst_detail.push(obj);
            }
          })
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
    this.sp.hide();
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

    const subs: Subscription = this.fitters.getFitterInvoiceList(dtm).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.collectionSize = res.count;
          
          res.data.forEach((e: any) =>{
            e.SubTotal = ( e.TotalAmount - e.GSTAmount)
            e.TotalAmount = (e.SubTotal + e.GSTAmount)
           })

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

  getFitterInvoiceListByID() {
    this.sp.show();
    const subs: Subscription = this.fitters.getFitterInvoiceListByID(this.id).subscribe({
      next: (res: any) => {
        if (res.success) {
          res.data.forEach((e: any) =>{
            e.SubTotal = ( e.TotalAmount - e.GSTAmount)
            e.TotalAmount = (e.SubTotal + e.GSTAmount)
           })
          this.dataList = res.data;
          this.TotalAmountInv = (res.calculation[0].totalAmount).toFixed(2) ;
          this.TotalGSTAmount= (res.calculation[0].totalGstAmount).toFixed(2);
          this.gst_details = res.calculation[0].gst_details;
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

  calculateGrandTotal(v:any){
    v.GSTAmount = +v.SubTotal * + v.GSTPercentage / 100;
    v.TotalAmount = +v.SubTotal + v.GSTAmount
    v.DueAmount = v.TotalAmount
  }


  editInvoice() {
    this.UpdateProduct = !this.UpdateProduct
  }

gstCheck(v:any){
  if(v.GSTPercentage == 0 ){
     v.GSTType = 'None'
  }

  if(v.GSTPercentage != 0){
    if(v.GSTType == 'NONE' ||  v.GSTType == 'None'){
      Swal.fire({
        position: 'center',
        icon: 'warning',
        title: 'Opps !! <br> Please Select GSTType.',
        backdrop : false,
      })
    }
  }
}

  updateInvoice(v:any){

      this.calculateGrandTotal(v)
      this.UpdateProduct = false
      const subs: Subscription = this.fitters.updateFitterInvoiceNo(v).subscribe({
        next: (res: any) => {
          if (res.success) {
            
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
