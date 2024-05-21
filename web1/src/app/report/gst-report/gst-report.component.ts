import { Component, OnInit } from '@angular/core';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { ProductService } from 'src/app/service/product.service';
import { Subscription, fromEvent } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import { PurchaseService } from 'src/app/service/purchase.service';
import { ShopService } from 'src/app/service/shop.service';
import * as moment from 'moment';
import * as XLSX from 'xlsx';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { SupplierService } from 'src/app/service/supplier.service';
import { SupportService } from 'src/app/service/support.service';
import { environment } from 'src/environments/environment';
import { BillService } from 'src/app/service/bill.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-gst-report',
  templateUrl: './gst-report.component.html',
  styleUrls: ['./gst-report.component.css']
})
export class GstReportComponent implements OnInit {
  shop: any = JSON.parse(localStorage.getItem('shop') || '');
  user: any = JSON.parse(localStorage.getItem('user') || '');
  selectedShop: any = JSON.parse(localStorage.getItem('selectedShop') || '');
  permission = JSON.parse(localStorage.getItem('permission') || '[]');
  companySetting = JSON.parse(localStorage.getItem('companysetting') || '');
  form: any | FormGroup;
  env = environment;

  constructor(
    private purchaseService: PurchaseService,
    private ss: ShopService,
    private ps: ProductService,
    public as: AlertService,
    public sp: NgxSpinnerService,
    private fb: FormBuilder,
    private sup: SupplierService,
    private supps: SupportService,
    private bill: BillService,
    private modalService: NgbModal,

  ) { }

  data: any = {
    FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), GSTStatus: '', 
  };

  GstData:any ={
    Sel: 1, ID: null, IsGstFiled: 0
  }
  
  Productsearch:any='';
  dataList:any = []
  totalQty:any = 0;
  totalGstAmount:any = 0;
  totalAmount:any = 0;
  totalDiscount:any = 0;
  totalUnitPrice:any = 0;
  totalPurchasePrice:any = 0;
  totalProfit:any = 0;
  gst_details:any = [];

  multiCheck: any 
  PendingCheck = false;
  ngOnInit(): void {
  }

  PendingChecks(){
   if(this.data.GSTStatus === 'GST-Pending'){
     this.PendingCheck = true;
   }else{
    this.PendingCheck = false;
   }
  }

  getGstReport() {
    this.sp.show()
    let Parem = '';

    if (this.data.GSTStatus != '') {
       if(this.data.GSTStatus === 'GST-Pending'){
         Parem = Parem + ' and billdetail.IsGstFiled = 0 and billdetail.Status = 1' ;

       }
       if(this.data.GSTStatus === 'GST-Filed'){
         Parem = Parem + ' and billdetail.IsGstFiled = 1 and billdetail.Status = 1' ;
       }
       if(this.data.GSTStatus === 'Cancel Product'){
         Parem = Parem + ' and billdetail.IsGstFiled = 1 and billdetail.Status = 0' ;
       }
    }

    if (this.data.FromDate !== '' && this.data.FromDate !== null) {
      let FromDate = moment(this.data.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and DATE_FORMAT(billmaster.BillDate, "%Y-%m-%d") between ' + `'${FromDate}'`;
    }

    if (this.data.ToDate !== '' && this.data.ToDate !== null) {
      let ToDate = moment(this.data.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'`;
    }

    const subs: Subscription = this.bill.getGstReport(Parem,this.Productsearch).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.as.successToast(res.message)
          this.dataList = res.data
          this.totalQty = res.calculation[0].totalQty;
          this.totalGstAmount = res.calculation[0].totalGstAmount;
          this.totalAmount = res.calculation[0].totalAmount;
          this.totalDiscount = res.calculation[0].totalDiscount;
          this.totalUnitPrice = res.calculation[0].totalUnitPrice;
          this.totalPurchasePrice = res.calculation[0].totalPurchasePrice;
          this.totalProfit = res.calculation[0].totalProfit;
          this.gst_details = res.calculation[0].gst_details;
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  openModal(content1: any) {
    this.modalService.open(content1, { centered: true, backdrop: 'static', keyboard: false, size: 'sm' });
  }

  multicheck($event:any) {
    for (var i = 0; i < this.dataList.length; i++) {
      const index = this.dataList.findIndex(((x: any) => x === this.dataList[i]));
      if (this.dataList[index].Sel === 0 || this.dataList[index].Sel === null || this.dataList[index].Sel === undefined) {
        this.dataList[index].Sel = 1;
      } else {
        this.dataList[index].Sel = 0;
      }
    }
    console.log($event);
  }

  validate(v:any,event:any) {
    if (v.Sel === 0 || v.Sel === null || v.Sel === undefined) {
      v.Sel = 1;
    } else {
      v.Sel = 0;
    }
  }

  // submitGstFile(){
  //   this.GstData = this.dataList
  //   .map((e: any) => {
  //     return {
  //       Sel: `${e.Sel}`,
  //       ID: e.ID,
  //       IsGstFiled: e.IsGstFiled,
  //     };
  //   })
  //   .filter((d: { Sel: any; }) => d.Sel === 1);
    
  //   const subs: Subscription = this.bill.submitGstFile(this.GstData).subscribe({
  //     next: (res: any) => {
  //       if (res.success) {
  //         this.as.successToast(res.message)
  //         this.dataList = res.data
  //       } else {
  //         this.as.errorToast(res.message)
  //       }
  //       this.sp.hide()
  //     },
  //     error: (err: any) => console.log(err.message),
  //     complete: () => subs.unsubscribe(),
  //   });
  // }

  submitGstFile() {
    this.sp.show();
    this.GstData = this.dataList
      .map((e: any) => {
        return {
          Sel: e.Sel,
          ID: e.ID,
          IsGstFiled: e.IsGstFiled,
        };
      })
      .filter((d: { Sel: Number }) => Number(d.Sel) === 1);  // Ensure comparison as a number
      
    const subs: Subscription = this.bill.submitGstFile(this.GstData).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.as.successToast(res.message);
          this.data = {
            FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), GSTStatus: '', 
          };
        
          this.GstData = {
            Sel: 1, ID: null, IsGstFiled: 0
          }
          this.dataList = [];
          this.PendingCheck = false;
          this.totalQty = 0;
          this.totalGstAmount = 0;
          this.totalAmount = 0;
          this.totalDiscount = 0;
          this.totalUnitPrice = 0;
          this.totalPurchasePrice = 0;
          this.totalProfit = 0;
          this.gst_details = [];
        } else {
          this.as.errorToast(res.message);
        }
        this.sp.hide();
      },
      error: (err: any) => {
        console.log(err.message);
        this.sp.hide();  // Ensure spinner is hidden on error as well
      },
      complete: () => subs.unsubscribe(),
    });
  }

  FromReset() {
    this.data = {
      FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), GSTStatus: '', 
    };
  
    this.GstData = {
      Sel: 1, ID: null, IsGstFiled: 0
    }
    this.dataList = []
    this.PendingCheck = false;
    this.totalQty = 0;
    this.totalGstAmount = 0;
    this.totalAmount = 0;
    this.totalDiscount = 0;
    this.totalUnitPrice = 0;
    this.totalPurchasePrice = 0;
    this.totalProfit = 0;
    this.gst_details = [];
  }

  exportAsXLSX(): void {
    let element = document.getElementById('GSTExcel');
    const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(element);
    delete ws['A2'];
    // Initialize column widths array
    const colWidths: number[] = [];

    // Iterate over all cells to determine maximum width for each column
    XLSX.utils.sheet_to_json(ws, { header: 1 }).forEach((row: any = []) => {
      row.forEach((cell: any, index: number) => {
        const cellValue = cell ? String(cell) : '';
        colWidths[index] = Math.max(colWidths[index] || 0, cellValue.length);
      });
    });

    // Set column widths in the worksheet
    ws['!cols'] = colWidths.map((width: number) => ({ wch: width + 2 }));

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, 'GST_Report.xlsx');
  }

  dateFormat(date: any) {
    return moment(date).format(`${this.companySetting.DateFormat}`);
  }
}
