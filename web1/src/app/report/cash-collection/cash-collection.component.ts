import { Component, OnInit } from '@angular/core';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { Subscription } from 'rxjs';
import { ShopService } from 'src/app/service/shop.service';
import * as moment from 'moment';
import { NgxSpinnerService } from 'ngx-spinner';
import * as XLSX from 'xlsx';
import { SupportService } from 'src/app/service/support.service';
import { BillService } from 'src/app/service/bill.service';

@Component({
  selector: 'app-cash-collection',
  templateUrl: './cash-collection.component.html',
  styleUrls: ['./cash-collection.component.css']
})

export class CashCollectionComponent implements OnInit {
  shop:any =JSON.parse(localStorage.getItem('shop') || '') ;
  user:any =JSON.parse(localStorage.getItem('user') || '') ;
  permission = JSON.parse(localStorage.getItem('permission') || '[]');
  companySetting = JSON.parse(localStorage.getItem('companysetting') || '');
  selectedShop = JSON.parse(localStorage.getItem('selectedShop') || '');

  constructor(
    private ss: ShopService,
    public as: AlertService,
    public supps: SupportService,
    public sp: NgxSpinnerService,
    public billService: BillService,

  ) { }

  shopList:any;
  selectsShop :any;
  PaymentModesList:any =[];
  dataList:any =[];

  data: any =  { 
    FilterTypes:'CreatedOn', FromDate: moment().format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0,PaymentStatus:0,
    PaymentMode:0
  };

  paymentMode:any = []
  sumOfPaymentMode = 0
  AmountReturnByCredit = 0
  AmountReturnByDebit = 0
  totalAmount = 0
  oldPayment = 0
  newPayment = 0

  viewEyeTestReport = false
  editEyeTestReport = false
  addEyeTestReport = false
  deleteEyeTestReport = false

  ngOnInit(): void {
    this.permission.forEach((element: any) => {
      if (element.ModuleName === 'EyeTestReport') {
        this.viewEyeTestReport = element.View;
        this.editEyeTestReport = element.Edit;
        this.addEyeTestReport = element.Add;
        this.deleteEyeTestReport = element.Delete;
      }
    });

    if(this.user.UserGroup === 'Employee'){
      this.shopList  = this.shop;
      this.data.ShopID = this.shopList[0].ShopID
    }else{
      this.dropdownShoplist();
    }
    this.getPaymentModesList()
  }

  getPaymentModesList() {
    const subs: Subscription = this.supps.getList('PaymentModeType').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.PaymentModesList = res.data
        } else {
          this.as.errorToast(res.message)
        }
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  dropdownShoplist(){
    const subs: Subscription = this.ss.dropdownShoplist('').subscribe({
      next: (res: any) => {
        this.shopList  = res.data
        let shop = res.data
        this.selectsShop = shop.filter((s:any) => s.ID === Number(this.selectedShop[0]));
        this.selectsShop =  '/ ' + this.selectsShop[0].Name + ' (' + this.selectsShop[0].AreaName + ')'
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getCashReport(){
    this.sp.show()
    let Parem = '';
    this.paymentMode = [];
    this.sumOfPaymentMode = 0;
    this.AmountReturnByCredit = 0;
    this.AmountReturnByDebit = 0;
    this.totalAmount = 0;

    if (this.data.FromDate !== '' && this.data.FromDate !== null){
      let FromDate =  moment(this.data.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and DATE_FORMAT(paymentmaster.PaymentDate, "%Y-%m-%d") between ' +  `'${FromDate}'`;}

    if (this.data.ToDate !== '' && this.data.ToDate !== null){
      let ToDate =  moment(this.data.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' +  `'${ToDate}'`;}

     let dtm = {
      Date : Parem ,
      ShopID : this.data.ShopID ? this.data.ShopID : 0,
      PaymentMode : this.data.PaymentMode ? this.data.PaymentMode   : 0,
      PaymentStatus : this.data.PaymentStatus ? this.data.PaymentStatus : 0,
     }

    const subs: Subscription =  this.billService.cashcollectionreport(dtm).subscribe({
      next: (res: any) => {
        if(res.success){
          this.as.successToast(res.message)
          this.dataList = res.data
          this.paymentMode = res.paymentMode
          this.sumOfPaymentMode = res.sumOfPaymentMode
          this.AmountReturnByCredit = res.AmountReturnByCredit
          this.AmountReturnByDebit = res.AmountReturnByDebit
          this.totalAmount = res.totalAmount
          this.totalCalculation(this.dataList);
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }


  totalCalculation(data: any) {
    this.newPayment = 0;
    this.oldPayment = 0;
  
    for (var i = 0; i < data.length; i++) {
      const billDate = moment(data[i].BillDate).format('YYYY-MM-DD');
      const fromDate = moment(this.data.FromDate).format('YYYY-MM-DD');
      const toDate = moment(this.data.ToDate).format('YYYY-MM-DD');
  
      if (billDate !== 'Invalid date' && data[i].PaymentStatus !== null && new Date(billDate) >= new Date(fromDate) && new Date(billDate) <= new Date(toDate)) {
        this.newPayment += Number(data[i].Amount);
      } else {
        this.oldPayment += Number(data[i].Amount);
      }
    }
  }

  exportAsXLSX(): void {
    let element = document.getElementById('CaseConExcel');
    const ws: XLSX.WorkSheet =XLSX.utils.table_to_sheet(element);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, 'Cash_Colletion_Report.xlsx');
  }

  dateFormat(date:any){
    return moment(date).format(`${this.companySetting.DateFormat}`);
  }
}
