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
  selector: 'app-recycle-bin',
  templateUrl: './recycle-bin.component.html',
  styleUrls: ['./recycle-bin.component.css']
})
export class RecycleBinComponent implements OnInit {

  constructor(
    private ss: ShopService,
    public as: AlertService,
    public supps: SupportService,
    public sp: NgxSpinnerService,
    public billService: BillService,
  ) { }

  data = {Type:'',FromDate:'',ToDate:'',UserID:'',ShopID:''}
  userList:any=[]
  shopList:any=[]
  dataList:any=[]

  ngOnInit(): void {
    this.dropdownShoplist()
    this.getEmployee()
    // this.getRecycleBinData()
    // this.data.FromDate = moment(this.data.FromDate).format('YYYY-MM-DD')
    // this.data.ToDate = moment(this.data.ToDate).format('YYYY-MM-DD')
  }

  
  getEmployee() {
    this.sp.show();
    const subs: Subscription = this.billService.getEmployee().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.userList = res.data;
        } else {
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

  typechange(){
    this.dataList = []
  }

  getRecycleBinData() {
      this.sp.show()
      let dtm = {
        FromDate: moment(this.data.FromDate).format('YYYY-MM-DD'),
        ToDate: moment(this.data.ToDate).format('YYYY-MM-DD'),
        ShopID: this.data.ShopID ? this.data.ShopID : 0,
        UserID: this.data.UserID ? this.data.UserID : 0,
        Type: this.data.Type ? this.data.Type : 0,
      }
  
      const subs: Subscription = this.billService.getRecycleBinData(dtm).subscribe({
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
  
}
