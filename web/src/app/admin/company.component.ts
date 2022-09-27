import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators,ReactiveFormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router';
import { environment } from '../../environments/environment';
import { ThemePalette } from '@angular/material/core';
import { Company} from '../interface/Company';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CompanyService } from '../service/company.service';
import { Subscription } from 'rxjs';
import { AlertService } from '../service/alert.service';

@Component({
  selector: 'app-company',
  templateUrl: './company.component.html',
  styleUrls: ['./company.component.css']
})

export class CompanyComponent implements OnInit {
  loggedInUser:any = localStorage.getItem('LoggedINUser');
  evn = environment;
  stringUrl: string | undefined;

  name = new FormControl('');
  companyImage: any;
  userImage: any;
  disableSuperAdminFields = false;
  toggleChecked = false;
  dataList : any;
  id : number;
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
    ID: null, CompanyName: '', MobileNo1: '', MobileNo2: '', PhoneNo: '', Address: '', Country: '', State: '', City: '', Email: '', Website: '', GSTNo: '', CINNo: '', LogoURL: '', Remark: '', Plan: '', Version: '', NoOfShops: '', EffectiveDate: new Date(), CancellationDate:  new Date(), WhatsappMsg: false, EmailMsg: false, WholeSale: false, RetailPrice: false, Status: 1, CreatedBy: null, CreatedOn: null, UpdatedBy: null, UpdatedOn: null, dataFormat: undefined,
     data: { ID : null, CompanyID : null, Name : "", UserGroup : "", DOB : null, Anniversary : null, MobileNo1 : null, MobileNo2 : null, PhoneNo : null, Email : null, Address : null, Branch : '', FaxNo : '', Website : '', PhotoURL : '',LoginName : "", Password : "", Status : 1, CreatedBy : null, UpdatedBy : null, CreatedOn : "", UpdatedOn : null
     }
  };


  // public id =  this.route.snapshot.paramMap.get('id');


  ngOnInit() {

    console.log(this.id);
    if (this.id !== 0) {
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
    this.data.Document = [];
    this.data.CommissionType = 0;
    this.data.CommissionMode = 0;
    this.data. CommissionValue = 0;
    this.data.CommissionValueNB = 0;
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

}
