import { Component, OnInit } from '@angular/core';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { Subscription } from 'rxjs';
import { ShopService } from 'src/app/service/shop.service';
import * as moment from 'moment';
import { NgxSpinnerService } from 'ngx-spinner';
import * as XLSX from 'xlsx';
import { SupportService } from 'src/app/service/support.service';
import { ExpenseService } from 'src/app/service/expense.service';

@Component({
  selector: 'app-expense',
  templateUrl: './expense.component.html',
  styleUrls: ['./expense.component.css']
})
export class ExpenseComponent implements OnInit {

  permission = JSON.parse(localStorage.getItem('permission') || '[]');
  companySetting = JSON.parse(localStorage.getItem('companysetting') || '');
  selectedShop:any =JSON.parse(localStorage.getItem('selectedShop') || '') ;


  constructor(
    private ss: ShopService,
    public as: AlertService,
    public supps: SupportService,
    public sp: NgxSpinnerService,
    public expen: ExpenseService,
  ) { }

  shopList:any = [];
  PaymentModesList:any = [];
  ExpenseList:any = [];
  shopLists:any =[]


  data: any =  { 
     FromDate: moment().format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, PaymentMode: 'All', CashType: 'All'
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
        let shop = res.data
        this.shopLists = shop.filter((s:any) => s.ID === Number(this.selectedShop[0]));
        this.shopLists =  '/ ' + this.shopLists[0].Name + ' (' + this.shopLists[0].AreaName + ')'
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
    this.sp.show()
    let Parem = '';

    if (this.data.FromDate !== '' && this.data.FromDate !== null){
      let FromDate =  moment(this.data.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and DATE_FORMAT(expense.ExpenseDate, "%Y-%m-%d") between ' +  `'${FromDate}'`;}

    if (this.data.ToDate !== '' && this.data.ToDate !== null){
      let ToDate =  moment(this.data.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' +  `'${ToDate}'`;}

    if (this.data.ShopID != 0){
      Parem = Parem + ' and expense.ShopID IN ' +  `(${this.data.ShopID})`;
    }

    if (this.data.PaymentMode !== 'All') {
      Parem = Parem + ' and Expense.PaymentMode = ' + `'${this.data.PaymentMode}'`
    }

    if (this.data.CashType !== 'All') {
      Parem = Parem + ' and Expense.CashType = ' + `'${this.data.CashType}'`
    }

    const subs: Subscription =  this.expen.getExpenseReport(Parem).subscribe({
      next: (res: any) => {
        if(res.success){
          this.as.successToast(res.message)
          this.ExpenseList = res.data
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  exportAsXLSX(): void {
    let element = document.getElementById('ExpenseExcel');
    const ws: XLSX.WorkSheet =XLSX.utils.table_to_sheet(element);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, 'Expense_Report.xlsx');
  }

  dateFormat(date:any){
    return moment(date).format(`${this.companySetting.DateFormat}`);
  }
}
