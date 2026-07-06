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
import { CustomerService } from 'src/app/service/customer.service';
import { ExcelService } from 'src/app/service/helpers/excel.service';
import { MembershipcardService } from 'src/app/service/membershipcard.service';
import { BillService } from 'src/app/service/bill.service';

@Component({
  selector: 'app-customer-report',
  templateUrl: './customer-report.component.html',
  styleUrls: ['./customer-report.component.css']
})
export class CustomerReportComponent implements OnInit {
   env = environment;
  shop: any = JSON.parse(localStorage.getItem('shop') || '');
  user: any = JSON.parse(localStorage.getItem('user') || '');
  selectedShop: any = JSON.parse(localStorage.getItem('selectedShop') || '');
  permission = JSON.parse(localStorage.getItem('permission') || '[]');
  companySetting: any = JSON.parse(localStorage.getItem('companysetting') || '[]');
  companyData: any = JSON.parse(localStorage.getItem('company') || '[]');

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private purchaseService: PurchaseService,
    private ss: ShopService,
    private msc: MembershipcardService,
    private sup: CustomerService,
    private supps: SupportService,
    private ps: ProductService,
    public as: AlertService,
    public sp: NgxSpinnerService,
    private modalService: NgbModal,
    private excelService: ExcelService,
        public bill: BillService,
  ) { }

  dataList: any = [];
  powerList: any = [];
  shopList: any = [];
  memberList: any = [];
  Type = 'Customer'
  selectsShop :any;
  data: any = {
    FromDate: moment().startOf('month').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, Type: 0
  };

    data1: any = {
     FilterTypes:'AllDue', FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, CustomerID: 0, VendorStatus: 0,
    };
  
  performanceList: any;
  currentPage = 1;
  itemsPerPage = 10;
  pageSize!: number;
  collectionSize = 0
  page = 4;

  
  totalAmountD : any;
  totalDiscountD : any;
  totalDueAmountD : any;
  totalGstAmountD : any;
  totalPaidAmountD : any;
  totalQtyD : any;
  totalSubTotalD : any;
  dataList1: any = []

   dataList1All: any = []
  totalAmountDAll : any;
  totalDueAmountDAll : any;
  totalPaidAmountDAll : any;
cusList:any
  myControl = new FormControl('All');
filteredOptions:any

  dataRegister: any = {
    FromDate: '', ToDate: ''
  }
searchTimer: any;
  RegisterList: any = []
  RegisterDetailList: any = []
  RegisterAmount:any = 0
  RegisterPaid:any = 0
  RegisterBalance:any = 0
   RegisterTotalSale :any = 0
  RegisterTotalPurchase :any = 0
  RegisterTotalExpense:any = 0
    RegisterProfit:any = 0
  FilterTypeR:any 
  ngOnInit(): void {

    // this.exportCustomerPower();
    if (this.user.UserGroup === 'Employee') {
      this.shopList = this.shop;
      this.data.ShopID = this.shopList[0].ShopID
    } else {
      // this.dropdownShoplist();
      this.bill.shopList$.subscribe((list:any) => {
        this.shopList = list
        let shop = list;
        this.selectsShop = shop.filter((s: any) => s.ID === Number(this.selectedShop[0]));
        this.selectsShop = '/ ' + this.selectsShop[0].Name + ' (' + this.selectsShop[0].AreaName + ')'
      });
    }
    this.fetchCustomerPerformance()
  }

   changePagesize(num: number): void {
    this.itemsPerPage = this.pageSize + num;
  }

  fetchCustomerPerformance() {
    this.sp.show()
    const dtm = {
      currentPage: this.currentPage,
      itemsPerPage: this.itemsPerPage
    }
    const subs: Subscription = this.sup.fetchCustomerPerformance(dtm).subscribe({
      next: (res: any) => {
        if(res.success){
          this.collectionSize = res.count;
          this.performanceList = res.data;
        
          this.as.successToast(res.message)
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide();
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

  exportCustomerData() {
    this.sp.show()
    const subs: Subscription = this.sup.exportCustomerData('').subscribe({
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


  exportCustomerPower() {
    this.sp.show()
    this.exportCustomerData();
    if (this.Type === 'Customer') {
      const subs: Subscription = this.sup.exportCustomerData('').subscribe({
        next: (res: any) => {
          if (res.success) {
            this.as.successToast(res.message)
            this.powerList = res.data
            this.excel(this.Type)
          } else {
            this.as.errorToast(res.message)
          }
          this.sp.hide()
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    } else {
      const subs: Subscription = this.sup.exportCustomerPower(this.Type).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.as.successToast(res.message)
            this.powerList = res.data
            this.excel(this.Type)
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

  dateFormat(date: any): string {
    if (date == null || date == "") {
      return '0000-00-00'; // Default Value
    }
    return moment(date).format(this.companySetting?.DateFormat || 'YYYY-MM-DD');
  }

  excel(Type: any): void {

    let data = []
    if (Type === 'Customer') {
      data = this.powerList.map((e: any) => {
        return {
          VisitDate: e.VisitDate,
          MRDNO: e.MRDNO,
          Cust_ID: e.Sno,
          Name: e.Name,
          MobileNo1: e.MobileNo1,
          MobileNo2: e.MobileNo2,
          Age: e.Age,
          Gender: e.Gender,
          Address: e.Address,
          Remarks: e.Remarks,
          Category: e.Category,
          Anniversary: e.Anniversary,
          DOB: e.DOB,
          Email: e.Email,
          PhoneNo: e.PhoneNo,
          RefferedByDoc: e.RefferedByDoc,
          ReferenceType: e.ReferenceType,
          GSTNo: e.GSTNo,
          Other: e.Other,
          ShopName: e.ShopName,
          ShopID: e.ShopID,
        }
      })
    } else if (Type === 'spectacle_rx') {
      data = this.powerList.map((e: any) => {
        return {
          VisitDate: e.VisitDate,
          VisitNo: e.VisitNo,
          Cust_ID: e.Sno,
          CustomerName: e.CustomerName,
          MobileNo1: e.MobileNo1,
          MobileNo2: e.MobileNo2,
          REDPSPH: e.REDPSPH,
          REDPCYL: e.REDPCYL,
          REDPAxis: e.REDPAxis,
          REDPVA: e.REDPVA,
          LEDPSPH: e.LEDPSPH,
          LEDPCYL: e.LEDPCYL,
          LEDPAxis: e.LEDPAxis,
          LEDPVA: e.LEDPVA,
          RENPSPH: e.RENPSPH,
          RENPCYL: e.RENPCYL,
          RENPAxis: e.RENPAxis,
          RENPVA: e.RENPVA,
          LENPSPH: e.LENPSPH,
          LENPCYL: e.LENPCYL,
          LENPAxis: e.LENPAxis,
          LENPVA: e.LENPVA,
          REPD: e.REPD,
          LEPD: e.LEPD,
          R_Addition: e.R_Addition,
          L_Addition: e.L_Addition,
          R_Prism: e.R_Prism,
          L_Prism: e.L_Prism,
          Lens: e.Lens,
          Shade: e.Shade,
          Frame: e.Frame,
          VertexDistance: e.VertexDistance,
          RefractiveInde: e.RefractiveIndex,
          FittingHeight: e.FittingHeight,
          ConstantUse: e.ConstantUse,
          NearWork: e.NearWork,
          DistanceWork: e.DistanceWork,
          RefferedByDoc: e.RefferedByDoc,
          Reminder: e.Reminder,
          ExpiryDate: e.ExpiryDate,
        }
      })
    } else if (Type === 'contact_lens_rx') {
      data = this.powerList.map((e: any) => {
        return {
          VisitDate: e.VisitDate,
          VisitNo: e.VisitNo,
          Cust_ID: e.Sno,
          CustomerName: e.CustomerName,
           MobileNo1: e.MobileNo1,
          MobileNo2: e.MobileNo2,
          REDPSPH: e.REDPSPH,
          REDPCYL: e.REDPCYL,
          REDPAxis: e.REDPAxis,
          REDPVA: e.REDPVA,
          LEDPSPH: e.LEDPSPH,
          LEDPCYL: e.LEDPCYL,
          LEDPAxis: e.LEDPAxis,
          LEDPVA: e.LEDPVA,
          RENPSPH: e.RENPSPH,
          RENPCYL: e.RENPCYL,
          RENPAxis: e.RENPAxis,
          RENPVA: e.RENPVA,
          LENPSPH: e.LENPSPH,
          LENPCYL: e.LENPCYL,
          LENPAxis: e.LENPAxis,
          LENPVA: e.LENPVA,
          REPD: e.REPD,
          LEPD: e.LEPD,
          R_Addition: e.R_Addition,
          L_Addition: e.L_Addition,
          R_KR: e.R_KR,
          L_KR: e.L_KR,
          R_HVID: e.R_HVID,
          L_HVID: e.L_HVID,
          R_CS: e.R_CS,
          L_CS: e.L_CS,
          R_BC: e.R_BC,
          L_BC: e.L_BC,
          R_Diameter: e.R_Diameter,
          L_Diameter: e.L_Diameter,
          BR: e.BR,
          Material: e.Material,
          Modality: e.Modality,
          Other: e.Other,
          ConstantUse: e.ConstantUse,
          NearWork: e.NearWork,
          DistanceWork: e.DistanceWork,
          Multifocal: e.Multifocal,
          RefferedByDoc: e.RefferedByDoc,
          ExpiryDate: e.ExpiryDate,
        }
      })
    } else if (Type === 'other_rx') {
      data = this.powerList.map((e: any) => {
        return {
          VisitDate: e.VisitDate,
          VisitNo: e.VisitNo,
          Cust_ID: e.Sno,
          CustomerName: e.CustomerName,
          MobileNo1: e.MobileNo1,
          MobileNo2: e.MobileNo2,
          BP: e.BP,
          Sugar: e.Sugar,
          IOL_Power: e.IOL_Power,
          Operation: e.Operation,
          R_VN: e.R_VN,
          L_VN: e.L_VN,
          R_TN: e.R_TN,
          L_TN: e.L_TN,
          R_KR: e.R_KR,
          L_KR: e.L_KR,
          Treatment: e.Treatment,
          Diagnosis: e.Diagnosis,
          RefferedByDoc: e.RefferedByDoc,
        }
      })
    }

    this.excelService.exportAsExcelFile(data, this.Type);
  }

  FromReset() {
    this.data = {
      FromDate: moment().startOf('month').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 'All'
    };
  }

  searchDataMember() {
    this.sp.show()
    let Parem = '';

    if (this.data.FromDate !== '' && this.data.FromDate !== null) {
      let FromDate = moment(this.data.FromDate).format('YYYY-MM-DD')
    
      if(this.data.Type == 'All' ){
        Parem = Parem + ' and DATE_FORMAT(membershipcard.CreatedOn, "%Y-%m-%d") between ' + `'${FromDate}'`;
      }
      if(this.data.Type == 'Issue' ){
        Parem = Parem + ' and DATE_FORMAT(membershipcard.IssueDate, "%Y-%m-%d") between ' + `'${FromDate}'`;
      }
      if(this.data.Type == 'Deactive'){
        Parem = Parem + ' and DATE_FORMAT(membershipcard.ExpiryDate, "%Y-%m-%d") between ' + `'${FromDate}'`;
      }
      if(this.data.Type == 'Active'){
        Parem = Parem + ' and DATE_FORMAT(membershipcard.IssueDate, "%Y-%m-%d")  between ' + `'${FromDate}'`;
      }
   
    }

    if (this.data.ToDate !== '' && this.data.ToDate !== null) {
      let ToDate = moment(this.data.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'`;

      if(this.data.Type == 'Active'){
        Parem = Parem + ' and DATE_FORMAT(membershipcard.ExpiryDate, "%Y-%m-%d")  < ' + `'${ToDate}'`;
      }
    }

    if (this.data.ShopID != 0) {
      Parem = Parem + ' and membershipcard.ShopID IN ' + `(${this.data.ShopID})`;
    }
    
    const subs: Subscription = this.msc.MembershipcardByreport(Parem).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.as.successToast(res.message)
          this.memberList = res.data;

        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  exportEx(): void {
    /* pass here the table id */
    let element = document.getElementById('member');
    const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(element);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    /* save to file */
    XLSX.writeFile(wb, 'customer_member_card.xlsx');
  }
  exportExPerformance(): void {
    /* pass here the table id */
    let element = document.getElementById('member');
    const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(element);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    /* save to file */
    XLSX.writeFile(wb, 'Customer_Performance.xlsx');
  }



  customerSearch(searchKey: any, mode: any, type: any) {

  clearTimeout(this.searchTimer);

  this.searchTimer = setTimeout(() => {

    this.filteredOptions = [];

    let dtm: any = { Type: '', Name: '' };

    if (type === 'Customer') {
      dtm = {
        Type: 'Customer',
        Name: this.data1.CustomerID
      };
    }

    if (searchKey.length >= 3) {

      if (mode === 'Name') {
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

  }, 1000); // 1 second delay

}
  
    CustomerSelection(mode: any, ID: any) {
      if (mode === 'Value') {
        this.data1.CustomerID = ID
      }
     
      if (mode === 'All') {
        this.filteredOptions = []
        this.data1.CustomerID = 0
   
      }
    }


    
    getCustomerDuePayment() {
    
    if(this.data1.FilterTypes == 'InvoiceWise'){
      this.sp.show()
      let Parem = '';
    
      if (this.data1.FromDate !== '' && this.data1.FromDate !== null) {
        let FromDate = moment(this.data1.FromDate).format('YYYY-MM-DD')
        Parem = Parem + ' and DATE_FORMAT(billmaster.BillDate, "%Y-%m-%d") between ' + `'${FromDate}'`;
      }
    
      if (this.data1.ToDate !== '' && this.data1.ToDate !== null) {
        let ToDate = moment(this.data1.ToDate).format('YYYY-MM-DD')
        Parem = Parem + ' and ' + `'${ToDate}'`;
      }
    
      if (this.data1.ShopID != 0) {
        Parem = Parem + ' and billmaster.ShopID IN ' + `(${this.data1.ShopID})`;
      }
    
      if (this.data1.CustomerID != 0) {
        Parem = Parem + ' and billmaster.CustomerID = ' + `(${this.data1.CustomerID})`;
      }
    
      const subs: Subscription = this.sup.getCustomerDuePayment(Parem).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.as.successToast(res.message)
            this.dataList1 = res.data
            this.totalAmountD = res.calculation[0]?.totalAmount?.toFixed(2);
            this.totalDiscountD = res.calculation[0]?.totalDiscount?.toFixed(2);
            this.totalDueAmountD = res.calculation[0]?.totalDueAmount?.toFixed(2);
            this.totalGstAmountD = res.calculation[0]?.totalGstAmount?.toFixed(2);
            this.totalPaidAmountD = res.calculation[0]?.totalPaidAmount?.toFixed(2);
            this.totalQtyD = res.calculation[0]?.totalQty;
            this.totalSubTotalD = res.calculation[0].totalSubTotal?.toFixed(2);
          } else {
            this.as.errorToast(res.message)
          }
          this.sp.hide()
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    }
    else{
     this.sp.show()
      let Parem = '';
      if (this.data1.ShopID != 0) {
        Parem = Parem + ' and pm.ShopID IN ' + `(${this.data1.ShopID})`;
      }
    
      if (this.data1.CustomerID != 0) {
        Parem = Parem + ' and pm.CustomerID = ' + `(${this.data1.CustomerID})`;
      }
    
      const subs: Subscription = this.sup.getCustomerAllDuePayment(Parem).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.as.successToast(res.message)
            this.dataList1All = res.data
            this.totalDueAmountDAll = res.calculation?.totalBillAmount?.toFixed(2);
            this.totalPaidAmountDAll = res.calculation?.totalPaidAmount?.toFixed(2);
            this.totalAmountDAll = res.calculation?.totalBalanceAmount?.toFixed(2);
     
          } else {
            this.as.errorToast(res.message)
          }
          this.sp.hide()
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    }}
    

    
    
    FromReset1() {
      this.data1 = {
       FilterTypes:'InvoiceWise', FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'),ShopID: 0, CustomerID: 0
      };
      this.dataList1 = [];
    }
    
    exportAsXLSX1(): void {
      let element = document.getElementById('CustomerDuaExcel');
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
      XLSX.writeFile(wb, 'Customer_DuaAmonut_Report.xlsx');
    }
    
    print1() {
      let shop = this.shopList
      this.selectsShop = shop.filter((s: any) => s.ID === Number(this.selectedShop[0]));
    
      let printContent: any = document.getElementById('print-content1');
      let printWindow: any = window.open('pp', '_blank');
      printWindow.document.write(`
      <html>
        <head>
        <title>Customer Due Report</title>
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


    
      getRegisterSale() {

        // let FromDate = moment(this.dataRegister.FromDate).format('YYYY-MM-DD')
        // let ToDate =  moment(this.dataRegister.ToDate).endOf('month').format('YYYY-MM-DD');
     
          let dtm = {
            filterType : this.FilterTypeR,
            FromDate : moment(this.dataRegister.FromDate).format('YYYY-MM-DD'),
            ToDate :  moment(this.dataRegister.ToDate).endOf('month').format('YYYY-MM-DD'),
          }

        const subs: Subscription = this.bill.getProfitReport(dtm).subscribe({
          next: (res: any) => {
            if (res.success) {
              this.as.successToast(res.message)
              this.RegisterList = res.data
              this.RegisterTotalSale = res.header.TotalSale
              this.RegisterTotalPurchase = res.header.TotalPurchase
              this.RegisterTotalExpense= res.header.TotalExpense
              this.RegisterProfit= res.header.Profit

       
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
}
