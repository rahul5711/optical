import { Component, OnInit } from '@angular/core';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { ProductService } from 'src/app/service/product.service';
import { Subscription, fromEvent } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import { ShopService } from 'src/app/service/shop.service';
import * as moment from 'moment';
import * as XLSX from 'xlsx';
import { FormBuilder, FormGroup } from '@angular/forms';
import { environment } from 'src/environments/environment';
import { BillService } from 'src/app/service/bill.service';
import { SupportService } from 'src/app/service/support.service';

@Component({
  selector: 'app-insurance',
  templateUrl: './insurance.component.html',
  styleUrls: ['./insurance.component.css']
})
export class InsuranceComponent implements OnInit {

  env = environment;
  user: any = JSON.parse(localStorage.getItem('user') || '');
  shop: any = JSON.parse(localStorage.getItem('shop') || '');
  selectedShop: any = JSON.parse(localStorage.getItem('selectedShop') || '');
  permission = JSON.parse(localStorage.getItem('permission') || '[]');
  companySetting = JSON.parse(localStorage.getItem('companysetting') || '');
  searchValue: any = '';
  form: any | FormGroup;
  Productsearch: any = '';
  columnVisibility: any = {
    SNo: true,
    ProductName: true,
    Barcode: true,
    Quantity: true,
    FromShop: true,
    ToShop: true,
    InitiationDate: true,
    Status: true,
    InitiatedBy: true,
  };

  constructor(
    private ss: ShopService,
    private ps: ProductService,
    public as: AlertService,
    public sp: NgxSpinnerService,
    private bill: BillService,
    private fb: FormBuilder,
    private supps: SupportService,
  ) {
    this.form = this.fb.group({
      billerIds: []
    })
  }

  dataList: any
  shopList: any;
  selectsShop: any;
  selectedProduct: any;
  shopLists: any
  
  ApprovedAmount: any = 0;
  ClaimAmount: any = 0;
  PaidAmount: any = 0;
  RemainingAmount: any = 0;

  data: any = {
    FilterTypes: 'All', FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, CompanyName:0
  };

  nameList:any = []

  ngOnInit(): void {
    // this.dropdownShoplist()
    if (this.user.UserGroup === 'Employee') {
      this.shopList = this.shop;
      this.data.ShopID = this.shopList[0].ShopID
    } else {
      // this.dropdownShoplist()
      this.bill.shopList$.subscribe((list: any) => {
        this.shopList = list
        let shop = list
        this.shopLists = shop.filter((s: any) => s.ID === Number(this.selectedShop[0]));
        this.shopLists = '/ ' + this.shopLists[0].Name + ' (' + this.shopLists[0].AreaName + ')'
      });
    }
    this.getInsuranceCompanyNameList();
  }

  dropdownShoplist() {
    this.sp.show()
    const subs: Subscription = this.ss.dropdownShoplist('').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.shopList = res.data
          let shop = res.data
          this.shopLists = shop.filter((s: any) => s.ID === Number(this.selectedShop[0]));
          this.shopLists = '/ ' + this.shopLists[0].Name + ' (' + this.shopLists[0].AreaName + ')'
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }


  getInsuranceCompanyNameList() {
      const subs: Subscription = this.supps.getList('Insurance Company Name').subscribe({
        next: (res: any) => {
          if (res.success) {
            this.nameList = res.data
              
          } else {
            this.as.errorToast(res.message)
          }
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    }


  getInsuranceReport() {
    this.sp.show()
    let Parem = '';

    if (this.data.FromDate !== '' && this.data.FromDate !== null && this.data.FilterTypes === 'All') {

      let FromDate = moment(this.data.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and DATE_FORMAT(i.RequestDate, "%Y-%m-%d")  between ' + `'${FromDate}'`;
    }

    if (this.data.ToDate !== '' && this.data.ToDate !== null && this.data.FilterTypes === 'All') {
      let ToDate = moment(this.data.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'`;
    }

    // if (this.data.FromDate !== '' && this.data.FromDate !== null && this.data.FilterTypes === 'BillDate') {

    //   let FromDate = moment(this.data.FromDate).format('YYYY-MM-DD')
    //   Parem = Parem + ' and DATE_FORMAT(billmaster.BillDate, "%Y-%m-%d")  between ' + `'${FromDate}'`;
    // }

    // if (this.data.ToDate !== '' && this.data.ToDate !== null && this.data.FilterTypes === 'BillDate') {
    //   let ToDate = moment(this.data.ToDate).format('YYYY-MM-DD')
    //   Parem = Parem + ' and ' + `'${ToDate}'`;
    // }

    if (this.data.FromDate !== '' && this.data.FromDate !== null && this.data.FilterTypes === 'RequestDate') {
      let FromDate = moment(this.data.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and DATE_FORMAT(i.RequestDate, "%Y-%m-%d") between ' + `'${FromDate}'`;
    }

    if (this.data.ToDate !== '' && this.data.ToDate !== null && this.data.FilterTypes === 'RequestDate') {
      let ToDate = moment(this.data.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'`;
    }
    if (this.data.FromDate !== '' && this.data.FromDate !== null && this.data.FilterTypes === 'ApproveDate') {
      let FromDate = moment(this.data.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and DATE_FORMAT(i.ApproveDate, "%Y-%m-%d") between ' + `'${FromDate}'`;
    }

    if (this.data.ToDate !== '' && this.data.ToDate !== null && this.data.FilterTypes === 'ApproveDate') {
      let ToDate = moment(this.data.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'`;
    }

    if (this.data.ShopID != 0) {
      Parem = Parem + ' and insurance.ShopID IN ' + `(${this.data.ShopID})`;
    }

     if (this.data.CompanyName != 0) {
      Parem = Parem + ' and i.InsuranceCompanyName = ' + `'${this.data.CompanyName.trim()}'`;
    }
    
    const subs: Subscription = this.bill.getInsuranceReport(Parem).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.as.successToast(res.message)
          this.dataList = res.data;
            this.ApprovedAmount = res.calculation.ApprovedAmount;
            this.ClaimAmount = res.calculation.ClaimAmount;
            this.PaidAmount = res.calculation.PaidAmount;
            this.RemainingAmount = res.calculation.RemainingAmount;
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  FromReset() {
    if (this.user.UserGroup == 'CompanyAdmin') {
      this.data = {
        FilterTypes: 'All', FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0,
      };
    } else {
      this.data = {
        FilterTypes: 'All', FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: this.shopList[0].ShopID,
      };
    }
    this.dataList = []
  }

  dateFormat(date: any): string {
    if (date == null || date == "") {
      return '0000-00-00'; // Default Value
    }
    return moment(date).format(this.companySetting?.DateFormat || 'YYYY-MM-DD');
  }

}
