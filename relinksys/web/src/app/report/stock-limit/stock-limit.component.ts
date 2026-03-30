import { Component, OnInit } from '@angular/core';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { Subscription } from 'rxjs';
import { ShopService } from 'src/app/service/shop.service';
import * as moment from 'moment';
import { NgxSpinnerService } from 'ngx-spinner';
import * as XLSX from 'xlsx';
import { EmployeeService } from 'src/app/service/employee.service';
import { CustomerService } from 'src/app/service/customer.service';
import { BillService } from 'src/app/service/bill.service';
import { PurchaseService } from 'src/app/service/purchase.service';
import { SupplierService } from 'src/app/service/supplier.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-stock-limit',
  templateUrl: './stock-limit.component.html',
  styleUrls: ['./stock-limit.component.css']
})
export class StockLimitComponent implements OnInit {

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
    private bill: BillService,
    private ps: PurchaseService,
    private sup: SupplierService,
    private modalService: NgbModal,
  ) { }

  shopList:any;
  employeeList:any;
  dataList:any;
  supplierDropList:any;
searchValue:any

  data: any =  { 
     FromDate: moment().startOf('month').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 'All',
  };

orderSupplier: any = {
    SupplierID: null, ProductTypeName: '', ProductName: '', Quantity: 0, OrderDate:'', OrderNumber:'',
  }

  ngOnInit(): void {
     if(this.user.UserGroup === 'Employee'){
      this.shopList  = this.shop;
      this.data.ShopID = this.shopList[0].ShopID
    }else{
      // this.dropdownShoplist();
      this.bill.shopList$.subscribe((list:any) => {
        this.shopList = list
      });
    }
    // this.dropdownUserlist()
      this.bill.employeeList$.subscribe((list:any) => {
        this.employeeList  = list
      });
  }


    getdropdownSupplierlist() {
      this.sp.show();
      const subs: Subscription = this.sup.dropdownSupplierlist('').subscribe({
        next: (res: any) => {
          if (res.success) {
            this.supplierDropList = res.data;
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
       let body = {
         From:this.data.FromDate,
         To:this.data.ToDate,
         ShopID:this.data.ShopID,
       }
   
       const subs: Subscription =  this.ps.getStockLimitAlertReport(body).subscribe({
         next: (res: any) => {
           if(res.success){
             this.as.successToast(res.message)
             this.dataList = res.data
           }else{
             this.as.errorToast(res.message)
           }
           this.sp.hide()
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
   
     FromReset(){
       this.data =  { 
         FilterTypes:'CreatedOn', FromDate: moment().startOf('month').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 'All',EmployeeID:'All',
         Type:'spectacle_rx'
       };
       this.dataList = [];
     }

       onChange(event: { toUpperCase: () => any; toTitleCase: () => any; }) {
    if (this.companySetting.DataFormat === '1') {
      event = event.toUpperCase()
    } else if (this.companySetting.DataFormat == '2') {
      event = event.toTitleCase()
    }
    return event;
  }

  openModal(content1: any, data:any) {
    this.modalService.open(content1, { centered: true, backdrop: 'static', keyboard: false, size: 'xxl' });
    this.orderSupplier.ProductName = data.ProductName
    this.orderSupplier.ProductTypeName = data.ProductTypeName
    this.getdropdownSupplierlist()
  }
}
