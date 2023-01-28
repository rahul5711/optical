import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { Subscription } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import { PurchaseService } from 'src/app/service/purchase.service';
import { ShopService } from 'src/app/service/shop.service';
import * as moment from 'moment';
import * as XLSX from 'xlsx';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-service-report',
  templateUrl: './service-report.component.html',
  styleUrls: ['./service-report.component.css']
})

export class ServiceReportComponent implements OnInit {

  constructor(
    private purchaseService: PurchaseService,
    private ss: ShopService,
    public as: AlertService,
    private modalService: NgbModal,
  ) { }

  shopList :any;
  PurchaseChargeList :any;
  DetailAmount:any
  DetailtotalAmount: any;
  DetailtotalGstAmount: any;
  gstdetails:any

  charge: any =  { 
    FromDate: moment().startOf('month').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0
  };

  ngOnInit(): void {
    this.dropdownShoplist();
  }

  dropdownShoplist(){
    const subs: Subscription = this.ss.dropdownShoplist('').subscribe({
      next: (res: any) => {
        this.shopList  = res.data
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  purchaseCharge(){
    let Parem = '';

    if (this.charge.FromDate !== '' && this.charge.FromDate !== null){
      let FromDate =  moment(this.charge.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and purchasemasternew.PurchaseDate between ' +  `'${FromDate}'`; }

    if (this.charge.ToDate !== '' && this.charge.ToDate !== null){
      let ToDate =  moment(this.charge.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' +  `'${ToDate}'`; }

    if (this.charge.ShopID != 0){
      Parem = Parem + ' and purchasemasternew.ShopID IN ' +  `(${this.charge.ShopID})`;}

    const subs: Subscription =  this.purchaseService.getPurchaseChargeReport(Parem).subscribe({
      next: (res: any) => {
        if(res.message){
          this.as.successToast(res.message)
          this.PurchaseChargeList = res.data
          this.DetailAmount = res.calculation[0].totalAmount.toFixed(2);
          this.DetailtotalGstAmount = res.calculation[0].totalGstAmount.toFixed(2);
          this.gstdetails = res.calculation[0].gst_details
        }
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  exportAsXLSXDetail(): void {
    let element = document.getElementById('purchaseChargeExcel');
    const ws: XLSX.WorkSheet =XLSX.utils.table_to_sheet(element);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, 'PurchaseCharge_Report.xlsx');
  }

  PDFdetail(){

  }

  openModal(content: any) {
    this.modalService.open(content, { centered: true , backdrop : 'static', keyboard: false,size: 'sm'});
  }

}
