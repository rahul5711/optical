import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators,ReactiveFormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router';
import { ThemePalette } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2'; 
import * as moment from 'moment';
import { AlertService } from 'src/app/service/alert.service';
import { FileUploadService } from 'src/app/service/file-upload.service';
import { EmployeeService } from 'src/app/service/employee.service';
import { RoleService } from 'src/app/service/role.service';
import { ShopService } from 'src/app/service/shop.service';

@Component({
  selector: 'app-employee',
  templateUrl: './employee.component.html',
  styleUrls: ['./employee.component.css']
})
export class EmployeeComponent implements OnInit {
  loggedInCompany:any = (localStorage.getItem('LoggedINCompany') || '');
  user = (localStorage.getItem('user') || '');
  env: { production: boolean; apiUrl: string; appUrl: string; };
  userImage :any;
  id: any;
  img: any;
  roleList:any
  dropShoplist: any;
  
  constructor(
    private router: Router,
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private formBuilder: FormBuilder,
    public as: AlertService,
    private es: EmployeeService,
    private fu: FileUploadService,
    private role: RoleService,
    private sp: NgxSpinnerService,
    private ss: ShopService,
  ) { 
    this.id = this.route.snapshot.params['id'];
    this.env = environment
  }

  data: any  = { ID : null, CompanyID : null , Name : null, UserGroup : "Employee", DOB : null, Anniversary : null, MobileNo1 : null,
  MobileNo2 : null, PhoneNo : null, Email : null, Address : null, Branch : '', FaxNo : null, Website : null, PhotoURL : null, Document: null,
  LoginName : "", Password : "", Status : 1, CreatedBy : null, UpdatedBy : null, CreatedOn : "", UpdatedOn : null, CommissionType: 0, CommissionMode: 0,
  CommissionValue: 0, CommissionValueNB: 0
  };

  userShop: any = {ID: null, UserID: null, ShopID: null, RoleID: null, Status: 1, CreatedOn: null, CreatedBy: null};

  ngOnInit(): void {
    if (this.id != 0) {
      this.getUserById(); 
    }
    this.rolesList(); 
    this.dropdownShoplist(); 
  }

  onSubmit(){
    const subs: Subscription =  this.es.saveUser(this.data).subscribe({
      next: (res: any) => {
        // this.dataList = res.result;
        // console.log(this.dataList);
        if (res.success) {
          this.router.navigate(['/admin/employeeList']); 
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Your file has been Save.',
            showConfirmButton: false,
            timer: 1200
          }) 
        } else {
          this.as.errorToast(res.message)
        }
      },
      error: (err: any) => {
        console.log(err.msg);
      },
      complete: () => subs.unsubscribe(),
      
    });
  }

  uploadImage(e:any, mode:any){
    if(e.target.files.length) {
      this.img = e.target.files[0];
    };
    this.fu.uploadFileComapny(this.img).subscribe((data:any) => {
      if (data.body !== undefined && mode === 'company') {
        this.userImage = this.env.apiUrl + data.body?.download;
        this.data.PhotoURL = data.body?.download
        console.log(this.userImage);
        this.as.successToast(data.body?.message)
      }
    });
  }

  getUserById(){
    const subs: Subscription = this.es.getUserById(this.id).subscribe({
      next: (res: any) => {
        console.log(res.data);
        
        if (res.success) {
          this.as.successToast(res.message)
          this.data = res.data[0]
          this.userImage = this.env.apiUrl + res.data[0].PhotoURL;

        } else {
          this.as.errorToast(res.message)
        }
      },
      error: (err: any) => {
        console.log(err.message);
      },
      complete: () => subs.unsubscribe(),
    })
  }

  updateUser(){
    console.log(this.data);
    const subs: Subscription =  this.es.updateUser( this.data).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.router.navigate(['/admin/employeeList']);
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Your file has been Update.',
            showConfirmButton: false,
            timer: 1200
          })   
        } else {
          this.as.errorToast(res.message)
        }
      },
      error: (err: any) => {
        console.log(err.msg);
      },
      complete: () => subs.unsubscribe(),
    });
    
  }

  rolesList(){
    const subs: Subscription = this.role.getList().subscribe({
      next: (res: any) => {
        this.roleList = res.data
        console.log(this.roleList);
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
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

}