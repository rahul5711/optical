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
import { RoleService } from '../service/role.service';
import { DataStorageServiceService } from '../service/data-storage-service.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  env = environment;

  particlesJS: any;
  data:any = { LoginName: '', Password: '' }
 
  user:any =localStorage.getItem('user') || '';
  hide = false
  dropShoplist: any;
  roleList: any;
  selectedShop: any;
  moduleList: any = [
    {ModuleName: 'CompanyInfo', MView: true, Edit: true, Add: true, View: true, Delete: true},
  ];

  constructor(private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    public as: AlertService,
    private auth: AuthServiceService,
    private token: TokenService,
    private sp: NgxSpinnerService,
    private modalService: NgbModal,
    private ss: ShopService,
    private role: RoleService,
    private dataStorageService: DataStorageServiceService,


  ) { }


  ngOnInit(): void {

  }
 
  rolesList(){
    const subs: Subscription = this.role.getList().subscribe({
      next: (res: any) => {
        this.roleList = res.data
        this.setPermission()
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  onSubmit(content:any) {
    if (this.data.LoginName === "") {
      return this.as.errorToast("please fill up login name")
    }
    if (this.data.Password === "") {
      return this.as.errorToast("please fill up password")
    }
    
    const subs: Subscription = this.auth.login(this.data).subscribe({
      next: (res: any) => {
        this.sp.show()
        if (res.success == true) {
          this.as.successToast(res.message)
          this.token.setToken(res.accessToken);
          this.token.refreshToken(res.refreshToken);
          localStorage.setItem('user', JSON.stringify(res.data));

            if(res.data.UserGroup  == "SuperAdmin" ){
              localStorage.setItem('user', JSON.stringify(res.data));
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
              localStorage.setItem('user', JSON.stringify(res.data));
              localStorage.setItem('company', JSON.stringify(res.Company));
              localStorage.setItem('companysetting', JSON.stringify(res.CompanySetting));
              localStorage.setItem('shop', JSON.stringify(res.shop));
              localStorage.setItem('selectedShop', JSON.stringify([`${res.shop[0]?.ID}`]));
              localStorage.setItem('permission', JSON.stringify(this.moduleList));
              this.dataStorageService.permission = this.moduleList;
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
                localStorage.setItem('company', JSON.stringify(res.Company));
                localStorage.setItem('companysetting', JSON.stringify(res.CompanySetting));
                localStorage.setItem('user', JSON.stringify(res.data));
                localStorage.setItem('permission', JSON.stringify(this.moduleList));
                
                this.dataStorageService.permission = this.moduleList;
                this.dropShoplist = res.shop
               
                this.modalService.open(content, { centered: true , backdrop : 'static', keyboard: false,size: 'sm'});

            }   
        } 
        else {
          this.as.errorToast(res.message);          
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err),
      complete: () => subs.unsubscribe(),
    });
   
  }

  saveSelectedShop() {
   this.dropShoplist.forEach((element:any) => {
     if (element.ID === this.selectedShop) {
        let shop = []
        shop.push(element)
       localStorage.setItem('selectedShop', JSON.stringify([`${element.ID}`]));
       localStorage.setItem('shop', JSON.stringify(shop));
       this.rolesList()
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

 setPermission() {
  this.roleList.forEach((element: any) => {
    if (element.ID === Number(JSON.parse(localStorage.getItem('shop') || '')[0].RoleID)) {
     localStorage.setItem('permission', element.Permission);
     this.dataStorageService.permission = JSON.parse(element.Permission);
    }
  });
}
}
