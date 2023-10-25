import { Component, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { MatSelect } from '@angular/material/select';
import { ProductService } from 'src/app/service/product.service';
import { ReminderService } from 'src/app/service/reminder.service';
import * as moment from 'moment';


@Component({
  selector: 'app-reminder',
  templateUrl: './reminder.component.html',
  styleUrls: ['./reminder.component.css']
})
export class ReminderComponent implements OnInit {

  user = JSON.parse(localStorage.getItem('user') || '');

  bdayList: any = [];
  bdayRange = 'Today';
  bdayTbl = 'Customer';
  AnniversaryRange = 'Today';
  AnniversaryTbl = 'Customer';
  AnniversaryList: any = [];
  OrderRange = 'Today';
  OrderPendingList: any = [];
  EyeRange = 'Today';
  EyeTestingList: any = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private rs: ReminderService,
    public as: AlertService,
    private sp: NgxSpinnerService,

  ) { }

  ngOnInit(): void {
    this.getBirthDayReminder()
    this.getAnniversaryReminder()
    this.getCustomerOrderPending()
    this.getEyeTestingReminder()
  }
 
  // bday msg start
  tabClickBday(event: any) {
    this.bdayTbl = event.tab.textLabel;
    this.getBirthDayReminder();
  }

  getBirthDayReminder() {
    var BDate = '';
    if (this.bdayRange === 'Today') { BDate = moment().format('YYYY-MM-DD'); }
    else if (this.bdayRange === 'Tomorrow') {
      BDate = moment().add(1, 'days').format('YYYY-MM-DD');
    }
    else if (this.bdayRange === 'Yesterday') {
      BDate = moment().subtract(1, 'days').format('YYYY-MM-DD');
    }
    console.log(BDate, this.bdayTbl);

    const subs: Subscription = this.rs.getBirthDayReminder(this.bdayTbl).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.bdayList = res.data;
        } else {
          this.as.errorToast(res.message)
        }
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }
  // bday msg end
  // Anniversary msg start
  tabClickAnniversary(event: any) {
    this.AnniversaryTbl = event.tab.textLabel;
    this.getAnniversaryReminder();
  }

  getAnniversaryReminder() {
    var ADate = '';
    if (this.AnniversaryRange === 'Today') { ADate = moment().format('YYYY-MM-DD'); }
    else if (this.AnniversaryRange === 'Tomorrow') {
      ADate = moment().add(1, 'days').format('YYYY-MM-DD');
    }
    else if (this.AnniversaryRange === 'Yesterday') {
      ADate = moment().subtract(1, 'days').format('YYYY-MM-DD');
    }
    console.log(ADate, this.AnniversaryTbl);

    const subs: Subscription = this.rs.getAnniversaryReminder(this.AnniversaryTbl).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.AnniversaryList = res.data;
        } else {
          this.as.errorToast(res.message)
        }
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }
  // Anniversary msg end
  // Order Pending msg start
  getCustomerOrderPending() {
    var ODate = '';
    if (this.OrderRange === 'Today') { ODate = moment().format('YYYY-MM-DD'); }
    else if (this.OrderRange === 'Tomorrow') {
      ODate = moment().add(1, 'days').format('YYYY-MM-DD');
    }
    else if (this.OrderRange === 'Yesterday') {
      ODate = moment().subtract(1, 'days').format('YYYY-MM-DD');
    }
    console.log(ODate, this.OrderRange);

    const subs: Subscription = this.rs.getCustomerOrderPending(ODate).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.OrderPendingList = res.data;
        } else {
          this.as.errorToast(res.message)
        }
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }
  // Order Pending msg end
  // EyeTesting msg start
  getEyeTestingReminder() {
    var EDate = '';
    if (this.EyeRange === 'Today') { EDate = moment().format('YYYY-MM-DD'); }
    else if (this.EyeRange === 'Tomorrow') {
      EDate = moment().add(1, 'days').format('YYYY-MM-DD');
    }
    else if (this.EyeRange === 'Yesterday') {
      EDate = moment().subtract(1, 'days').format('YYYY-MM-DD');
    }
    console.log(EDate, this.EyeRange);

    const subs: Subscription = this.rs.getEyeTestingReminder(EDate).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.EyeTestingList = res.data;
        } else {
          this.as.errorToast(res.message)
        }
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }
  // EyeTesting msg end
}
