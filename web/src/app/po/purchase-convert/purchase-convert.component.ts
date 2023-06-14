
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
  selector: 'app-purchase-convert',
  templateUrl: './purchase-convert.component.html',
  styleUrls: ['./purchase-convert.component.css']
})
export class PurchaseConvertComponent implements OnInit {
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

  data = { PurchaseMaster: null, PurchaseDetail: {} };

  PurchaseMaster: any = {
    ID: null, SupplierID: null, SupplierName: null, CompanyID: null, GSTNo: null, ShopID: 0, ShopName: null, PurchaseDate: null,
    PaymentStatus: null, InvoiceNo: null, Status: 1, CreatedBy: null, Quantity: 0, SubTotal: 0, DiscountAmount: 0,
    GSTAmount: 0, TotalAmount: 0,FromDate:'',ToDate:''
  };



  shopList: any = []
  supplierList: any = []
  gstList: any;
  currentPage = 1;
  itemsPerPage = 10;
  pageSize!: number;
  collectionSize = 0
  page = 4;
  dataList:any =[]
  gst_detail: any = [];
  filterList: any = [];


  ngOnInit(): void {
    this.PurchaseMaster.PurchaseDate = moment().format('YYYY-MM-DD');
    this.PurchaseMaster.FromDate = moment().format('YYYY-MM-DD');
    this.PurchaseMaster.ToDate = moment().format('YYYY-MM-DD');
    this.dropdownShoplist();
    this.dropdownSupplierlist();
    // this.getList();
    this.getGSTList();
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

  multicheck() {
    for (var i = 0; i < this.dataList.length; i++) {
      const index = this.dataList.findIndex(((x: any) => x === this.dataList[i]));
      if (this.dataList[index].sel == null || this.dataList[index].sel === 0) {
        this.dataList[index].sel = 1;
      } else {
        this.dataList[index].sel = 0;
      }
    }
    this.calculateGrandTotal()
  }

  validate(v:any, event: any) {
    if (v.sel === 0 || v.sel === null || v.sel === undefined) {
      v.sel = 1;
    } else {
      v.sel = 0;
    }
    this.calculateGrandTotal()
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

    const subs: Subscription = this.bill.getSupplierPoList(dtm).subscribe({
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

  getParem(){
    this.sp.show()

    let parem = ''
  

    if (this.PurchaseMaster.FromDate !== '' && this.PurchaseMaster.FromDate !== null){
      let FromDate =  moment(this.PurchaseMaster.FromDate).format('YYYY-MM-DD')
      parem = parem + ' and DATE_FORMAT(billmaster.BillDate, "%Y-%m-%d") between ' +  `'${FromDate}'`;}

    if (this.PurchaseMaster.ToDate !== '' && this.PurchaseMaster.ToDate !== null){
      let ToDate =  moment(this.PurchaseMaster.ToDate).format('YYYY-MM-DD')
      parem = parem + ' and ' +  `'${ToDate}'`;}

    if (this.PurchaseMaster.ShopID != 0){
      parem = parem + ' and barcodemasternew.ShopID = ' +  `'${this.PurchaseMaster.ShopID}'`;}
  
    if (this.PurchaseMaster.SupplierID !== 0){
      parem = parem + ' and barcodemasternew.SupplierID = '  + `'${this.PurchaseMaster.SupplierID}'`;}


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

  calculateFields(fieldName: any, mode: any, item:any) {
    this.calculation.calculateFields(fieldName, mode, item, '')
  }

  calculateGrandTotal() {
    let selectList: any = []
    this.dataList.forEach((el: any)=>{
       if(el.sel === 1){
        selectList.push(el)
       }
    })
    this.calculation.calculateGrandTotals(this.PurchaseMaster, selectList, '', this.gst_detail )
  }

  onSubmit() {
    this.filterList = this.dataList.filter((d: any) => d.sel === 1);
    if (this.filterList.length > 0) {
      
    }

    if (this.PurchaseMaster.InvoiceNo === null || this.PurchaseMaster.InvoiceNo === '') {
      Swal.fire({
        icon: 'error',
        title: 'Vendor Invoice No is required',
        text: ' Enter Vendor Invoice No ',
        footer: ''
      });
    }else{
      this.calculateGrandTotal();
      this.PurchaseMaster.ShopID = this.selectedShop[0];
      delete this.PurchaseMaster.FromDate
      delete this.PurchaseMaster.ToDate
      this.data.PurchaseMaster = this.PurchaseMaster;
      this.data.PurchaseDetail = this.filterList;
      console.log(this.data);
      
    }
  }
}
