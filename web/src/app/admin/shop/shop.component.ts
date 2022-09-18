import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators,ReactiveFormsModule } from '@angular/forms';
import {NgForm} from '@angular/forms';
import {DomSanitizer} from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router';
import { ThemePalette } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-shop',
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.css']
})

export class ShopComponent implements OnInit {
  reactiveForm!: FormGroup;
  toggleChecked = false
  companyImage:any;
  
  constructor(
    private router: Router,
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private formBuilder: FormBuilder,
  ) { 

    this.reactiveForm = new FormGroup({
      Name : new FormControl(null, Validators.required)
     
    })
  }

  data: any = { ID : null,  CompanyID: null, Name : null, AreaName: null, MobileNo1 : null, MobileNo2 : null, PhoneNo : null, Address : null, Email : null,
    Website : null, GSTNo : null, CINNo : null, BarcodeName: null, Discount: false, GSTnumber: false, LogoURL : null,HSNCode: false, CustGSTNo:false, Rate:false, Discounts:false, Tax:false, SubTotal:false, Total:false,  ShopTiming : 'MON-SAT 10 AM - 8 PM, SUN OFF', WelcomeNote : 'No Terms and Conditions',   Status : 1,
    CreatedBy : null, CreatedOn : null, UpdatedBy : null, UpdatedOn : null, ShopStatus: 0,
  };

  ngOnInit(): void {
    
  }

  onSubmit(){
    console.log(this.data);
  }
}
