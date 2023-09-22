import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators,ReactiveFormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { NgxSpinner, NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { FileUploadService } from 'src/app/service/helpers/file-upload.service';
import { CompanyService } from 'src/app/service/company.service';

@Component({
  selector: 'app-company-setting',
  templateUrl: './company-setting.component.html',
  styleUrls: ['./company-setting.component.css']
})
export class CompanySettingComponent implements OnInit {

  companysetting:any = JSON.parse(localStorage.getItem('companysetting') || '');
  user:any =JSON.parse(localStorage.getItem('user') || '') ;
  shop:any =JSON.parse(localStorage.getItem('shop') || '') ;
  selectedShop:any =JSON.parse(localStorage.getItem('selectedShop') || '') ;
 
  env = environment;
  img: any;
  userImage: string | undefined;

  constructor(
    private formBuilder: FormBuilder,
    public as: AlertService,
    private fu: FileUploadService,
    private cs: CompanyService,
    private sp: NgxSpinnerService,

  ) { }

  data: any = {ID: null, CompanyLanguage: 'English', Locale: 'en-IN', CompanyCurrency: '', CurrencyFormat: null, DateFormat: null,CompanyTagline: '', BillHeader: '', BillFooter: '', RewardsPointValidity: '', EmailReport: null,
     WholeSalePrice: false, Composite: false, RetailRate: false,  Color1: '', FontApi:'', FontsStyle: '', HSNCode: false, Discount: false, GSTNo: false, Rate: false, SubTotal: false, Total: false, CGSTSGST: false,
     WelComeNote: '' ,BillFormat:null,SenderID: '',MsgAPIKey:'', SmsSetting: '',DataFormat: 0,RewardPercentage:0, RewardExpiryDate: '30',AppliedReward:0, MobileNo:'2', MessageReport: null, LogoURL: null, WatermarkLogoURL: null,
     InvoiceFormat: 'option.ejs', LoginTimeStart: '', LoginTimeEnd: '', year: false, month: false, partycode: false, type: false , BarCode:'', FeedbackDate:'', ServiceDate:'',DeliveryDay:'',UpdatedBy:null
  };

  bill : any ={CompanyID: null,  BillHeader:'3',HeaderWidth:100, HeaderHeight:25, HeaderPadding:5,HeaderMargin:5,ImageWidth:200,ImageHeight:150,ImageAlign:'center',ShopNameFont:25,ShopNameBold:'400', ShopDetailFont:15, Color:'#000000',LineSpace:20, CustomerFont:15, CustomerLineSpace:20,
  TableBody:12,TableHeading:15, NoteFont:15, NoteLineSpace:20, UpdateBy:null}

  companyWatermark: any;
  companyWholeSalePrice: any;
  billFormatList: any;
  companyImage: any;
  dataList: any;

  dataFormat: any = [
       {ID: 'DD-MM-YYYY', Name: '10-02-2021'},
       {ID: 'DD-MM-YYYY h:mm a', Name: '01-12-2000 11:39 PM/AM'},
       {ID: 'DD MMM YYYY', Name: '26 Aug 2023'},
       {ID: 'DD MMM YYYY h:mm a', Name: '26 Aug 2023 11:39 PM/AM'},
  ];

  wlcmArray: any = [];
  wlcmArray1: any = [] ;

  ngOnInit(): void {
   this.getCompanySetting();
   this.getBillFormateById();
   [this.shop] = this.shop.filter((s:any) => s.ID === Number(this.selectedShop[0]));;
  }

  getCompanySetting(){
    this.data = JSON.parse(localStorage.getItem('companysetting') || '');
    this.wlcmArray1 = JSON.parse(this.companysetting.WelComeNote) || ''
    if (this.data.LogoURL === "null" || this.data.LogoURL === "") {
     this.data.LogoURL = "assets/images/userEmpty.png"
   } 
  }

  uploadImage(e:any, mode:any){
    if(e.target.files.length) {
      this.img = e.target.files[0];
    };
    this.fu.uploadFileComapny(this.img).subscribe((data:any) => {
      if (data.body !== undefined && mode === 'company') {
        this.companyImage = this.env.apiUrl + data.body?.download;
        this.data.LogoURL = data.body?.download
        // this.as.successToast(data.body?.message)
      } else {
        this.companyWatermark = this.env.apiUrl + data.body?.download;
        this.data.PhotoURL = data.body?.download
        // this.as.successToast(data.body?.message)
      }
    });
  }

  addRow() {
    this.wlcmArray1.push({NoteType: '', Content: ''});
  }

  delete(i: any) {
    this.wlcmArray1.splice(this.wlcmArray.indexOf(this.wlcmArray[i]), 1);
  }

  updatecompanysetting(){
    this.sp.show();
    this.data.WelComeNote = JSON.stringify(this.wlcmArray1);
    const subs: Subscription =  this.cs.updatecompanysetting( this.data).subscribe({
      next: (res: any) => {
        if (res.success) {
            Swal.fire({
              position: 'center',
              icon: 'success',
              title: 'Your Company Setting has been Update.',
              showConfirmButton: false,
              timer: 1500
            })
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => {
        console.log(err.msg);
      },
      complete: () => subs.unsubscribe(),
    });
  }

  saveBillFormate(){
    this.sp.show()
    this.bill.CompanyID = this.companysetting.CompanyID
   const subs: Subscription =  this.cs.saveBillFormate(this.bill).subscribe({
    next: (res: any) => {
      if (res.success) {
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Your file has been Update.',
            showConfirmButton: false,
            timer: 1500
          })
      } else {
        this.as.errorToast(res.message)
      }
      this.sp.hide();
    },
    error: (err: any) => {
      console.log(err.msg);
    },
    complete: () => subs.unsubscribe(),
  });
  }

  getBillFormateById(){
    this.sp.show()
 
   let dtm = {
     CompanyID : this.companysetting.CompanyID
    }
    const subs: Subscription =  this.cs.getBillFormateById(dtm).subscribe({
     next: (res: any) => {
       if (res.success) {
           this.bill = res.data[0]  
       } else {
         this.as.errorToast(res.message)
       }
       this.sp.hide();
     },
     error: (err: any) => {
       console.log(err.msg);
     },
     complete: () => subs.unsubscribe(),
   });
   }

}
