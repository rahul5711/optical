import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { Subscription } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { map, filter, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { fromEvent } from 'rxjs';
import { environment } from 'src/environments/environment';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import { EcomService } from 'src/app/service/ecom.service';
import { BillService } from 'src/app/service/bill.service';
import { ProductService } from 'src/app/service/product.service';
import { ProductTypeName } from 'src/app/filterDropDown/nameFilter';

@Component({
  selector: 'app-bill',
  templateUrl: './bill.component.html',
  styleUrls: ['./bill.component.css']
})
export class BillComponent implements OnInit {
  id: any
  companySetting = JSON.parse(localStorage.getItem('companysetting') || '');
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    public as: AlertService,
    private sp: NgxSpinnerService,
    private modalService: NgbModal,
    private bill: BillService,
    private ec: EcomService,
    private ps: ProductService,
  ) {
    this.id = this.route.snapshot.params['id'];
  }
  specList: any;
  PaidAmount: any = 0;
  dataList: any = []
  billMaster: any = []
  billDetail: any = []
  eyePower: any = []
  BarcodeList: any = []
  searchList: any
  SelectedItems: any = []
  Req: any = { SearchBarCode: '', searchString: '', SupplierID: 0 }
  selectedRowIndex: number = -1;
  Billitem: any = {
   ProductTypeName:'',  ProductName:'', Quantity: 0, BarCodeCount: 0, Manual: false, PreOrder: false,
  }
  Payment :any = {
  PaidAmount: 0,PaymentReceipt:'', PaymentTransactionId:'', Remark:'',
  }
  selectedProduct: any
  searchValue: any
  prodList: any
  disableAddButtons = false;
  ngOnInit(): void {
    this.getOrderDetailByID()
  }

  getOrderDetailByID() {
    this.sp.show()
    let dtm = {
      BillMasterID: Number(this.id)
    }

    const subs: Subscription = this.ec.getOrderDetailByID(dtm).subscribe({
      next: (res: any) => {
        if (res.success == true) {
          this.billMaster = res.billMasterData;
          this.billDetail = res.billDetailData;
          res.billDetailData.forEach((e: any) => {
            if (e.power != null) {
              [this.eyePower] = JSON.parse(e.power)
            }
          })
          console.table(this.eyePower)
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

  openModal(content: any, data: any, index: number) {

    // 🟢 store row index
    this.selectedRowIndex = index;

    // reset
    this.Billitem.Manual = false
    this.Billitem.PreOrder = false
    this.Billitem.Quantity = 0
    this.Billitem.BarCodeCount = 0
    this.Billitem.ProductName = data.ProductName
    this.Billitem.ProductTypeName = data.ProductTypeName
    this.Billitem.Quantity = data.Quantity;

    this.Req.searchString = data.ProductName;

    this.modalService.open(content, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      size: 'xl'
    });

    const subs: Subscription = this.ec.searchByString(this.Req, "false", false).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.BarcodeList = res.data;
        } else {
          this.as.errorToast(res.message);
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getSearchByBarcodeNoS(data: any) {

    this.Req.SearchBarCode = data.BaseBarCode
    this.Req.searchString = data.ProductName 
    this.Req.SupplierID = data.SupplierID;
    const subs: Subscription = this.ec.searchByBarcodeNo(this.Req, "false", false).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.searchList = res.data[0];
          this.Billitem.BarCodeCount = this.searchList.BarCodeCount
        }
        else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  addItem() {
    if (this.Billitem.Manual == false) {

      if (!this.searchList || !this.searchList.Barcode) {
        this.as.errorToast("Please select product");
        return;
      }

      this.billDetail[this.selectedRowIndex].Barcode = this.searchList.Barcode;
      this.billDetail[this.selectedRowIndex].SelectedProductName = this.searchList.ProductName;
      this.billDetail[this.selectedRowIndex].Manual = this.Billitem.Manual;
      this.billDetail[this.selectedRowIndex].PreOrder = this.Billitem.PreOrder;

      this.modalService.dismissAll();

      this.searchList = null;
    }
    if (this.Billitem.Manual == true) {
     
      
      this.billDetail[this.selectedRowIndex].Barcode = '0';
      this.billDetail[this.selectedRowIndex].BarCodeCount = '0';
      this.billDetail[this.selectedRowIndex].Manual = this.Billitem.Manual;
      this.billDetail[this.selectedRowIndex].PreOrder = this.Billitem.PreOrder;
      this.modalService.dismissAll();
    }

  }



  save() {
    this.billMaster.PaidAmount = this.Payment.PaidAmount
    this.billMaster.PaymentReceipt = this.Payment.PaymentReceipt
    this.billMaster.PaymentTransactionId = this.Payment.PaymentTransactionId
    this.billMaster.Remark = this.Payment.Remark
    let dtm = {
      BillMaster: this.billMaster,
      BillDetail: this.billDetail,
    }

    const subs: Subscription = this.ec.orderProcess(dtm).subscribe({
      next: (res: any) => {
        if (res.success == true) {
          console.log(res);

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
