
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


@Component({
  selector: 'app-supplier-po',
  templateUrl: './supplier-po.component.html',
  styleUrls: ['./supplier-po.component.css']
})
export class SupplierPoComponent implements OnInit {
  company = JSON.parse(localStorage.getItem('company') || '');
  shop:any =JSON.parse(localStorage.getItem('shop') || '') ;
  selectedShop:any =JSON.parse(localStorage.getItem('selectedShop') || '') ;
  user:any =JSON.parse(localStorage.getItem('user') || '') ;
  companySetting = JSON.parse(localStorage.getItem('companysetting') || '');

  public parseMeasurementID(v: any): any[] {
    return JSON.parse(v.MeasurementID || '[]');
  }
  env = environment;
  searchValue:any
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
  ) { }

  data = { ID: '', FromDate: '', ToDate: '', SupplierID: 'All', ShopID: 'All', stringProductName: '' }

  sendData: any = { supplier: null, filterList: null, supplierList: null };

  mode = "Unassigned";
  shopList: any = []
  supplierList: any = []
  orderList: any = []
  filtersList: any = [];

  supplier: any;
  supplierID = 'All'

  ID = 0
  currentPage = 1;
  itemsPerPage = 10;
  pageSize!: number;
  collectionSize = 0
  page = 4;

  orderSupplier = false
  orderSupplierbtn = true
  orderComplete = false
  Orderpower: any = []
  multiCheck: any 
  supllierPDF = ''

  ngOnInit(): void {
    this.sp.show()
    if(this.user.UserGroup === 'Employee'){
      this.shopList  = this.shop;
      this.data.ShopID = this.shopList[0].ShopID
    }else{
      this.dropdownShoplist();
    }
    // this.getSupplierPo();
    this.dropdownSupplierlist();
    this.sp.hide()
  }

  changePagesize(num: number): void {
    this.itemsPerPage = this.pageSize + num;
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

  Reset() {
    this.data = { ID: '', FromDate: '', ToDate: '', SupplierID: 'All', ShopID: 'All', stringProductName: '' }
    this.Search(this.mode);
  }

  multicheck($event:any) {
    for (var i = 0; i < this.orderList.length; i++) {
      const index = this.orderList.findIndex(((x: any) => x === this.orderList[i]));
      if (this.orderList[index].Sel === 0 || this.orderList[index].Sel === null || this.orderList[index].Sel === undefined) {
        this.orderList[index].Sel = 1;
        this.orderSupplierbtn = false
      } else {
        this.orderList[index].Sel = 0;
        this.orderSupplierbtn = true
      }
    }
    console.log($event);
  }

  validate(v:any,event:any) {
    if (v.Sel === 0 || v.Sel === null || v.Sel === undefined) {
      v.Sel = 1;
      this.orderSupplierbtn = false
    } else {
      v.Sel = 0;
      this.orderSupplierbtn = true
    }
  }

  getSupplierPo() {
    this.sp.show()
    this.orderSupplier = true
    let Parem = '';
    if(this.user.UserGroup === 'Employee'){
      Parem = Parem + ' and barcodemasternew.ShopID = ' + this.data.ShopID;
    }else{
      Parem = '';
    }
    const subs: Subscription = this.bill.getSupplierPo(this.ID, Parem).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.orderList = res.data
          this.multiCheck = false
        } else {
          this.as.errorToast(res.message)
          Swal.fire({
            position: 'center',
            icon: 'warning',
            title: 'Opps !!',
            text: res.message,
            showConfirmButton: true,
            backdrop: false,
          })
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  openModal(content: any) {
    this.sp.show()
    this.modalService.open(content, { centered: true, backdrop: 'static', keyboard: false, size: 'sm' });
    this.sp.hide()
  }

  Search(mode: any) {
    this.sp.show()

    let ID = 0
    let Parem = '';

    if (this.data.FromDate !== '' && this.data.FromDate !== null) {
      let FromDate = moment(this.data.FromDate).format('YYYY-MM-DD')
      Parem = Parem + 'and DATE_FORMAT(billmaster.BillDate, "%Y-%m-%d")  between ' + `'${FromDate}'`;
    }

    if (this.data.ToDate !== '' && this.data.ToDate !== null) {
      let ToDate = moment(this.data.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'`;
    }
  
    if (this.supplierID !== null && this.supplierID !== 'All') {
      Parem = Parem + ' and barcodemasternew.SupplierID = ' + this.supplierID;
    }

    if (this.data.ShopID !== null && this.data.ShopID !== 'All') {
      Parem = Parem + ' and barcodemasternew.ShopID = ' + this.data.ShopID;
    }

    if (this.data.stringProductName !== '') {
      Parem = Parem + ' and billdetail.ProductName = ' +  `'${this.data.stringProductName}'`;
    }

    if (this.orderComplete === false) {
      this.orderSupplier = true
      const subs: Subscription = this.bill.getSupplierPo(ID, Parem).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.orderList = res.data
            this.as.successToast(res.message)
          } else {
            this.as.errorToast(res.message)
          }
          this.sp.hide()
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    } else {
      const dtm = {
        currentPage: 1,
        itemsPerPage: 50000,
        Parem: Parem
      }
      this.orderComplete = true
      const subs: Subscription = this.bill.getSupplierPoList(dtm).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.collectionSize = 1;
            this.page = 1;
            this.orderList = res.data;
            this.as.successToast(res.message)
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

  assignSupplierPo(mode: any) {
    this.sp.show()
    this.filtersList = this.orderList.filter((d: { Sel: number; }) => d.Sel === 1);

    if (this.filtersList.length > 0) {
      switch (mode) {
        case "Assign":
          this.filtersList.forEach((element: any) => {
            element.BillID = this.data.ID
            element.SupplierID = this.supplierID;
          });
          this.orderSupplier = true
          this.orderComplete = false
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Your Per-Order Supplier To Assign !!',
            showConfirmButton: false,
            timer: 1200
          })
          break;
      }

      let Body = this.filtersList;

      const subs: Subscription = this.bill.assignSupplierPo(Body).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.modalService.dismissAll()
            this.multiCheck = true
            this.supplierID = ''
            this.assignSupplierDoc()
            this.getSupplierPo()
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
  }
  
  assignSupplierPoCancel(mode: any) {
    this.sp.show()
    this.filtersList = this.orderList.filter((d: { Sel: number; }) => d.Sel === 1);

    if (this.filtersList.length > 0) {
      switch (mode) {
        case "Cancel":
          this.filtersList.forEach((element: any) => {
            this.data.ID = element.BillID;
            element.SupplierID = '0';
            element.SupplierDocNo = null
          });
          this.orderSupplier = false
          this.orderComplete = true
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Your Order Cancel !!',
            showConfirmButton: false,
            timer: 1200
          })
          break;
      }

      let Body = this.filtersList;

      const subs: Subscription = this.bill.assignSupplierPo(Body).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.multiCheck = true
            this.getList()
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
  }

  getList() {
    this.sp.show()
    const dtm = {
      currentPage: this.currentPage,
      itemsPerPage: this.itemsPerPage
    }
    const subs: Subscription = this.bill.getSupplierPoList(dtm).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.collectionSize = res.count;
          this.orderList = res.data;
          this.as.successToast(res.message)
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  Unassigned() {
    this.getSupplierPo()
    this.orderSupplier = true
    this.orderComplete = false
    if(this.user.UserGroup === 'Employee'){
      this.data = { ID: '', FromDate: '', ToDate: '', SupplierID: 'All', ShopID: this.data.ShopID, stringProductName: '' }
    }else{
      this.data = { ID: '', FromDate: '', ToDate: '', SupplierID: 'All', ShopID: 'All', stringProductName: '' }
    }
  }

  Assigned() {
    this.orderSupplier = false
    this.orderComplete = true
    if(this.user.UserGroup === 'Employee'){
      this.data = { ID: '', FromDate: '', ToDate: '', SupplierID: 'All', ShopID: this.data.ShopID, stringProductName: '' }
    }else{
      this.getList()
      this.data = { ID: '', FromDate: '', ToDate: '', SupplierID: 'All', ShopID: 'All', stringProductName: '' }
    }
  }

  openModal1(content1: any, data: any) {
    this.sp.show()
    if (data.MeasurementID == "undefined") {
      Swal.fire({
        icon: 'warning',
        title: 'Customer Power Not Be Found',
        text: '',
        footer: '',
        backdrop: false,
      });
    } else {
      this.Orderpower = JSON.parse(data.MeasurementID)
      this.modalService.open(content1, { centered: true, backdrop: 'static', keyboard: false, size: 'md' });
    }
    this.sp.hide()
  }

  assignSupplierDoc() {
    this.sp.show()
    this.filtersList = this.orderList.filter((d: { Sel: number; }) => d.Sel === 1);
          this.filtersList.forEach((element: any) => {
            this.data.ID = element.BillID 
            this.supplierID =  element.SupplierID 
            element.Sel = element.Sel;
            if(element.SupplierDocNo === '' || element.SupplierDocNo === null || element.SupplierDocNo === undefined){
              element.SupplierDocNo = 'NA'
            }else{
              element.SupplierDocNo = element.SupplierDocNo;
            }
          });
      let Body = this.filtersList;

      const subs: Subscription = this.bill.assignSupplierDoc(Body).subscribe({
        next: (res: any) => {
          if (res.success) {
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

  dateFormat(date:any){
    return moment(date).format(`${this.companySetting.DateFormat}`);
  }

  AssignSupplierPDF(){
    this.sp.show();
    this.filtersList = this.orderList.filter((d: any) => d.Sel === 1);
      if(this.filtersList.length > 0){
        this.filtersList.forEach((e: any) => {
          e.Remark = e.Remark === undefined ? '' : e.Remark;
      });
        let body: any = { productList: this.filtersList }
         const subs: Subscription = this.bill.AssignSupplierPDF(body).subscribe({
           next: (res: any) => {
             if (res) {
               const url = this.env.apiUrl + "/uploads/" + res;
               this.supllierPDF = url
               window.open(url, "_blank");
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

  onChange(event: { toUpperCase: () => any; toTitleCase: () => any; }) {
    if (this.companySetting.DataFormat === '1') {
      event = event.toUpperCase()
    } else if (this.companySetting.DataFormat == '2') {
      event = event.toTitleCase()
    }
    return event;
  }

  sendWhatsapp(mode: any) {
    let temp = JSON.parse(this.companySetting.WhatsappSetting);
    let s: any = []

    this.supplierList.forEach((sk: any) => {
      if (this.filtersList[0].SupplierID === sk.ID) {
        s.push(sk)
      }
    })

    this.shop = this.shop.filter((sh: any) => sh.ID === Number(this.selectedShop[0]));

    let WhatsappMsg = '';

    WhatsappMsg = 'Lens Detail';
    var msg = `*Hi ${s[0].Name},*%0A` +
      `${WhatsappMsg}%0A` +
      `*Customer Lens PDF*: ${this.supllierPDF}%0A` +
      `*${this.shop[0].Name}* - ${this.shop[0].AreaName}%0A${this.shop[0].MobileNo1}%0A${this.shop[0].Website}`;


    if (s[0].MobileNo1 != '') {
      var mob = this.company.Code + s[0].MobileNo1;
      var url = `https://wa.me/${mob}?text=${msg}`;
      window.open(url, "_blank");
    } else {
      Swal.fire({
        position: 'center',
        icon: 'warning',
        title: '<b>' + s[0].Name + '</b>' + ' Mobile number is not available.',
        showConfirmButton: true,
      })
    }
  }

}
