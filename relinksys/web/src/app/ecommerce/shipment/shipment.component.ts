import { Component, OnInit, HostListener } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { ProductService } from 'src/app/service/product.service';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { SupplierService } from 'src/app/service/supplier.service';
import { SupportService } from 'src/app/service/support.service';
import { CalculationService } from 'src/app/service/helpers/calculation.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { PurchaseService } from 'src/app/service/purchase.service';
import { BillService } from 'src/app/service/bill.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { fromEvent } from 'rxjs';
import { take } from 'rxjs/operators';
import { CompressImageService } from 'src/app/service/helpers/compress-image.service';
import { FileUploadService } from 'src/app/service/helpers/file-upload.service';
import { EcomService } from 'src/app/service/ecom.service';

@Component({
  selector: 'app-shipment',
  templateUrl: './shipment.component.html',
  styleUrls: ['./shipment.component.css']
})
export class ShipmentComponent implements OnInit {
  evn = environment;
  user = JSON.parse(localStorage.getItem('user') || '');
  company = JSON.parse(localStorage.getItem('company') || '');
  shop = JSON.parse(localStorage.getItem('shop') || '');
  companySetting = JSON.parse(localStorage.getItem('companysetting') || '');
  selectedShop: any = JSON.parse(localStorage.getItem('selectedShop') || '');
  permission = JSON.parse(localStorage.getItem('permission') || '[]');

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private ps: ProductService,
    private ss: SupplierService,
    private supps: SupportService,
    private purchaseService: PurchaseService,
    private ec: EcomService,
    public as: AlertService,
    public calculation: CalculationService,
    public sp: NgxSpinnerService,
    public bill: BillService,
    private modalService: NgbModal,
    private compressImage: CompressImageService,
    private fu: FileUploadService,
  ) {
  }

  data: any = {
    IsSameCity: '', IsSameState: '', IsOtherState: '',
  }
  IsSameCity: any = 0
  IsSameState: any = 0
  IsOtherState: any = 0
  dataList: any
  isEditMode: boolean = false;


  ngOnInit(): void {
    this.getShipmentRate()
  }

  getShipmentRate() {
    this.sp.show()
    const subs: Subscription = this.ec.shipmentRate().subscribe({
      next: (res: any) => {
        if (res.success) {
          if(!res.data){
            this.isEditMode =  false
          }else{
this.isEditMode = true
          }
          this.IsSameCity = res.data.IsSameCity;
          this.IsOtherState = res.data.IsOtherState;
          this.IsSameState = res.data.IsSameState;
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  editRow() {
    this.data = {
      ID: this.dataList?.ID,   // agar ID hai
      IsSameCity: this.IsSameCity,
      IsSameState: this.IsSameState,
      IsOtherState: this.IsOtherState
    };

    this.isEditMode = true;
  }

  onSubmit() {
    this.sp.show();

    const payload = {
      ...this.data,
      isUpdate: this.isEditMode   // backend ko hint
    };

    const subs: Subscription =
      this.ec.saveOrUpdateShipmentRate(payload).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.as.successToast(
              this.isEditMode ? 'Updated successfully' : 'Saved successfully'
            );
            Swal.fire({
              position: 'center',
              icon: 'success',
              title:  this.isEditMode ? 'Updated successfully' : 'Saved successfully',
              showConfirmButton: true,
              timer: 1000
            })
            this.getShipmentRate();
            this.data = '';
            // this.resetForm();
            this.isEditMode = false;
          } else {
            this.as.errorToast(res.message);
            Swal.fire({
              position: 'center',
              icon: 'error',
              title: res.message,
              showConfirmButton: true,
            })
          }
          this.sp.hide();
        },
        error: (err: any) => {
          console.error(err);
          this.sp.hide();
        },
        complete: () => subs.unsubscribe(),
      });
  }


}
