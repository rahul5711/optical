import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-admin-dashborad',
  templateUrl: './admin-dashborad.component.html',
  styleUrls: ['./admin-dashborad.component.css']
})
export class AdminDashboradComponent implements OnInit {

  constructor() { }

  cards: any = []

  ngOnInit(): void {

    let dashcard = [
      {
        "icon" : "assets/images/new-company.png",
        "title": "New Company",
        "routersLinks" : "/admin/company/0"
      },
      {
        "icon" : "assets/images/company-list.png",
        "title": "Company List",
        "routersLinks" : "/admin/companyList"
      },
      {
        "icon" : "assets/images/sub-plans.png",
        "title": "Plan",
        "routersLinks" : "/admin/companyList"
      },
      {
        "icon" : "assets/images/search-product.png",
        "title": "Prod_Master",
        "routersLinks" : "/admin/productManageAssign"
      }
     ]
     this.cards = dashcard
  }

}
