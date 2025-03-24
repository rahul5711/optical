import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { NgxSpinnerService } from 'ngx-spinner';
import { AlertService } from 'src/app/service/helpers/alert.service';
import * as moment from 'moment';
import { CompanyService } from 'src/app/service/company.service';
import { ExcelService } from 'src/app/service/helpers/excel.service';

@Component({
  selector: 'app-plan-expiry',
  templateUrl: './plan-expiry.component.html',
  styleUrls: ['./plan-expiry.component.css']
})
export class PlanExpiryComponent implements OnInit {
  @ViewChild('searching') searching: ElementRef | any;
  term = "";
  loggedInUser:any = localStorage.getItem('LoggedINUser');

  filterType:any = 'Expiry'
  evn = environment;
  stringUrl: string | undefined;
  dataList: any;
  sumOfCaAmount:any=0;
  sumNoOfShops:any=0;
  filterList:any;

  filter: any =  
  { FromDate: moment().startOf('month').format('YYYY-MM-DD'), ToDate: moment().endOf('month').format('YYYY-MM-DD'), CompanyID: 0, CompanyStatus:2 };
  
  dropComlist: any
  searchValue:any
  todaydate: any;

  constructor(
    private sp: NgxSpinnerService,
    public as: AlertService,
    private cs: CompanyService,
    private excelService: ExcelService,
  ) { }

  ngOnInit(): void {
    this.dropdownShoplist()
  }

  dropdownShoplist() {
    this.sp.show()
    const subs: Subscription = this.cs.dropdownlist('').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.dropComlist = res.data
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }


  searchData(){
    this.sp.show()

    let Parem = '';
    this.todaydate = moment(new Date()).format('YYYY-MM-DD');

    if(this.filterType == 'Expiry'){
      if (this.filter.FromDate !== '' && this.filter.FromDate !== null) {
        let FromDate = moment(this.filter.FromDate).format('YYYY-MM-DD')
        Parem = Parem + ' and DATE_FORMAT(company.CancellationDate, "%Y-%m-%d") between ' + `'${FromDate}'`;
      }
    }

    if(this.filterType == 'Subscription'){
      if (this.filter.FromDate !== '' && this.filter.FromDate !== null) {
        let FromDate = moment(this.filter.FromDate).format('YYYY-MM-DD')
        Parem = Parem + ' and DATE_FORMAT(company.EffectiveDate, "%Y-%m-%d") between ' + `'${FromDate}'`;
      }
    }

    if (this.filter.ToDate !== '' && this.filter.ToDate !== null) {
      let ToDate = moment(this.filter.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'`;
    }

    if (this.filter.CompanyID != 0) {
      Parem = Parem + ' and company.ID = ' + `${this.filter.CompanyID}`;
    }
    if (this.filter.CompanyStatus != 2) {
      Parem = Parem + ' and company.Status = ' + `${this.filter.CompanyStatus}`;
    }


    const subs: Subscription = this.cs.getCompanyExpirylist(Parem).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.as.successToast(res.message)
          this.dataList = res.data
          this.sumOfCaAmount = res.sumOfCaAmount
          this.sumNoOfShops = res.sumNoOfShops
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
    this.filter =  {  FromDate: moment().startOf('month').format('YYYY-MM-DD'), ToDate: moment().endOf('month').format('YYYY-MM-DD'), CompanyID: 0, CompanyStatus:2 };
    this.dataList = [];
    this.filterType = 'Expiry'
    this.sumOfCaAmount=0
    this.sumNoOfShops=0
  }


  exportAsXLSX(): void {
    // let data = this.dataList.map((e: any) => {
    //   return {
    //     Name: e.Name,
    //     MobileNo1: e.MobileNo1,
    //     MobileNo2: e.MobileNo2,
    //     GSTType: e.GSTType,
    //     GSTNo: e.GSTNo,
    //     PhoneNo: e.PhoneNo,
    //     Email: e.Email,
    //     Address: e.Address,
    //     ContactPerson: e.ContactPerson,
    //     CreatedPerson: e.CreatedPerson,
    //     UpdatedPerson: e.UpdatedPerson,
    //   }
    // })
    this.excelService.exportAsExcelFile(this.dataList, 'Company_Plan_list');
  }
}
