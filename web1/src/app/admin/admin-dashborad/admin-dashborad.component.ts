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
        "icon" : "assets/images/newcompanys.png",
        "title": "New Company",
        "routersLinks" : "/admin/company/0"
      },
      {
        "icon" : "assets/images/companylistss.png",
        "title": "Company List",
        "routersLinks" : "/admin/companyList"
      },
      {
        "icon" : "assets/images/plans.png",
        "title": "Plan",
        "routersLinks" : "/admin/companyList"
      },
      {
        "icon" : "assets/images/prodss.png",
        "title": "Prod_Master",
        "routersLinks" : "/admin/productManageAssign" 
      }
     ]
     this.cards = dashcard
  }

}
