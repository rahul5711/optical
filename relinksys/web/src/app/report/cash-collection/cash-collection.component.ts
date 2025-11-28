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
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: AutoTableOptions) => jsPDF;
  }
}

interface AutoTableOptions {
  startY?: number;
  head?: string[][];
  body?: string[][];
  html?: string | HTMLElement;
  theme?: 'striped' | 'grid' | 'plain';
  styles?: any; // Aap yahan specific styles define kar sakte hain
  headStyles?: any;
  bodyStyles?: any;
  alternateRowStyles?: any;
  // Aur bhi options ho sakte hain jo aap autoTable documentation mein dekh sakte hain
}

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
  oldAmountReturn = 0
  totalExpense = 0
  totalCash = 0
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
      } else {
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
      // this.dropdownShoplist();
    this.billService.shopList$.subscribe((list:any) => {
       this.shopList = list
    });
    }
    // this.getPaymentModesList()
    this.billService.paymentModes$.subscribe((list:any) => {
       this.PaymentModesList = list
    });
  }


  generateManualPdfTable(): void {
    const doc = new jsPDF();
    let shops: any = []

    shops = this.shop.filter((s: any) => s.ID === Number(this.data.ShopID));

    const tableHeader = ['SNo.', 'InvoiceNo', 'BillDate', 'Pay_Date', 'CustomerName', 'MobileNo', 'Pay_Mode', 'Amount'];
    const tableBody = this.dataList.map((item: any, index: number) => [
      (index + 1).toString(),
      String(item.InvoiceNo || ''),
      item.BillDate ? moment(item.BillDate).format('DD-MM-YYYY') : '',
      item.PaymentDate ? moment(item.PaymentDate).format('DD-MM-YYYY') : '',
      String(item.CustomerName || ''),
      String(item.MobileNo1 || ''),
      String(item.PaymentMode || ''),
      String(item.Amount?.toFixed(2) || ''),
    ]);

    const totalAmount = this.totalAmount || 0;
    const oldPayment = this.oldPayment || 0;
    const newPayment = this.newPayment || 0;
    const paymentModes = this.paymentMode || [];

    const area = shops[0]?.AreaName;
    const shopName = area && area !== 'null' && area.trim() !== '' ? `${shops[0]?.Name} (${area})` : `${shops[0]?.Name}`;
    const shopAddress = shops[0]?.Address || '';
    const shopPhone = shops[0]?.MobileNo1 || '';
    const shopEmail = shops[0]?.Email || '';
    const reportTitle = "Cash Collection Report";
    const fromDate = this.data.FromDate;
    const toDate = this.data.ToDate;

    // --- Shop header (only first page) ---
    const boxX = 5;
    const boxY = 5;
    const boxWidth = doc.internal.pageSize.getWidth() - 2 * boxX;
    let contentY = boxY + 8;

    doc.setDrawColor(0); // black border
    doc.setLineWidth(0.5);
    if (this.data.ShopID != 0) {
      doc.rect(boxX, boxY, boxWidth, 45, 'S'); // fixed height box
    } else {
      doc.rect(boxX, boxY, boxWidth, 25, 'S');
    }

    // Shop name
    if (this.data.ShopID != 0) {

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(shopName, doc.internal.pageSize.getWidth() / 2, contentY, { align: 'center' });
      contentY += 7;

      // Address
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(shopAddress, doc.internal.pageSize.getWidth() / 2, contentY, { align: 'center' });
      contentY += 6;

      // Phone
      doc.text(`Phone: ${shopPhone}`, doc.internal.pageSize.getWidth() / 2, contentY, { align: 'center' });
      contentY += 6;

      // Email
      doc.text(`Email: ${shopEmail}`, doc.internal.pageSize.getWidth() / 2, contentY, { align: 'center' });
      contentY += 8;
    } else {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('All Shop', doc.internal.pageSize.getWidth() / 2, contentY, { align: 'center' });
      contentY += 7;
    }
    // Title
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(reportTitle, doc.internal.pageSize.getWidth() / 2, contentY, { align: 'center' });
    contentY += 6;

    // Dates
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`From Date: ${fromDate}`, boxX + 2, contentY);
    doc.text(`To Date: ${toDate}`, boxX + boxWidth - 2, contentY, { align: 'right' });

    // --- Main Invoice Table ---
    let finalY = 0;
    if (this.data.ShopID != 0) {
      finalY = 58
    } else {
      finalY = 35
    }
    autoTable(doc, {
      startY: finalY,
      head: [tableHeader],
      body: tableBody,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [230, 230, 230],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      margin: { top: 10, left: 5, right: 5 },
      theme: 'grid',
      didDrawPage: (data: any) => {
        const pageHeight = doc.internal.pageSize.getHeight();
        const pageWidth = doc.internal.pageSize.getWidth();
        doc.setFontSize(9);
        doc.text(`Page ${data.pageNumber}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
        finalY = data.cursor.y;
      }
    });

    // --- Last page summary ---
    const usableHeight = doc.internal.pageSize.getHeight() - 0;
    if (finalY + 5 > usableHeight) {
      doc.addPage();
      finalY = 5;
    }

    finalY += 5;

    // --- PaymentMode Table (row-wise) ---
    const paymentHead = paymentModes.map((mode: any) => mode.Name || '');
    const paymentRow = paymentModes.map((mode: any) => (mode.Amount || 0));

    autoTable(doc, {
      startY: finalY,
      head: [paymentHead],
      body: [paymentRow],
      styles: { fontSize: 9, halign: 'center' },
      headStyles: {
        fillColor: [200, 200, 200],
        textColor: 0,
        fontStyle: 'bold'
      },
      margin: { left: 5, right: 5 },
      theme: 'grid',
      didDrawPage: (data: any) => {
        finalY = data.cursor.y;
      }
    });

    // --- Totals Table (3 columns only) ---
    autoTable(doc, {
      startY: finalY + 5,
      head: [['Total Amount', 'Old Payment', 'Advance Payment']],
      body: [[
        totalAmount.toFixed(2),
        oldPayment.toFixed(2),
        newPayment.toFixed(2),
      ]],
      styles: { fontSize: 9, halign: 'center' },
      headStyles: {
        fillColor: [200, 200, 200],
        textColor: 0,
        fontStyle: 'bold'
      },
      margin: { left: 5, right: 5 },
      theme: 'grid',
      didParseCell: (data) => {
        // First body row, first column (Total Amount)
        if (data.section === 'body' && data.row.index === 0 && data.column.index === 0) {
          data.cell.styles.textColor = [255, 0, 0]; // red
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });

    // --- Output ---
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const newWindow = window.open(pdfUrl, '_blank');
    if (newWindow) {
      newWindow.onload = () => newWindow.print();
    }
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

    if (this.data.ShopID[0] == 0) {
      this.data.ShopID = 0
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
          this.totalExpense = (res.totalExpense).toFixed(2)
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
    this.oldAmountReturn = 0;

    for (var i = 0; i < data.length; i++) {
      const billDate = moment(data[i].BillDate).format('YYYY-MM-DD');
      const fromDate = moment(this.data.FromDate).format('YYYY-MM-DD');
      const toDate = moment(this.data.ToDate).format('YYYY-MM-DD');

      if (billDate !== 'Invalid date' && data[i].PaymentStatus !== null && new Date(billDate) >= new Date(fromDate) && new Date(billDate) <= new Date(toDate)) {
        if (!data[i].PaymentMode.includes('AMOUNT RETURN') && data[i].PaymentMode !== 'Customer Credit') {
          this.newPayment += Number(data[i].Amount);
        }
        if (data[i].PaymentMode.includes('AMOUNT RETURN')) {
          this.AmountReturn += Number(data[i].Amount);
        }

      } 
      else if (new Date(billDate) < new Date(fromDate)){
        if (!data[i].PaymentMode.includes('AMOUNT RETURN') && data[i].PaymentMode !== 'Customer Credit') {
          this.oldPayment += Number(data[i].Amount);
        }
         if (data[i].PaymentMode.includes('AMOUNT RETURN')) {
          this.oldAmountReturn += Number(data[i].Amount);
        }
        
      }
    }
     this.newPayment = this.newPayment - this.AmountReturn;
     this.oldPayment = this.oldPayment - this.oldAmountReturn;
  }

//    totalCalculation(data: any) {
//   this.newPayment = 0;
//   this.oldPayment = 0;
//   this.AmountReturn = 0;
//   this.oldAmountReturn = 0;

//   for (var i = 0; i < data.length; i++) {
//     const billDate = moment(data[i].BillDate).format('YYYY-MM-DD');
//     const fromDate = moment(this.data.FromDate).format('YYYY-MM-DD');
//     const toDate = moment(this.data.ToDate).format('YYYY-MM-DD');

//     const paymentMode = data[i].PaymentMode || ''; 
//     const amount = Number(data[i].Amount) || 0;

//     if (billDate === 'Invalid date' || data[i].PaymentStatus === null) {
//       continue; 
//     }

//     if (new Date(billDate) >= new Date(fromDate) && new Date(billDate) <= new Date(toDate)) {
//       if (!paymentMode.includes('AMOUNT RETURN') && paymentMode !== 'Customer Credit') {
//         this.newPayment += amount;
//       }

//       if (paymentMode.includes('AMOUNT RETURN')) {
//         this.AmountReturn += amount;
//       }
//     }

//     else if (new Date(billDate) < new Date(fromDate)) {
//       if (!paymentMode.includes('AMOUNT RETURN') && paymentMode !== 'Customer Credit') {
//         this.oldPayment += amount;
//       }

//       if (paymentMode.includes('AMOUNT RETURN')) {
//         this.oldAmountReturn += amount;
//       }
//     }
//   }

//   this.newPayment = this.newPayment - this.AmountReturn;
//   this.oldPayment = this.oldPayment - this.oldAmountReturn;
// }

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
    XLSX.utils.sheet_to_json(ws, { header: 1 }).forEach((row: any = []) => {
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


  dateFormat(date: any): string {
    if (date == null || date == "") {
      return '0000-00-00'; // Default Value
    }
    return moment(date).format(this.companySetting?.DateFormat || 'YYYY-MM-DD');
  }

  FromReset() {
     if(this.user.UserGroup == 'CompanyAdmin'){
             this.data = {
              FilterTypes: 'CreatedOn', FromDate: moment().format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, PaymentStatus: 0,
               PaymentMode: 0
             };
        }else{
          this.data = {
              FilterTypes: 'CreatedOn', FromDate: moment().format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: this.shopList[0].ShopID, PaymentStatus: 0, PaymentMode: 0
             };
        }

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
    printWindow.print();
  }

  toggleColumnVisibility(column: string): void {
    this.columnVisibility[column] = !this.columnVisibility[column];
  }



}
