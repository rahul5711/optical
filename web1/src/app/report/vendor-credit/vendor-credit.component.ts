import { Component, OnInit } from '@angular/core';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { ProductService } from 'src/app/service/product.service';
import { Subscription ,fromEvent} from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import { PurchaseService } from 'src/app/service/purchase.service';
import { ShopService } from 'src/app/service/shop.service';
import * as moment from 'moment';
import * as XLSX from 'xlsx';
import { FormBuilder,FormControl,FormGroup } from '@angular/forms';
import { SupplierService } from 'src/app/service/supplier.service';
import { SupportService } from 'src/app/service/support.service';

@Component({
  selector: 'app-vendor-credit',
  templateUrl: './vendor-credit.component.html',
  styleUrls: ['./vendor-credit.component.css']
})
export class VendorCreditComponent implements OnInit {
  shop:any =JSON.parse(localStorage.getItem('shop') || '') ;
  user:any =JSON.parse(localStorage.getItem('user') || '') ;
  selectedShop:any =JSON.parse(localStorage.getItem('selectedShop') || '') ;
  permission = JSON.parse(localStorage.getItem('permission') || '[]');
  companySetting = JSON.parse(localStorage.getItem('companysetting') || '');
  form :any | FormGroup;

  myControl = new FormControl('All');
  filteredOptions: any ;
  
  constructor(
    private purchaseService: PurchaseService,
    private ss: ShopService,
    private ps: ProductService,
    public as: AlertService,
    public sp: NgxSpinnerService,
    private fb: FormBuilder,
    private sup: SupplierService,
    private supps: SupportService,


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
    FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, SupplierID : 0,VendorStatus:0,
  };

  totalAmount: any;
  totalBalance: any;
  totalPaidAmount: any;
  
  searchby = true;

  ngOnInit(): void {
    this.dropdownShoplist()
    if(this.user.UserGroup === 'Employee'){
      this.shopList  = this.shop;
      this.data.ShopID = this.shopList[0].ShopID
    }else{
      this.dropdownShoplist()
    }
    // this.dropdownSupplierlist()
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

    if (this.data.VendorStatus != 0){
      Parem = Parem + ' and ' +  `(${this.data.VendorStatus})`;}
  
console.log(Parem);

    const subs: Subscription =  this.sup.vendorCreditReport(Parem).subscribe({
      next: (res: any) => {
        if(res.success){
          this.searchby = false
          this.as.successToast(res.message)
          this.dataList = res.data
          this.totalAmount = res.calculation[0].totalAmount;
          this.totalBalance = res.calculation[0].totalBalance;
          this.totalPaidAmount = res.calculation[0].totalPaidAmount;
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

  customerSearch(searchKey: any, mode: any, type:any) {
    this.filteredOptions = [];

    let supplierID = 0;

    if (type === 'Supplier') {
        switch(mode) {
            case 'data':
                supplierID = this.data.SupplierID;
                break;
            default:
                break;
        }
    }

    let dtm = {
        Type: 'Supplier',
        Name: supplierID.toString()
    };

    if (searchKey.length >= 2 && mode === 'Name') {
        dtm.Name = searchKey;
    }

    const subs: Subscription = this.supps.dropdownlistBySearch(dtm).subscribe({
        next: (res: any) => {
            if(res.success){
                this.filteredOptions = res.data;
            } else {
                this.as.errorToast(res.message);
            }
            this.sp.hide();
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
    });
}

CustomerSelection(mode: any, ID: any) {
    switch(mode) {
        case 'data':
            this.data.SupplierID = ID;
            break;
        case 'All':
            this.filteredOptions = [];
            this.data.SupplierID = 0;
            break;
        default:
            break;
    }
}

showFitter(){
  this.searchby = true
 }
}
