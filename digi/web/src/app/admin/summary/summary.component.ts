import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators,ReactiveFormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { pipe, Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { NgxSpinnerService } from 'ngx-spinner';
import { BillService } from 'src/app/service/bill.service';
import { AlertService } from 'src/app/service/helpers/alert.service';

@Component({
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.css']
})

export class SummaryComponent implements OnInit {

  constructor(
        private router: Router,
        private route: ActivatedRoute,
        private formBuilder: FormBuilder,
        public as: AlertService,
        private bill: BillService,
        private sp: NgxSpinnerService,
  ) { }

  dataList:any=[]
  dataList1:any=[]
  dataList2:any=[]

  SaleAmount = 0
  TotalCollection = 0
  PaymentDetail:any = []
  RecievedAmount = 0
  DueAmount = 0
  OldRecievedAmount = 0
  Expenses = 0
  NewBill = 0
  NewCustomer = 0
  NewEyeTest = 0 

  AllBalance = 0
  AllPending = 0
  TodayBalance =0
  TodayPending =0

  DeleteBill =0
  DeleteCustomer = 0
  DeleteExpenses = 0
  DeleteProduct = 0

  ngOnInit(): void {
    this.getDashBoardReportOne('today')
    this.getDashBoardReportTwo('today')
    this.getDashBoardReportThree('today')
  }

  getDashBoardReportOne(filterType:any){
    this.sp.show()
    const subs: Subscription = this.bill.getDashBoardReportOne(filterType).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.as.successToast(res.message)
           this.dataList = res.data
           this.SaleAmount = res.calculation.SaleAmount
           this.TotalCollection = res.calculation.TotalCollection
           this.PaymentDetail = res.calculation.PaymentDetail
           this.RecievedAmount = res.calculation.RecievedAmount
           this.DueAmount = res.calculation.DueAmount
           this.OldRecievedAmount = res.calculation.OldRecievedAmount
           this.Expenses = res.calculation.Expenses
           this.NewBill = res.calculation.NewBill
           this.NewCustomer = res.calculation.NewCustomer
           this.NewEyeTest = res.calculation.NewEyeTest
          
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => {
        console.log(err.message);
      },
      complete: () => subs.unsubscribe(),
    })
  }

  getDashBoardReportTwo(filterType1:any){
    this.sp.show()
    const subs: Subscription = this.bill.getDashBoardReportTwo(filterType1).subscribe({
      next: (res: any) => {
        if (res.success) {
          // this.as.successToast(res.message)
           this.dataList1 = res.data
           this.AllBalance = res.calculation.AllBalance
           this.AllPending = res.calculation.AllPending
           this.TodayBalance = res.calculation.TodayBalance
           this.TodayPending = res.calculation.TodayPending
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => {
        console.log(err.message);
      },
      complete: () => subs.unsubscribe(),
    })
  }

  getDashBoardReportThree(filterType2:any){
    this.sp.show()
    const subs: Subscription = this.bill.getDashBoardReportThree(filterType2).subscribe({
      next: (res: any) => {
        if (res.success) {
          // this.as.successToast(res.message)
           this.dataList2 = res.data
           this.DeleteBill = res.calculation.DeleteBill
           this.DeleteCustomer = res.calculation.DeleteCustomer
           this.DeleteExpenses = res.calculation.DeleteExpenses
           this.DeleteProduct = res.calculation.DeleteProduct
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => {
        console.log(err.message);
      },
      complete: () => subs.unsubscribe(),
    })
  }

}
