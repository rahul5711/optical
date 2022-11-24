import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators,ReactiveFormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2'; 
import { AlertService } from 'src/app/service/alert.service';
import { FileUploadService } from 'src/app/service/file-upload.service';
import { CompanyService } from 'src/app/service/company.service';

@Component({
  selector: 'app-company-setting',
  templateUrl: './company-setting.component.html',
  styleUrls: ['./company-setting.component.css']
})
export class CompanySettingComponent implements OnInit {
  img: any;
  userImage: string | undefined;

  constructor(
    private formBuilder: FormBuilder,
    public as: AlertService,
    private fu: FileUploadService,
    private cs: CompanyService,

  ) { }

  data: any = {ID: null, CompanyLanguage: 'English', Locale: 'en-IN', CompanyCurrency: '', CurrencyFormat: null, DateFormat: null,CompanyTagline: '', BillHeader: '', BillFooter: '', RewardsPointValidity: '', EmailReport: null,
     WholeSalePrice: false, Composite: false, RetailRate: false,  Color1: '', FontApi:'', FontsStyle: '', HSNCode: false, Discount: false, GSTNo: false, Rate: false, SubTotal: false, Total: false, CGSTSGST: false, 
     WelComeNote: '',BillFormat:null,SenderID: '',MsgAPIKey:'', SmsSetting: '',DataFormat: 0,RewardPercentage:0, RewardExpiryDate: '30',AppliedReward:0, MobileNo:'2', MessageReport: null, LogoURL: '', WatermarkLogoURL: '', 
     InvoiceFormat: 'option.ejs', LoginTimeStart: '', LoginTimeEnd: '', year: false, month: false, partycode: false, type: false , BarCode:'', FeedbackDate:'', ServiceDate:'',DeliveryDay:''
  }; 


  companyWatermark: any;
  companyWholeSalePrice: any;
  billFormatList: any;
  env = environment;
  companyImage: any;
  dataList: any;
  loggedInCompany = (localStorage.getItem('LoggedINCompany'));
  user:any =JSON.parse(localStorage.getItem('user') || '') ;
   
   
  dataFormat: any = [
       {ID: 'llll', Name: 'Wed, Feb 10, 2021 7:03 PM'},
       {ID: 'LLLL', Name: 'Wednesday, February 10, 2021 7:02 PM'},
       {ID: 'lll', Name: 'Feb 10, 2021 7:00 PM'},
       {ID: 'LLL', Name: 'February 10, 2021 7:00 PM'},
       {ID: 'LL', Name: 'February 10, 2021'},
       {ID: 'll', Name: 'Feb 10, 2021'},
       {ID: 'L', Name: '02/10/2021'},
       {ID: 'l', Name: '2/10/2021'},
       {ID: 'DD/MM/YYYY', Name: '10/02/2021'},
       {ID: 'DD-MM-YYYY', Name: '10-02-2021'}
  ];
   
  wlcmArray: any = [];
  wlcmArray1: any;

  ngOnInit(): void {
    this.data = this.user.CompanySetting
     this.wlcmArray1 = JSON.parse(this.data.WelComeNote) || ''

    console.log(this.wlcmArray1);
    
  }

  uploadImage(e:any, mode:any){
    if(e.target.files.length) {
      this.img = e.target.files[0];
    };
    this.fu.uploadFileComapny(this.img).subscribe((data:any) => {
      if (data.body !== undefined && mode === 'company') {
        this.companyImage = this.env.apiUrl + data.body?.download;
        this.data.LogoURL = data.body?.download
        this.as.successToast(data.body?.message)
      } else {
        this.companyWatermark = this.env.apiUrl + data.body?.download;
        this.data.PhotoURL = data.body?.download
        this.as.successToast(data.body?.message) 
      }
    });
  }

  addRow() {
    this.wlcmArray1.push({NoteType: '', Content: ''});
  }

  delete(i: string | number) {
    this.wlcmArray1.splice(this.wlcmArray.indexOf(this.wlcmArray[i]), 1);
  }

  updatecompanysetting(){
    const subs: Subscription =  this.cs.updatecompanysetting( this.data).subscribe({
      next: (res: any) => {
        if (res.success) {
         
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
