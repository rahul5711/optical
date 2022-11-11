import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2'; 
import { Subscription } from 'rxjs';
import { ShopService } from '../service/shop.service';
import { map, filter, debounceTime, distinctUntilChanged } from 'rxjs/operators';


@Component({
  selector: 'app-common',
  templateUrl: './common.component.html',
  styleUrls: ['./common.component.css']
})
export class CommonComponent implements OnInit {

  loggedInUser:any = localStorage.getItem('LoggedINUser') || '' ;
  user:any =JSON.parse(localStorage.getItem('user') || '') ;
  y = false
  x: any;
  dropShoplist :any;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ss: ShopService,
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
    const subs: Subscription = this.ss.dropdownShoplist(this.user).subscribe({
      next: (res: any) => {
        this.dropShoplist = res.data
    
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
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
