import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { Subscription } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import { ShopService } from 'src/app/service/shop.service';
import * as moment from 'moment';
import * as XLSX from 'xlsx';
import { EmployeeService } from 'src/app/service/employee.service';
import { PettycashService } from 'src/app/service/pettycash.service';
import { FormControl } from '@angular/forms';
import { SupportService } from 'src/app/service/support.service';
import { FitterService } from 'src/app/service/fitter.service';
import { CustomerService } from 'src/app/service/customer.service';
import { DoctorService } from 'src/app/service/doctor.service';
import { SupplierService } from 'src/app/service/supplier.service';

@Component({
  selector: 'app-pettycash-report',
  templateUrl: './pettycash-report.component.html',
  styleUrls: ['./pettycash-report.component.css']
})
export class PettycashReportComponent implements OnInit {

  shop: any = JSON.parse(localStorage.getItem('shop') || '');
  user: any = JSON.parse(localStorage.getItem('user') || '');
  selectedShop: any = JSON.parse(localStorage.getItem('selectedShop') || '');
  permission = JSON.parse(localStorage.getItem('permission') || '[]');
  companySetting: any = JSON.parse(localStorage.getItem('companysetting') || '[]');
  searchValue: any = '';
  env = environment;
  selectsShop: any;

  filteredOptions: any;
  
 constructor(
    private router: Router,
    private route: ActivatedRoute,
    private ss: ShopService,
    public as: AlertService,
    public sp: NgxSpinnerService,
    public emp: EmployeeService,
    private pettyCash: PettycashService,
    private supps: SupportService,
    private fitters: FitterService,
    private customer: CustomerService,
    private doctor: DoctorService,
    private sup: SupplierService,
  ) { }

  data: any = {
    FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, UserType: '', UserID:'', CashType: 0,CreditType:0
  };

  payeeList: any = []
  shopList: any = []
  dataList: any = []

  ngOnInit(): void {
    this.dropdownShoplist()
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


  getPayeeList(){
    this.payeeList = [];

    if (this.data.UserType === 'Supplier')
    {
      const subs: Subscription = this.sup.dropdownSupplierlist('').subscribe({
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
    else if(this.data.UserType === 'Employee')
    { 
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
    else if(this.data.UserType === 'Fitter')
    { 
      const subs: Subscription = this.fitters.dropdownlist().subscribe({
        next: (res: any) => {
          this.payeeList = res.data.sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    }  
    else if(this.data.UserType === 'Customer')
    { 
      const subs: Subscription = this.customer.dropdownlist().subscribe({
        next: (res: any) => {
          if(res.success){
            this.payeeList = res.data.sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
          }else{
            this.as.errorToast(res.message)
          }
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    }  
    else if(this.data.UserType === 'Doctor')
    { 
      const subs: Subscription = this.doctor.dropdownDoctorlist().subscribe({
        next: (res: any) => {
          if(res.success){
            this.payeeList = res.data.sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
          }else{
            this.as.errorToast(res.message)
          }
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    } 

  }

  pettyCashReport() {
    this.sp.show()
    let Parem = '';

    if (this.data.FromDate !== '' && this.data.FromDate !== null) {
      let FromDate = moment(this.data.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and DATE_FORMAT(pettycash.CreatedOn, "%Y-%m-%d") between ' + `'${FromDate}'`;
    }

    if (this.data.ToDate !== '' && this.data.ToDate !== null) {
      let ToDate = moment(this.data.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'`;
    }

    if (this.data.ShopID != 0) {
      Parem = Parem + ' and pettycash.ShopID IN ' + `(${this.data.ShopID})`;
    }

    if (this.data.UserType != 0) {
      Parem = Parem +  ' and pettycash.ActionType = ' + `'${this.data.UserType}'`;
    }
    if (this.data.UserID != 0) {
      Parem = Parem +  ' and pettycash.EmployeeID = ' + this.data.UserID;
    }

    if (this.data.CashType != 0) {
      Parem = Parem + '  and pettycash.CashType = ' +  `'${this.data.CashType}'`;
    }

    if (this.data.CreditType != 0) {
      Parem = Parem + ' and pettycash.CreditType = '+ `'${this.data.CreditType}'`;
    }

    console.log(Parem);

    const subs: Subscription = this.pettyCash.pettyCashReport(Parem).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.as.successToast(res.message)
          this.dataList = res.data

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
      FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, UserType: '', UserID:'', CashType: 0,CreditType:0
    };
    this.dataList = [];
  }

  dateFormat(date: any) {
    return moment(date).format(`${this.companySetting.DateFormat}`);
  }

  print() {
    let shop = this.shopList
    this.selectsShop = shop.filter((s: any) => s.ID === Number(this.selectedShop[0]));

    let printContent: any = document.getElementById('petty-content');
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

  exportAsXLSX(): void {
    let element = document.getElementById('pettyExcel');
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
    XLSX.writeFile(wb, 'PettyCashExcel_Report.xlsx');
  }

}
