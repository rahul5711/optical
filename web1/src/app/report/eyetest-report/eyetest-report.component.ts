import { Component, OnInit } from '@angular/core';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { Subscription } from 'rxjs';
import { ShopService } from 'src/app/service/shop.service';
import * as moment from 'moment';
import { NgxSpinnerService } from 'ngx-spinner';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-eyetest-report',
  templateUrl: './eyetest-report.component.html',
  styleUrls: ['./eyetest-report.component.css']
})
export class EyetestReportComponent implements OnInit {

  constructor(
    private ss: ShopService,
    public as: AlertService,
  ) { }

  shopList:any;

  data: any =  { 
    FilterTypes:'CreatedOn', FromDate: moment().startOf('month').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0
  };

  ngOnInit(): void {
    this. dropdownShoplist();
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

}
