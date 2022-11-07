import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import * as  particlesJS from 'angular-particle';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AlertService } from '../service/alert.service';
import { AuthServiceService } from '../service/auth-service.service';
import { Subscription } from 'rxjs';
import { TokenService } from '../service/token.service';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2'; 
import { Toast } from 'ngx-toastr';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ShopService } from '../service/shop.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  particlesJS: any;
  data:any = { LoginName: '', Password: '' }
 
  user:any =localStorage.getItem('user') || '';
  hide = false
  dropShoplist: any;
  selectedShop: any;

  constructor(private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    public as: AlertService,
    private auth: AuthServiceService,
    private token: TokenService,
    private sp: NgxSpinnerService,
    private modalService: NgbModal,
    private ss: ShopService,

  ) { }


  ngOnInit(): void {
   console.log(this.user);
   

  }
 
  dropdownShoplist(){
    const subs: Subscription = this.ss.dropdownShoplist(this.user).subscribe({
      next: (res: any) => {
        this.dropShoplist = res.data
        console.log(this.dropShoplist);
        
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  saveSelectedShop() {
    this.dropShoplist.forEach((element:any) => {
      if (element.ID === this.selectedShop) {
        localStorage.setItem('user', JSON.stringify(element));
        
        this.modalService.dismissAll()
        this.router.navigate(['/admin/CompanyDashborad']);
        Swal.fire({
          position: 'center',
          icon: 'success',
          title:   'Welcome TO ' + `${element.Name}`,
          showConfirmButton: false,
          timer: 100
        })
      }
    });
    
  }

  onSubmit(content:any) {
   
    if (this.data.LoginName === "") {
      return this.as.errorToast("please fill up login name")
    }
    if (this.data.Password === "") {
      return this.as.errorToast("please fill up password")
    }
    this.sp.show()
    const subs: Subscription = this.auth.login(this.data).subscribe({
      next: (res: any) => {
        if (res.success == true) {
          this.as.successToast(res.message)
          this.token.setToken(res.accessToken);
          this.token.refreshToken(res.refreshToken);
          localStorage.setItem('user', JSON.stringify(res));
          console.log(res,'res');
           
            if(res.data.UserGroup  == "SuperAdmin" ){
              this.router.navigate(['/admin/adminDashborad']);
             
              let dt = new Date();
              let hours = dt.getHours();
              let min = dt.getMinutes();
      
              if(hours>=1 || hours<=12){
                Swal.fire({
                  position: 'center',
                  icon: 'success',
                  title:   'Good Morning Sir ' + `${res.data.Name}`,
                  showConfirmButton: false,
                  timer: 1500
                })
              }else if(hours>=12 || hours<=16){
                Swal.fire({
                  position: 'center',
                  icon: 'success',
                  title:   'Good After Sir ' + `${res.data.Name}`,
                  showConfirmButton: false,
                  timer: 1500
                })
              }else if(hours>=16 || hours<=21){
                Swal.fire({
                  position: 'center',
                  icon: 'success',
                  title:   'Good Evning Sir ' + `${res.data.Name}`,
                  showConfirmButton: false,
                  timer: 1500
                })
              }else if(hours>=21 || hours<=24){
                Swal.fire({
                  position: 'center',
                  icon: 'success',
                  title:   'Good Night Sir ' + `${res.data.Name}`,
                  showConfirmButton: false,
                  timer: 1500
                })
              }
            }
          
             if( res.data.UserGroup == "CompanyAdmin"){
               this.router.navigate(['/admin/CompanyDashborad']);
               Swal.fire({
                position: 'center',
                icon: 'success',
                title:   'Welcome TO ' + `${res.data.Name}`,
                showConfirmButton: false,
                timer: 1500
              })
              } 

              if( res.data.UserGroup == "Employee"){
                
                this.modalService.open(content, { centered: true , backdrop : 'static', keyboard: false,size: 'sm'});
                this.dropdownShoplist()
                
               } 


           
        } 
        else {
          this.as.errorToast(res.message);          
        }
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
    this.sp.hide()
  
  }
}
