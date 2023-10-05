import { Component, OnInit } from '@angular/core';


@Component({
  selector: 'app-dashborad',
  templateUrl: './dashborad.component.html',
  styleUrls: ['./dashborad.component.css']
})
export class DashboradComponent implements OnInit {

  constructor( ) { }
  
  cards: any = []
 
  ngOnInit(): void {

   let dashcard = [
    // {
    //   "icon" : "assets/images/customer.png",
    //   "title": "Customer",
    //   "routersLinks" : "/sale/billing/0/0"
    // },
    {
      "icon" : "assets/images/billing.png",
      "title": "Billing",
      "routersLinks" : "/sale/billing/0/0"
    },
    {
      "icon" : "assets/images/purchase.png",
      "title": "Purchase",
      "routersLinks" : "/inventory/purchase/0"
    },
    {
      "icon" : "assets/images/expense.png",
      "title": "Expense",
      "routersLinks" : "/companyPayment/expense"
    },
    // {
    //   "icon" : "assets/images/supp.png",
    //   "title": "Supplier",
    //   "routersLinks" : "/inventory/supplier"
    // },
  
    {
      "icon" : "assets/images/transfer.png",
      "title": "Product Transfer",
      "routersLinks" : "/inventory/product-transfer"
    },
    {
      "icon" : "assets/images/sms-removebg-preview.png",
      "title": "Bulk SMS",
      "routersLinks" : "/admin/smsSetting"
    },
  
    {
      "icon" : "assets/images/nreminder.png",
      "title": "Reminder",
      "routersLinks" : "/product/productManage"
    },
   ]

   this.cards = dashcard
  }

}
