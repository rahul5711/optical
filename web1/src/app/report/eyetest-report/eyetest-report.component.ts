import { Component, OnInit } from '@angular/core';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { Subscription } from 'rxjs';
import { ShopService } from 'src/app/service/shop.service';
import * as moment from 'moment';
import { NgxSpinnerService } from 'ngx-spinner';
import * as XLSX from 'xlsx';
import { EmployeeService } from 'src/app/service/employee.service';
import { CustomerService } from 'src/app/service/customer.service';

@Component({
  selector: 'app-eyetest-report',
  templateUrl: './eyetest-report.component.html',
  styleUrls: ['./eyetest-report.component.css']
})
export class EyetestReportComponent implements OnInit {
  shop:any =JSON.parse(localStorage.getItem('shop') || '') ;
  user:any =JSON.parse(localStorage.getItem('user') || '') ;
  permission = JSON.parse(localStorage.getItem('permission') || '[]');
  companySetting = JSON.parse(localStorage.getItem('companysetting') || '');

  constructor(
    private ss: ShopService,
    public as: AlertService,
    private emp: EmployeeService,
    private sp: NgxSpinnerService,
    private cs: CustomerService,

  ) { }

  shopList:any;
  employeeList:any;
  eyeList:any;

  data: any =  { 
    FilterTypes:'CreatedOn', FromDate: moment().startOf('month').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 'All',EmployeeID:'All',
    Type:'spectacle_rx'
  };

  viewEyeTestReport = false
  editEyeTestReport = false
  addEyeTestReport = false
  deleteEyeTestReport = false


  
  ngOnInit(): void {
    this.permission.forEach((element: any) => {
      if (element.ModuleName === 'EyeTestReport') {
        this.viewEyeTestReport = element.View;
        this.editEyeTestReport = element.Edit;
        this.addEyeTestReport = element.Add;
        this.deleteEyeTestReport = element.Delete;
      }
    });

    if(this.user.UserGroup === 'Employee'){
      this.shopList  = this.shop;
      this.data.ShopID = this.shopList[0].ShopID
    }else{
      this.dropdownShoplist();
    }
    this.dropdownUserlist()
  }

  dropdownShoplist(){
    const subs: Subscription = this.ss.dropdownShoplist('').subscribe({
      next: (res: any) => {
        this.shopList  = res.data
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  dropdownUserlist(){
    this.sp.show()
    const subs: Subscription = this.emp.dropdownUserlist('').subscribe({
      next: (res: any) => {
        if(res.success){
          this.employeeList  = res.data
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  searchData(){
    this.sp.show()
    let body = {
      From:this.data.FromDate,
      To:this.data.ToDate,
      Employee:this.data.EmployeeID,
      ShopID:this.data.ShopID,
      Type:this.data.Type,
    }

    const subs: Subscription =  this.cs.getEyeTestingReport(body).subscribe({
      next: (res: any) => {
        if(res.success){
          this.as.successToast(res.message)
          this.eyeList = res.data
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  dateFormat(date:any){
    return moment(date).format(`${this.companySetting.DateFormat}`);
  }

  FromReset(){
    this.data =  { 
      FilterTypes:'CreatedOn', FromDate: moment().startOf('month').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 'All',EmployeeID:'All',
      Type:'spectacle_rx'
    };
    this.eyeList = [];
  }

  exportEx(): void
  {
    /* pass here the table id */
    let element = document.getElementById('exportsss');
    const ws: XLSX.WorkSheet =XLSX.utils.table_to_sheet(element);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    /* save to file */  
    XLSX.writeFile(wb, 'customer.xlsx');
 
  }

  
}
