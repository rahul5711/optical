import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { FileUploadService } from 'src/app/service/helpers/file-upload.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { take } from 'rxjs/operators';
import { CompressImageService } from 'src/app/service/helpers/compress-image.service';
import * as moment from 'moment';
import { CustomerService } from 'src/app/service/customer.service';
import { CustomerPowerCalculationService } from 'src/app/service/helpers/customer-power-calculation.service';
import { BillService } from 'src/app/service/bill.service';
import { ProductService } from 'src/app/service/product.service';
import { BillCalculationService } from 'src/app/service/helpers/bill-calculation.service';
import { SupportService } from 'src/app/service/support.service';
import { trigger, style, animate, transition } from '@angular/animations';
import { SupplierService } from 'src/app/service/supplier.service';
import { FitterService } from 'src/app/service/fitter.service';
import { CalculationService } from 'src/app/service/helpers/calculation.service';
import { PaymentService } from 'src/app/service/payment.service';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { NgTinyUrlService } from 'ng-tiny-url';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-recycle',
  templateUrl: './recycle.component.html',
  styleUrls: ['./recycle.component.css']
})
export class RecycleComponent implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    public as: AlertService,
    private sp: NgxSpinnerService,
    public calculation: CustomerPowerCalculationService,
    public bill: BillService,
    private ps: ProductService,
    private billCalculation: BillCalculationService,
    private supps: SupportService,
    private cs: CustomerService,
    private modalService: NgbModal,
    private sup: SupplierService,
    private fitters: FitterService,
    public cal: CalculationService,
    public pay: PaymentService,
    private tinyUrlService: NgTinyUrlService,
    private sanitizer: DomSanitizer
  ) { }

  data:any ={
    FromDate:'', To:'',Employee:'',
  }

  employeeList:any = []

  ngOnInit(): void {
    this.getEmployee()
  }

  customerlist = false
  billlist = false
  expenselist = false
  purchaselist = false

  getEmployee() {
    this.sp.show();
    const subs: Subscription = this.bill.getEmployee().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.employeeList = res.data.sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  reset(){
    this.data ={
      FromDate:'', To:'',Employee:'',
    }
    this.customerlist = false
    this.billlist = false
    this.expenselist = false
    this.purchaselist = false
  }
  getList(mode:any){
     if(mode == 'Customer'){
      this.customerlist = true
      this.billlist = false
      this.expenselist = false
      this.purchaselist = false
     }
     if(mode == 'Bill'){
      this.customerlist = false
      this.billlist = true
      this.expenselist = false
      this.purchaselist = false
     }
     if(mode == 'Expenses'){
      this.customerlist = false
      this.billlist = false
      this.expenselist = true
      this.purchaselist = false
     }
     if(mode == 'Purchase'){
      this.customerlist = false
      this.billlist = false
      this.expenselist = false
      this.purchaselist = true
     }
  }
}
