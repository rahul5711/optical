import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-dashborad',
  templateUrl: './dashborad.component.html',
  styleUrls: ['./dashborad.component.css']
})
export class DashboradComponent implements OnInit {
  user: any = JSON.parse(localStorage.getItem('user') || '');
  permission = JSON.parse(localStorage.getItem('permission') || '[]');
  constructor(
    private modalService: NgbModal,
  ) { }

  cards: any = [];
  CustomerView = false;
  Billview = false;
  Expenseview = false;
  Transferview = false;
  smsSettingview = false;
  reminderview = true;

  ngOnInit(): void {
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

    if (this.user.UserGroup === 'CompanyAdmin') {
      dashcard = [
        {
          icon: "assets/images/billing.png",
          title: "Customer",
          routersLinks: "/sale/billing/0/0"
        },
        {
          icon: "assets/images/search-list.png",
          title: "Bill Search",
          routersLinks: "/sale/billinglist/0"
        },
        {
          icon: "assets/images/purchase.png",
          title: "Purchase",
          routersLinks: "/inventory/purchaseList/0"
        },
        {
          icon: "assets/images/expense.png",
          title: "Expense",
          routersLinks: "/companyPayment/expense"
        },
        {
          icon: "assets/images/transfer.png",
          title: "Product Transfer",
          routersLinks: "/inventory/product-transfer"
        },
        {
          icon: "assets/images/sms-removebg-preview.png",
          title: "Bulk SMS",
          routersLinks: "/admin/smsSetting"
        },
        {
          icon: "assets/images/reminder.png",
          title: "Reminder",
          routersLinks: "/admin/reminder"
        },
        {
          icon: "assets/images/sms-removebg-preview.png",
          title: "Summary",
          routersLinks: "/admin/dashboardSummary"
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
          routersLinks: "/inventory/product-transfer",
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

    this.cards = dashcard;
  }
}
