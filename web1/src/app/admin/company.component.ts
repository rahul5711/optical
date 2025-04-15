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
import { DataStorageServiceService } from '../service/helpers/data-storage-service.service';
import { DateAdapter } from '@angular/material/core';
import { AdminSupportService } from '../service/admin-support.service';

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
  env = environment
  compId: any;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cs: CompanyService,
    private fu: FileUploadService,
    public as: AlertService,
    private sp: NgxSpinnerService,
    private dataS: DataStorageServiceService,
    private supps: AdminSupportService,
    private dateAdapter: DateAdapter<Date>
  ) {
    this.id = this.route.snapshot.params['id'];
    this.dateAdapter.setLocale('en-GB'); //dd/MM/yyyy
  }

  // plans: any[] = [
  // {ID: 1, Name: 'Trial Plan (15 Days)', days: 15},
  // {ID: 2, Name: 'Monthly Plan (30 Days)', days: 30},
  // {ID: 3, Name: 'Half Yearly Plan (180 Days)', days: 180},
  // {ID: 4, Name: 'Yearly Plan (365 Days)' , days: 360}];

  plans: any[] = [
    {ID: 1, Name: 'PREMIUM PLAN', days: 360},
    {ID: 2, Name: 'REGULAR PLAN', days: 360},
  ];

data : any = {
    ID: null, CompanyName: null, MobileNo1: '', MobileNo2: '', PhoneNo: '', Address: null, Country: null, State: null, City: null, Email: null, Website: '', GSTNo: '', CINNo: '', LogoURL: null, Remark: '',SRemark:'',CAmount:'', DBkey:'', Plan: null, Version: null, NoOfShops: null, EffectiveDate: new Date(), CacellationDate:  null,  WhatsappMsg: false, Code:'91',EmailMsg: false, WholeSale: false, RetailPrice: false, Status: 1, CreatedBy: null, CreatedOn: null, UpdatedBy: null, UpdatedOn: null, dataFormat: undefined, User: [],dataAssign: false,CompanyStatus:'',
    PrimeMembership:false, PhotoClick:false, CustomerCategory:false, EmployeeCommission:false, LoginHistory:false, DiscountSetting:false,Quotation:false, ProductTransfer:false,  BulkTransfer:false,  PettyCash:false, LocationTracker:false, StockCheck:false, RecycleBin:false, AllExcelImport:false,
};

data1: any = { 
    ID : null, CompanyID : null, Name : "", UserGroup : "", DOB : null, Anniversary : null, MobileNo1 : null, MobileNo2 : null,   PhoneNo  : null, Email : null, Address : null, Branch : null, FaxNo : null, Website : null, PhotoURL : null, LoginName : "", Password : "", Status : 1, CreatedBy : null, UpdatedBy : null, CreatedOn : "", UpdatedOn : null, Document : [], CommissionType : 0, CommissionMode : 0, CommissionValue : 0,CommissionValueNB : 0,
    DiscountPermission:false};

  // public id =  this.route.snapshot.paramMap.get('id');
  DBList:any
  depList:any

  ngOnInit() {
      if (this.id != 0) {
        this.getCompanyById();
      }
      this.getDbConfig()
      this.getfieldList()
  }


  getDbConfig(){
    const subs: Subscription = this.cs.getDbConfig('').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.as.successToast(res.message)
          this.DBList = res.data
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
  getfieldList() {
    const subs: Subscription = this.supps.getList('CompanyStatus').subscribe({
      next: (res: any) => {
        if(res.success){
          this.depList = res.data
          this.as.successToast(res.message)
        }else{
          this.as.errorToast(res.message)
        }
      },
    error: (err: any) => console.log(err.message),
    complete: () => subs.unsubscribe(),
    });
  
  }
  onPlanChange(value:any){
    if(this.id !== 0) {
      this.data.EffectiveDate = new Date();
    }
    // if(value === 1) {
    //   const d = new Date().setDate(this.data.EffectiveDate.getDate() + 15);
    //   const date = new Date(d);
    //   this.data.CancellationDate = date;
    // }
    // if(value === 2) {
    //   const e = new Date().setDate(this.data.EffectiveDate.getDate() + 30);
    //   const date1 = new Date(e);
    //   this.data.CancellationDate = date1;
    // }
    if(value === 1) {
      const f = new Date().setDate(this.data.EffectiveDate.getDate() + 365);
      const date2 = new Date(f);
      this.data.CancellationDate = date2;
    }
    if(value === 2) {
      const a = new Date().setDate(this.data.EffectiveDate.getDate() + 365);
      const date3 = new Date(a);
      this.data.CancellationDate = date3;
      }
  }



  // onPlanChange(value: any) {
  //   if (this.id !== 0) {
  //     this.data.EffectiveDate = new Date();
  //   }
  
  //   const addDays = (days: number) => {
  //     const currentDate = new Date();
  //     currentDate.setDate(currentDate.getDate() + days);
  
  //     // Get current time in 12-hour format
  //     const hours = currentDate.getHours() % 12 || 12;
  //     const minutes = currentDate.getMinutes();
  //     const ampm = currentDate.getHours() >= 12 ? 'PM' : 'AM';
  
  //     // Format time as HH:mm AM/PM
  //     const formattedTime = `${hours}:${minutes < 10 ? '0' : ''}${minutes} ${ampm}`;
  
  //     // Combine date and time
  //     const combinedDateTime = new Date(`${currentDate.toDateString()} ${formattedTime}`);
      
  //     return combinedDateTime;
  //   };
  
  //   if (value === 1) {
  //     this.data.CancellationDate = addDays(15);
  //   }
  //   if (value === 2) {
  //     this.data.CancellationDate = addDays(30);
  //   }
  //   if (value === 3) {
  //     this.data.CancellationDate = addDays(181);
  //   }
  //   if (value === 4) {
  //     this.data.CancellationDate = addDays(365);
  //   }
  // }

  copyData(val: any) {
    if (val) {
      this.data1.Name = this.data.CompanyName;
      this.data1.MobileNo1 = this.data.MobileNo1;
      this.data1.MobileNo2 = this.data.MobileNo2;
      this.data1.PhoneNo = this.data.PhoneNo;
      this.data1.Address = this.data.Address;
      this.data1.Email = this.data.Email;
    }
  }

  onsubmit() {
    this.sp.show();
    if(this.data.Plan == 1){
      this.data.PrimeMembership = true
      this.data.PhotoClick = true
      this.data.CustomerCategory = true
      this.data.EmployeeCommission = true
      this.data.LoginHistory = true
      this.data.DiscountSetting = true
      this.data.Quotation = true
      this.data.ProductTransfer = true
      this.data.BulkTransfer = true
      this.data.PettyCash = true
      this.data.LocationTracker = true
      this.data.StockCheck = true
      this.data.RecycleBin = true
      this.data.AllExcelImport = true
    }
    if(this.data.Plan == 2){
      this.data.PrimeMembership = false
      this.data.PhotoClick = false
      this.data.CustomerCategory = false
      this.data.EmployeeCommission = false
      this.data.LoginHistory = false
      this.data.DiscountSetting = false
      this.data.Quotation = false
      this.data.ProductTransfer = false
      this.data.BulkTransfer = false
      this.data.PettyCash = false
      this.data.LocationTracker = false
      this.data.StockCheck = false
      this.data.RecycleBin = false
      this.data.AllExcelImport = false
    }
    this.data.User = this.data1
    console.log(this.data);
    const subs: Subscription =  this.cs.createCompany(this.data).subscribe({
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
              title: res.message,
              showConfirmButton: true,
              backdrop: 'static'
            })
        }
        this.sp.hide();
      },
      error: (err: any) => {
        console.log(err.msg);
      },
      complete: () => subs.unsubscribe(),
    });
  }

  getCompanyById(){
    this.sp.show();
    const subs: Subscription = this.cs.getCompanyById(this.id).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.as.successToast(res.message)
          this.data = res.data[0]
          this.data1 = res.user[0]
          this.companyImage = this.env.apiUrl + res.data[0].LogoURL;
          console.log(this.companyImage);
          
          this.userImage = this.env.apiUrl + res.data[0].PhotoURL;
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => {
        console.log(err.message);
      },
      complete: () => subs.unsubscribe(),
    })
  }

  updateCompany(){
    this.sp.show();
    this.data.User = this.data1
    const subs: Subscription =  this.cs.updateCompany(this.data).subscribe({
      next: (res: any) => {
        if (res.success) {
           if(this.user.UserGroup === 'SuperAdmin'){
            this.router.navigate(['/admin/companyList']);
            Swal.fire({
              position: 'center',
              icon: 'success',
              title: 'Your file has been Update.',
              showConfirmButton: false,
              timer: 1200
            })
           }else{
            this.getCompanyById()
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
          Swal.fire({
            position: 'center',
            icon: 'error',
            title: res.message,
            showConfirmButton: true,
            backdrop: 'static'
          })
        }
        this.sp.hide();
      },
      error: (err: any) => {
        console.log(err.msg);
      },
      complete: () => subs.unsubscribe(),
    });
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
        this.data1.PhotoURL = data.body?.download
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
