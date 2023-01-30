import { Component, OnInit } from '@angular/core';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { ProductService } from 'src/app/service/product.service';
import { Subscription } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import { PurchaseService } from 'src/app/service/purchase.service';
import { ShopService } from 'src/app/service/shop.service';
import * as moment from 'moment';
import * as XLSX from 'xlsx';
import { SupplierService } from 'src/app/service/supplier.service';

@Component({
  selector: 'app-product-summary-report',
  templateUrl: './product-summary-report.component.html',
  styleUrls: ['./product-summary-report.component.css']
})
export class ProductSummaryReportComponent implements OnInit {

  constructor(
    private purchaseService: PurchaseService,
    private sup: SupplierService,
    private ss: ShopService,
    public as: AlertService,
  ) { }

  shopList :any;
  supplierList :any;


  data: any =  {
    FromDate: moment().startOf('month').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'),SupplierID:0, ShopID: 0, 
  };


  ngOnInit(): void {
    this.dropdownShoplist();
    this.dropdownSupplierlist();
  }

  dropdownSupplierlist(){
    const subs: Subscription = this.sup.dropdownSupplierlist('').subscribe({
      next: (res: any) => {
        this.supplierList  = res.data
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
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

  exportAsXLSX(): void {
    let element = document.getElementById('ProductSummaryExcel');
    const ws: XLSX.WorkSheet =XLSX.utils.table_to_sheet(element);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, 'Product_Summary_Report.xlsx');
  }

}
