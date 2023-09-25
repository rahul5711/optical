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
import { BillService } from 'src/app/service/bill.service';
import { PaymentService } from 'src/app/service/payment.service';

@Component({
  selector: 'app-commission-detail',
  templateUrl: './commission-detail.component.html',
  styleUrls: ['./commission-detail.component.css']
})
export class CommissionDetailComponent implements OnInit {
  evn = environment
  selectedShop = JSON.parse(localStorage.getItem('selectedShop') || '');
  company = JSON.parse(localStorage.getItem('company') || '');
  companySetting:any = JSON.parse(localStorage.getItem('companysetting') || '[]');

  id:any;
  Type:any;
  UserID:any;
  ShopID:any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    public as: AlertService,
    private sp: NgxSpinnerService,
    private bill: PaymentService,
  ) { 
    this.id = this.route.snapshot.params['id'];
    this.Type= this.route.snapshot.params['Type'];
    this.UserID= this.route.snapshot.params['UserID'];
    this.ShopID= this.route.snapshot.params['ShopID'];
  }

  data: any = {
    ID: null, UserID: null, UserName: null, UserType: null,  CompanyID: null, GSTNo: null,  InvoiceNo: null, PaymentStatus: null, InvoiceDate: null,Quantity: null, ShopID: null, ShopName: null,AreaName:null, TotalAmount: null, Status: 1, CreatedBy: null, CreatedByEmp: null, CreatedOn: null, DueAmount: null
  };

  dataList:any = []

  ngOnInit(): void {
   
    if (this.id != 0) {
      this.getCommissionDetailByID(this.id,this.Type,this.UserID,this.ShopID);
    }
  }

  getCommissionDetailByID(id:any,Type:any,UserID:any,ShopID:any) {
    this.sp.show()
    const dtm = {
      PayeeName:UserID,
      PaymentType:Type,
      ID:id,
      ShopID:ShopID
    }
    const subs: Subscription = this.bill.getCommissionDetailByID(dtm).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.data = res.master
          this.data.ShopName = res.master.ShopName + ' (' + res.master.AreaName + ')'
          this.data.InvoiceDate = moment(res.master.PurchaseDate).format('YYYY-MM-DD');
          this.dataList = res.detail
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
 
    })
  }

  dateFormat(date:any){
    return moment(date).format(`${this.companySetting.DateFormat}`);
  }
}
