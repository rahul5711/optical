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

@Component({
  selector: 'app-bill',
  templateUrl: './bill.component.html',
  styleUrls: ['./bill.component.css']
})
export class BillComponent implements OnInit {
  id: any

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    public as: AlertService,
    private sp: NgxSpinnerService,
    private modalService: NgbModal,
    private bill: BillService,
    private ec: EcomService,
  ) {
    this.id = this.route.snapshot.params['id'];
  }

  dataList: any = []
  billMaster: any = []
  billDetail: any = []
  eyePower: any = []
  BarcodeList: any = []
  searchList: any 
  SelectedItems: any = []
  Req: any = { SearchBarCode: '', searchString: '', SupplierID: 0 }
selectedRowIndex: number = -1;
  Billitem :any = {
   Quantity:0, BarCodeCount:0
 }
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
  this.Billitem.Quantity = 0
  this.Billitem.BarCodeCount = 0
  this.Billitem.Quantity = data.Quantity;

  this.Req.searchString = data.ProductName;

  this.modalService.open(content, { 
    centered: true, 
    backdrop: 'static', 
    keyboard: false, 
    size: 'xl' 
  });

  const subs: Subscription = this.bill.searchByString(this.Req, "false", false).subscribe({
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
    
    this.Req.SearchBarCode = data.Barcode
    this.Req.searchString = data.ProductName
    this.Req.SupplierID = data.SupplierID;
    const subs: Subscription = this.bill.searchByBarcodeNo(this.Req, "false", false).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.searchList = res.data[0];
          this.Billitem.BarCodeCount =   this.searchList.BarCodeCount
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

  if (!this.searchList || !this.searchList.Barcode) {
    this.as.errorToast("Please select product");
    return;
  }

  // 🟢 direct same row update
  this.billDetail[this.selectedRowIndex].Barcode = this.searchList.Barcode;

  // optional aur fields bhi dal sakte ho
  this.billDetail[this.selectedRowIndex].SelectedProductName = this.searchList.ProductName;

  // 🔴 modal close
  this.modalService.dismissAll();

  // reset
  this.searchList = null;
}

save(){
  let dtm = {
   BillMaster : this.billMaster,
   BillDetail : this.billDetail,
  }
  console.log(dtm)
}

}
