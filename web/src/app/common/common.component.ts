import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2'; 
import { Subscription } from 'rxjs';
import { ShopService } from '../service/shop.service';
import { map, filter, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-common',
  templateUrl: './common.component.html',
  styleUrls: ['./common.component.css']
})
export class CommonComponent implements OnInit {

  user:any =JSON.parse(localStorage.getItem('user') || '') ;
  CompanyAdmindisplsy :any
  SuperAdmindis :any
  x: any;
  dropShoplist :any;
  selectedShops :any = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ss: ShopService,
    private sp: NgxSpinnerService,
    ) { }
  viewCompanyInfo = true;

  ngOnInit(): void { 
    this.user = JSON.parse(localStorage.getItem('user') || '')
    if (this.user.UserGroup !== 'SuperAdmin') {
      this.selectedShops = Number(JSON.parse(localStorage.getItem('selectedShop') || '')[0]);
      this.dropShoplist  = JSON.parse(localStorage.getItem('shop') || '')
    }
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
