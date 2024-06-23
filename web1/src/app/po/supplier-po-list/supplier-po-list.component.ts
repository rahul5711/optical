
import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { AlertService } from 'src/app/service/helpers/alert.service';
import * as moment from 'moment';
import { BillService } from 'src/app/service/bill.service';
import { SupplierService } from 'src/app/service/supplier.service';
import { ShopService } from 'src/app/service/shop.service';
import { CalculationService } from 'src/app/service/helpers/calculation.service';
import { SupportService } from 'src/app/service/support.service';

@Component({
  selector: 'app-supplier-po-list',
  templateUrl: './supplier-po-list.component.html',
  styleUrls: ['./supplier-po-list.component.css']
})
export class SupplierPoListComponent implements OnInit {

  evn = environment
  company = JSON.parse(localStorage.getItem('company') || '');
  shop:any =JSON.parse(localStorage.getItem('shop') || '') ;
  user:any =JSON.parse(localStorage.getItem('user') || '') ;
  selectedShop = JSON.parse(localStorage.getItem('selectedShop') || '');
  companySetting = JSON.parse(localStorage.getItem('companysetting') || '');
  searchValue:any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    public as: AlertService,
    private sp: NgxSpinnerService,
    public bill: BillService,
    private ss: ShopService,
    private sup: SupplierService,
    public calculation: CalculationService,
    private supps: SupportService,
  ) { }

  data: any = {
    FromDate:'',ToDate:'', SupplierID: 0, ShopID: 0, 
  };
  supllierPDF:any = ''
  shopList: any = []
  supplierList: any = []

  currentPage = 1;
  itemsPerPage = 10;
  pageSize!: number;
  collectionSize = 0
  page = 4;

  dataList:any =[]

  ngOnInit(): void {
    if(this.user.UserGroup === 'Employee'){
      this.shopList  = this.shop;
      this.data.ShopID = this.shopList[0].ShopID
    }else{
      this.dropdownShoplist();
      this.getList();
    }
    this.dropdownSupplierlist();

  }

  dropdownShoplist() {
    const subs: Subscription = this.ss.dropdownShoplist('').subscribe({
      next: (res: any) => {
        this.shopList = res.data
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  dropdownSupplierlist() {
    const subs: Subscription = this.sup.dropdownSupplierlist('').subscribe({
      next: (res: any) => {
        this.supplierList = res.data.sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
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

    const subs: Subscription = this.bill.getSupplierPoPurchaseList(dtm).subscribe({
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
  }

  Search(){
    this.sp.show()

    let parem = ''
  
    if (this.data.FromDate !== '' && this.data.FromDate !== null){
      let FromDate =  moment(this.data.FromDate).format('YYYY-MM-DD')
      parem = parem + ' and DATE_FORMAT(billmaster.BillDate, "%Y-%m-%d") between ' +  `'${FromDate}'`;}

    if (this.data.ToDate !== '' && this.data.ToDate !== null){
      let ToDate =  moment(this.data.ToDate).format('YYYY-MM-DD')
      parem = parem + ' and ' +  `'${ToDate}'`;}

    if (this.data.ShopID != 0 && this.data.ShopID !== 'Main' && this.data.ShopID !== 'Other'){
      parem = parem + ' and barcodemasternew.ShopID = ' +  `(${this.data.ShopID})`;}
  
      if (this.data.ShopID === 'Main') {
        parem = parem + ' and barcodemasternew.ShopID = 242';
      }
  
      if (this.data.ShopID === 'Other') {
        parem = parem + ' and barcodemasternew.ShopID != 242' ;
      }

    if (this.data.SupplierID !== 0){
      parem = parem + ' and barcodemasternew.SupplierID = '  + `'${this.data.SupplierID}'`;}


      const dtm = {
        currentPage: 1,
        itemsPerPage: 5000,
        Parem: parem
      }
  
      const subs: Subscription = this.bill.getSupplierPoList(dtm).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.collectionSize = res.count;
            this.page = 1;
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
  }

  Reset(){
    this.data = {
      FromDate:'',ToDate:'', SupplierID: 0, ShopID: 0, 
    };
  }

  dateFormat(date:any){
    return moment(date).format(`${this.companySetting.DateFormat}`);
  }

  onChange(event: { toUpperCase: () => any; toTitleCase: () => any; }) {
    if (this.companySetting.DataFormat === '1') {
      event = event.toUpperCase()
    } else if (this.companySetting.DataFormat == '2') {
      event = event.toTitleCase()
    }
    return event;
  }

  AssignSupplierPDF(){
    this.sp.show();

        let body: any = { productList: this.dataList }
         const subs: Subscription = this.bill.AssignSupplierPDF(body).subscribe({
           next: (res: any) => {
             if (res) {
               const url = this.evn.apiUrl + "/uploads/" + res;
               this.supllierPDF = url
               window.open(url, "_blank");
             } else {
               this.as.errorToast(res.message)
             }
             this.sp.hide();
           },
           error: (err: any) => console.log(err.message),
           complete: () => subs.unsubscribe(),
         });
      }
  }


