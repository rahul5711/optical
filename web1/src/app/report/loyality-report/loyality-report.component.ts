import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { ProductService } from 'src/app/service/product.service';
import { Subscription } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import { PurchaseService } from 'src/app/service/purchase.service';
import { ShopService } from 'src/app/service/shop.service';
import { SupplierService } from 'src/app/service/supplier.service';
import * as moment from 'moment';
import * as XLSX from 'xlsx';
import { SupportService } from 'src/app/service/support.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormControl } from '@angular/forms';
import { EmployeeService } from 'src/app/service/employee.service';
import { DoctorService } from 'src/app/service/doctor.service';
import { BillService } from 'src/app/service/bill.service';

@Component({
  selector: 'app-loyality-report',
  templateUrl: './loyality-report.component.html',
  styleUrls: ['./loyality-report.component.css']
})
export class LoyalityReportComponent implements OnInit {

  shop: any = JSON.parse(localStorage.getItem('shop') || '');
  user: any = JSON.parse(localStorage.getItem('user') || '');
  selectedShop: any = JSON.parse(localStorage.getItem('selectedShop') || '');
  permission = JSON.parse(localStorage.getItem('permission') || '[]');
  companySetting: any = JSON.parse(localStorage.getItem('companysetting') || '[]');
  searchValue: any = '';
  env = environment;
  Productsearch: any = '';

  columnVisibility: any = {
    SNo: true,
    UserType: true,
    PaymentStatus: true,
    InvoiceNo: true,
    GSTNo: true,
    Quantity: true,
    TotalAmount: true,
    PurchaseDate: true,
    LastUpdate: true,
    ShopName: true,
    UserName: true,

  };
  columnVisibility1: any = {
    SNo: true,
    UserType: true,
    CommissionMode: true,
    CommissionType: true,
    CommissionValue: true,
    CommissionAmount: true,
    BrandedCommissionAmount: true,
    NonBrandedCommissionAmount: true,
    SaleInvoiceNo: true,
    Quantity: true,
    PaymentInvoiceNo: true,
    PurchaseDate: true,
    ShopName: true,
    UserName: true,
  };

  myControl = new FormControl('All');
  filteredOptions: any;

  shopList: any;
  selectsShop: any;
  LoyalityMasterList: any
  TotalQuantity: any;
  TotalAmount: any;

  LoyalityDetailList: any
  DetailTotalQuantity: any;
  DetailCommissionAmount: any;
  DetailBrandedCommissionAmount: any;
  DetailNonBrandedCommissionAmount: any;


  payeeList: any = []
  dataList: any = []

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private ss: ShopService,
    public as: AlertService,
    public sp: NgxSpinnerService,
    public emp: EmployeeService,
    private doc: DoctorService,
    private bill: BillService,
  ) { }

  LoyalityMaster: any = {
    FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, UserID: '',
    UserType: '', PaymentStatus: 0
  };

  LoyalityDetail: any = {
    FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, UserID: '',
    UserType: '', PaymentStatus: 0
  };

  viewLoyalityReport = false;
  editLoyalityReport = false
  addLoyalityReport = false
  deleteLoyalityReport = false

  viewLoyalityDetailReport = false
  editLoyalityDetailReport = false
  addLoyalityDetailReport = false
  deleteLoyalityDetailReport = false

  ngOnInit(): void {
    this.permission.forEach((element: any) => {
      if (element.ModuleName === 'LoyalityReport') {
        this.viewLoyalityReport = element.View;
        this.editLoyalityReport = element.Edit;
        this.addLoyalityReport = element.Add;
        this.deleteLoyalityReport = element.Delete;
      }
     else if (element.ModuleName === 'LoyalityDetailReport') {
        this.viewLoyalityDetailReport = element.View;
        this.editLoyalityDetailReport = element.Edit;
        this.addLoyalityDetailReport = element.Add;
        this.deleteLoyalityDetailReport = element.Delete;
      }
    });

    if (this.user.UserGroup === 'Employee') {
      this.shopList = this.shop
    } else {
      this.dropdownShoplist()
    }
  }

  dropdownShoplist() {
    const subs: Subscription = this.ss.dropdownShoplist('').subscribe({
      next: (res: any) => {
        this.shopList = res.data.sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getPayeeList() {
    this.dataList = []

    if (this.LoyalityMaster.UserType === 'Employee' || this.LoyalityDetail.UserType === 'Employee') {
      const subs: Subscription = this.emp.dropdownUserlist('').subscribe({
        next: (res: any) => {
          if (res.success) {
            this.payeeList = res.data.sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
          } else {
            this.as.errorToast(res.message)
          }
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    }
    else if (this.LoyalityMaster.UserType === 'Doctor' || this.LoyalityDetail.UserType === 'Doctor') {
      const subs: Subscription = this.doc.dropdownDoctorlist().subscribe({
        next: (res: any) => {
          this.payeeList = res.data.sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    }

  }

  getLoyalityReport() {
    this.sp.show()
    const subs: Subscription = this.bill.getLoyalityReport(
      this.LoyalityMaster.UserType,
      this.LoyalityMaster.UserID,
      this.LoyalityMaster.FromDate,
      this.LoyalityMaster.ToDate,
      this.LoyalityMaster.ShopID,
      this.LoyalityMaster.PaymentStatus).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.LoyalityMasterList = res.data;
            this.TotalQuantity = res.calculation.Quantity;
            this.TotalAmount = res.calculation.TotalAmount;

            this.as.successToast(res.message)
          } else {
            this.as.errorToast(res.message)
          }
          this.sp.hide()
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
  }

  getLoyalityDetailReport() {
    this.sp.show()
    const subs: Subscription = this.bill.getLoyalityDetailReport(
      this.LoyalityDetail.UserType,
      this.LoyalityDetail.UserID,
      this.LoyalityDetail.FromDate,
      this.LoyalityDetail.ToDate,
      this.LoyalityDetail.ShopID,
      this.LoyalityDetail.PaymentStatus).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.LoyalityDetailList = res.data;
            this.DetailTotalQuantity = res.calculation.Quantity;
            this.DetailCommissionAmount = res.calculation.CommissionAmount;
            this.DetailBrandedCommissionAmount = res.calculation.BrandedCommissionAmount;
            this.DetailNonBrandedCommissionAmount = res.calculation.NonBrandedCommissionAmount;

            this.as.successToast(res.message)
          } else {
            this.as.errorToast(res.message)
          }
          this.sp.hide()
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
  }

  onChange(event: { toUpperCase: () => any; toTitleCase: () => any; }) {
    if (this.companySetting.DataFormat === '1') {
      event = event.toUpperCase()
    } else if (this.companySetting.DataFormat == '2') {
      event = event.toTitleCase()
    }
    return event;
  }

  exportAsXLSXMaster(): void {
    let element = document.getElementById('loyalityExcel');
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
    XLSX.writeFile(wb, 'Loyality_Report.xlsx');
  }

  exportAsXLSXDetail(): void {
    let element = document.getElementById('loyalityDetailExcel');
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
    XLSX.writeFile(wb, 'Loyality_Detail_Report.xlsx');
  }

  print(mode: any) {
    let shop = this.shopList
    this.selectsShop = shop.filter((s: any) => s.ID === Number(this.selectedShop[0]));
    let printContent: any = '';
    let printTitle: any = '';

    if (mode === 'loyality-content') {
      printContent = document.getElementById('loyality-content');
      printTitle = 'loyality Report'
    }
    if (mode === 'loyalityDetail-content') {
      printContent = document.getElementById('loyalityDetail-content');
      printTitle = 'loyality Detail Report'
    }

    let printWindow: any = window.open('pp', '_blank');
    printWindow.document.write(`
  <html>
    <head>
    <title> ${printTitle}</title>
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

  dateFormat(date: any) {
    return moment(date).format(`${this.companySetting.DateFormat}`);
  }

  toggleColumnVisibility(column: string): void {
    this.columnVisibility[column] = !this.columnVisibility[column];
  }

  toggleColumnVisibility1(column: string): void {
    this.columnVisibility1[column] = !this.columnVisibility1[column];
  }

  LoyalityMasterFromReset() {
    this.LoyalityMaster = {
      FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, UserID: '',
      UserType: '', PaymentStatus: ''
    };
    this.LoyalityMasterList = [];
    this.TotalQuantity = ''
    this.TotalAmount = ''
  }

  LoyalityDetailFromReset() {
    this.LoyalityDetail = {
      FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, UserID: '',
      UserType: '', PaymentStatus: ''
    };
    this.LoyalityDetailList = [];
    this.DetailTotalQuantity = '';
    this.DetailCommissionAmount = '';
    this.DetailBrandedCommissionAmount = '';
    this.DetailNonBrandedCommissionAmount = '';
  }
}
