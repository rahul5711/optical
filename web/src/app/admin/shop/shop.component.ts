import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators,ReactiveFormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { pipe, Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2'; 
import { ShopService } from 'src/app/service/shop.service';
import { AlertService } from 'src/app/service/alert.service';
import { FileUploadService } from 'src/app/service/file-upload.service';
import { take } from 'rxjs/operators';
import { CompressImageService } from 'src/app/service/compress-image.service';

@Component({
  selector: 'app-shop',
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.css']
})

export class ShopComponent implements OnInit {

  loggedInCompany:any = (localStorage.getItem('LoggedINCompany') || '');
  user = JSON.parse(localStorage.getItem('user') || '');
  reactiveForm!: FormGroup;
  toggleChecked = false
  companyImage:any;
  img: any;
  env: { production: boolean; apiUrl: string; appUrl: string; };
  id: any;
 
  constructor(

    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    public as: AlertService,
    private ss: ShopService,
    private fu: FileUploadService,
    private compressImage: CompressImageService


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
      this.data.GSTNo = this.user.Company.GSTNo;
      this.data.CINNo = this.user.Company.CINNo;
      this.data.Address = this.user.Company.Address;
      this.data.Website = this.user.Company.Website;
      this.data.Email = this.user.Company.Email;
      this.data.LogoURL = this.user.Company.LogoURL;
      this.data.PhoneNo = this.user.Company.PhoneNo;
      this.data.MobileNo1 = this.user.Company.MobileNo1;
      this.data.MobileNo2 = this.user.Company.MobileNo2; 
    }
  }

  onsubmit() {
    const subs: Subscription =  this.ss.shopSave( this.data).subscribe({
      next: (res: any) => {
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
   
    this.img = e.target.files[0];
      // console.log(`Image size before compressed: ${this.img.size} bytes.`)
    this.compressImage.compress(this.img).pipe(take(1)).subscribe((compressedImage: any) => {
      // console.log(`Image size after compressed: ${compressedImage.size} bytes.`)
    this.fu.uploadFileComapny(compressedImage).subscribe((data:any) => {
      if (data.body !== undefined && mode === 'company') {
        this.companyImage = this.env.apiUrl + data.body?.download;
        this.data.LogoURL = data.body?.download
        this.as.successToast(data.body?.message)
      }
     });
   })

  }

  getShopById(){
    const subs: Subscription = this.ss.getShopById(this.id).subscribe({
      next: (res: any) => {
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
