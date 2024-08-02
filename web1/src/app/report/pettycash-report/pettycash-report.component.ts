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

  data: any = {
    FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, UserID: '',
    UserType: '', CashType: 0,CreditType:0
  };

  payeeList: any = []
  shopList: any = []

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

}
