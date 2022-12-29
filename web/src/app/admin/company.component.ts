import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators,ReactiveFormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CompanyService } from '../service/company.service';
import { FileUploadService } from '../service/helpers/file-upload.service';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import * as moment from 'moment';
import { CompanyModel} from '../interface/Company';
import { AlertService } from '../service/helpers/alert.service';


@Component({
  selector: 'app-company',
  templateUrl: './company.component.html',
  styleUrls: ['./company.component.css']
})

export class CompanyComponent implements OnInit {

  user:any =JSON.parse(localStorage.getItem('user') || '') ;
  companyImage: any;
  userImage: any;
  disableSuperAdminFields = false;
  toggleChecked = false;
  dataList : any;
  id : any;
  imgList: any;
  img: any;
  env: { production: boolean; apiUrl: string; appUrl: string; };
  compId: any;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cs: CompanyService,
    private fu: FileUploadService,
    public as: AlertService,
    private sp: NgxSpinnerService,

  ) {
    this.id = this.route.snapshot.params['id'];
    this.env = environment
  }


  plans: any[] = [
  {ID: 1, Name: 'Trial Plan (15 Days)', days: 15},
  {ID: 2, Name: 'Monthly Plan (30 Days)', days: 30},
  {ID: 3, Name: 'Half Yearly Plan (180 Days)', days: 180},
  {ID: 4, Name: 'Yearly Plan (365 Days)' , days: 360}];


  data : any = {
    ID: null, CompanyName: null, MobileNo1: '', MobileNo2: '', PhoneNo: '', Address: null, Country: null, State: null, City: null, Email: null, Website: '', GSTNo: '', CINNo: '', LogoURL: null, Remark: '',SRemark:'',CAmount:'', Plan: null, Version: null, NoOfShops: null, EffectiveDate: new Date(), CacellationDate:  null,  WhatsappMsg: false, EmailMsg: false, WholeSale: false, RetailPrice: false, Status: 1, CreatedBy: null, CreatedOn: null, UpdatedBy: null, UpdatedOn: null, dataFormat: undefined,
      Name : '',  DOB : null, Anniversary : null,  Branch : '', FaxNo : '',  PhotoURL : '',LoginName : "", Password : "",
     Document:null, CommissionType :null, CommissionMode :null, CommissionValue :null, CommissionValueNB :null,
  };

 
  // public id =  this.route.snapshot.paramMap.get('id');


  ngOnInit() {
    this.sp.show();
    if (this.id != 0) {
      this.getCompanyById();
    }
    this.sp.hide();
  }

  onPlanChange(value:any){
    if(this.id !== 0) {
      this.data.EffectiveDate = new Date();
    }
    if(value === 1) {
      const d = new Date().setDate(this.data.EffectiveDate.getDate() + 15);
      const date = new Date(d);
      this.data.CancellationDate = date;
    }
    if(value === 2) {
      const e = new Date().setDate(this.data.EffectiveDate.getDate() + 30);
      const date1 = new Date(e);
      this.data.CancellationDate = date1;
    }
    if(value === 3) {
      const f = new Date().setDate(this.data.EffectiveDate.getDate() + 181);
      const date2 = new Date(f);
      this.data.CancellationDate = date2;
    }
    if(value === 4) {
      const a = new Date().setDate(this.data.EffectiveDate.getDate() + 365);
      const date3 = new Date(a);
      this.data.CancellationDate = date3;
      }
  }

  copyData(val: any) {
    if (val) {
      this.data.Name = this.data.CompanyName;
      this.data.MobileNo1 = this.data.MobileNo1;
      this.data.MobileNo2 = this.data.MobileNo2;
      this.data.PhoneNo = this.data.PhoneNo;
      this.data.Address = this.data.Address;
      this.data.Email = this.data.Email;
    }
  }

  onsubmit() {
    this.sp.show();
    const subs: Subscription =  this.cs.createCompany( this.data).subscribe({
      next: (res: any) => {
        // this.dataList = res.result;
        if (res.success) {
          this.router.navigate(['/admin/companyList']);
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
    this.sp.hide();
  }

  getCompanyById(){
    this.sp.show();
    const subs: Subscription = this.cs.getCompanyById(this.id).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.as.successToast(res.message)
          this.data = res.data[0]
          this.companyImage = this.env.apiUrl + res.data[0].LogoURL;
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
    this.sp.hide();
  }

  updateCompany(){
    this.sp.show();
    const subs: Subscription =  this.cs.updateCompany( this.data).subscribe({
      next: (res: any) => {
        if (res.success) {
           if(this.user.UserGroup === 'SuperAdmin'){
            this.router.navigate(['/admin/companyList']);
           }else{
            Swal.fire({
              position: 'center',
              icon: 'success',
              title: 'Your file has been Update.',
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
    this.sp.hide();
  }

  uploadImage(e:any, mode:any){
    this.sp.show();
    if(e.target.files.length) {
      this.img = e.target.files[0];
    };
    this.fu.uploadFiles(this.img).subscribe((data:any) => {
      if (data.body !== undefined && mode === 'company') {
        this.companyImage = this.env.apiUrl + data.body?.download;
        this.data.LogoURL = data.body?.download
        if(data.body.message === 'Uploaded Successfully'){
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Uploaded Successfully.',
            showConfirmButton: false,
            timer: 500
          })
        }
      } else {
        this.userImage = this.env.apiUrl + data.body?.download;
        this.data.PhotoURL = data.body?.download
        if(data?.body?.message === 'Uploaded Successfully'){
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Uploaded Successfully.',
            showConfirmButton: false,
            timer: 500
          })
        }
        // this.as.successToast(data.body?.message)
      }
    });
    this.sp.hide();
  }
}
