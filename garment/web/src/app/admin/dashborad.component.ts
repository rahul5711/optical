import {Component, HostListener, OnInit, TemplateRef, ViewChild  } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs/internal/Subscription';
import { BillService } from '../service/bill.service';
import { ReminderService } from '../service/reminder.service';


@Component({
  selector: 'app-dashborad',
  templateUrl: './dashborad.component.html',
  styleUrls: ['./dashborad.component.css']
})
export class DashboradComponent implements OnInit {
  user: any = JSON.parse(localStorage.getItem('user') || '');
  company: any = JSON.parse(localStorage.getItem('company') || '');
  companysetting: any = JSON.parse(localStorage.getItem('companysetting') || '');
  shop: any = JSON.parse(localStorage.getItem('shop') || '');
  permission = JSON.parse(localStorage.getItem('permission') || '[]');

  constructor(
    private modalService: NgbModal,
    private bill: BillService,
    private rem: ReminderService,
    private router: Router,
  ) { }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.altKey && event.key == 'c' || event.altKey && event.key == 'C'  ) {
      this.router.navigate(['/sale/billing',0,0]);  
    }
    if (event.altKey && event.key == 'b' || event.altKey && event.key == 'B'  ) {
      this.router.navigate(['/sale/billinglist',0]);  
    }
    if (event.altKey && event.key == 'p' || event.altKey && event.key == 'P'  ) {
      this.router.navigate(['/inventory/purchaseList',0]);  
    }
    if (event.altKey && event.key == 'e' || event.altKey && event.key == 'E'  ) {
      event.preventDefault();
      this.router.navigate(['/companyPayment/expense']);  
    }
    if (event.altKey && event.key == 't' || event.altKey && event.key == 'T'  ) {
      this.router.navigate(['/inventory/transfer-list']);  
    }
    if (event.altKey && event.key == 'r' || event.altKey && event.key == 'R'  ) {
      this.router.navigate(['/admin/reminder']);  
    }

  }

  cards: any = [];
  CustomerView = false;
  Billview = false;
  Expenseview = false;
  Transferview = false;
  smsSettingview = false;
  reminderview = true;

  AmountDue = 0
  AmountExpense = 0
  AmountRecieve = 0
  AmountSale = 0
  OldAmountRecieve = 0

 SaleTotalBalanceAmount = 0
 SaleTotalPaidAmount =  0
 SaleTotalSaleAmount =  0
 SaleList:any =  []

 CustomerTotalBalance =  0
 CustomerList:any =  []

 CollectionList:any =  []
 CollectionCARD =  0
 CollectionCASH =  0
 CollectionTotalAmount =  0
CollectionTotalNewAmount =  0
  CollectionTotalOldAmount =  0
  CollectionUPI =  0

  Count =  0

  ngOnInit(): void {
    this.getReminderCount()
    this.permission.forEach((e: any) => {
      if (e.ModuleName === 'Customer') {
        this.CustomerView = e.MView;
      }else if (e.ModuleName === 'BillingSearch'){
        this.Billview = e.MView;
      }
      else if (e.ModuleName === 'ExpenseList'){
        this.Expenseview = e.MView;
      }
      else if (e.ModuleName === 'ProductTransfer'){
        this.Transferview = e.MView;
      }
      else if (e.ModuleName === 'SmsSetting'){
        this.smsSettingview = e.MView;
      }
      else if (e.ModuleName === 'SmsSetting'){
        this.reminderview = e.MView;
      }
    });

    let dashcard: any[] = [];

    if(this.company.ID != 241){
    if (this.user.UserGroup === 'CompanyAdmin') {
      dashcard = [
        {
          icon: "assets/images/billing.png",
          title: "Customer",
          routersLinks: "/sale/billing/0/0",
          titleName: "Alt+c",
        },
        {
          icon: "assets/images/search-list.png",
          title: "Bill Search",
          routersLinks: "/sale/billinglist/0",
          titleName: "Alt+b",
        },
        {
          icon: "assets/images/purchase.png",
          title: "Purchase",
          routersLinks: "/inventory/purchaseList/0",
          titleName: "Alt+p",
        },
        {
          icon: "assets/images/expense.png",
          title: "Expense",
          routersLinks: "/companyPayment/expense",
          titleName: "Alt+e",
        },
        {
          icon: "assets/images/transfer.png",
          title: "Transfer Product",
          routersLinks: "/inventory/transfer-list",
          titleName: "Alt+t",
        },
        {
          icon: "assets/images/sms-removebg-preview.png",
          title: "Bulk SMS",
          routersLinks: "/admin/smsSetting",
          titleName: "",
        },
        {
          icon: "assets/images/reminder.png",
          title: "Reminder",
          routersLinks: "/admin/reminder",
          titleName: "Alt+r",
        },
        {
          icon: "assets/images/sms-removebg-preview.png",
          title: "Summary",
          routersLinks: "/admin/dashboardSummary",
          titleName: "",
        },
      ];
    } else {
      if (this.CustomerView === true) {
        dashcard.push({
          icon: "assets/images/billing.png",
          title: "Customer",
          routersLinks: "/sale/billing/0/0"
        });
      }
      if (this.Billview === true) {
        dashcard.push({
          icon: "assets/images/search-list.png",
          title: "Bill Search",
          routersLinks: "/sale/billinglist/0",
        });
      }
      if (this.Expenseview === true) {
        dashcard.push({
          icon: "assets/images/expense.png",
          title: "Expense",
          routersLinks: "/companyPayment/expense",
        });
      }
      if (this.Transferview === true) {
        dashcard.push({
          icon: "assets/images/transfer.png",
          title: "Product Transfer",
          routersLinks: "/inventory/transfer-list",
        });
      }
      if (this.smsSettingview === true) {
        dashcard.push({
          icon: "assets/images/sms-removebg-preview.png",
          title: "Bulk SMS",
          routersLinks: "/admin/smsSetting",
        });
      }
      if (this.reminderview === true) {
        dashcard.push({
          icon: "assets/images/reminder.png",
          title: "Reminder",
          routersLinks: "/admin/reminder"
        });
      }
    }
    }

    if(this.company.ID == 241){
      this.getDashBoardReportBI()
      if(this.user.UserGroup === 'CompanyAdmin'){
        dashcard = [
          {
            icon: "assets/images/billing.png",
            title: "Customer",
            routersLinks: "/sale/billing/0/0",
            titleName: "Alt+c",
          },
          {
            icon: "assets/images/search-list.png",
            title: "Bill Search",
            routersLinks: "/sale/billinglist/0",
            titleName: "Alt+b",
          },
          {
            icon: "assets/images/purchase.png",
            title: "Purchase",
            routersLinks: "/inventory/purchaseList/0",
            titleName: "Alt+p",
          },
          {
            icon: "assets/images/expense.png",
            title: "Expense",
            routersLinks: "/companyPayment/expense",
            titleName: "Alt+e",
          },
      
  
          {
            icon: "assets/images/reminder.png",
            title: "Reminder",
            routersLinks: "/admin/reminder",
            titleName: "Alt+r",
          },
       
            {
          icon: "assets/images/sms-removebg-preview.png",
          title: "Summary",
          routersLinks: "/admin/dashboardSummary",
          titleName: "",
        },
        ];
      } else {
        if (this.CustomerView === true) {
          dashcard.push({
            icon: "assets/images/billing.png",
            title: "Customer",
            routersLinks: "/sale/billing/0/0"
          });
        }
        if (this.Billview === true) {
          dashcard.push({
            icon: "assets/images/search-list.png",
            title: "Bill Search",
            routersLinks: "/sale/billinglist/0",
          });
        }
        if (this.Expenseview === true) {
          dashcard.push({
            icon: "assets/images/expense.png",
            title: "Expense",
            routersLinks: "/companyPayment/expense",
          });
        }
        if (this.Transferview === true) {
          dashcard.push({
            icon: "assets/images/transfer.png",
            title: "Product Transfer",
            routersLinks: "/inventory/transfer-list",
          });
        }
        if (this.smsSettingview === true) {
          dashcard.push({
            icon: "assets/images/sms-removebg-preview.png",
            title: "Bulk SMS",
            routersLinks: "/admin/smsSetting",
          });
        }
        if (this.reminderview === true) {
          dashcard.push({
            icon: "assets/images/reminder.png",
            title: "Reminder",
            routersLinks: "/admin/reminder"
          });
        }
      }
    
    }

    this.cards = dashcard;
  }

  getDashBoardReportBI() {
      const subs: Subscription = this.bill.getDashBoardReportBI('').subscribe({
        next: (res: any) => {
          if(res.success){
             this.AmountDue =  res.data.TodayData.AmountDue
             this.AmountExpense =  res.data.TodayData.AmountExpense
             this.AmountRecieve =  res.data.TodayData.AmountRecieve
             this.AmountSale =  res.data.TodayData.AmountSale
             this.OldAmountRecieve =  res.data.TodayData.OldAmountRecieve

             this.SaleTotalBalanceAmount =  res.data.Sale.TotalBalanceAmount
             this.SaleTotalPaidAmount =  res.data.Sale.TotalPaidAmount
             this.SaleTotalSaleAmount =  res.data.Sale.TotalSaleAmount
             this.SaleList =  res.data.Sale.data

             this.CustomerTotalBalance =  res.data.CustomerBalance.TotalBalance
             this.CustomerList =  res.data.CustomerBalance.data

             this.CollectionList =  res.data.Collection.data
             this.CollectionCARD =  res.data.Collection.CARD
             this.CollectionCASH =  res.data.Collection.CASH
             this.CollectionTotalAmount =  res.data.Collection.TotalAmount
             this.CollectionTotalNewAmount =  res.data.Collection.TotalNewAmount
             this.CollectionTotalOldAmount =  res.data.Collection.TotalOldAmount
             this.CollectionUPI =  res.data.Collection.UPI

          }else{
          }
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    }

    
    getReminderCount() {
    const subs: Subscription = this.rem.getReminderCount('').subscribe({
      next: (res: any) => {
        if(res.success){
           this.Count =  res.data.TotalCount

        }else{
        }
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }
  
}
