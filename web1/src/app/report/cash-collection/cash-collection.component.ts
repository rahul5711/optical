import { Component, HostListener, OnInit } from '@angular/core';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { Subscription } from 'rxjs';
import { ShopService } from 'src/app/service/shop.service';
import * as moment from 'moment';
import { NgxSpinnerService } from 'ngx-spinner';
import * as XLSX from 'xlsx';
import { SupportService } from 'src/app/service/support.service';
import { BillService } from 'src/app/service/bill.service';
import { environment } from 'src/environments/environment';
import { NgxPrintDirective } from 'ngx-print';
import { MatSelectChange } from '@angular/material/select';


@Component({
  selector: 'app-cash-collection',
  templateUrl: './cash-collection.component.html',
  styleUrls: ['./cash-collection.component.css']
})

export class CashCollectionComponent implements OnInit {
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.ctrlKey && event.key === 'p') {
      this.print();
      event.preventDefault();
    }
    if (event.ctrlKey && event.key === 'e') {
      this.exportAsXLSX();
      event.preventDefault();
    }
 
  }
  
  env = environment;
  shop: any = JSON.parse(localStorage.getItem('shop') || '');
  user: any = JSON.parse(localStorage.getItem('user') || '');
  permission = JSON.parse(localStorage.getItem('permission') || '[]');
  companySetting = JSON.parse(localStorage.getItem('companysetting') || '');
  selectedShop = JSON.parse(localStorage.getItem('selectedShop') || '');
  columnVisibility: any = {
    SNo: true,
    InvoiceNo: true,
    InvoiceDate: true,
    PaymentDate: true,
    CustomerName: true,
    MobileNo: true,
    PaymentMode: true,
    Amount: true,
    DueAmount: true,
    PayableAmount: true,
    BillAmount: true,
    PaymentStatus: true,
    DeliveryDate: true,
    ShopName: true,
  };
  
  constructor(
    private ss: ShopService,
    public as: AlertService,
    public supps: SupportService,
    public sp: NgxSpinnerService,
    public billService: BillService,

  ) { }

  shopList: any;
  selectsShop: any;
  selectsShopimg: any;
  PaymentModesList: any = [];
  dataList: any = [];

  data: any = {
    FilterTypes: 'CreatedOn', FromDate: moment().format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, PaymentStatus: 0,
    PaymentMode: 0
  };

  paymentMode: any = []
  sumOfPaymentMode = 0
  AmountReturnByCredit = 0
  AmountReturnByDebit = 0
  totalAmount = 0
  oldPayment = 0
  newPayment = 0
  AmountReturn = 0

  viewCashCollectionReport = false
  editCashCollectionReport = false
  addCashCollectionReport = false
  deleteCashCollectionReport = false

  ngOnInit(): void {
    this.permission.forEach((element: any) => {
      if (element.ModuleName === 'CashCollectionReport') {
        this.viewCashCollectionReport = element.View;
        this.editCashCollectionReport = element.Edit;
        this.addCashCollectionReport = element.Add;
        this.deleteCashCollectionReport = element.Delete;
      }else{
        this.viewCashCollectionReport = true;
        this.editCashCollectionReport = true;
        this.addCashCollectionReport = true;
        this.deleteCashCollectionReport = true;
      }
    });

    if (this.user.UserGroup === 'Employee') {
      this.shopList = this.shop;
      this.data.ShopID = this.shopList[0].ShopID
    } else {
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

  dropdownShoplist() {
    const subs: Subscription = this.ss.dropdownShoplist('').subscribe({
      next: (res: any) => {
        this.shopList = res.data
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getCashReport() {
    this.sp.show()
    let Parem = '';
    this.paymentMode = [];
    this.sumOfPaymentMode = 0;
    this.AmountReturnByCredit = 0;
    this.AmountReturnByDebit = 0;
    this.totalAmount = 0;

    if (this.data.FromDate !== '' && this.data.FromDate !== null) {
      let FromDate = moment(this.data.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and DATE_FORMAT(paymentmaster.PaymentDate, "%Y-%m-%d") between ' + `'${FromDate}'`;
    }

    if (this.data.ToDate !== '' && this.data.ToDate !== null) {
      let ToDate = moment(this.data.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'`;
    }

    let dtm = {
      Date: Parem,
      ShopID: this.data.ShopID ? this.data.ShopID : 0,
      PaymentMode: this.data.PaymentMode ? this.data.PaymentMode : 0,
      PaymentStatus: this.data.PaymentStatus ? this.data.PaymentStatus : 0,
    }

    const subs: Subscription = this.billService.cashcollectionreport(dtm).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.as.successToast(res.message)
          this.dataList = res.data
          this.paymentMode = res.paymentMode
          this.sumOfPaymentMode = res.sumOfPaymentMode
          this.AmountReturnByCredit = res.AmountReturnByCredit
          this.AmountReturnByDebit = res.AmountReturnByDebit
          this.totalAmount = res.totalAmount
          this.totalCalculation(this.dataList);
        } else {
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
    this.AmountReturn = 0;

    for (var i = 0; i < data.length; i++) {
      const billDate = moment(data[i].BillDate).format('YYYY-MM-DD');
      const fromDate = moment(this.data.FromDate).format('YYYY-MM-DD');
      const toDate = moment(this.data.ToDate).format('YYYY-MM-DD');

      if (billDate !== 'Invalid date' && data[i].PaymentStatus !== null && new Date(billDate) >= new Date(fromDate) && new Date(billDate) <= new Date(toDate)) 
      {
        if(data[i].PaymentMode !== 'AMOUNT RETURN' && data[i].PaymentMode !== 'Customer Credit'){
          this.newPayment += Number(data[i].Amount);
        }
        if(data[i].PaymentMode === 'AMOUNT RETURN'){
          this.AmountReturn += Number(data[i].Amount);
        }
       

      } else {
        if(data[i].PaymentMode !== 'AMOUNT RETURN' && data[i].PaymentMode !== 'Customer Credit'){
        this.oldPayment += Number(data[i].Amount);
        }
      }


   

    }
  }

//   exportAsXLSX(): void {
//     const element = document.getElementById('CaseConExcel');
//     const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(element);

//     // Delete specific cell
//     delete ws['A2'];

//     // Initialize column widths array
//     const colWidths: number[] = [];

//     // Iterate over all cells to determine maximum width for each column
//     XLSX.utils.sheet_to_json(ws, { header: 1 }).forEach((row: any=[]) => {
//         row.forEach((cell: any, index: number) => {
//             const cellValue = cell ? String(cell) : '';
//             colWidths[index] = Math.max(colWidths[index] || 0, cellValue.length);
//         });
//     });

//     // Set column widths in the worksheet
//     ws['!cols'] = colWidths.map((width: number) => ({ wch: width + 2 }));

//     // Create workbook and write file
//     const wb: XLSX.WorkBook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
//     XLSX.writeFile(wb, 'Cash_Collection_Report.xlsx');
// }

exportAsXLSX(): void {
  const element = document.getElementById('CaseConExcel');
  const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(element);

  // Delete specific cell
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

   // Customize the Excel sheet here (e.g., set header background color)
   const headerRange = XLSX.utils.decode_range(ws['!ref'] || "A1:Z1");
   for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
       const headerCellAddress = XLSX.utils.encode_cell({ r: headerRange.s.r, c: col });
       if (ws[headerCellAddress]) {
           ws[headerCellAddress].s = ws[headerCellAddress].s || {}; // Initialize style object if not exist
           ws[headerCellAddress].s.fill = {
               fgColor: { rgb: "FF0000FF" }, // Red background color
               patternType: 'solid' // Solid fill pattern
           };
       }
   }

  // Create workbook and write file
  const wb: XLSX.WorkBook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, 'Cash_Collection_Report.xlsx');
}


  dateFormat(date: any) {
    return moment(date).format(`${this.companySetting.DateFormat}`);
  }

  FromReset() {
    this.data = {
      FilterTypes: 'CreatedOn', FromDate: moment().format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, PaymentStatus: 0,
      PaymentMode: 0
    };
    this.dataList = [];
  }


  print() {

    let shopID = this.data.ShopID
    let shop = this.shopList
    this.selectsShop = shop.filter((s: any) => s.ID === Number(shopID));
    if (this.selectsShop == '' || this.selectsShop == undefined) {
      this.selectsShop = shop.filter((s: any) => s.ID === Number(this.selectedShop[0]));
    }
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
                text-align: center;
              }
              td {
                padding:0px;
                margin:0px;
              }
              tr:nth-child(even) {
                background-color: #f2f2f2;
              }
              th.hide-on-print,tr.hide-on-print,
              td.hide-on-print {
                display: none;
              }
              tfoot.hide-on-print {
                display: block;
              }
            }
          </style>
        </head>
        <body>
        <div class="header-body">
          <div class="print-logo ">
            <img src="${this.env.apiUrl + this.selectsShop[0].LogoURL}" alt="Logo" >
          </div>
          <div class="print-title">
            <h3>${this.selectsShop[0].Name + ' (' + this.selectsShop[0].AreaName + ')'}</h3>
            <h4 style="font-weight: 300; letter-spacing: 1px;">${this.selectsShop[0].Address}</h4>
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
    printWindow.onload = () => {
      printWindow.print();
      printWindow.document.execCommand('SaveAs', true, 'CashCollectionReport.pdf');
      printWindow.close();
    };
  }

  toggleColumnVisibility(column: string): void {
    this.columnVisibility[column] = !this.columnVisibility[column];
  }



}
