import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators,ReactiveFormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router';
import { ThemePalette } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CompanyService } from '../service/company.service';
import { Subscription } from 'rxjs';
import { AlertService } from '../service/alert.service';
import { environment } from 'src/environments/environment';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-company',
  templateUrl: './company.component.html',
  styleUrls: ['./company.component.css']
})

export class CompanyComponent implements OnInit {

  loggedInUser:any = localStorage.getItem('LoggedINUser');
  evn = environment;
 
  companyImage: any;
  userImage: any;
  disableSuperAdminFields = false;
  toggleChecked = false;
  dataList : any;
  id : any;

  constructor(
    private router: Router,
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private cs: CompanyService,
    public as: AlertService,
  ) {
    this.id = this.route.snapshot.params['id'];
  }

  color: ThemePalette = 'primary';
  plans: any[] = [
  {ID: 1, Name: 'Trial Plan (15 Days)', days: 15},
  {ID: 2, Name: 'Monthly Plan (30 Days)', days: 30}, 
  {ID: 3, Name: 'Half Yearly Plan (180 Days)', days: 180},
  {ID: 4, Name: 'Yearly Plan (365 Days)' , days: 360}];

  data : any = {
    ID: null, CompanyName: null, MobileNo1: null, MobileNo2: null, PhoneNo: null, Address: null, Country: null, State: null, City: null, Email: null, Website: null, GSTNo: null, CINNo: null, LogoURL: null, Remark: null, Plan: null, Version: null, NoOfShops: null, EffectiveDate: new Date(), CacellationDate:  new Date(), WhatsappMsg: false, EmailMsg: false, WholeSale: false, RetailPrice: false, Status: 1, CreatedBy: null, CreatedOn: null, UpdatedBy: null, UpdatedOn: null, dataFormat: undefined,
     Name : null, UserGroup : "", DOB : null, Anniversary : null,  Branch : '', FaxNo : '',  PhotoURL : '',LoginName : "", Password : "",
     Document:null, CommissionType :null, CommissionMode :null, CommissionValue :null, CommissionValueNB :null,
  };


  // public id =  this.route.snapshot.paramMap.get('id');


  ngOnInit() {
    if (this.id != 0) {
      this.getCompanyById(); 
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
   
    const subs: Subscription =  this.cs.createCompany( this.data).subscribe({
      next: (res: any) => {
        // this.dataList = res.result;
        // console.log(this.dataList);
        if (res.success) {
          this.router.navigate(['/admin/companyList']);  
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

  getCompanyById(){
    const subs: Subscription = this.cs.getCompanyById(this.id).subscribe({
      next: (res: any) => {
        console.log(res.data);
        if (res.success) {
          this.as.successToast(res.message)
          this.data = res.data[0]
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

  updateCompany(){
    console.log(this.data);
    const subs: Subscription =  this.cs.updateCompany( this.data).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.router.navigate(['/admin/companyList']);  
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
