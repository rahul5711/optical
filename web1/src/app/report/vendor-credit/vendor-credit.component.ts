import { Component, OnInit } from '@angular/core';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { ProductService } from 'src/app/service/product.service';
import { Subscription ,fromEvent} from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import { PurchaseService } from 'src/app/service/purchase.service';
import { ShopService } from 'src/app/service/shop.service';
import * as moment from 'moment';
import * as XLSX from 'xlsx';
import { FormBuilder,FormGroup } from '@angular/forms';
import { SupplierService } from 'src/app/service/supplier.service';

@Component({
  selector: 'app-vendor-credit',
  templateUrl: './vendor-credit.component.html',
  styleUrls: ['./vendor-credit.component.css']
})
export class VendorCreditComponent implements OnInit {

  selectedShop:any =JSON.parse(localStorage.getItem('selectedShop') || '') ;
  permission = JSON.parse(localStorage.getItem('permission') || '[]');
  companySetting = JSON.parse(localStorage.getItem('companysetting') || '');
  form :any | FormGroup;

  constructor(
    private purchaseService: PurchaseService,
    private ss: ShopService,
    private ps: ProductService,
    public as: AlertService,
    public sp: NgxSpinnerService,
    private fb: FormBuilder,
    private sup: SupplierService,

  ) {
    this.form = this.fb.group({
      billerIds: []
    })
   }

  shopList :any;
  selectsShop :any;
  DetailtotalQty: any;
  supplierList :any = []
  dataList :any = []
  billerList :any = []
  
  data: any =  {
    FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, SupplierID : 0,
  };

  ngOnInit(): void {
    this.dropdownShoplist()
    this.dropdownSupplierlist()
  }

  dropdownShoplist(){
    this.sp.show()
    const subs: Subscription = this.ss.dropdownShoplist('').subscribe({
      next: (res: any) => {
        if(res.success){
          this.shopList  = res.data
          let shop = res.data
          this.selectsShop = shop.filter((s:any) => s.ID === Number(this.selectedShop[0]));
          this.selectsShop =  '/ ' + this.selectsShop[0].Name + ' (' + this.selectsShop[0].AreaName + ')'

          this.billerList = res.data.map((o: any) => {
            return {
              id: o.ID,
              text: `${o.Name}`,
              // text: `${o.blr_id}`,
            };
          });

        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
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

  exportAsXLSX(): void {
    let element = document.getElementById('SupplierCreditExcel');
    const ws: XLSX.WorkSheet =XLSX.utils.table_to_sheet(element);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, 'Supplier_Credit_Report.xlsx');
  }

  getCreditReport(){
    this.sp.show()
    let Parem = '';

    if (this.data.FromDate !== '' && this.data.FromDate !== null){
      let FromDate =  moment(this.data.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and DATE_FORMAT(vendorcredit.CreditDate, "%Y-%m-%d") between ' +  `'${FromDate}'`;}

    if (this.data.ToDate !== '' && this.data.ToDate !== null){
      let ToDate =  moment(this.data.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' +  `'${ToDate}'`;}

    if (this.data.ShopID != 0){
      Parem = Parem + ' and vendorcredit.ShopID IN ' +  `(${this.data.ShopID})`;}
  
    if (this.data.SupplierID != 0){
      Parem = Parem + ' and vendorcredit.SupplierID IN ' +  `(${this.data.SupplierID})`;}
  

    const subs: Subscription =  this.sup.vendorCreditReport(Parem).subscribe({
      next: (res: any) => {
        if(res.success){
          this.as.successToast(res.message)
          this.dataList = res.data
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  FromReset(){
    this.data =  { 
      FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, SupplierID : 0,
    };
    this.dataList = [];
  }

  dateFormat(date:any){
    return moment(date).format(`${this.companySetting.DateFormat}`);
  }
}
