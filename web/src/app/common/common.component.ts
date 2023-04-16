import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2'; 
import { Subscription } from 'rxjs';
import { map, filter, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { NgxSpinnerService } from 'ngx-spinner';
import { ShopService } from '../service/shop.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-common',
  templateUrl: './common.component.html',
  styleUrls: ['./common.component.css']
})
export class CommonComponent implements OnInit {

  user:any =JSON.parse(localStorage.getItem('user') || '') ;
  company:any
  CompanyAdmindisplsy :any
  SuperAdmindis :any
  x: any;
  dropShoplist :any;
  selectedShops :any = [];
  searchText:any
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ss: ShopService,
    private sp: NgxSpinnerService,
    private modalService: NgbModal,
    ) { }
  viewCompanyInfo = true;

  heroes: any = []

  ngOnInit(): void { 
    this.user = JSON.parse(localStorage.getItem('user') || '')
    if (this.user.UserGroup !== 'SuperAdmin') {
      this.company = JSON.parse(localStorage.getItem('company') || '') ;
      this.selectedShops = Number(JSON.parse(localStorage.getItem('selectedShop') || '')[0]);
      this.dropShoplist  = JSON.parse(localStorage.getItem('shop') || '')
    } else {
      this.company.ID = this.user.CompanyID
    }
    this.heroes = [
      {
        "Name": "Company",
        "routersLinks" : `/admin/company/${this.company.ID}`
      },
      {
        "Name": "Employee ",
        "routersLinks" : `/admin/employee/0`
      },
      {
        "Name": "Employee List",
        "routersLinks" : `/admin/employeeList`
      },
      {
        "Name": "Shop List",
        "routersLinks" : `/admin/shopList`
      },
      {
        "Name": "Role Permission ",
        "routersLinks" : `/admin/rolePermission`
      },
      {
        "Name": "Company Setting ",
        "routersLinks" : `/admin/companySetting`
      },
    ];
  }

  openModal(content: any) {
    this.modalService.open(content, { centered: true , backdrop : 'static', keyboard: false,size: 'sm'});
  }

  myFunction() {
    this.x = document.getElementById("myTopnav");
    if (this.x.className === "topnav") {
      this.x.className += " responsive";
    } else {
      this.x.className = "topnav";
    }
  }

  saveSelectedShop() {
   localStorage.removeItem('selectedShop');
   localStorage.setItem('selectedShop', JSON.stringify([`${this.selectedShops}`]));
   this.router.navigate(['/admin/CompanyDashborad']);
  }

  logout() {
    localStorage.removeItem('LoggedINUser');
    localStorage.removeItem('LoggedINCompany');
    localStorage.removeItem('LoggedINShop');
    window.localStorage.setItem('isLoggedIn', 'false');
    localStorage.clear();
    this.router.navigate(['/login']).then(() => {
    window.location.reload();
    });
  }
  
}
