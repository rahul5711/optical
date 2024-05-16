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
import * as moment from 'moment';


@Component({
  selector: 'app-employee',
  templateUrl: './employee.component.html',
  styleUrls: ['./employee.component.css']
})
export class EmployeeComponent implements OnInit {
  loggedInCompany:any = (localStorage.getItem('LoggedINCompany') || '');
  permission = JSON.parse(localStorage.getItem('permission') || '[]');
  user = (localStorage.getItem('user') || '');
  env: { production: boolean; apiUrl: string; appUrl: string; };
  userImage :any;
  id: any;
  img: any;
  roleList:any
  dropShoplist: any;
  userList: any;
  saveUpdateHide = false
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
  CommissionValue: 0, CommissionValueNB: 0, DiscountPermission: false
  };

  UserShop: any = {ID: null, UserID: null, ShopID: null, RoleID: null, Status: 1};

  editEmployee = false
  addEmployee = false
  deleteEmployee = false


  imgArray: any = [];

  ngOnInit(): void {
    this.permission.forEach((element: any) => {
      if (element.ModuleName === 'Employee') {
        this.editEmployee = element.Edit;
        this.addEmployee = element.Add;
        this.deleteEmployee = element.Delete;
      }
    });
    if (this.id != 0) {
      this.getUserById();
    }
    this.dropdownShoplist();
    this.rolesList();

  }

  onSubmit(){
    this.sp.show();
    this.data.Document = JSON.stringify(this.imgArray);
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
            icon: 'warning',
            title: 'Already Exist <br>' + res.message,
            showConfirmButton: true,
            backdrop: false
          })
        }
        this.sp.hide()
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
    this.sp.show()
    const subs: Subscription = this.es.getUserById(this.id).subscribe({
      next: (res: any) => {
        this.userList = res.UserShop
        if (res.success) {
          this.as.successToast(res.message)
          this.data = res.data[0]
          let document = JSON.parse(res.data[0].Document);
          for(var i = 0; i < document.length; i++) {
            let Obj: any = {ImageName: '' , Src: ''};
            Obj.ImageName = document[i].ImageName;
            this.imgArray.push(Obj);
          }
          this.data.DiscountPermission = this.data.DiscountPermission === 'true';
            if (res.data[0].PhotoURL !== "null" && res.data[0].PhotoURL !== '') {
              this.userImage = this.env.apiUrl + res.data[0].PhotoURL;;
            } else {
              this.userImage = "/assets/images/userEmpty.png"
            }
         
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => {
        console.log(err.message);
      },
      complete: () => subs.unsubscribe(),
    })
  }

  updateUser(){
    this.sp.show()
    this.data.Document = this.imgArray;
    const subs: Subscription =  this.es.updateUser(this.data).subscribe({
      next: (res: any) => {
        if (res.success) {
            this.router.navigate(['/admin/employee/' , this.id]);
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
        this.sp.hide()
      },
      error: (err: any) => {
        console.log(err.msg);
      },
      complete: () => subs.unsubscribe(),
    });

  }

  dropdownShoplist(){
    this.sp.show()
    const subs: Subscription = this.ss.dropdownShoplist(this.user).subscribe({
      next: (res: any) => {
        if(res.success){
          this.dropShoplist = res.data
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  saveUserShop(){
    this.sp.show()
    this.UserShop.UserID = Number(this.id)
    const subs: Subscription =  this.ss.saveUserShop(this.UserShop).subscribe({
      next: (res: any) => {
        if (res.success) {
            Swal.fire({
              position: 'center',
              icon: 'success',
              title: 'Your file has been Save.',
              showConfirmButton: false,
              timer: 1200
            })
            this.UserShop = {ID: null, UserID: null, ShopID: null, RoleID: null, Status: 1};
            this.getUserById()
        } else {
          this.as.errorToast(res.message)
          Swal.fire({
            position: 'center',
            icon: 'error',
            title: res.message,
            showConfirmButton: true,
          })
        }
        this.sp.hide()
      },
      error: (err: any) => {
        console.log(err.msg);
      },
      complete: () => subs.unsubscribe(),
    });
  }

  updateUserShop(){
    this.sp.show()
    const subs: Subscription =  this.ss.updateUserShop(this.UserShop).subscribe({
      next: (res: any) => {
        if (res.success) {
            this.getUserById();
            this.UserShop = {ID: null, UserID: null, ShopID: null, RoleID: null, Status: 1};
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
        this.sp.hide()
      },
      error: (err: any) => {
        console.log(err.msg);
      },
      complete: () => subs.unsubscribe(),

    });
  }

  rolesList(){
    this.sp.show()
    const subs: Subscription = this.role.getList('').subscribe({
      next: (res: any) => {
        if(res.success){
          this.roleList = res.data
        }else{
          this.as.errorToast(res.message)
        }
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
            if(res.success){
              this.userList.splice(i, 1);
              this.as.successToast(res.message)
              Swal.fire({
                position: 'center',
                icon: 'success',
                title: 'Your file has been deleted.',
                showConfirmButton: false,
                timer: 1000
              })
            }else{
              this.as.errorToast(res.message)
            }
            this.sp.hide();
          },
          error: (err: any) => console.log(err.message),
          complete: () => subs.unsubscribe(),
        });
      }
    })
  }

  editUserShop(data: any) {
   this.UserShop = {ID: data.ID, UserID: data.UserID, ShopID: data.ShopID, RoleID: data.RoleID, Status: 1};
   this.saveUpdateHide = true
  }

  add() {
    this.imgArray.push({ImageName: '' });
  } 

  download(imgArray:any) {
    const url = 'http://opticalguru.relinksys.com:50080/zip?id=' + JSON.stringify(imgArray);
    window.open(url, '_blank');
  }

  uploadImage1(e:any,  i:any){

    this.img = e.target.files[0];
     const subs: Subscription = this.compressImage.compress(this.img).pipe(take(1)).subscribe({
      next: (compressedImage: any) => {
        const subss: Subscription = this.fu.uploadFileEmployee(compressedImage).subscribe({
          next: (data: any) => {
            if (data.body !== undefined) {
              this.imgArray[i].ImageName = this.env.apiUrl + data.body?.download;
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



}
