import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators,ReactiveFormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { NgxSpinner, NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { FileUploadService } from 'src/app/service/helpers/file-upload.service';
import { CompanyService } from 'src/app/service/company.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-company-setting',
  templateUrl: './company-setting.component.html',
  styleUrls: ['./company-setting.component.css']
})
export class CompanySettingComponent implements OnInit {

  @ViewChild('barcode') barcodeElement: ElementRef | any;
  companysetting:any = JSON.parse(localStorage.getItem('companysetting') || '');
  user:any =JSON.parse(localStorage.getItem('user') || '') ;
  shop:any =JSON.parse(localStorage.getItem('shop') || '') ;
  selectedShop:any =JSON.parse(localStorage.getItem('selectedShop') || '') ;
  company:any =JSON.parse(localStorage.getItem('company') || '') ;
 
  env = environment;
  img: any;
  userImage: string | undefined;

  constructor(
    private formBuilder: FormBuilder,
    public as: AlertService,
    private fu: FileUploadService,
    private cs: CompanyService,
    private sp: NgxSpinnerService,
    private router: Router,

  ) { }

  data: any = {ID: null, CompanyLanguage: 'English', Locale: 'en-IN', CompanyCurrency: '', CurrencyFormat: null, DateFormat: null,CompanyTagline: '', BillHeader: '', BillFooter: '', RewardsPointValidity: '', EmailReport: null,
     WholeSalePrice: false, Composite: false, RetailRate: false,  Color1: '', FontApi:'', FontsStyle: '', HSNCode: false, Discount: false, GSTNo: false, Rate: false, SubTotal: false, Total: false, CGSTSGST: false,
     WelComeNote: '' ,BillFormat:null,SenderID: '',MsgAPIKey:'', SmsSetting: '',DataFormat: 0,RewardPercentage:0, RewardExpiryDate: '30',AppliedReward:0, MobileNo:'2', MessageReport: null, LogoURL: null, WatermarkLogoURL: null,
     InvoiceFormat: 'option.ejs', LoginTimeStart: '', LoginTimeEnd: '', year: false, month: false, partycode: false, type: false , BarCode:'', FeedbackDate:'', ServiceDate:'',DeliveryDay:'',UpdatedBy:null
  };

  bill : any ={CompanyID: null,  BillHeader:'3',HeaderWidth:780, HeaderHeight:170, HeaderPadding:5,HeaderMargin:5,ImageWidth:200,ImageHeight:150,ImageAlign:'center',ShopNameFont:25,ShopNameBold:'600', ShopDetailFont:17, Color:'red',LineSpace:25, CustomerFont:16, CustomerLineSpace:22,
  TableBody:15,TableHeading:17, NoteFont:15.5, NoteLineSpace:25, UpdateBy:null}

  barcode : any ={CompanyID: null,  BillHeader:'0',BarcodeWidth:425, BarcodeHeight:70, Rightwidth:50, Leftwidth:50,  BarcodePadding:0,BarcodeMargin:0,BarcodeNameFontSize:10,MRPFontSize:16,IncTaxFontSize:10,ProductBrandFontSize:10,ProductModelFontSize:10,MRPLineHeight:15, PaddingTop:0,PaddingBotton:0,PaddingLeft:0,PaddingRight:0,MarginTop:0,MarginBotton:0,MarginLeft:0,MarginRight:0,FloatLeftSide : 'Left', FloatRightSide:'Right', UpdateBy:null}

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

  
  // getCompanySetting(){
  //   this.data = JSON.parse(localStorage.getItem('companysetting') || '');
  //   this.wlcmArray1 = JSON.parse(this.companysetting.WelComeNote) || ''
  //   if (this.data.LogoURL === "null" || this.data.LogoURL === "") {
  //    this.data.LogoURL = "assets/images/userEmpty.png"
  //  } 

  //  if( this.data.year === 'true') {
  //   this.data.year = true;
  // } else if ( this.data.year === 'false' ||  this.data.year === null) {
  //   this.data.year = false;
  // }

  // if( this.data.month === 'true') {
  //   this.data.month = true;
  // } else if ( this.data.month === 'false' ||  this.data.month === null) {
  //   this.data.month = false;
  // }

  // if( this.data.partycode === 'true') {
  //   this.data.partycode = true;
  // } else if ( this.data.partycode === 'false' ||  this.data.partycode === null) {
  //   this.data.partycode = false;
  // }

  // if( this.data.type === 'true') {
  //   this.data.type = true;
  // } else if ( this.data.type === 'false' ||  this.data.type === null) {
  //   this.data.type = false;
  // }
  // }

  getCompanySetting() {
    // Retrieve company settings from local storage
    const companySettingJson = localStorage.getItem('companysetting') || '{}';
    this.data = JSON.parse(companySettingJson);
  
    // Set default logo URL if it's null or empty
    this.data.LogoURL = this.data.LogoURL || 'assets/images/userEmpty.png';
  
    // Convert string values to booleans
    this.data.year = this.data.year === 'true';
    this.data.month = this.data.month === 'true';
    this.data.partycode = this.data.partycode === 'true';
    this.data.type = this.data.type === 'true';
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
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, LogOut it!'
          }).then((result) => {
            if (result.isConfirmed) {
              localStorage.clear();
              this.router.navigate(['/login']).then(() => {
                window.location.reload();
              });
            }
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
          title: 'Are you sure?',
          text: "You won't be able to revert this!",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Yes, LogOut it!'
        }).then((result) => {
          if (result.isConfirmed) {
            localStorage.clear();
            this.router.navigate(['/login']).then(() => {
              window.location.reload();
            });
          }
        })
          this.getBillFormateById()
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
        if(res.data[0] != undefined){
          this.bill = res.data[0]  
        }
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

   saveBarcodeFormate(){
    console.log(this.barcode);
    
   }

}
