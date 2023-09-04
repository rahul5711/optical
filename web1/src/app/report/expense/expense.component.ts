import { Component, OnInit } from '@angular/core';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { Subscription } from 'rxjs';
import { ShopService } from 'src/app/service/shop.service';
import * as moment from 'moment';
import { NgxSpinnerService } from 'ngx-spinner';
import * as XLSX from 'xlsx';
import { SupportService } from 'src/app/service/support.service';

@Component({
  selector: 'app-expense',
  templateUrl: './expense.component.html',
  styleUrls: ['./expense.component.css']
})
export class ExpenseComponent implements OnInit {

  permission = JSON.parse(localStorage.getItem('permission') || '[]');

  constructor(
    private ss: ShopService,
    public as: AlertService,
    public supps: SupportService,
    public sp: NgxSpinnerService,
  ) { }

  shopList:any = [];
  PaymentModesList:any = [];

  data: any =  { 
     FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, PaymentMode: 'All', CashType: 'All'
  };

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
    this.dropdownShoplist();
    this.getPaymentModesList();
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

  searchData(){
    // this.sp.show()
    let Parem = '';

    if (this.data.FromDate !== '' && this.data.FromDate !== null){
      let FromDate =  moment(this.data.FromDate).format('YYYY-MM-DD')
      Parem = Parem + '  and expense.ExpenseDate between  ' +  `'${FromDate}'`;}

    if (this.data.ToDate !== '' && this.data.ToDate !== null){
      let ToDate =  moment(this.data.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' +  `'${ToDate}'`;}

    if (this.data.ShopID != 0){
      Parem = Parem + ' and expense.ShopID IN ' +  `(${this.data.ShopID})`;
    }

    if (this.data.PaymentMode !== 'All') {
      Parem = Parem + ' and Expense.PaymentMode = ' + `'${this.data.PaymentMode}'`
    }

    if (this.data.PaymentMode !== 'All') {
      Parem = Parem + ' and Expense.PaymentMode = ' + `'${this.data.PaymentMode}'`
    }

    if (this.data.CashType !== 'All' && this.data.CashType !== null) {
      Parem = Parem + ' and Expense.CashType = ' + `'${this.data.CashType}'`
    }
    console.log(Parem,'=========Parem===============');
    
  }

}
