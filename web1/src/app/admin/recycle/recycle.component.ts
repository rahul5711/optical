import { Component, Input, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';
import { EmployeeService } from 'src/app/service/employee.service';
import { ShopService } from 'src/app/service/shop.service';
import { LedgeService } from 'src/app/service/ledge.service';

@Component({
  selector: 'app-recycle',
  templateUrl: './recycle.component.html',
  styleUrls: ['./recycle.component.css']
})
export class RecycleComponent implements OnInit {

  company = JSON.parse(localStorage.getItem('company') || '');
  shop = JSON.parse(localStorage.getItem('shop') || '');
  user = JSON.parse(localStorage.getItem('user') || '');
  companySetting = JSON.parse(localStorage.getItem('companysetting') || '');
  selectedShop = JSON.parse(localStorage.getItem('selectedShop') || '');
  permission = JSON.parse(localStorage.getItem('permission') || '[]');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public as: AlertService,
    private sp: NgxSpinnerService,
    private modalService: NgbModal,
    private emp: EmployeeService,
    private ss: ShopService,
    private ledge: LedgeService,
  ) { }

  data:any = { FromDate:'', To:'',Employee:'',ShopName:''}

  employeeList:any = []
  shopList:any = []

  customerlist = false
  billlist = false
  expenselist = false
  purchaselist = false

  customerData:any = []
  expenseData:any = []
  billData:any = []
  product_delete_qty:any=[]
  product_delete_amt:any=[]

  ngOnInit(): void {
    this.getEmployee();
    this.dropdownShoplist();
  }

  getEmployee() {
    this.sp.show();
    const subs: Subscription = this.emp.dropdownUserlist('').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.employeeList = res.data.sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
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

  reset(){
    this.data ={ FromDate:'', To:'',Employee:'',ShopName:''}
    this.customerData = []
    this.expenseData = []
    this.billData  = []
    
    this.customerlist = false
    this.billlist = false
    this.expenselist = false
    this.purchaselist = false
  }


  getList(mode:any){
     if(mode == 'Customer'){
      this.customerlist = true
      this.billlist = false
      this.expenselist = false
      this.purchaselist = false
     }
     if(mode == 'Bill'){
      this.customerlist = false
      this.billlist = true
      this.expenselist = false
      this.purchaselist = false
     }
     if(mode == 'Expenses'){
      this.customerlist = false
      this.billlist = false
      this.expenselist = true
      this.purchaselist = false
     }
     if(mode == 'Purchase'){
      this.customerlist = false
      this.billlist = false
      this.expenselist = false
      this.purchaselist = true
     }
  }

  onsubmit(){

    let dtm = {
      FromDate: this.data.FromDate,
      ToDate: this.data.ToDate ,
      UserID: this.data.Employee,
      ShopID: this.data.ShopID ,
    }
     delete dtm.ShopID

    const subs: Subscription = this.ledge.getRecycleData(dtm).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.as.successToast(res.message)
          this.customerData = res.customerData
          this.expenseData = res.expenseData
          this.billData = res.billData
          this.product_delete_qty = res.billData.product_delete_qty
          this.product_delete_amt = res.billData.product_delete_amt
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
