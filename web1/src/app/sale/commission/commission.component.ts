import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { environment } from 'src/environments/environment';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { SupportService } from 'src/app/service/support.service';
import { ExcelService } from 'src/app/service/helpers/excel.service';
import { EmployeeService } from 'src/app/service/employee.service';
import { DoctorService } from 'src/app/service/doctor.service';
import { ShopService } from 'src/app/service/shop.service';
import { PaymentService } from 'src/app/service/payment.service';

@Component({
  selector: 'app-commission',
  templateUrl: './commission.component.html',
  styleUrls: ['./commission.component.css']
})
export class CommissionComponent implements OnInit {
  user = JSON.parse(localStorage.getItem('user') || '');
  companysetting = JSON.parse(localStorage.getItem('companysetting') || '');
  selectedShop = JSON.parse(localStorage.getItem('selectedShop') || '');
  permission = JSON.parse(localStorage.getItem('permission') || '[]');
  env = environment;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    public as: AlertService,
    private sp: NgxSpinnerService,
    private excelService: ExcelService,
    private supps: SupportService,
    public emp: EmployeeService,
    private doc: DoctorService,
    private ss: ShopService,
    private pay: PaymentService,

  ) { }

  data: any = {
    ID: null,  CompanyID: null, ShopID: null,  PayeeName: null, ShopName: null,  PurchaseDate: null, InvoiceNo: null,
     Quantity: 0, TotalAmount: 0, Status: 1, 
  };

  data1 = { Master: null, Detail: {} };

  shopList:any = []
  payeeList:any = []
  dataList:any = []

  editLoyalty = false
  addLoyalty = false
  deleteLoyalty = false

  ngOnInit(): void {
    this.permission.forEach((element: any) => {
      if (element.ModuleName === 'Loyalty') {
        this.editLoyalty = element.Edit;
        this.addLoyalty = element.Add;
        this.deleteLoyalty = element.Delete;
      }
    });
    this.dropdownShoplist()
  }

  dropdownShoplist(){
    const subs: Subscription = this.ss.dropdownShoplist('').subscribe({
      next: (res: any) => {
        this.shopList  = res.data
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getPayeeList(){
    if(this.data.PaymentType === 'Employee')
    { 
      const subs: Subscription = this.emp.dropdownUserlist('').subscribe({
        next: (res: any) => {
          if (res.success) {
            this.payeeList = res.data
          } else {
            this.as.errorToast(res.message)
          }
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    }
    else if(this.data.PaymentType === 'Doctor')
    { 
      const subs: Subscription = this.doc.dropdownDoctorlist().subscribe({
        next: (res: any) => {
          this.payeeList = res.data
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    }  
 
  }

  getCommissionDetail(){
    const subs: Subscription = this.pay.getCommissionDetail(this.data).subscribe({
      next: (res: any) => {
        this.dataList  = res.data
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  multicheck() {
    for (var i = 0; i < this.dataList.length; i++) {
      const index = this.dataList.findIndex(((x: any) => x === this.dataList[i]));
      if (this.dataList[index].Sel == null || this.dataList[index].Sel === 0 || this.dataList[index].Sel === undefined) {
        this.dataList[index].Sel = 1;
      } else {
        this.dataList[index].Sel = 0;
      }
    }
  }

  validate(v:any, event: any) {
    if (v.Sel === 0 || v.Sel === null || v.Sel === undefined) {
      v.Sel = 1;
    } else {
      v.Sel = 0;
    }
  }

  onSubmit(){
    this.sp.show();
    this.data.ShopID = Number(this.selectedShop[0]);
    this.data.PayeeName = Number(this.data.PayeeName);
    this.data1.Master = this.data;

    let CommissionDetails: any = []
    this.dataList.forEach((el: any) =>{
      if(el.Sel === 1){
        CommissionDetails.push(el)
       }
    })

    this.data1.Detail = CommissionDetails;
    const subs: Subscription = this.pay.saveCommissionDetail(this.data1).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.router.navigate(['/sale/commissionList', res.data.ID])
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  calculateGrandTotal(){

    let selectList: any = []
    this.dataList.forEach((el: any)=>{
       if(el.Sel === 1){
        selectList.push(el)
       }
    })

    this.data.Quantity = 0;
    this.data.TotalAmount = 0;
    selectList.forEach((element: any) => {
      this.data.Quantity = +this.data.Quantity +  element.Quantity
      this.data.TotalAmount = Number(+this.data.TotalAmount +  element.CommissionAmount
        )
    })
  }

}
