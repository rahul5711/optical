
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
  selectedShop = JSON.parse(localStorage.getItem('selectedShop') || '');

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

  shopList: any = []
  supplierList: any = []

  currentPage = 1;
  itemsPerPage = 10;
  pageSize!: number;
  collectionSize = 0
  page = 4;

  dataList:any =[]

  ngOnInit(): void {
    this.dropdownShoplist();
    this.dropdownSupplierlist();
    this.getList();
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
        this.supplierList = res.data
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
    this.sp.hide()
  }

  Search(){
    this.sp.show()

    let parem = ''
  
    if (this.data.FromDate !== '' && this.data.FromDate !== null){
      let FromDate =  moment(this.data.FromDate).format('YYYY-MM-DD')
      parem = parem + ' and DATE_FORMAT(barcodemasternew.CreatedOn, "%Y-%m-%d") between ' +  `'${FromDate}'`;}

    if (this.data.ToDate !== '' && this.data.ToDate !== null){
      let ToDate =  moment(this.data.ToDate).format('YYYY-MM-DD')
      parem = parem + ' and ' +  `'${ToDate}'`;}

    if (this.data.ShopID != 0){
      parem = parem + ' and barcodemasternew.ShopID = ' +  `(${this.data.ShopID})`;}
  
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
      this.sp.hide()
  }

  Reset(){
    this.data = {
      FromDate:'',ToDate:'', SupplierID: 0, ShopID: 0, 
    };
  }

}
