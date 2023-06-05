
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
  supplierID: any

  ID = 0
  currentPage = 1;
  itemsPerPage = 10;
  pageSize!: number;
  collectionSize = 0
  page = 4;

  orderSupplier = false
  orderComplete = false
  Orderpower: any = []
  ngOnInit(): void {
    this.sp.show()
    this.dropdownShoplist();
    this.dropdownSupplierlist();
    this.getSupplierPo();
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
        this.supplierList = res.data
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  Reset() {
    this.data = { ID: '', FromDate: '', ToDate: '', SupplierID: 'All', ShopID: 'All', stringProductName: '' }
    this.Search(this.mode);
  }

  validate(v: { Sel: number | null; }, event: any) {
    if (v.Sel === 0 || v.Sel === null) {
      v.Sel = 1;
    } else {
      v.Sel = 0;
    }
  }

  multicheck() {
    for (var i = 0; i < this.orderList.length; i++) {
      const index = this.orderList.findIndex(((x: any) => x === this.orderList[i]));
      if (this.orderList[index].Sel == null || this.orderList[index].Sel === 0) {
        this.orderList[index].Sel = 1;
      } else {
        this.orderList[index].Sel = 0;
      }
    }
  }

  getSupplierPo() {
    this.sp.show()
    this.orderSupplier = true
    const subs: Subscription = this.bill.getSupplierPo(this.ID, '').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.orderList = res.data
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
    this.sp.hide()
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
      Parem = Parem + 'and billmaster.BillDate between ' + `'${FromDate}'`;
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

    if (this.orderComplete === false) {
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

    this.sp.hide()
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
          this.orderSupplier = false
          this.orderComplete = true
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Your Per-Order Supplier To Assign !!',
            showConfirmButton: false,
            timer: 1200
          })
          break;
        case "Cancel":
          this.filtersList.forEach((element: any) => {
            this.data.ID = element.BillID;
            element.SupplierID = '0';
          });
          this.orderSupplier = true
          this.orderComplete = false
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
            this.modalService.dismissAll()
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
    this.sp.hide()
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
    this.sp.hide()
  }

  Unassigned() {
    this.getSupplierPo()
    this.orderSupplier = true
    this.orderComplete = false

  }

  Assigned() {
    this.getList()
    this.orderSupplier = false
    this.orderComplete = true
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
}
