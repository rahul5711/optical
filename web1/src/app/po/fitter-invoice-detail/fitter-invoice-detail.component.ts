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
  companySetting:any = JSON.parse(localStorage.getItem('companysetting') || '[]');

  id:any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    public as: AlertService,
    private sp: NgxSpinnerService,
    private fitters: FitterService,
  ) { 
    this.id = this.route.snapshot.params['id'];
  }

  FitterMaster: any = {
    ID: null, FitterID: null, FitterName:null,  CompanyID: null,  ShopID: 'All',  PaymentStatus: 'Unpaid', InvoiceNo: null, GSTNo: null,
    Quantity: 0, SubTotal: 0,  TotalAmount: 0, GSTPercentage: 0, GSTAmount: 0, GSTType: 'None', Status: 1, CreatedBy: null, PurchaseDate: null, DueAmount:0
  };

  dataList:any = []

  ngOnInit(): void {
   
    if (this.id != 0) {
      this.getFitterInvoiceDetailByID();
    }
  }

  getFitterInvoiceDetailByID() {
    this.sp.show();
    const subs: Subscription = this.fitters.getFitterInvoiceDetailByID(this.id).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.FitterMaster = res.FitterMaster[0]
          this.FitterMaster.PurchaseDate = moment(res.FitterMaster[0].PurchaseDate).format('YYYY-MM-DD');
          this.FitterMaster.ShopName = res.FitterMaster[0].ShopName + ' (' + res.FitterMaster[0].AreaName + ')' 
          this.dataList = res.FitterDetail
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
  }

  dateFormat(date:any){
    return moment(date).format(`${this.companySetting.DateFormat}`);
  }

}
