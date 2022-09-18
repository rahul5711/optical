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

@Component({
  selector: 'app-company',
  templateUrl: './company.component.html',
  styleUrls: ['./company.component.css']
})

export class CompanyComponent implements OnInit {

  name = new FormControl('');
  companyImage: any;
  userImage: any;
  disableSuperAdminFields = false;
  toggleChecked = false;
  dataList : any;
  constructor(
    private router: Router,
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private companyService: CompanyService,
  ) {}

  color: ThemePalette = 'primary';
  plans: any[] = [
  {ID: 1, Name: 'Trial Plan (15 Days)', days: 15},
  {ID: 2, Name: 'Monthly Plan (30 Days)', days: 30}, 
  {ID: 3, Name: 'Half Yearly Plan (180 Days)', days: 180},
  {ID: 4, Name: 'Yearly Plan (365 Days)' , days: 360}];

  data : Company = {
    ID: 0, CompanyName: '', MobileNo1: '', MobileNo2: '', PhoneNo: '', Address: '', Country: '', State: '', City: '', Email: '', Website: '',
    GSTNo: '', CINNo: '', LogoURL: '', Remark: '', Plan: '', Version: '', NoOfShops: '', EffectiveDate: new Date(),
    CancellationDate:  new Date(), WhatsappMsg: false, EmailMsg: false, WholeSale: false, RetailPrice: false, Status: 1, CreatedBy: 0, CreatedOn: null, UpdatedBy: 0, UpdatedOn: null,
    dataFormat: undefined
  };

  data1: any = { ID : null, CompanyID : null, Name : "", UserGroup : "", DOB : null, Anniversary : null, MobileNo1 : null,
    MobileNo2 : null, PhoneNo : null, Email : null, Address : null, Branch : null, FaxNo : null, Website : null, PhotoURL : null,
    LoginName : "", Password : "", Status : 1, CreatedBy : null, UpdatedBy : null, CreatedOn : "", UpdatedOn : null
  };

  ngOnInit(): void {
  }

  onsubmit() {
    const subs: Subscription =  this.companyService.createCompany(this.data1).subscribe({
      next: (res: any) => {
        this.dataList = res.result;
      },
      error: (err: any) => {
        console.log(err.msg);
      },
      complete: () => subs.unsubscribe(),
    });
  }
      
}
