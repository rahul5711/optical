import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators,ReactiveFormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { pipe, Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { FileUploadService } from 'src/app/service/helpers/file-upload.service';
import { EmployeeService } from 'src/app/service/employee.service';
import { RoleService } from 'src/app/service/role.service';
import { ShopService } from 'src/app/service/shop.service';
import { take } from 'rxjs/operators';
import { CompressImageService } from 'src/app/service/helpers/compress-image.service';


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
  userList: any;
  saveUpdateHide:any
  v = "^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$"
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    public as: AlertService,
    private es: EmployeeService,
    private fu: FileUploadService,
    private role: RoleService,
    private sp: NgxSpinnerService,
    private ss: ShopService,
    private compressImage: CompressImageService
  ) {
    this.id = this.route.snapshot.params['id'];
    this.env = environment
  }

  data: any  = { ID : null, CompanyID : null , Name : null, UserGroup : "Employee", DOB : null, Anniversary : null, MobileNo1 : null,
  MobileNo2 : null, PhoneNo : null, Email : null, Address : null, Branch : '', FaxNo : null, Website : null, PhotoURL : null, Document: null,
  LoginName : "", Password : "", Status : 1, CreatedBy : null, UpdatedBy : null, CreatedOn : "", UpdatedOn : null, CommissionType: 0, CommissionMode: 0,
  CommissionValue: 0, CommissionValueNB: 0
  };

  UserShop: any = {ID: null, UserID: null, ShopID: null, RoleID: null, Status: 1};

  ngOnInit(): void {
    if (this.id != 0) {
      this.getUserById();
    }
    this.dropdownShoplist();
    this.rolesList();
  }

  onSubmit(){
    const subs: Subscription =  this.es.saveUser(this.data).subscribe({
      next: (res: any) => {
        if (res.success) {
          if(res.data !== 0) {
            this.id = res.data;
            this.router.navigate(['/admin/employee/' , this.id]);
            Swal.fire({
              position: 'center',
              icon: 'success',
              title: 'Your file has been Save.',
              showConfirmButton: false,
              timer: 1200
            })
          }
        } else {
          this.as.errorToast(res.message)
          Swal.fire({
            position: 'center',
            icon: 'error',
            title: 'Already exist',
            text:'LoginName Already exist from this LoginName ' + this.data.LoginName,
            showConfirmButton: true,
            backdrop: false
          })
        }
      },
      error: (err: any) => {
        console.log(err.msg);
      },
      complete: () => subs.unsubscribe(),

    });
  }

  uploadImage(e:any, mode:any){

  this.img = e.target.files[0];
   const subs: Subscription = this.compressImage.compress(this.img).pipe(take(1)).subscribe({
    next: (compressedImage: any) => {
      const subss: Subscription = this.fu.uploadFileComapny(compressedImage).subscribe({
        next: (data: any) => {
          if (data.body !== undefined && mode === 'company') {
            this.userImage = this.env.apiUrl + data.body?.download;
            this.data.PhotoURL = data.body?.download
            this.as.successToast(data.body.message)
           }
        },
        error: (err: any) => {
          console.log(err.message);
        },
        complete: () => subss.unsubscribe(),
      })
    },
    error: (err: any) => {
      console.log(err.message);
    },
    complete: () => subs.unsubscribe(),
  })
  }

  getUserById(){
    const subs: Subscription = this.es.getUserById(this.id).subscribe({
      next: (res: any) => {
        this.userList = res.UserShop
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
    const subs: Subscription =  this.es.updateUser( this.data).subscribe({
      next: (res: any) => {
        if (res.success) {
          if(res.data !== 0) {
            this.id = res.data;
            this.router.navigate(['/admin/employee/' , this.id]);
            Swal.fire({
              position: 'center',
              icon: 'success',
              title: 'Your file has been Save.',
              showConfirmButton: false,
              timer: 1200
            })
          }
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

  dropdownShoplist(){
    const subs: Subscription = this.ss.dropdownShoplist(this.user).subscribe({
      next: (res: any) => {
        this.dropShoplist = res.data
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  saveUserShop(){
    this.UserShop.UserID = this.id
    const subs: Subscription =  this.ss.saveUserShop(this.UserShop).subscribe({
      next: (res: any) => {
        if (res.success) {
            this.getUserById()
            Swal.fire({
              position: 'center',
              icon: 'success',
              title: 'Your file has been Save.',
              showConfirmButton: false,
              timer: 1200
            })
        } else {
          this.as.errorToast(res.message)
          Swal.fire({
            position: 'center',
            icon: 'error',
            title: res.message,
            showConfirmButton: true,
          })
        }
      },
      error: (err: any) => {
        console.log(err.msg);
      },
      complete: () => subs.unsubscribe(),

    });
  }

  updateUserShop(){
    const subs: Subscription =  this.ss.updateUserShop(this.UserShop).subscribe({
      next: (res: any) => {
        if (res.success) {
            this.getUserById();
            this.saveUpdateHide = false;
            Swal.fire({
              position: 'center',
              icon: 'success',
              title: 'Your file has been Save.',
              showConfirmButton: false,
              timer: 1200
            })
        } else {
          this.as.errorToast(res.message)
          Swal.fire({
            position: 'center',
            icon: 'error',
            title: res.message,
            showConfirmButton: true,
          })
        }
      },
      error: (err: any) => {
        console.log(err.msg);
      },
      complete: () => subs.unsubscribe(),

    });
  }

  rolesList(){
    const subs: Subscription = this.role.getList('').subscribe({
      next: (res: any) => {
        this.roleList = res.data
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  deleteItem(i:any){
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.sp.show();
        const subs: Subscription = this.ss.deleteUserShop(this.userList[i].ID).subscribe({
          next: (res: any) => {
            this.userList.splice(i, 1);
            this.sp.hide();
            this.as.successToast(res.message)
          },
          error: (err: any) => console.log(err.message),
          complete: () => subs.unsubscribe(),
        });
      Swal.fire({
          position: 'center',
          icon: 'success',
          title: 'Your file has been deleted.',
          showConfirmButton: false,
          timer: 1000
        })
      }
    })
  }

  editUserShop(data: any) {
   this.UserShop = data;
   this.saveUpdateHide = true
  }

}
