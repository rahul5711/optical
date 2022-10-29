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
import { ShopService } from 'src/app/service/shop.service';
import { AlertService } from 'src/app/service/alert.service';
import { FileUploadService } from 'src/app/service/file-upload.service';

@Component({
  selector: 'app-shop',
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.css']
})

export class ShopComponent implements OnInit {

  loggedInCompany:any = (localStorage.getItem('LoggedINCompany') || '');
  user = (localStorage.getItem('user') || '');
  reactiveForm!: FormGroup;
  toggleChecked = false
  companyImage:any;
  img: any;
  env: { production: boolean; apiUrl: string; appUrl: string; };
  id: any;
 
  constructor(

    private router: Router,
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private formBuilder: FormBuilder,
    public as: AlertService,
    private ss: ShopService,
    private fu: FileUploadService,

  ) { 
    this.id = this.route.snapshot.params['id'];
    this.env = environment
    this.reactiveForm = new FormGroup({
      Name : new FormControl(null, Validators.required)
    })
  }

  data: any = { ID : null,  CompanyID: null, Name : null, AreaName: null, MobileNo1 : null, MobileNo2 : null, PhoneNo : null, Address : null, Email : null,
    Website : null, GSTNo : null, CINNo : null, BarcodeName: null, Discount: false, GSTnumber: false, LogoURL : null,HSNCode: false, CustGSTNo:false, Rate:false, Discounts:false, Tax:false, SubTotal:false, Total:false,  ShopTiming : 'MON-SAT 10 AM - 8 PM, SUN OFF', WelcomeNote : 'No Terms and Conditions',   Status : 1,
    CreatedBy : null, CreatedOn : null, UpdatedBy : null, UpdatedOn : null, ShopStatus: 0,
  };

  ngOnInit(): void {
    if (this.id != 0) {
      this.getShopById(); 
    }
  }

  copyData(val: any) {
    if (val) {
      this.data.GSTNo = this.loggedInCompany.GSTNo;
      this.data.CINNo = this.loggedInCompany.CINNo;
      this.data.Address = this.loggedInCompany.Address;
      this.data.Website = this.loggedInCompany.Website;
      this.data.Email = this.loggedInCompany.Email;
      this.data.LogoURL = this.loggedInCompany.LogoURL;
      this.data.PhoneNo = this.loggedInCompany.PhoneNo;
      this.data.MobileNo1 = this.loggedInCompany.MobileNo1;
      this.data.MobileNo2 = this.loggedInCompany.MobileNo2; 
    }
  }

  onsubmit() {
    const subs: Subscription =  this.ss.shopSave( this.data).subscribe({
      next: (res: any) => {
        // this.dataList = res.result;
        // console.log(this.dataList);
        if (res.success) {
          this.router.navigate(['/admin/shopList']); 
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
        this.companyImage = this.env.apiUrl + data.body?.download;
        this.data.LogoURL = data.body?.download
        console.log(this.companyImage);
        this.as.successToast(data.body?.message)
      }
    });
  }

  getShopById(){
    const subs: Subscription = this.ss.getShopById(this.id).subscribe({
      next: (res: any) => {
        console.log(res.data);
        
        if (res.success) {
          this.as.successToast(res.message)
          this.data = res.data[0]
          this.companyImage = this.env.apiUrl + res.data[0].LogoURL;

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

  updateShop(){
    console.log(this.data);
    const subs: Subscription =  this.ss.updateShop( this.data).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.router.navigate(['/admin/shopList']);
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

}
