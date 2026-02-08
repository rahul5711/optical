
import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';
import { BillService } from 'src/app/service/bill.service';
import { ProductService } from 'src/app/service/product.service';
import { SupplierService } from 'src/app/service/supplier.service';
import { ShopService } from 'src/app/service/shop.service';
import { CustomerService } from 'src/app/service/customer.service';

@Component({
  selector: 'app-order-request',
  templateUrl: './order-request.component.html',
  styleUrls: ['./order-request.component.css']
})
export class OrderRequestComponent implements OnInit {
  env = environment;
  company = JSON.parse(localStorage.getItem('company') || '');
  shop: any = JSON.parse(localStorage.getItem('shop') || '');
  selectedShop: any = JSON.parse(localStorage.getItem('selectedShop') || '');
  user: any = JSON.parse(localStorage.getItem('user') || '');
  companySetting = JSON.parse(localStorage.getItem('companysetting') || '');
  public parseMeasurementID(v: any): any[] {
    return JSON.parse(v.MeasurementID || '[]');
  }
  myControl = new FormControl('All');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    public as: AlertService,
    private sp: NgxSpinnerService,
    public bill: BillService,
    private ps: ProductService,
    private modalService: NgbModal,
    private ss: ShopService,
    private sup: SupplierService,
    private cs: CustomerService,
  ) { }

  searchValue: any
  data: any = {
    FromDate: '', ToDate: '', supplierID: '', ShopID: '', stringProductName: ''
  }
  supplierList: any = []
  shopList: any = []
  filteredOptions: any = []

  ngOnInit(): void {
    this.sp.show()
    if (this.user.UserGroup === 'Employee') {
      this.shopList = this.shop;
      this.data.ShopID = this.shopList[0].ShopID
    } else {
      // this.dropdownShoplist();
      this.bill.shopList$.subscribe((list: any) => {
        this.shopList = list
      });
    }
    // this.getSupplierPo();
    // this.dropdownSupplierlist();
    this.bill.supplierList$.subscribe((list: any) => {
      this.supplierList = list.sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
    });
    this.data.FromDate = moment().format('YYYY-MM-DD');
    this.data.ToDate = moment().format('YYYY-MM-DD');
    this.sp.hide()
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

  dropdownSupplierlist() {
    const subs: Subscription = this.sup.dropdownSupplierlist('').subscribe({
      next: (res: any) => {
        this.supplierList = res.data.sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  dateFormat(date: any): string {
    if (date == null || date == "") {
      return '0000-00-00'; // Default Value
    }
    return moment(date).format(this.companySetting?.DateFormat || 'YYYY-MM-DD');
  }

  onChange(event: { toUpperCase: () => any; toTitleCase: () => any; }) {
    if (this.companySetting.DataFormat === '1') {
      event = event.toUpperCase()
    } else if (this.companySetting.DataFormat == '2') {
      event = event.toTitleCase()
    }
    return event;
  }


  customerSearch(searchKey: any, mode: any, type: any) {
    this.filteredOptions = [];
    let dtm: any = { Name: '', MobileNo1: '', Address: '', Sno: '' };

    if (searchKey.length >= 2 && mode === 'Name') {
      const isNumeric = /^\d+$/.test(searchKey);
      if (isNumeric) {
        dtm.MobileNo1 = searchKey;
      } else {
        dtm.Name = searchKey;
      }
    }

    const subs: Subscription = this.cs.customerSearch(dtm).subscribe({
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
      this.data.CustomerID = ID
    }
    if (mode === 'All') {
      this.filteredOptions = []
      this.data.CustomerID = 'All'
    }
  }

}
