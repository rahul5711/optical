import { Component, OnInit } from '@angular/core';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { ProductService } from 'src/app/service/product.service';
import { Subscription, fromEvent } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import { PurchaseService } from 'src/app/service/purchase.service';
import { ShopService } from 'src/app/service/shop.service';
import * as moment from 'moment';
import * as XLSX from 'xlsx';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { SupplierService } from 'src/app/service/supplier.service';
import { SupportService } from 'src/app/service/support.service';
import { environment } from 'src/environments/environment';
import { CustomerService } from 'src/app/service/customer.service';
import { BillService } from 'src/app/service/bill.service';

@Component({
  selector: 'app-vendor-credit',
  templateUrl: './vendor-credit.component.html',
  styleUrls: ['./vendor-credit.component.css']
})
export class VendorCreditComponent implements OnInit {
  shop: any = JSON.parse(localStorage.getItem('shop') || '');
  user: any = JSON.parse(localStorage.getItem('user') || '');
  selectedShop: any = JSON.parse(localStorage.getItem('selectedShop') || '');
  permission = JSON.parse(localStorage.getItem('permission') || '[]');
  companySetting = JSON.parse(localStorage.getItem('companysetting') || '');
  form: any | FormGroup;
  env = environment;
  columnVisibility: any = {
    SNo: true,
    SupplierName: true,
    CreditNumber: true,
    CreditDate: true,
    Shop: true,
    Amount: true,
    PaidAmount: true,
    Balance: true,
    Status: true,
    Remark: true,
    CreditType: true,
  };

  myControl = new FormControl('All');
  myControl1 = new FormControl('All');
  filteredOptions: any;

  constructor(
    private purchaseService: PurchaseService,
    private ss: ShopService,
    private ps: ProductService,
    public as: AlertService,
    public sp: NgxSpinnerService,
    private fb: FormBuilder,
    private sup: SupplierService,
    private supps: SupportService,
    private cs: CustomerService,
    private bill: BillService,

  ) {
    this.form = this.fb.group({
      billerIds: []
    })
  }

  shopList: any;
  selectsShop: any;
  DetailtotalQty: any;
  supplierList: any = []
  dataList: any = []
  dataList1: any = []
  dataList2: any = []
  billerList: any = []
  customerList: any = []

  data: any = {
    FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, SupplierID: 0, VendorStatus: 0,
  };

  data1: any = {
    FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, CustomerID: 0, CustomerStatus: 0,
  };

  totalAmount: any;
  totalBalance: any;
  totalPaidAmount: any;
  totalAmount2: any;
  totalBalance2: any;
  totalPaidAmount2: any;

  totalAmountD : any;
  totalDiscountD : any;
  totalDueAmountD : any;
  totalGstAmountD : any;
  totalPaidAmountD : any;
  totalQtyD : any;
  totalSubTotalD : any;

  viewSupplierCreditReport = false
  editSupplierCreditReport = false
  addSupplierCreditReport = false
  deleteSupplierCreditReport = false

  ngOnInit(): void {
    this.permission.forEach((element: any) => {
      if (element.ModuleName === 'SupplierCreditReport') {
        this.viewSupplierCreditReport = element.View;
        this.editSupplierCreditReport = element.Edit;
        this.addSupplierCreditReport = element.Add;
        this.deleteSupplierCreditReport = element.Delete;
      } else {
        this.viewSupplierCreditReport = true
        this.editSupplierCreditReport = true
        this.addSupplierCreditReport = true
        this.deleteSupplierCreditReport = true
      }
    });

    this.dropdownShoplist()
    if (this.user.UserGroup === 'Employee') {
      this.shopList = this.shop;
      this.data.ShopID = this.shopList[0].ShopID
    } else {
      this.dropdownShoplist()
    }
    // this.dropdownSupplierlist()
      this.bill.shopList$.subscribe((list:any) => {
        this.supplierList = list
      });
  }

  dropdownShoplist() {
    this.sp.show()
    const subs: Subscription = this.ss.dropdownShoplist('').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.shopList = res.data
          let shop = res.data
          this.selectsShop = shop.filter((s: any) => s.ID === Number(this.selectedShop[0]));
          this.selectsShop = '/ ' + this.selectsShop[0].Name + ' (' + this.selectsShop[0].AreaName + ')'

          this.billerList = res.data.map((o: any) => {
            return {
              id: o.ID,
              text: `${o.Name}`,
              // text: `${o.blr_id}`,
            };
          });

        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
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

  exportAsXLSX(): void {
    let element = document.getElementById('SupplierCreditExcel');
    const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(element);
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

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, 'Supplier_Credit_Report.xlsx');
  }

  getCreditReport() {
    this.sp.show()
    let Parem = '';

    if (this.data.FromDate !== '' && this.data.FromDate !== null) {
      let FromDate = moment(this.data.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and DATE_FORMAT(vendorcredit.CreditDate, "%Y-%m-%d") between ' + `'${FromDate}'`;
    }

    if (this.data.ToDate !== '' && this.data.ToDate !== null) {
      let ToDate = moment(this.data.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'`;
    }

    if (this.data.ShopID != 0) {
      Parem = Parem + ' and vendorcredit.ShopID IN ' + `(${this.data.ShopID})`;
    }

    if (this.data.SupplierID != 0) {
      Parem = Parem + ' and vendorcredit.SupplierID IN ' + `(${this.data.SupplierID})`;
    }

    if (this.data.VendorStatus != 0) {
      Parem = Parem + ' and ' + `(${this.data.VendorStatus})`;
    }


    const subs: Subscription = this.sup.vendorCreditReport(Parem).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.as.successToast(res.message)
          this.dataList = res.data
          this.totalAmount = res.calculation[0].totalAmount;
          this.totalBalance = res.calculation[0].totalBalance;
          this.totalPaidAmount = res.calculation[0].totalPaidAmount;
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  FromReset() {
    this.data = {
      FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'),ShopID: 0, SupplierID: 0, VendorStatus: 0,
    };
    this.dataList = [];
  }

  dateFormat(date: any): string {
    if (date == null || date == "") {
      return '0000-00-00'; // Default Value
    }
    return moment(date).format(this.companySetting?.DateFormat || 'YYYY-MM-DD');
  }

  customerSearch(searchKey: any, mode: any, type: any) {
    this.filteredOptions = [];
      let dtm = { Type: '', Name: '' }

      if (type === 'Supplier') {
      dtm = {
        Type: 'Supplier',
        Name: this.data.SupplierID
      };
    }
    if (type === 'Customer') {
      dtm = {
        Type: 'Customer',
        Name: this.data1.CustomerID
      };
    }

  
    if (searchKey.length >= 2 && mode === 'Name') {
      dtm.Name = searchKey;
    }

    const subs: Subscription = this.supps.dropdownlistBySearch(dtm).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.filteredOptions = res.data;
        } else {
          this.as.errorToast(res.message);
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  CustomerSelection(mode: any, ID: any) {
    if (mode === 'BillMaster') {
      this.data1.CustomerID = ID
    }
    if (mode === 'data') {
      this.data.SupplierID = ID
    }

    if (mode === 'All') {
      this.filteredOptions = []
      this.data1.CustomerID = 0
      this.data.SupplierID = 0
    }
  }

  print() {
    let shop = this.shopList
    this.selectsShop = shop.filter((s: any) => s.ID === Number(this.selectedShop[0]));

    let printContent: any = document.getElementById('print-content');
    let printWindow: any = window.open('pp', '_blank');
    printWindow.document.write(`
    <html>
      <head>
      <title>Vendor Credit Report</title>
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
            td  {
              padding:0px;
              margin:0px;
            }
            tr:nth-child(even) {
              background-color: #f2f2f2;
          }
          th.hide-on-print,totolRow,
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


  getVendorDuePayment() {
    this.sp.show()
    let Parem = '';

    if (this.data1.FromDate !== '' && this.data1.FromDate !== null) {
      let FromDate = moment(this.data1.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and DATE_FORMAT(purchasemasternew.PurchaseDate, "%Y-%m-%d") between ' + `'${FromDate}'`;
    }

    if (this.data1.ToDate !== '' && this.data1.ToDate !== null) {
      let ToDate = moment(this.data1.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'`;
    }

    if (this.data1.ShopID != 0) {
      Parem = Parem + ' and purchasemasternew.ShopID IN ' + `(${this.data1.ShopID})`;
    }

    if (this.data1.SupplierID != 0) {
      Parem = Parem + ' and purchasemasternew.SupplierID IN ' + `(${this.data1.SupplierID})`;
    }

    const subs: Subscription = this.purchaseService.getVendorDuePayment(Parem).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.as.successToast(res.message)
          this.dataList1 = res.data
          this.totalAmountD = res.calculation[0].totalAmount.toFixed(2);
          this.totalDiscountD = res.calculation[0].totalDiscount.toFixed(2);
          this.totalDueAmountD = res.calculation[0].totalDueAmount.toFixed(2);
          this.totalGstAmountD = res.calculation[0].totalGstAmount.toFixed(2);
          this.totalPaidAmountD = res.calculation[0].totalPaidAmount.toFixed(2);
          this.totalQtyD = res.calculation[0].totalQty;
          this.totalSubTotalD = res.calculation[0].totalSubTotal.toFixed(2);
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  FromReset1() {
    this.data1 = {
      FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'),ShopID: 0, SupplierID: 0
    };
    this.dataList = [];
  }

  exportAsXLSX1(): void {
    let element = document.getElementById('SupplierDuaExcel');
    const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(element);
    
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
    ws['!cols'] = colWidths.map((width: number) => ({
      wch: width + 2, 
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF00' } }
    }));

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, 'Customer-CreditNote.xlsx');
  }

  print1() {
    let shop = this.shopList
    this.selectsShop = shop.filter((s: any) => s.ID === Number(this.selectedShop[0]));

    let printContent: any = document.getElementById('print-content1');
    let printWindow: any = window.open('pp', '_blank');
    printWindow.document.write(`
    <html>
      <head>
      <title>Vendor Credit Report</title>
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
            td  {
              padding:0px;
              margin:0px;
            }
            tr:nth-child(even) {
              background-color: #f2f2f2;
          }
          th.hide-on-print,totolRow,
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

  dropdownCustomerlist(){
        this.sp.show()
        const subs: Subscription = this.cs.dropdownlist().subscribe({
          next: (res: any) => {
            if(res.success){
              this.customerList  = res.data
            }else{
              this.as.errorToast(res.message)
            }
            this.sp.hide()
          },
          error: (err: any) => console.log(err.message),
          complete: () => subs.unsubscribe(),
        });
      }

      
  customernote() {
    this.sp.show()
    let Parem = '';

    if (this.data1.FromDate !== '' && this.data1.FromDate !== null) {
      let FromDate = moment(this.data1.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and DATE_FORMAT(customercredit.CreditDate, "%Y-%m-%d") between ' + `'${FromDate}'`;
    }

    if (this.data1.ToDate !== '' && this.data1.ToDate !== null) {
      let ToDate = moment(this.data1.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'`;
    }

    if (this.data1.ShopID != 0) {
      Parem = Parem + ' and customercredit.ShopID IN ' + `(${this.data1.ShopID})`;
    }

    if (this.data1.CustomerID != 0) {
      Parem = Parem + ' and customercredit.CustomerID = ' + `${this.data1.CustomerID}`;
    }

    // if (this.data1.CustomerStatus != 0) {
    //   Parem = Parem + ' and ' + `(${this.data1.CustomerStatus})`;
    // }


    const subs: Subscription = this.cs.customerCreditReport(Parem).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.as.successToast(res.message)
          this.dataList2 = res.data
          this.totalAmount2 = res.calculation[0].totalAmount;
          this.totalBalance2 = res.calculation[0].totalBalance;
          this.totalPaidAmount2 = res.calculation[0].totalPaidAmount;
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }
}
