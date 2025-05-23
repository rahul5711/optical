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
import { ExcelService } from 'src/app/service/helpers/excel.service';
import { color } from 'html2canvas/dist/types/css/types/color';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

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
    private excelService: ExcelService,
    private modalService: NgbModal,
  ) { }

  shopList: any = [];
  PaymentModesList: any = [];
  ExpenseTypeList: any = [];
  ExpenseList: any = [];
  shopLists: any = []


  data: any = {
    FromDate: moment().format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, PaymentMode: 'All',ExpenseType:'All', CashType: 'All'
  };

  dataRegister: any = {
    FromDate: '', ToDate: '',ShopID:0
  }
  RegisterList: any = []
  RegisterDetailList: any = []
  RegisterAmount:any = 0
  RegisterPaid:any = 0
  RegisterBalance:any = 0
  FilterTypeR:any
  MonthYearHead:any

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
      }else{
        this.viewExpenesReport = true;
        this.editExpenesReport = true;
        this.addExpenesReport = true;
        this.deleteExpenesReport = true;
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
      Parem = Parem + ' and Expense.PaymentMode = ' + `'${this.data.PaymentMode.trim()}'`
    }
    
    if (this.data.ExpenseType !== 'All') {
      Parem = Parem + ' and Expense.Category = ' + `'${this.data.ExpenseType.trim()}'`
    }

    if (this.data.CashType !== 'All') {
      Parem = Parem + ' and Expense.CashType = ' + `'${this.data.CashType.trim()}'`
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
    delete ws['A2'];
      // Initialize column widths array
    const colWidths: number[] = [];

    // Iterate over all cells to determine maximum width for each column
    XLSX.utils.sheet_to_json(ws, { header: 1 }).forEach((row: any=[]) => {
        row.forEach((cell: any, index: number) => {
            const cellValue = cell ? String(cell) : '';
            colWidths[index] = Math.max(colWidths[index] || 0, cellValue.length);
        });
    });

    // Set column widths in the worksheet
    ws['!cols'] = colWidths.map((width: number) => ({ wch: width + 2 }));
    
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, 'Expense_Report.xlsx');
  }


  

  
  // exportAsXLSX(): void {
  //   let data = this.ExpenseList.map((e: any) => {
  //     return {
  //       ExpenseDate: e.ExpenseDate,
  //       InvoiceNo: e.InvoiceNo,
  //       ExpenseType: e.ExpenseType,
  //       GivenTo: e.GivenTo,
  //       PaymentMode: e.PaymentMode,
  //       CashType: e.CashType,
  //       Amount: e.Amount,
  //       ShopName: e.ShopName,
  //     }
  //   })
  //   this.excelService.exportAsExcelFile(data, 'supplier_list');
  // }

  dateFormat(date: any): string {
    if (date == null || date == "") {
      return '0000-00-00'; // Default Value
    }
    return moment(date).format(this.companySetting?.DateFormat || 'YYYY-MM-DD');
  }

  FromReset() {
    this.data = {
      FromDate: moment().format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, PaymentMode: 'All',ExpenseType:'All', CashType: 'All'
    };
    this.ExpenseList = [];
    this.totalAmt = 0
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
             object-fit: contain;
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
                width:100%;
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



      getRegisterSale() {
        let Parem = '';
    
        let FromDate = moment(this.dataRegister.FromDate).format('YYYY-MM-DD')
        Parem = Parem + ' and DATE_FORMAT(expense.ExpenseDate, "%Y-%m-%d") between ' + `'${FromDate}'`;
    
        let ToDate =  moment(this.dataRegister.ToDate).endOf('month').format('YYYY-MM-DD');
        Parem = Parem + ' and ' + `'${ToDate}'`;
    
        if (this.dataRegister.ShopID != 0){
          Parem = Parem + ' and expense.ShopID IN ' +  `(${this.dataRegister.ShopID})`;}
    
        const subs: Subscription = this.expen.getSaleReportMonthYearWise(Parem,this.FilterTypeR).subscribe({
          next: (res: any) => {
            if (res.success) {
              this.as.successToast(res.message)
              this.RegisterList = res.data
              this.RegisterAmount = res.calculation.Amount
              this.RegisterBalance = res.calculation.Balance
              this.RegisterPaid = res.calculation.Paid
            } else {
              this.as.errorToast(res.message)
            }
            this.sp.hide()
          },
          error: (err: any) => console.log(err.message),
          complete: () => subs.unsubscribe(),
        });
    
      }
    
      ChangeDate(){
        if(this.FilterTypeR == "YearMonthWise"){
                this.dataRegister.FromDate =  moment(this.dataRegister.FromDate).startOf('month').format('YYYY-MM-DD');
                this.dataRegister.ToDate =  moment(this.dataRegister.ToDate).endOf('month').format('YYYY-MM-DD');
        }
        if(this.FilterTypeR == "YearWise"){
                this.dataRegister.FromDate =  moment(this.dataRegister.FromDate).startOf('year').format('YYYY-MM-DD');
                this.dataRegister.ToDate =  moment(this.dataRegister.ToDate).endOf('year').format('YYYY-MM-DD');
        }
      }
     
      
      
      
      openModalR(contentR: any, data: any) {
        if(data.MonthYear){
          this.sp.show();
          this.MonthYearHead = data.MonthYear
          this.modalService.open(contentR, { centered: true, backdrop: 'static', keyboard: false, size: 'md' });
          const subs: Subscription = this.expen.getSaleReportMonthYearWiseDetails(data.BillMasterIds ).subscribe({
            next: (res: any) => {
              if (res.success) {
                this.RegisterDetailList = res.data;
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
         }
  

}
