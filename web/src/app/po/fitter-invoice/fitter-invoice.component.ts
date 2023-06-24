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
  selector: 'app-fitter-invoice',
  templateUrl: './fitter-invoice.component.html',
  styleUrls: ['./fitter-invoice.component.css']
})
export class FitterInvoiceComponent implements OnInit {
  evn = environment
  selectedShop = JSON.parse(localStorage.getItem('selectedShop') || '');
  company = JSON.parse(localStorage.getItem('company') || '');

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
  ) { }

  selectedMaster: any = {
    ID: null, FitterID: null, FitterName: null, CompanyID: null, GSTNo: null, ShopID: 'All', ShopName: null, PaymentStatus: null, PurchaseDate: null,
    InvoiceNo: null, Status: 1, CreatedBy: null, Quantity: 0, TotalAmount: 0
  };

  fitterList:any = []
  shopList:any = []

  ngOnInit(): void {
    this.dropdownfitterlist()
    this.dropdownShoplist()
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
}
