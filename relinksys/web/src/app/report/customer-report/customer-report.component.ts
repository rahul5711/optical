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

  data: any = {
    FromDate: moment().startOf('month').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, Type: 0
  };

  performanceList: any;
  currentPage = 1;
  itemsPerPage = 10;
  pageSize!: number;
  collectionSize = 0
  page = 4;

  ngOnInit(): void {

    // this.exportCustomerPower();
    if (this.user.UserGroup === 'Employee') {
      this.shopList = this.shop;
      this.data.ShopID = this.shopList[0].ShopID
    } else {
      // this.dropdownShoplist();
      this.bill.shopList$.subscribe((list:any) => {
        this.shopList = list
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
}
