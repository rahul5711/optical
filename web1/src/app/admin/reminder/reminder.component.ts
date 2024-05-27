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
  company = JSON.parse(localStorage.getItem('company') || '');
  user = JSON.parse(localStorage.getItem('user') || '');
  companySetting:any = JSON.parse(localStorage.getItem('companysetting') || '[]');
  shop:any = JSON.parse(localStorage.getItem('shop') || '');
  selectedShop:any = JSON.parse(localStorage.getItem('selectedShop') || '');

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
  FeedBackRange = 'Today';
  FeedBackList: any = [];
  ServiceRange = 'Today';
  ServiceList: any = [];
  SolutionTbl = 'Customer';
  SolutionRange = 'Today';
  SolutionList: any = [];
  ContactLensTbl = 'Customer';
  ContactLensRange = 'Today';
  ContactLensList: any = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private rs: ReminderService,
    public as: AlertService,
    private sp: NgxSpinnerService,

  ) { }

  ngOnInit(): void {
    [this.shop] = this.shop.filter((s: any) => s.ID === Number(this.selectedShop[0]));
    this.getBirthDayReminder()
    this.getAnniversaryReminder()
    this.getCustomerOrderPending()
    this.getEyeTestingReminder()
    this.getFeedBackReminder()
    this.getServiceMessageReminder()
    this.getSolutionExpiryReminder()
    this.getContactLensExpiryReminder()
  }

  // bday msg start
  tabClickBday(event: any) {
    this.bdayTbl = event.tab.textLabel;
    this.getBirthDayReminder();
  }

  getBirthDayReminder() {
    let dateType = '';
    if (this.bdayRange === 'Today') { dateType = 'today' }
    else if (this.bdayRange === 'Tomorrow') {
      dateType = 'tomorrow'
    } else if (this.bdayRange === 'Yesterday') {
      dateType = 'yesterday';
    }

    const subs: Subscription = this.rs.getBirthDayReminder(this.bdayTbl, dateType).subscribe({
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
    let dateType = '';
    if (this.AnniversaryRange === 'Today') { dateType = 'today'; }
    else if (this.AnniversaryRange === 'Tomorrow') {
      dateType = 'tomorrow';
    } else if (this.AnniversaryRange === 'Yesterday') {
      dateType = 'yesterday';
    }

    const subs: Subscription = this.rs.getAnniversaryReminder(this.AnniversaryTbl, dateType).subscribe({
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
    let dateType = '';
    if (this.OrderRange === 'Today') { dateType = 'today' }
    else if (this.OrderRange === 'Tomorrow') {
      dateType = 'tomorrow'
    } else if (this.OrderRange === 'Yesterday') {
      dateType = 'yesterday'
    }

    const subs: Subscription = this.rs.getCustomerOrderPending(dateType).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.OrderPendingList = res.data;
          const orderPendingCount = this.OrderPendingList.length;
          console.log(orderPendingCount);
          
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
    let dateType = '';
    if (this.EyeRange === 'Today') { dateType = 'today'; }
    else if (this.EyeRange === 'Tomorrow') {
      dateType = 'tomorrow';
    } else if (this.EyeRange === 'Yesterday') {
      dateType = 'yesterday'
    }

    const subs: Subscription = this.rs.getEyeTestingReminder(dateType).subscribe({
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
  // FeedBackReminder  start
  getFeedBackReminder() {
    let dateType = '';
    if (this.FeedBackRange === 'Today') { dateType = 'today'; }
    else if (this.FeedBackRange === 'Tomorrow') {
      dateType = 'tomorrow';
    } else if (this.FeedBackRange === 'Yesterday') {
      dateType = 'yesterday'
    }

    const subs: Subscription = this.rs.getFeedBackReminder(dateType).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.FeedBackList = res.data;
        } else {
          this.as.errorToast(res.message)
        }
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }
  // FeedBackReminder  end
  // getServiceMessageReminder  start
  getServiceMessageReminder() {
    let dateType = '';
    if (this.ServiceRange === 'Today') { dateType = 'today'; }
    else if (this.ServiceRange === 'Tomorrow') {
      dateType = 'tomorrow';
    } else if (this.ServiceRange === 'Yesterday') {
      dateType = 'yesterday'
    }

    const subs: Subscription = this.rs.getServiceMessageReminder(dateType).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.ServiceList = res.data;
        } else {
          this.as.errorToast(res.message)
        }
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }
  // getServiceMessageReminder  end
  // getSolutionExpiryReminder  start
  tabClickSolution(event: any) {
    this.SolutionTbl = event.tab.textLabel;
    this.getSolutionExpiryReminder();
  }

  getSolutionExpiryReminder() {
    let dateType = '';
    if (this.SolutionRange === 'Today') { dateType = 'today' }
    else if (this.SolutionRange === 'Tomorrow') {
      dateType = 'tomorrow'
    } else if (this.SolutionRange === 'Yesterday') {
      dateType = 'yesterday';
    }

    const subs: Subscription = this.rs.getSolutionExpiryReminder(this.SolutionTbl, dateType).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.SolutionList = res.data;
        } else {
          this.as.errorToast(res.message)
        }
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }
  // getSolutionExpiryReminder msg end
  // getSolutionExpiryReminder  start
  tabClickContactLens(event: any) {
    this.ContactLensTbl = event.tab.textLabel;
    this.getContactLensExpiryReminder();
  }

  getContactLensExpiryReminder() {
    let dateType = '';
    if (this.ContactLensRange === 'Today') { dateType = 'today' }
    else if (this.ContactLensRange === 'Tomorrow') {
      dateType = 'tomorrow'
    } else if (this.ContactLensRange === 'Yesterday') {
      dateType = 'yesterday';
    }

    const subs: Subscription = this.rs.getContactLensExpiryReminder(this.ContactLensTbl, dateType).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.ContactLensList = res.data;
        } else {
          this.as.errorToast(res.message)
        }
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }
  // getSolutionExpiryReminder msg end

  dateFormat(date:any){
    return moment(date).format(`${this.companySetting.DateFormat}`);
  }

  // WhatsappSetting in CompnaySetting foundElement(MessageName1) Check then respones messageName
  getWhatsAppMessage(temp: any, messageName: any) {
    if (temp && temp !== 'null') {
      const foundElement = temp.find((element: { MessageName1: any; }) => element.MessageName1 === messageName);
      return foundElement ? foundElement.MessageText1 : '';
    }
    return '';
  }

  // Whatsapp All Message Send 
  WhatsappSend(data: any, mode: any) {
    let temp = JSON.parse(this.companySetting.WhatsappSetting);
    let WhatsappMsg = '';
  
    // Customer_Birthday Condition`s  
    if (mode === 'CustomerBday' || mode === 'SupplierBday' || mode === 'EmployeeBday' || mode === 'FitterBday' || mode === 'DoctorBday') {
      WhatsappMsg = this.getWhatsAppMessage(temp, 'Customer_Birthday');
    }

    // Customer_Anniversary Condition`s 
    if (mode === 'CustomerAnniversary' || mode === 'SupplierAnniversary' || mode === 'EmployeeAnniversary' || mode === 'FitterAnniversary' || mode === 'DoctorAnniversary') {
      WhatsappMsg = this.getWhatsAppMessage(temp, 'Customer_Anniversary');
    }

    // Customer_Order Pending Condition 
    if (mode === 'OrderPending') {
      WhatsappMsg = this.getWhatsAppMessage(temp, 'Customer_Bill OrderReady') ;
    }

    // Customer_Eye Testing Condition 
    if (mode === 'EyeTesting') {
      WhatsappMsg = this.getWhatsAppMessage(temp, 'Customer_Eye Testing');
    }

    // Solution Expiry Condition 
    if (mode === 'CustomerSolution' || mode === 'SupplierSolution' ) {
      WhatsappMsg = this.getWhatsAppMessage(temp, 'Customer_Solution Expiry');
    }

    // Contactlens Expiry Condition 
    if (mode === 'CustomerContactlens' || mode === 'SupplierContactlens' ) {
      WhatsappMsg = this.getWhatsAppMessage(temp, 'Customer_Contactlens Expiry');
    }
  
    // Customer_Comfort Feedback Condition 
    if (mode === 'Comfort') {
      WhatsappMsg = this.getWhatsAppMessage(temp, 'Customer_Comfort Feedback') ;
    }

    // Customer_Service Condition 
    if (mode === 'Service') {
      WhatsappMsg = this.getWhatsAppMessage(temp, 'Customer_Service') ;
    }

    let p = ''
    if(mode === 'Service' || mode === 'Comfort' || mode === 'OrderPending'){
       p = '*Please give your valuable Review for us !*'
     }else{
      p = ''
     }

    const msg = `*Hi ${data.Title} ${data.Name},*%0A` +
      `${WhatsappMsg}%0A` +
      `*${this.shop.Name}* - ${this.shop.AreaName}%0A${this.shop.MobileNo1}%0A${this.shop.Website}%0A${p}`;
  
    const mob = this.company.Code + data.MobileNo1;
    const url = `https://wa.me/${mob}?text=${msg}`;
    window.open(url, "_blank");
  }
  
}
