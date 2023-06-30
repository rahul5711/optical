import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { AlertService } from 'src/app/service/helpers/alert.service';
import * as moment from 'moment';
import { BillService } from 'src/app/service/bill.service';
import { ShopService } from 'src/app/service/shop.service';
import { CalculationService } from 'src/app/service/helpers/calculation.service';
import { SupportService } from 'src/app/service/support.service';
import { FitterService } from 'src/app/service/fitter.service';

@Component({
  selector: 'app-fitter-invoice-detail',
  templateUrl: './fitter-invoice-detail.component.html',
  styleUrls: ['./fitter-invoice-detail.component.css']
})
export class FitterInvoiceDetailComponent implements OnInit {

  evn = environment
  selectedShop = JSON.parse(localStorage.getItem('selectedShop') || '');
  company = JSON.parse(localStorage.getItem('company') || '');
   id:any
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    public as: AlertService,
    private sp: NgxSpinnerService,
    public bill: BillService,
    private ss: ShopService,
    private fitters: FitterService,
    public calculation: CalculationService,
    private supps: SupportService,
  ) { 
    this.id = this.route.snapshot.params['id'];
  }


  FitterMaster: any = {
    ID: null, FitterID: null, FitterName:null,  CompanyID: null,  ShopID: 'All',  PaymentStatus: 'Unpaid', InvoiceNo: null, GSTNo: null,
    Quantity: 0, SubTotal: 0,  TotalAmount: 0, GSTPercentage: 0, GSTAmount: 0, GSTType: 'None', Status: 1, CreatedBy: null, PurchaseDate: null, DueAmount:0
  };

  shopList:any = []
  fitterList:any = []
  gstdetails:any



  ngOnInit(): void {
    this.dropdownfitterlist()
    this.dropdownShoplist()
    this.FitterMaster.PurchaseDate = moment().format('YYYY-MM-DD');

    if (this.id != 0) {
      this.getFitterInvoiceListByID();
    }
  }

  dropdownfitterlist() {
    const subs: Subscription = this.fitters.dropdownlist().subscribe({
      next: (res: any) => {
        this.fitterList = res.data
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

  getFitterDetails(event: { value: any; }) {
    const index = this.fitterList.findIndex((element: any) => element.Name === event.value);
    this.FitterMaster.FitterID = this.fitterList[index].ID;
    this.FitterMaster.FitterName = this.fitterList[index].Name;
    this.FitterMaster.GSTNo = this.fitterList[index].GSTNo;
  }

  getFitterInvoiceListByID() {
    this.sp.show();
    const subs: Subscription = this.fitters.getFitterInvoiceListByID(this.id).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.FitterMaster = res.data[0]
          // this.itemList = res.result.PurchaseDetail
          this.gstdetails = res.calculation[0].gst_details
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => {
        console.log(err.message);
      },
      complete: () => subs.unsubscribe(),
    })
    this.sp.hide();
  }

}
