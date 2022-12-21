import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { AlertService } from 'src/app/service/alert.service';
import { FileUploadService } from 'src/app/service/file-upload.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { take } from 'rxjs/operators';
import { CompressImageService } from 'src/app/service/compress-image.service';
import * as moment from 'moment';
import { CustomerModel, SpectacleModel, ContactModel, OtherModel } from 'src/app/interface/Customer';
import { CustomerService } from 'src/app/service/customer.service';

@Component({
  selector: 'app-billing',
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.css']
})

export class BillingComponent implements OnInit {
  
  user = JSON.parse(localStorage.getItem('user') || '');
  companysetting = JSON.parse(localStorage.getItem('companysetting') || '');
  env = environment;

  id: any;
  customerImage: any;
  clensImage: any;
  spectacleImage: any;
  img: any;
  familyList: any;
  docList: any;
  ReferenceList: any;
  OtherList: any;
  spectacleLists:any=[]
  contactList: any=[]
  otherList: any=[]
  toggleChecked = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    public as: AlertService,
    private fu: FileUploadService,
    private sp: NgxSpinnerService,
    private modalService: NgbModal,
    private compressImage: CompressImageService,
    private cs: CustomerService
  ) {
    this.id = this.route.snapshot.params['id'];
  }

  data: CustomerModel = {
    ID: '', CompanyID: '',  Idd: 0, Name: '', Sno: '', TotalCustomer: '', VisitDate: '', MobileNo1: '', MobileNo2: '', PhoneNo: '', Address: '', GSTNo: '', Email: '', PhotoURL: '', DOB: '', Age: 0, Anniversary: '', RefferedByDoc: '', ReferenceType: '', Gender: '', Category: '', Other: '', Remarks: '', Status: 1, CreatedBy: 0, UpdatedBy: 0, CreatedOn: '', UpdatedOn: '', tablename: '', spectacle_rx: [], contact_lens_rx: [], other_rx: [],
  };

  spectacle: SpectacleModel = {
    ID: 'null', CustomerID: '', REDPSPH: '', Reminder: '6', REDPCYL: '', REDPAxis: '', REDPVA: '', LEDPSPH: '', LEDPCYL: '', LEDPAxis: '',
    LEDPVA: '', RENPSPH: '', RENPCYL: '', RENPAxis: '', RENPVA: '', LENPSPH: '', LENPCYL: '', LENPAxis: '', LENPVA: '', REPD: '', LEPD: '',
    R_Addition: '', L_Addition: '', R_Prism: '', L_Prism: '', Lens: '', Shade: '', Frame: '', VertexDistance: '', RefractiveIndex: '', FittingHeight: '', ConstantUse: false, NearWork: false, RefferedByDoc: 'Self', DistanceWork: false, UploadBy: 'Upload', PhotoURL: '', FileURL: '', Family: 'Self', ExpiryDate: '', Status: 1, CreatedBy: 0, CreatedOn: '', UpdatedBy: 0, UpdatedOn: ''
  };

  clens: ContactModel   = {
    ID: 'null', CustomerID: '', REDPSPH: '', REDPCYL: '', REDPAxis: '', REDPVA: '', LEDPSPH: '', LEDPCYL: '', LEDPAxis: '',
    LEDPVA: '', RENPSPH: '', RENPCYL: '', RENPAxis: '', RENPVA: '', LENPSPH: '', LENPCYL: '', LENPAxis: '', LENPVA: '', REPD: '', LEPD: '',
    R_Addition: '', L_Addition: '', R_KR: '', L_KR: '', R_HVID: '', L_HVID: '', R_CS: '', L_CS: '', R_BC: '', L_BC: '',
    R_Diameter: '', L_Diameter: '', BR: '', Material: '', Modality: '', RefferedByDoc: 'Self', Other: '', ConstantUse: false,
    NearWork: false, DistanceWork: false, Multifocal: false, PhotoURL: '', FileURL: '', Family: 'Self', Status: 1, CreatedBy: 0,
    CreatedOn: '', UpdatedBy: 0, UpdatedOn: ''
  };

  other: OtherModel = {
    ID: 'null', CustomerID: '', BP: '', Sugar: '', IOL_Power: '', RefferedByDoc: 'Self', Operation: '', R_VN: '', L_VN: '', R_TN: '', L_TN: '', R_KR: '', L_KR: '', Treatment: '', Diagnosis: '', Family: 'Self', FileURL: '', Status: 1, CreatedBy: 0, CreatedOn: '', UpdatedBy: 0, UpdatedOn: ''
  };

  Check: any = { SpectacleCheck: true, ContactCheck: false, OtherCheck: false, };

  // dropdown values in satics
  dataSPH: any = [
    { Name: '+25.00' },
    { Name: '+24.75' },
    { Name: '+24.50' },
    { Name: '+24.25' },
    { Name: '+24.00' },
    { Name: '+23.75' },
    { Name: '+23.50' },
    { Name: '+23.25' },
    { Name: '+23.00' },
    { Name: '+22.75' },
    { Name: '+22.50' },
    { Name: '+22.25' },
    { Name: '+22.00' },
    { Name: '+21.75' },
    { Name: '+21.50' },
    { Name: '+21.25' },
    { Name: '+21.00' },
    { Name: '+20.75' },
    { Name: '+20.50' },
    { Name: '+20.25' },
    { Name: '+20.00' },
    { Name: '+19.75' },
    { Name: '+19.50' },
    { Name: '+19.25' },
    { Name: '+19.00' },
    { Name: '+18.75' },
    { Name: '+18.50' },
    { Name: '+18.25' },
    { Name: '+18.00' },
    { Name: '+17.75' },
    { Name: '+17.50' },
    { Name: '+17.25' },
    { Name: '+17.00' },
    { Name: '+16.75' },
    { Name: '+16.50' },
    { Name: '+16.25' },
    { Name: '+16.00' },
    { Name: '+15.75' },
    { Name: '+15.50' },
    { Name: '+15.25' },
    { Name: '+15.00' },
    { Name: '+14.75' },
    { Name: '+14.50' },
    { Name: '+14.25' },
    { Name: '+14.00' },
    { Name: '+13.75' },
    { Name: '+13.50' },
    { Name: '+13.25' },
    { Name: '+13.00' },
    { Name: '+12.75' },
    { Name: '+12.50' },
    { Name: '+12.25' },
    { Name: '+12.00' },
    { Name: '+11.75' },
    { Name: '+11.50' },
    { Name: '+11.25' },
    { Name: '+11.00' },
    { Name: '+10.75' },
    { Name: '+10.50' },
    { Name: '+10.25' },
    { Name: '+10.00' },
    { Name: '+9.75' },
    { Name: '+9.50' },
    { Name: '+9.25' },
    { Name: '+9.00' },
    { Name: '+8.75' },
    { Name: '+8.50' },
    { Name: '+8.25' },
    { Name: '+8.00' },
    { Name: '+7.75' },
    { Name: '+7.50' },
    { Name: '+7.25' },
    { Name: '+7.00' },
    { Name: '+6.75' },
    { Name: '+6.50' },
    { Name: '+6.25' },
    { Name: '+6.00' },
    { Name: '+5.75' },
    { Name: '+5.50' },
    { Name: '+5.25' },
    { Name: '+5.00' },
    { Name: '+4.75' },
    { Name: '+4.50' },
    { Name: '+4.25' },
    { Name: '+4.00' },
    { Name: '+3.75' },
    { Name: '+3.50' },
    { Name: '+3.25' },
    { Name: '+3.00' },
    { Name: '+2.75' },
    { Name: '+2.50' },
    { Name: '+2.25' },
    { Name: '+2.00' },
    { Name: '+1.75' },
    { Name: '+1.50' },
    { Name: '+1.25' },
    { Name: '+1.00' },
    { Name: '+0.75' },
    { Name: '+0.50' },
    { Name: '+0.25' },
    { Name: ' ' },
    { Name: '-0.25' },
    { Name: '-0.50' },
    { Name: '-0.75' },
    { Name: '-1.00' },
    { Name: '-1.25' },
    { Name: '-1.50' },
    { Name: '-1.75' },
    { Name: '-2.00' },
    { Name: '-2.25' },
    { Name: '-2.50' },
    { Name: '-2.75' },
    { Name: '-3.00' },
    { Name: '-3.25' },
    { Name: '-3.50' },
    { Name: '-3.75' },
    { Name: '-4.00' },
    { Name: '-4.25' },
    { Name: '-4.50' },
    { Name: '-4.75' },
    { Name: '-5.00' },
    { Name: '-5.25' },
    { Name: '-5.50' },
    { Name: '-5.75' },
    { Name: '-6.00' },
    { Name: '-6.25' },
    { Name: '-6.50' },
    { Name: '-6.75' },
    { Name: '-7.00' },
    { Name: '-7.25' },
    { Name: '-7.50' },
    { Name: '-7.75' },
    { Name: '-8.00' },
    { Name: '-8.25' },
    { Name: '-8.50' },
    { Name: '-8.75' },
    { Name: '-9.00' },
    { Name: '-9.25' },
    { Name: '-9.50' },
    { Name: '-9.75' },
    { Name: '-10.00' },
    { Name: '-10.25' },
    { Name: '-10.50' },
    { Name: '-10.75' },
    { Name: '-11.00' },
    { Name: '-11.25' },
    { Name: '-11.50' },
    { Name: '-11.75' },
    { Name: '-12.00' },
    { Name: '-12.25' },
    { Name: '-12.50' },
    { Name: '-12.75' },
    { Name: '-13.00' },
    { Name: '-13.25' },
    { Name: '-13.50' },
    { Name: '-13.75' },
    { Name: '-14.00' },
    { Name: '-14.25' },
    { Name: '-14.50' },
    { Name: '-14.75' },
    { Name: '-15.00' },
    { Name: '-15.25' },
    { Name: '-15.50' },
    { Name: '-15.75' },
    { Name: '-16.00' },
    { Name: '-16.25' },
    { Name: '-16.50' },
    { Name: '-16.75' },
    { Name: '-17.00' },
    { Name: '-17.25' },
    { Name: '-17.50' },
    { Name: '-17.75' },
    { Name: '-18.00' },
    { Name: '-18.25' },
    { Name: '-18.50' },
    { Name: '-18.75' },
    { Name: '-19.00' },
    { Name: '-19.25' },
    { Name: '-19.50' },
    { Name: '-19.75' },
    { Name: '-20.00' },
    { Name: '-20.25' },
    { Name: '-20.50' },
    { Name: '-20.75' },
    { Name: '-21.00' },
    { Name: '-21.25' },
    { Name: '-21.50' },
    { Name: '-21.75' },
    { Name: '-22.00' },
    { Name: '-22.25' },
    { Name: '-22.50' },
    { Name: '-22.75' },
    { Name: '-23.00' },
    { Name: '-23.25' },
    { Name: '-23.50' },
    { Name: '-23.75' },
    { Name: '-24.00' },
    { Name: '-24.25' },
    { Name: '-24.50' },
    { Name: '-24.75' },
    { Name: '-25.00' },
  ];

  dataCYL: any = [
    { Name: '-10.00' },
    { Name: '-9.75' },
    { Name: '-9.50' },
    { Name: '-9.25' },
    { Name: '-9.00' },
    { Name: '-8.75' },
    { Name: '-8.50' },
    { Name: '-8.25' },
    { Name: '-8.00' },
    { Name: '-7.75' },
    { Name: '-7.50' },
    { Name: '-7.25' },
    { Name: '-7.00' },
    { Name: '-6.75' },
    { Name: '-6.50' },
    { Name: '-6.25' },
    { Name: '-6.00' },
    { Name: '-5.75' },
    { Name: '-5.50' },
    { Name: '-5.25' },
    { Name: '-5.00' },
    { Name: '-4.75' },
    { Name: '-4.50' },
    { Name: '-4.25' },
    { Name: '-4.00' },
    { Name: '-3.75' },
    { Name: '-3.50' },
    { Name: '-3.25' },
    { Name: '-3.00' },
    { Name: '-2.75' },
    { Name: '-2.50' },
    { Name: '-2.25' },
    { Name: '-2.00' },
    { Name: '-1.75' },
    { Name: '-1.50' },
    { Name: '-1.25' },
    { Name: '-1.00' },
    { Name: '-0.75' },
    { Name: '-0.50' },
    { Name: '-0.25' },
    { Name: 'PLANO' },
    { Name: '+0.25' },
    { Name: '+0.50' },
    { Name: '+0.75' },
    { Name: '+1.00' },
    { Name: '+1.25' },
    { Name: '+1.50' },
    { Name: '+1.75' },
    { Name: '+2.00' },
    { Name: '+2.25' },
    { Name: '+2.50' },
    { Name: '+2.75' },
    { Name: '+3.00' },
    { Name: '+3.25' },
    { Name: '+3.50' },
    { Name: '+3.75' },
    { Name: '+4.00' },
    { Name: '+4.25' },
    { Name: '+4.50' },
    { Name: '+4.75' },
    { Name: '+5.00' },
    { Name: '+5.25' },
    { Name: '+5.50' },
    { Name: '+5.75' },
    { Name: '+6.00' },
    { Name: '+6.25' },
    { Name: '+6.50' },
    { Name: '+6.75' },
    { Name: '+7.00' },
    { Name: '+7.25' },
    { Name: '+7.50' },
    { Name: '+7.75' },
    { Name: '+8.00' },
    { Name: '+8.25' },
    { Name: '+8.50' },
    { Name: '+8.75' },
    { Name: '+9.00' },
    { Name: '+9.25' },
    { Name: '+9.50' },
    { Name: '+9.75' },
    { Name: '+10.00' },

  ];

  dataPVA: any = [
    { Name: '6/6' },
    { Name: '6/6 P' },
    { Name: '6/9' },
    { Name: '6/9 P' },
    { Name: '6/12' },
    { Name: '6/12 P' },
    { Name: '6/18' },
    { Name: '6/18 P' },
    { Name: '6/24' },
    { Name: '6/24 P' },
    { Name: '6/30' },
    { Name: '6/30 P' },
    { Name: '6/36' },
    { Name: '6/36 P' },
    { Name: '6/60' },
    { Name: '6/60 P' },

  ];
  // dropdown values in satics 


  ngOnInit(): void {
    this.spectacle.REDPSPH = ' '
    this.data.VisitDate = moment().format('YYYY-MM-DD');
    if (this.id != 0) {
      this.getCustomerById(); 
    }
    
  }

  copyPower(val: any){
    if (val) {
      this.spectacle.LEDPSPH = this.spectacle.REDPSPH;
      this.spectacle.LEDPCYL = this.spectacle.REDPCYL;
      this.spectacle.LEDPAxis = this.spectacle.REDPAxis;
      this.spectacle.LEDPVA = this.spectacle.REDPVA;
      this.spectacle.L_Addition = this.spectacle.R_Addition;
      this.spectacle.LENPSPH = this.spectacle.RENPSPH;
      this.spectacle.LENPCYL = this.spectacle.RENPCYL;
      this.spectacle.LENPAxis = this.spectacle.RENPAxis;
      this.spectacle.LENPVA = this.spectacle.RENPVA;
    }else{
      this.spectacle.LEDPSPH = '';
      this.spectacle.LEDPCYL = '';
      this.spectacle.LEDPAxis = '';
      this.spectacle.LEDPVA = '';
      this.spectacle.L_Addition = '';
      this.spectacle.LENPSPH = '';
      this.spectacle.LENPCYL ='';
      this.spectacle.LENPAxis = '';
      this.spectacle.LENPVA = '';
    }
    if (val) {
      this.clens.LEDPSPH = this.clens.REDPSPH;
      this.clens.LEDPCYL = this.clens.REDPCYL;
      this.clens.LEDPAxis = this.clens.REDPAxis;
      this.clens.LEDPVA = this.clens.REDPVA;
      this.clens.L_Addition = this.clens.R_Addition;
      this.clens.LENPSPH = this.clens.RENPSPH;
      this.clens.LENPCYL = this.clens.RENPCYL;
      this.clens.LENPAxis = this.clens.RENPAxis;
      this.clens.LENPVA = this.clens.RENPVA;
    }else{
      this.clens.LEDPSPH = '';
      this.clens.LEDPCYL = '';
      this.clens.LEDPAxis = '';
      this.clens.LEDPVA = '';
      this.clens.L_Addition = '';
      this.clens.LENPSPH = '';
      this.clens.LENPCYL ='';
      this.clens.LENPAxis = '';
      this.clens.LENPVA = '';
    }
  }

  calculateAge() {
    if (this.data.DOB) {
      var timeDiff = Math.abs(Date.now() - new Date(this.data.DOB).getTime());
      this.data.Age = Math.floor(timeDiff / (1000 * 3600 * 24) / 365.25);    
    }
  }

  openModal(content: any) {
    this.modalService.open(content, { centered: true, backdrop: 'static', keyboard: false, size: 'md' });
  }

  onsubmit() {
    if(this.Check.SpectacleCheck === true) {
      this.data.tablename = 'spectacle_rx'
      this.data.spectacle_rx = this.spectacle
      this.spectacle.ExpiryDate = moment().add(Number(this.spectacle.Reminder), 'M').format('YYYY-MM-DD');
    }
    if(this.Check.ContactCheck === true) {
      this.data.tablename = 'contact_lens_rx'
      this.data.contact_lens_rx = this.clens
    }
    if(this.Check.OtherCheck === true) {
      this.data.tablename = 'other_rx'
      this.data.other_rx = this.other
    }
    
    const subs: Subscription = this.cs.saveCustomer(this.data).subscribe({
      next: (res: any) => {
        if (res.success) {
        if(res.data[0].ID !== 0) {
          this.id = res.data[0].ID;
          this.spectacle.CustomerID = this.id;
          this.clens.CustomerID = this.id;
          this.other.CustomerID = this.id;
          this.router.navigate(['/sale/billing', res.data[0].ID ]); 
          this.getCustomerById();
        }
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Your Customer has been Save.',
            showConfirmButton: false,
            timer: 1500
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
    this.contactList
  }

  getCustomerById(){
    const subs: Subscription = this.cs.getCustomerById(this.id).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.contactList = res.contact_lens_rx
          if(this.contactList.length !== 0){
            this.clens = res.contact_lens_rx[0] 
            this.clensImage = this.env.apiUrl + res.contact_lens_rx[0].PhotoURL;
          }
          this.data = res.data[0]
          this.customerImage = this.env.apiUrl + res.data[0].PhotoURL;
          this.otherList = res.other_rx
          if(this.otherList.length !== 0){
            this.other = res.other_rx[0] 
          }
          this.spectacleLists = res.spectacle_rx
          if(this.spectacleLists.length !== 0){
            this.spectacle =  res.spectacle_rx[0]
            this.spectacleImage = this.env.apiUrl + res.spectacle_rx[0].PhotoURL;
          }
          this.as.successToast(res.message)
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

  uploadImage(e: any, mode: any) {
    this.img = e.target.files[0];
    // console.log(`Image size before compressed: ${this.img.size} bytes.`)
    this.compressImage.compress(this.img).pipe(take(1)).subscribe((compressedImage: any) => {
      // console.log(`Image size after compressed: ${compressedImage.size} bytes.`)
      this.fu.uploadFileComapny(compressedImage).subscribe((data: any) => {
        if (data.body !== undefined && mode === 'User') {
          this.customerImage = this.env.apiUrl + data.body?.download;
          this.data.PhotoURL = data.body?.download;
          this.as.successToast(data.body?.message)
        }
        else if (data.body !== undefined && mode === 'spectacle') {
          this.spectacleImage = this.env.apiUrl + data.body?.download;
          this.spectacle.PhotoURL = data.body?.download;
          this.as.successToast(data.body?.message)
        }
        else if (data.body !== undefined && mode === 'clens') {
          this.clensImage = this.env.apiUrl + data.body?.download;
          this.clens.PhotoURL = data.body?.download;
          this.as.successToast(data.body?.message)
        }
      });
    })
  }

  clearFrom(){
    this.sp.show();
    this.data = {
      ID: '', CompanyID: '', Idd: 0, Name: '', Sno: '', TotalCustomer: '', VisitDate: this.data.VisitDate, MobileNo1: '', MobileNo2: '', PhoneNo: '', Address: '', GSTNo: '', Email: '', PhotoURL: '', DOB: '', Age: 0, Anniversary: '', RefferedByDoc: '', ReferenceType: '', Gender: '', Category: '', Other: '', Remarks: '', Status: 1, CreatedBy: 0, UpdatedBy: 0, CreatedOn: '', UpdatedOn: '', tablename: '', spectacle_rx: [], contact_lens_rx: [], other_rx: [],
    };
  
    this.spectacle = {
      ID: '', CustomerID: '', REDPSPH: '', Reminder: '6', REDPCYL: '', REDPAxis: '', REDPVA: '', LEDPSPH: '', LEDPCYL: '', LEDPAxis: '',
      LEDPVA: '', RENPSPH: '', RENPCYL: '', RENPAxis: '', RENPVA: '', LENPSPH: '', LENPCYL: '', LENPAxis: '', LENPVA: '', REPD: '', LEPD: '',
      R_Addition: '', L_Addition: '', R_Prism: '', L_Prism: '', Lens: '', Shade: '', Frame: '', VertexDistance: '', RefractiveIndex: '', FittingHeight: '', ConstantUse: false, NearWork: false, RefferedByDoc: 'Self', DistanceWork: false, UploadBy: 'Upload', PhotoURL: '', FileURL: '', Family: 'Self', ExpiryDate: '', Status: 1, CreatedBy: 0, CreatedOn: '', UpdatedBy: 0, UpdatedOn: ''
    };
  
    this.clens = {
      ID: ' ', CustomerID: '', REDPSPH: '', REDPCYL: '', REDPAxis: '', REDPVA: '', LEDPSPH: '', LEDPCYL: '', LEDPAxis: '',
      LEDPVA: '', RENPSPH: '', RENPCYL: '', RENPAxis: '', RENPVA: '', LENPSPH: '', LENPCYL: '', LENPAxis: '', LENPVA: '', REPD: '', LEPD: '',
      R_Addition: '', L_Addition: '', R_KR: '', L_KR: '', R_HVID: '', L_HVID: '', R_CS: '', L_CS: '', R_BC: '', L_BC: '',
      R_Diameter: '', L_Diameter: '', BR: '', Material: '', Modality: '', RefferedByDoc: 'Self', Other: '', ConstantUse: false,
      NearWork: false, DistanceWork: false, Multifocal: false, PhotoURL: '', FileURL: '', Family: 'Self', Status: 1, CreatedBy: 0,
      CreatedOn: '', UpdatedBy: 0, UpdatedOn: ''
    };
  
    this.other = {
      ID: '', CustomerID: '', BP: '', Sugar: '', IOL_Power: '', RefferedByDoc: 'Self', Operation: '', R_VN: '', L_VN: '', R_TN: '', L_TN: '',
      R_KR: '', L_KR: '', Treatment: '', Diagnosis: '', Family: 'Self', FileURL: '', Status: 1, CreatedBy: 0, CreatedOn: '', UpdatedBy: 0, UpdatedOn: ''
    };

    this.Check = { SpectacleCheck: true, ContactCheck: false, OtherCheck: false, };
    this.id = 0;
    this.router.navigate(['/sale/billing', 0 ]);
    this.ngOnInit();
    this.spectacleLists = [];
    this.contactList = [];
    this.otherList = [];
    this.sp.hide();
  }

  NewVisit(mode:any){
    if(mode === 'spectacle'){
      this.spectacle = {
        ID: 'null', CustomerID: this.id, REDPSPH: '', Reminder: '6', REDPCYL: '', REDPAxis: '', REDPVA: '', LEDPSPH: '', LEDPCYL: '', LEDPAxis: '', LEDPVA: '', RENPSPH: '', RENPCYL: '', RENPAxis: '', RENPVA: '', LENPSPH: '', LENPCYL: '', LENPAxis: '', LENPVA: '', REPD: '', LEPD: '', R_Addition: '', L_Addition: '', R_Prism: '', L_Prism: '', Lens: '', Shade: '', Frame: '', VertexDistance: '', RefractiveIndex: '', FittingHeight: '', ConstantUse: false, NearWork: false, RefferedByDoc: 'Self', DistanceWork: false, UploadBy: 'Upload', PhotoURL: '', FileURL: '', Family: 'Self', ExpiryDate: '', Status: 1, CreatedBy: 0, CreatedOn: '', UpdatedBy: 0, UpdatedOn: ''
      };
    }
   
    if(mode === 'contact'){
      this.clens = {
        ID: 'null', CustomerID: this.id, REDPSPH: '', REDPCYL: '', REDPAxis: '', REDPVA: '', LEDPSPH: '', LEDPCYL: '', LEDPAxis: '',
        LEDPVA: '', RENPSPH: '', RENPCYL: '', RENPAxis: '', RENPVA: '', LENPSPH: '', LENPCYL: '', LENPAxis: '', LENPVA: '', REPD: '', LEPD: '', R_Addition: '', L_Addition: '', R_KR: '', L_KR: '', R_HVID: '', L_HVID: '', R_CS: '', L_CS: '', R_BC: '', L_BC: '',
        R_Diameter: '', L_Diameter: '', BR: '', Material: '', Modality: '', RefferedByDoc: 'Self', Other: '', ConstantUse: false,
        NearWork: false, DistanceWork: false, Multifocal: false, PhotoURL: '', FileURL: '', Family: 'Self', Status: 1, CreatedBy: 0, CreatedOn: '', UpdatedBy: 0, UpdatedOn: ''
      };
    }
   
    this.other = {
      ID: 'null', CustomerID: this.id, BP: '', Sugar: '', IOL_Power: '', RefferedByDoc: 'Self', Operation: '', R_VN: '', L_VN: '', R_TN: '', L_TN: '', R_KR: '', L_KR: '', Treatment: '', Diagnosis: '', Family: 'Self', FileURL: '',  Status: 1, CreatedBy: 0, CreatedOn: '', UpdatedBy: 0, UpdatedOn: ''
    };
  }

  deleteSpec(i:any,mode:any){
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        if(mode === 'spectacle_rx'){
          const subs: Subscription = this.cs.deleteSpec(this.spectacleLists[i].ID,this.spectacleLists[i].CustomerID,'spectacle_rx').subscribe({
            next: (res: any) => {
              this.spectacleLists.splice(i, 1);
              if(this.spectacleLists.length === 0){
                let spec:any = []
                this.spectacle = spec
              }else{
                this.getCustomerById()
              }
              this.as.successToast(res.message)
            },
            error: (err: any) => console.log(err.message),
            complete: () => subs.unsubscribe(),
          });
         
        }else if(mode === 'contact'){
          const subs: Subscription = this.cs.deleteSpec(this.contactList[i].ID,this.contactList[i].CustomerID,'contact_lens_rx').subscribe({
            next: (res: any) => {
              this.contactList.splice(i, 1);
              if(this.contactList.length === 0){
                let con:any = []
                this.clens = con
              }else{
                this.getCustomerById()
              }
              this.as.successToast(res.message)
            },
            error: (err: any) => console.log(err.message),
            complete: () => subs.unsubscribe(),
          });
        }else if(mode === 'other'){
          const subs: Subscription = this.cs.deleteSpec(this.otherList[i].ID,this.otherList[i].CustomerID,'other_rx').subscribe({
            next: (res: any) => {
              this.otherList.splice(i, 1);
              if(this.otherList.length === 0){
                let orx:any = []
                this.other = orx
              }else{
                this.getCustomerById()
              }
              this.as.successToast(res.message)
            },
            error: (err: any) => console.log(err.message),
            complete: () => subs.unsubscribe(),
          });
        }
        Swal.fire({
          position: 'center',
          icon: 'success',
          title: 'Your file has been deleted.',
          showConfirmButton: false,
          timer: 1000
        })
      }
    })
  }

  edits(data:any,mode:any){
     if(mode === 'spectacle_rx'){
       this.spectacle = data;
     }if(mode === 'contact'){
       this.clens = data;
     } if(mode === 'other'){
       this.other = data;
     }
  }

  updateCustomer(){
    if(this.Check.SpectacleCheck === true) {
      this.data.tablename = 'spectacle_rx'
      this.data.spectacle_rx = this.spectacle
    }
    if(this.Check.ContactCheck === true) {
      this.data.tablename = 'contact_lens_rx'
      this.data.contact_lens_rx = this.clens
    }
    if(this.Check.OtherCheck === true) {
      this.data.tablename = 'other_rx'
      this.data.other_rx = this.other
    }
    const subs: Subscription = this.cs.updateCustomer(this.data).subscribe({
      next: (res: any) => {
        this.getCustomerById()
        if (res.success) {
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Your Customer has been update.',
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

  calculate(mode:any, x:any, y:any){
    let k = 0.00;
    let a = 0.00;
  
    if (mode === 'Lens'){
      // right spectacle calculate start
      if (x === 'RD')
      { if(this.spectacle.R_Addition !== ''){
        this.spectacle.R_Addition  = Number(this.spectacle.RENPSPH)  - Number(this.spectacle.REDPSPH)
        if(this.spectacle.R_Addition >= 0){
          this.spectacle.R_Addition = '+' + this.spectacle.R_Addition.toFixed(2).toString()
        }else{
          this.spectacle.R_Addition =  this.spectacle.R_Addition.toFixed(2).toString().replace("-", "+")
        }
        this.spectacle.RENPCYL = this.spectacle.REDPCYL;
        this.spectacle.RENPAxis = this.spectacle.REDPAxis;
      }
       
      } 
      if (x === 'R' ){
        if (this.spectacle.R_Addition !== ''){
          this.spectacle.RENPSPH = Number(this.spectacle.REDPSPH) + Number(this.spectacle.R_Addition)
          if(this.spectacle.RENPSPH >= 0){
            this.spectacle.RENPSPH = '+' + this.spectacle.RENPSPH.toFixed(2).toString()
          }else{
            this.spectacle.RENPSPH =  this.spectacle.RENPSPH.toFixed(2).toString()
          }
           this.spectacle.RENPCYL = this.spectacle.REDPCYL;
           this.spectacle.RENPAxis = this.spectacle.REDPAxis; 
        }else{
          this.spectacle.RENPSPH = this.spectacle.REDPSPH
        }
      }
      if (x === 'RN' ){
        if (this.spectacle.RENPSPH !== '' ){
          this.spectacle.R_Addition  =  Number(this.spectacle.REDPSPH) -  Number(this.spectacle.RENPSPH) 
          if(this.spectacle.R_Addition >= 0){
            this.spectacle.R_Addition = '+' + this.spectacle.R_Addition.toFixed(2).toString().replace("-", "+")
          }else{
            this.spectacle.R_Addition =   this.spectacle.R_Addition.toFixed(2).toString().replace("-", "+")
          }
          this.spectacle.RENPCYL = this.spectacle.REDPCYL;
          this.spectacle.RENPAxis = this.spectacle.REDPAxis; 
        } else{
          this.spectacle.R_Addition = ''
        }
      }
      // right spectacle calculate end
      // left spectacle calculate start
      if (x === 'LD')
      { if(this.spectacle.L_Addition !== ''){
        this.spectacle.L_Addition  = Number(this.spectacle.LENPSPH)  - Number(this.spectacle.LEDPSPH)
        if(this.spectacle.L_Addition >= 0){
          this.spectacle.L_Addition = '+' + this.spectacle.L_Addition.toFixed(2).toString()
        }else{
          this.spectacle.L_Addition =  this.spectacle.L_Addition.toFixed(2).toString().replace("-", "+")
        }
        this.spectacle.LENPCYL = this.spectacle.LEDPCYL;
        this.spectacle.LENPAxis = this.spectacle.LEDPAxis;
      }
       
      } 
      if (x === 'L' ){
        if (this.spectacle.L_Addition !== ''){
          this.spectacle.LENPSPH = Number(this.spectacle.LEDPSPH) + Number(this.spectacle.L_Addition)
          if(this.spectacle.LENPSPH >= 0){
            this.spectacle.LENPSPH = '+' + this.spectacle.LENPSPH.toFixed(2).toString()
          }else{
            this.spectacle.LENPSPH =  this.spectacle.LENPSPH.toFixed(2).toString()
          }
           this.spectacle.LENPCYL = this.spectacle.LEDPCYL;
           this.spectacle.LENPAxis = this.spectacle.LEDPAxis; 
        }else{
          this.spectacle.LENPSPH = this.spectacle.LEDPSPH
        }
       }
      if (x === 'LN'){
       if (this.spectacle.LENPSPH !== '' ){
          this.spectacle.L_Addition  =  Number(this.spectacle.LEDPSPH) -  Number(this.spectacle.LENPSPH) 
          if(this.spectacle.L_Addition >= 0){
            this.spectacle.L_Addition = '+' + this.spectacle.L_Addition.toFixed(2).toString().replace("-", "+")
          }else{
            this.spectacle.L_Addition =   this.spectacle.L_Addition.toFixed(2).toString().replace("-", "+")
          }
          this.spectacle.LENPCYL = this.spectacle.LEDPCYL;
          this.spectacle.LENPAxis = this.spectacle.LEDPAxis; 
        } else{
          this.spectacle.L_Addition = ''
        }
      }
      // left spectacle calculate end

    }else{
      // right contact calculate end
      if (x === 'CRD' && y === 0)
        { if(this.clens.R_Addition !== ''){
        this.clens.R_Addition  = Number(this.clens.RENPSPH)  - Number(this.clens.REDPSPH)
        if(this.clens.R_Addition >= 0){
          this.clens.R_Addition = '+' + this.clens.R_Addition.toFixed(2).toString()
        }else{
          this.clens.R_Addition =  this.clens.R_Addition.toFixed(2).toString().replace("-", "+")
        }
        this.clens.RENPCYL = this.clens.REDPCYL;
        this.clens.RENPAxis = this.clens.REDPAxis;
        }
      } 
      if (x === 'CR' && y === 0){
      let CR = 0.00
         if (this.clens.R_Addition !== ''){
        this.clens.RENPSPH = Number(this.clens.REDPSPH) + Number(this.clens.R_Addition)
        if(this.clens.RENPSPH >= 0){
          this.clens.RENPSPH = '+' + this.clens.RENPSPH.toFixed(2).toString()
        }else{
          this.clens.RENPSPH =  this.clens.RENPSPH.toFixed(2).toString()
        }
        this.clens.RENPCYL = this.clens.REDPCYL;
        this.clens.RENPAxis = this.clens.REDPAxis; 
         }else{
          this.clens.RENPSPH = this.clens.REDPSPH
         }
      }
      if (x === 'CRN' && y === 0){
        if (this.clens.RENPSPH !== '' ){
        this.clens.R_Addition  =  Number(this.clens.REDPSPH) -  Number(this.clens.RENPSPH) 
        if(this.clens.R_Addition >= 0){
          this.clens.R_Addition = '+' + this.clens.R_Addition.toFixed(2).toString().replace("-", "+")
        }else{
          this.clens.R_Addition =   this.clens.R_Addition.toFixed(2).toString().replace("-", "+")
        }
        this.clens.RENPCYL = this.clens.REDPCYL;
        this.clens.RENPAxis = this.clens.REDPAxis; 
        } else{
        this.clens.R_Addition = ''
        } 
      }
      // right contact calculate end
      // left contact calculate start
      if (x === 'CLD' && y === 0)
      { if(this.clens.L_Addition !== ''){
        this.clens.L_Addition  = Number(this.clens.LENPSPH)  - Number(this.clens.LEDPSPH)
        if(this.clens.L_Addition >= 0){
          this.clens.L_Addition = '+' + this.clens.L_Addition.toFixed(2).toString()
        }else{
          this.clens.L_Addition =  this.clens.L_Addition.toFixed(2).toString().replace("-", "+")
        }
        this.clens.LENPCYL = this.clens.LEDPCYL;
        this.clens.LENPAxis = this.clens.LEDPAxis;
      }
       
      } 
      if (x === 'CL' && y === 0){
        if (this.clens.L_Addition !== ''){
          this.clens.LENPSPH = Number(this.clens.LEDPSPH) + Number(this.clens.L_Addition)
          if(this.clens.LENPSPH >= 0){
            this.clens.LENPSPH = '+' + this.clens.LENPSPH.toFixed(2).toString()
          }else{
            this.clens.LENPSPH =  this.clens.LENPSPH.toFixed(2).toString()
          }
           this.clens.LENPCYL = this.clens.LEDPCYL;
           this.clens.LENPAxis = this.clens.LEDPAxis; 
        }else{
          this.spectacle.LENPSPH = this.spectacle.LEDPSPH
        }
       }
      if (x === 'CLN' && y === 0){
       if (this.clens.LENPSPH !== '' ){
          this.clens.L_Addition  =  Number(this.clens.LEDPSPH) -  Number(this.clens.LENPSPH) 
          if(this.clens.L_Addition >= 0){
            this.clens.L_Addition = '+' + this.clens.L_Addition.toFixed(2).toString().replace("-", "+")
          }else{
            this.clens.L_Addition =   this.clens.L_Addition.toFixed(2).toString().replace("-", "+")
          }
          this.clens.LENPCYL = this.clens.LEDPCYL;
          this.clens.LENPAxis = this.clens.LEDPAxis; 
        } else{
          this.clens.L_Addition = ''
        }
      }
      // left contact calculate end
    }  
  }

}
