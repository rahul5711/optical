import { Component, OnInit } from '@angular/core';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { Subscription } from 'rxjs';
import { ShopService } from 'src/app/service/shop.service';
import * as moment from 'moment';
import { NgxSpinnerService } from 'ngx-spinner';
import * as XLSX from 'xlsx';
import { SupportService } from 'src/app/service/support.service';
import { ExpenseService } from 'src/app/service/expense.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-expense',
  templateUrl: './expense.component.html',
  styleUrls: ['./expense.component.css']
})
export class ExpenseComponent implements OnInit {
  env = environment;
  shop: any = JSON.parse(localStorage.getItem('shop') || '');
  user: any = JSON.parse(localStorage.getItem('user') || '');
  permission = JSON.parse(localStorage.getItem('permission') || '[]');
  companySetting = JSON.parse(localStorage.getItem('companysetting') || '');
  selectedShop: any = JSON.parse(localStorage.getItem('selectedShop') || '');
  columnVisibility: any = {
    SNo: true,
    ExpenseDate: true,
    InvoiceNo: true,
    ExpenseType: true,
    GivenTo: true,
    PaymentMode: true,
    CashType: true,
    Amount: true,
    ShopName: true,
  };

  constructor(
    private ss: ShopService,
    public as: AlertService,
    public supps: SupportService,
    public sp: NgxSpinnerService,
    public expen: ExpenseService,
  ) { }

  shopList: any = [];
  PaymentModesList: any = [];
  ExpenseTypeList: any = [];
  ExpenseList: any = [];
  shopLists: any = []


  data: any = {
    FromDate: moment().format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, PaymentMode: 'All',ExpenseType:'All', CashType: 'All'
  };

  viewExpenesReport = false
  editExpenesReport = false
  addExpenesReport = false
  deleteExpenesReport = false

  totalAmt = 0

  ngOnInit(): void {
    this.permission.forEach((element: any) => {
      if (element.ModuleName === 'ExpenesReport') {
        this.viewExpenesReport = element.View;
        this.editExpenesReport = element.Edit;
        this.addExpenesReport = element.Add;
        this.deleteExpenesReport = element.Delete;
      }
    });

    if (this.user.UserGroup === 'Employee') {
      this.shopList = this.shop;
      this.data.ShopID = this.shopList[0].ShopID
    } else {
      this.dropdownShoplist();
    }

    this.getPaymentModesList();
    this.getExpenseTypeList();
    this.searchData()
  }

  dropdownShoplist() {
    const subs: Subscription = this.ss.dropdownShoplist('').subscribe({
      next: (res: any) => {
        this.shopList = res.data
        let shop = res.data
        this.shopLists = shop.filter((s: any) => s.ID === Number(this.selectedShop[0]));
        this.shopLists = '/ ' + this.shopLists[0].Name + ' (' + this.shopLists[0].AreaName + ')'
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

  getExpenseTypeList() {
    const subs: Subscription = this.supps.getList('ExpenseType').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.ExpenseTypeList = res.data.sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  searchData() {
    this.sp.show()
    let Parem = '';
    this.totalAmt = 0
    if (this.data.FromDate !== '' && this.data.FromDate !== null) {
      let FromDate = moment(this.data.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and DATE_FORMAT(expense.ExpenseDate, "%Y-%m-%d") between ' + `'${FromDate}'`;
    }

    if (this.data.ToDate !== '' && this.data.ToDate !== null) {
      let ToDate = moment(this.data.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'`;
    }

    if (this.data.ShopID != 0) {
      Parem = Parem + ' and expense.ShopID IN ' + `(${this.data.ShopID})`;
    }

    if (this.data.PaymentMode !== 'All') {
      Parem = Parem + ' and Expense.PaymentMode = ' + `'${this.data.PaymentMode}'`
    }
    
    if (this.data.ExpenseType !== 'All') {
      Parem = Parem + ' and Expense.Category = ' + `'${this.data.ExpenseType}'`
    }

    if (this.data.CashType !== 'All') {
      Parem = Parem + ' and Expense.CashType = ' + `'${this.data.CashType}'`
    }

    const subs: Subscription = this.expen.getExpenseReport(Parem).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.as.successToast(res.message)
          this.ExpenseList = res.data;
          this.totalAmt = this.ExpenseList.reduce((sum: any, e: { Amount: any; }) => sum + e.Amount, 0);
        } else {
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
    const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(element);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, 'Expense_Report.xlsx');
  }

  dateFormat(date: any) {
    return moment(date).format(`${this.companySetting.DateFormat}`);
  }

  FromReset() {
    this.data = {
      FromDate: moment().format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, PaymentMode: 'All', CashType: 'All'
    };
    this.ExpenseList = [];
  }

  print() {
    let shop = this.shopList
    this.shopLists = shop.filter((s: any) => s.ID === Number(this.selectedShop[0]));

    let printContent: any = document.getElementById('print-content');
    let printWindow: any = window.open('pp', '_blank');
    printWindow.document.write(`
      <html>
        <head>
        <title>Cash Collection Report</title>
          <style>
            @media print {
              body {
                margin:0;
                padding:0;
                zoom:100%;
                width:100%;
                font-family: 'Your Font Family', sans-serif;
              }
              .header-body{
                width:100%;
                height:120px;
              }
              .main-body{
                width:100%;
              }
              .header-body .print-title {
                width:60%;
                text-align: left;
                margin-bottom: 20px;
                float:right;
              }
              .header-body .print-logo {
                width:20%;
                text-align: center;
                margin-bottom: 0px;
                float:left;
              }
              .print-logo img{
                width: 100%;
                height: 110px;
                object-fit: cover;
              }
              thead{
                background-color: #dcdcdc;
                height:50px;
              }
              thead tr{
                height:30px;
              }
              th{
                padding:0px;
                margin:0px;

              }
              table  {
                padding:0px;
                margin:0px;
              }
              td  {
                padding:0px;
                margin:0px;
              }
              tr:nth-child(even) {
                background-color: #f2f2f2;
            }
            th.hide-on-print,totolRow,button-container,
            td.hide-on-print {
              display: none;
            }
            tfoot.hide-on-print {
              display: block;
            }
            .totolRow  td{
              color:red !important;
              font-weight: 600 !important;
            }
            .button-container {
              display: none;
            }
            }
          </style>
        </head>
        <body>
        <div class="header-body">
          <div class="print-logo ">
            <img src="${this.env.apiUrl + this.shopLists[0].LogoURL}" alt="Logo" >
          </div>
          <div class="print-title">
          <h3>${this.shopLists[0].Name + ' (' + this.shopLists[0].AreaName + ')'}</h3>
          <h4 style="font-weight: 300; letter-spacing: 1px;">${this.shopLists[0].Address}</h4>
          </div>
        </div>
        <div class="main-body">
          ${printContent.innerHTML}
        </div>
        </body>
      </html>
    `);

    printWindow.document.querySelectorAll('.hide-on-print').forEach((element: any) => {
      element.classList.add('hide-on-print');
    });

    printWindow.document.close();
    printWindow.print();
  }

  toggleColumnVisibility(column: string): void {
    this.columnVisibility[column] = !this.columnVisibility[column];
  }
}
