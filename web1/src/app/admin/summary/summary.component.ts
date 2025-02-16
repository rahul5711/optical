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
