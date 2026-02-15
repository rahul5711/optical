
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
import { CalculationService } from 'src/app/service/helpers/calculation.service';
import { PurchaseService } from 'src/app/service/purchase.service';

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
    public purchase: PurchaseService,
    private ps: ProductService,
    private modalService: NgbModal,
    private ss: ShopService,
    private sup: SupplierService,
    private cs: CustomerService,
    public calculation: CalculationService,
  ) { }

  searchValue: any
  PurchaseMaster: any = {
     ID: 0, SupplierID: null, SupplierName: null, CompanyID: null, GSTNo: null, ShopID: 0, ShopName: null, PurchaseDate: null,
    PaymentStatus: 'Unpaid', InvoiceNo: null, Status: 1, Quantity: 0, SubTotal: 0, DiscountAmount: 0,
    GSTAmount: 0, TotalAmount: 0, DueAmount: 0, PStatus: 0, FromDate: '', ToDate: '',
    CreatedBy: null, CreatedOn: null, UpdatedBy: null, UpdatedOn: null
  }

   data = { PurchaseMaster: null, PurchaseDetail: {} };

  supplierList: any = []
  shopList: any = []
  filteredOptions: any = []
  filterdata:any = []
  filterLists:any = []
  gst_detail: any = [];
  gstList: any;
  currentTime = ''

  ngOnInit(): void {
    this.sp.show()
    if (this.user.UserGroup === 'Employee') {
      this.shopList = this.shop;
      this.PurchaseMaster.ShopID = this.shopList[0].ShopID
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

     this.bill.taxLists$.subscribe((list:any) => {
      this.gstList = list
      this.gst_detail = [];
         list.forEach((ele: any) => {
            if (ele.Name !== '') {
              let obj = { GSTType: '', Amount: 0 };
              obj.GSTType = ele.Name;
              this.gst_detail.push(obj);
            }
          })
    });
    this.PurchaseMaster.FromDate = moment().format('YYYY-MM-DD');
    this.PurchaseMaster.ToDate = moment().format('YYYY-MM-DD');
        this.currentTime = new Date().toLocaleTimeString('en-US', { hourCycle: 'h23' })
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
      this.PurchaseMaster.CustomerID = ID
    }
    if (mode === 'All') {
      this.filteredOptions = []
      this.PurchaseMaster.CustomerID = 'All'
    }
  }


     Search(){
 let Params = '';

    if (this.PurchaseMaster.FromDate !== '' && this.PurchaseMaster.FromDate !== null ) {
      let FromDate = moment(this.PurchaseMaster.FromDate).format('YYYY-MM-DD')
      Params = Params + 'and DATE_FORMAT(billmaster.BillDate, "%Y-%m-%d")  between ' + `'${FromDate}'`;
    }

    if (this.PurchaseMaster.ToDate !== '' && this.PurchaseMaster.ToDate !== null ) {
      let ToDate = moment(this.PurchaseMaster.ToDate).format('YYYY-MM-DD')
      Params = Params + ' and ' + `'${ToDate}'`;
    }

     if (this.PurchaseMaster.SupplierID !== null && this.PurchaseMaster.SupplierID !== 'All') {
      Params = Params + ' and orderrequest.SupplierID = ' + this.PurchaseMaster.SupplierID;
    }

    if (this.PurchaseMaster.ShopID !== null && this.PurchaseMaster.ShopID !== 'All') {
      Params = Params + ' and orderrequest.OrderRequestShopID = ' + this.PurchaseMaster.ShopID;
    }

    //   if (this.PurchaseMaster.CustomerID !== null && this.PurchaseMaster.CustomerID !== 'All') {
    //   Params = Params + ' and billmaster.CustomerID = ' + this.PurchaseMaster.CustomerID;
    // }
   
    //   if (this.PurchaseMaster.stringProductName !== '') {
    //   Params = Params + ' and orderrequest.ProductName = ' + `'${this.PurchaseMaster.stringProductName}'`;
    // }
  
     const subs: Subscription = this.bill.orderformrequestfilter(Params).subscribe({
        next: (res: any) => {
          if (res.success) {
           this.filterdata = res.data
            this.as.successToast(res.message)
          } else {
            this.as.errorToast(res.message)
          }
          this.sp.hide()
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
     }

     
  multicheck() {
    for (var i = 0; i < this.filterdata.length; i++) {
      const index = this.filterdata.findIndex(((x: any) => x === this.filterdata[i]));
      if (this.filterdata[index].Sel == null || this.filterdata[index].Sel === 0 || this.filterdata[index].Sel === undefined) {
        this.filterdata[index].Sel = 1;
        this.calculateGrandTotal()
      } else {
        this.filterdata[index].Sel = 0;
        this.calculateGrandTotal()
      }
    }

  }

    calculateFields(fieldName: any, mode: any, item: any) {
      if (item.GSTType === 'None') {
        if (item.GSTPercentage != 0) {
          Swal.fire({
            position: 'center',
            icon: 'warning',
            title: 'Without GSTType the selected value will not be saved ',
            showConfirmButton: true,
            backdrop: false,
          })
          item.UpdateProduct = true
        }
      }
      this.calculation.calculateFields(fieldName, mode, item, '')
    }

  validate(v: any, event: any) {
    if (v.BillDetails.Sel === 0 || v.BillDetails.Sel === null || v.BillDetails.Sel === undefined) {
      v.BillDetails.Sel = 1;
      v.Sel = 1;
    } else {
      v.BillDetails.Sel = 0;
      v.Sel = 0;
    }
    this.calculateGrandTotal()
  }

    calculateGrandTotal() {
    let selectList: any = []
    this.filterdata.forEach((el: any) => {
      if (el.BillDetails.Sel === 1) {
        selectList.push(el.BillDetails)
      }
    })
    this.calculation.calculateGrandTotals(this.PurchaseMaster, selectList, '', this.gst_detail)
  }

     onSubmit(){
    // this.sp.show();
       this.filterLists = this.filterdata.filter((d: any) => d.Sel === 1);
       if (this.filterLists.length > 0) { }
   
       if (this.PurchaseMaster.InvoiceNo === null || this.PurchaseMaster.InvoiceNo === '') {
         Swal.fire({
           icon: 'error',
           title: 'Vendor Invoice No is required',
           text: ' Enter Vendor Invoice No ',
           footer: ''
         });
       } else {
         this.calculateGrandTotal();
         this.PurchaseMaster.ShopID = Number(this.selectedShop[0]);
         this.PurchaseMaster.SupplierID = Number(this.PurchaseMaster.SupplierID);
         this.PurchaseMaster.CompanyID = this.company.ID;
         this.PurchaseMaster.PurchaseDate = moment(this.PurchaseMaster.PurchaseDate).format('yyyy-MM-DD') + ' ' + this.currentTime;
         this.PurchaseMaster.DueAmount = this.PurchaseMaster.TotalAmount;
         delete this.PurchaseMaster.FromDate
         delete this.PurchaseMaster.ToDate
         this.data.PurchaseMaster = this.PurchaseMaster;
         this.filterLists.forEach((el: any) => {
           if (el.WholeSale === 0) {
             el.WholeSalePrice = 0
           }
         })
         console.log(this.filterLists);
         
         this.data.PurchaseDetail = JSON.stringify(this.filterLists);
           const subs: Subscription = this.purchase.orderPurchaseSoldProcess(this.data).subscribe({
                 next: (res: any) => {
                   if (res.success) {
                     this.router.navigate(['/inventory/purchase', res.data])
                   } else {
                     this.as.errorToast(res.message)
                   }
                   this.sp.hide();
                 },
                 error: (err: any) => console.log(err.message),
                 complete: () => subs.unsubscribe(),
               });
     }
   
       
    }


}
