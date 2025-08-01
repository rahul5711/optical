import { Component, OnInit } from '@angular/core';
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
import { ShopService } from 'src/app/service/shop.service';
import { CalculationService } from 'src/app/service/helpers/calculation.service';
import { SupportService } from 'src/app/service/support.service';
import { FitterService } from 'src/app/service/fitter.service';

@Component({
  selector: 'app-fitter-invoice',
  templateUrl: './fitter-invoice.component.html',
  styleUrls: ['./fitter-invoice.component.css']
})
export class FitterInvoiceComponent implements OnInit {
  evn = environment
  shop:any =JSON.parse(localStorage.getItem('shop') || '');
  user:any =JSON.parse(localStorage.getItem('user') || '');
  selectedShop = JSON.parse(localStorage.getItem('selectedShop') || '');
  company = JSON.parse(localStorage.getItem('company') || '');
  companySetting:any = JSON.parse(localStorage.getItem('companysetting') || '[]');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    public as: AlertService,
    private sp: NgxSpinnerService,
    public bill: BillService,
    private ss: ShopService,
    private fitters: FitterService,
    public calculation: CalculationService,
    private supps: SupportService,
  ) { }

  FitterMaster: any = {
    ID: null, FitterID: null,  CompanyID: this.company.ID,  ShopID: 'All',  PaymentStatus: 'Unpaid', InvoiceNo: null, GSTNo: null,
    Quantity: 0, SubTotal: 0,  TotalAmount: 0, GSTPercentage: 0, GSTAmount: 0, GSTType: 'None', Status: 1, CreatedBy: null, PurchaseDate: null, DueAmount:0
  };

  data = { FitterMaster: null, FitterDetail: {} };

  fitterList:any = []
  shopList:any = []
  gstList:any = []
  dataList:any = []
  currentTime = '';

  ngOnInit(): void {
    if(this.user.UserGroup === 'Employee'){
      this.shopList  = this.shop;
    }else{
      // this.dropdownShoplist();
         this.bill.shopList$.subscribe((list:any) => {
       this.shopList = list
    });
    }
    this.dropdownfitterlist()
    this.bill.taxLists$.subscribe((list:any) => {
      this.gstList = list
    });
    // this.getGSTList()
    // this.FitterMaster.PurchaseDate = moment().format('YYYY-MM-DD');
     this.currentTime = new Date().toLocaleTimeString('en-US', { hourCycle: 'h23'})
  }

  dropdownfitterlist() {
    const subs: Subscription = this.fitters.dropdownlist().subscribe({
      next: (res: any) => {
        this.fitterList = res.data.sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
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

  getGSTList() {
    this.sp.show();
    const subs: Subscription = this.supps.getList('TaxType').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.gstList = res.data
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  multicheck() {
    for (var i = 0; i < this.dataList.length; i++) {
      const index = this.dataList.findIndex(((x: any) => x === this.dataList[i]));
      if (this.dataList[index].Sel == null || this.dataList[index].Sel === 0 || this.dataList[index].Sel === undefined) {
         this.dataList[index].Sel = 1;
         this.calculateGrandTotal()
      } else {
         this.dataList[index].Sel = 0;
         this.calculateGrandTotal()
      }
    }
  }

  validate(v:any, event: any) {
    if (v.Sel === 0 || v.Sel === null || v.Sel === undefined) {
      v.Sel = 1;
    } else {
      v.Sel = 0;
    }
    this.calculateGrandTotal()
  }

  calculateGrandTotal(){

    let selectList: any = []
    this.dataList.forEach((el: any)=>{
       if(el.Sel === 1){
        selectList.push(el)
       }
    })

    this.FitterMaster.Quantity = 0;
    this.FitterMaster.GSTAmount = 0;
    this.FitterMaster.SubTotal = 0;
    this.FitterMaster.TotalAmount = 0;
   
    selectList.forEach((element: any) => {
      this.FitterMaster.Quantity = Number(+this.FitterMaster.Quantity + +element.Quantity);
      this.FitterMaster.SubTotal = Number(+this.FitterMaster.SubTotal + +element.SubTotal);   
    })
    this.FitterMaster.GSTAmount = Number((+this.FitterMaster.SubTotal) * +this.FitterMaster.GSTPercentage / 100);
    this.FitterMaster.TotalAmount = Number(+this.FitterMaster.SubTotal +  this.FitterMaster.GSTAmount)
    this.FitterMaster.GSTPercentage  = Number(this.FitterMaster.GSTPercentage)
    this.FitterMaster.DueAmount = this.FitterMaster.TotalAmount;
  }

  getParem(){
    this.sp.show()
    let parem = ''
    if (this.FitterMaster.ShopID != 0){
      parem = parem + ' and barcodemasternew.ShopID = ' +  `'${this.FitterMaster.ShopID}'`;}

    if (this.FitterMaster.FitterID !== 0){
      parem = parem + ' and barcodemasternew.FitterID = '  + `'${this.FitterMaster.FitterID}'`;}

    const dtm = {
      Parem: parem
    }

    const subs: Subscription = this.fitters.getFitterInvoice(dtm).subscribe({
        next: (res: any) => {
          if (res.success) {
            res.data.forEach((e: any) =>{
             e.UnitPrice = (e.FitterCost)
             e.SubTotal = (e.UnitPrice * e.Quantity)
             e.TotalAmount = (e.SubTotal)
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
  }

  onSubmit(){
    this.sp.show()
    this.calculateGrandTotal();
    this.FitterMaster.ShopID = Number(this.selectedShop[0]);
    this.FitterMaster.FitterID = Number(this.FitterMaster.FitterID);
    this.FitterMaster.PurchaseDate =  moment(this.FitterMaster.PurchaseDate).format('YYYY-MM-DD') +  ' ' + this.currentTime;
    this.data.FitterMaster = this.FitterMaster;

    let FitterDetails: any = []
    this.dataList.forEach((el: any) =>{
      if(el.Sel === 1){
        FitterDetails.push(el)
       }
    })

    this.data.FitterDetail = JSON.stringify(FitterDetails);
    
    const subs: Subscription = this.fitters.saveFitterInvoice(this.data).subscribe({
      next: (res: any) => {
        if (res.success) {
          // this.router.navigate(['/po/fitterInvoiceList', res.data])
          this.router.navigate(['/po/fitterInvoiceList', res.data])
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  dateFormat(date: any): string {
    if (date == null || date == "") {
      return '0000-00-00'; // Default Value
    }
    return moment(date).format(this.companySetting?.DateFormat || 'YYYY-MM-DD');
  }
}
