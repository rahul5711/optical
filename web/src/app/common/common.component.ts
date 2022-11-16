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

  loggedInUser:any = localStorage.getItem('LoggedINUser') || '' ;
  user:any =JSON.parse(localStorage.getItem('user') || '') ;
  CompanyAdmindisplsy :any
  SuperAdmindis :any
  x: any;
  dropShoplist :any;
  selectedShops :any;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ss: ShopService,
    private sp: NgxSpinnerService,
    ) { 
      console.log(window.location.href);

    }
  viewCompanyInfo = true;
  ngOnInit(): void { 
      this.dropdownShoplist()
  }
 
  myFunction() {
    this.x = document.getElementById("myTopnav");
    if (this.x.className === "topnav") {
      this.x.className += " responsive";
    } else {
      this.x.className = "topnav";
    }
  }

  dropdownShoplist(){
    const subs: Subscription = this.ss.dropdownShoplist(this.user.shop).subscribe({
      next: (res: any) => {
        this.dropShoplist = res.data
        if (this.dropShoplist.length !== 0) {
         
          // localStorage.setItem('LoggedINShop', JSON.stringify(this.shopList[0]));
          // this.loggedInShop = this.shopList[0];
          this.selectedShops = JSON.parse(localStorage.getItem("selectedShop") || '');
          console.log(this.selectedShops);
          
          if(this.selectedShops === null ) {
            this.selectedShops = this.dropShoplist[0].ShopID;
            localStorage.setItem('selectedShop', JSON.stringify(this.dropShoplist[0]));
            
          } else {
          
            this.selectedShops = JSON.parse(localStorage.getItem("selectedShop") || '').ShopID;
        
          }
        }
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  saveSelectedShop() {
    localStorage.removeItem('selectedShop');
    this.dropShoplist.forEach((element: { ID: any; }) => {
      if (element.ID === this.selectedShops) {
        localStorage.setItem('LoggedINShop', JSON.stringify(element));
        this.selectedShops = element;
        this.selectedShops = JSON.parse(localStorage.getItem("selectedShop") || '').ShopID;
        this.router.navigate(['/admin/CompanyDashborad']);
      }
    });
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
