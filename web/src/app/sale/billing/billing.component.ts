import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators,ReactiveFormsModule } from '@angular/forms';
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
import { CustomerModel,SpectacleModel,ContactModel,OtherModel} from 'src/app/interface/Customer';


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
  ReferenceList :any;
  OtherList :any;
  
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    public as: AlertService,
    private fu: FileUploadService,
    private sp: NgxSpinnerService,
    private modalService: NgbModal,
    private compressImage: CompressImageService
  ) { 
    this.id = this.route.snapshot.params['id'];
  }


  data: CustomerModel = {
    ID: '', CompanyID: '', Idd:0, Sno:'', TotalCustomer:'',VisitDate:'', Name: '',  MobileNo1: '', MobileNo2: '', PhoneNo: '', Address: '', GSTNo: '', Email: '',PhotoURL: '', DOB: '', Age: 0, Anniversary: '', RefferedByDoc: '', ReferenceType: '',Gender: '', Category: '', Other:'', Remarks:'', Status: 1, CreatedBy: 0, UpdatedBy: 0, CreatedOn: '', UpdatedOn: ''
  };

  spectacle: SpectacleModel = {
    ID: '', CustomerID: '', REDPSPH: '', Reminder: '6', REDPCYL: '', REDPAxis: '', REDPVA: '', LEDPSPH: '', LEDPCYL: '', LEDPAxis: '',
    LEDPVA: '', RENPSPH: '', RENPCYL: '', RENPAxis: '', RENPVA: '', LENPSPH: '', LENPCYL: '', LENPAxis: '', LENPVA: '', REPD: '', LEPD: '',
    R_Addition: '', L_Addition: '', R_Prism: '', L_Prism: '', Lens: '', Shade: '', Frame: '', VertexDistance: '', RefractiveIndex: '', FittingHeight: '', ConstantUse: false, NearWork: false, RefferedByDoc: 'Self', DistanceWork: false, UploadBy: 'Upload', PhotoURL: '', FileURL: '', Family: 'Self', ExpiryDate: '', Status: 1, CreatedBy: 0, CreatedOn: '', UpdatedBy: 0, UpdatedOn: ''
  };

  clens: ContactModel = {
    ID: ' ', CustomerID: '', REDPSPH: '', REDPCYL: '', REDPAxis: '', REDPVA: '', LEDPSPH: '', LEDPCYL: '', LEDPAxis: '',
    LEDPVA: '', RENPSPH: '', RENPCYL: '', RENPAxis: '', RENPVA: '', LENPSPH: '', LENPCYL: '', LENPAxis: '', LENPVA: '', REPD: '', LEPD: '',
    R_Addition: '', L_Addition: '', R_KR: '', L_KR: '', R_HVID: '', L_HVID: '', R_CS: '', L_CS: '', R_BC: '', L_BC: '',
    R_Diameter: '', L_Diameter: '', BR: '', Material: '', Modality: '', RefferedByDoc: 'Self', Other: '', ConstantUse: false,
    NearWork: false, DistanceWork: false, Multifocal: false, PhotoURL: '', FileURL: '', Family: 'Self', Status: 1, CreatedBy: 0,
    CreatedOn: '', UpdatedBy: 0, UpdatedOn: ''
  };

  other: OtherModel = {
    ID: '', CustomerID: '', BP: '', Sugar: '', IOL_Power: '', RefferedByDoc: 'Self', Operation: '', R_VN: '', L_VN: '', R_TN: '', L_TN: '',
    R_KR: '', L_KR: '', Treatment: '', Diagnosis: '', Family: 'Self', FileURL: '', Status: 1, CreatedBy: 0, CreatedOn: '', UpdatedBy: 0, UpdatedOn: ''
  };

  Check: any = { SpectacleCheck:false, ContactCheck :false,  OtherCheck :false, };
  // dropdown values in satics
  dataSPH: any = [
    { Name: '+25.00'},
    { Name: '+24.75'},
    { Name: '+24.50'},
    { Name: '+24.25'},
    { Name: '+24.00'},
    { Name: '+23.75'},
    { Name: '+23.50'},
    { Name: '+23.25'},
    { Name: '+23.00'},
    { Name: '+22.75'},
    { Name: '+22.50'},
    { Name: '+22.25'},
    { Name: '+22.00'},
    { Name: '+21.75'},
    { Name: '+21.50'},
    { Name: '+21.25'},
    { Name: '+21.00'},
    { Name: '+20.75'},
    { Name: '+20.50'},
    { Name: '+20.25'},
    { Name: '+20.00'},
    { Name: '+19.75'},
    { Name: '+19.50'},
    { Name: '+19.25'},
    { Name: '+19.00'},
    { Name: '+18.75'},
    { Name: '+18.50'},
    { Name: '+18.25'},
    { Name: '+18.00'},
    { Name: '+17.75'},
    { Name: '+17.50'},
    { Name: '+17.25'},
    { Name: '+17.00'},
    { Name: '+16.75'},
    { Name: '+16.50'},
    { Name: '+16.25'},
    { Name: '+16.00'},
    { Name: '+15.75'},
    { Name: '+15.50'},
    { Name: '+15.25'},
    { Name: '+15.00'},
    { Name: '+14.75'},
    { Name: '+14.50'},
    { Name: '+14.25'},
    { Name: '+14.00'},
    { Name: '+13.75'},
    { Name: '+13.50'},
    { Name: '+13.25'},
    { Name: '+13.00'},
    { Name: '+12.75'},
    { Name: '+12.50'},
    { Name: '+12.25'},
    { Name: '+12.00'},
    { Name: '+11.75'},
    { Name: '+11.50'},
    { Name: '+11.25'},
    { Name: '+11.00'},
    { Name: '+10.75'},
    { Name: '+10.50'},
    { Name: '+10.25'},
    { Name: '+10.00'},
    { Name: '+9.75'},
    { Name: '+9.50'},
    { Name: '+9.25'},
    { Name: '+9.00'},
    { Name: '+8.75'},
    { Name: '+8.50'},
    { Name: '+8.25'},
    { Name: '+8.00'},
    { Name: '+7.75'},
    { Name: '+7.50'},
    { Name: '+7.25'},
    { Name: '+7.00'},
    { Name: '+6.75'},
    { Name: '+6.50'},
    { Name: '+6.25'},
    { Name: '+6.00'},
    { Name: '+5.75'},
    { Name: '+5.50'},
    { Name: '+5.25'},
    { Name: '+5.00'},
    { Name: '+4.75'},
    { Name: '+4.50'},
    { Name: '+4.25'},
    { Name: '+4.00'},
    { Name: '+3.75'},
    { Name: '+3.50'},
    { Name: '+3.25'},
    { Name: '+3.00'},
    { Name: '+2.75'},
    { Name: '+2.50'},
    { Name: '+2.25'},
    { Name: '+2.00'},
    { Name: '+1.75'},
    { Name: '+1.50'},
    { Name: '+1.25'},
    { Name: '+1.00'},
    { Name: '+0.75'},
    { Name: '+0.50'},
    { Name: '+0.25'},
    { Name: 'PLANO'},
    { Name: '-0.25'},
    { Name: '-0.50'},
    { Name: '-0.75'},
    { Name: '-1.00'},
    { Name: '-1.25'},
    { Name: '-1.50'},
    { Name: '-1.75'},
    { Name: '-2.00'},
    { Name: '-2.25'},
    { Name: '-2.50'},
    { Name: '-2.75'},
    { Name: '-3.00'},
    { Name: '-3.25'},
    { Name: '-3.50'},
    { Name: '-3.75'},
    { Name: '-4.00'},
    { Name: '-4.25'},
    { Name: '-4.50'},
    { Name: '-4.75'},
    { Name: '-5.00'},
    { Name: '-5.25'},
    { Name: '-5.50'},
    { Name: '-5.75'},
    { Name: '-6.00'},
    { Name: '-6.25'},
    { Name: '-6.50'},
    { Name: '-6.75'},
    { Name: '-7.00'},
    { Name: '-7.25'},
    { Name: '-7.50'},
    { Name: '-7.75'},
    { Name: '-8.00'},
    { Name: '-8.25'},
    { Name: '-8.50'},
    { Name: '-8.75'},
    { Name: '-9.00'},
    { Name: '-9.25'},
    { Name: '-9.50'},
    { Name: '-9.75'},
    { Name: '-10.00'},
    { Name: '-10.25'},
    { Name: '-10.50'},
    { Name: '-10.75'},
    { Name: '-11.00'},
    { Name: '-11.25'},
    { Name: '-11.50'},
    { Name: '-11.75'},
    { Name: '-12.00'},
    { Name: '-12.25'},
    { Name: '-12.50'},
    { Name: '-12.75'},
    { Name: '-13.00'},
    { Name: '-13.25'},
    { Name: '-13.50'},
    { Name: '-13.75'},
    { Name: '-14.00'},
    { Name: '-14.25'},
    { Name: '-14.50'},
    { Name: '-14.75'},
    { Name: '-15.00'},
    { Name: '-15.25'},
    { Name: '-15.50'},
    { Name: '-15.75'},
    { Name: '-16.00'},
    { Name: '-16.25'},
    { Name: '-16.50'},
    { Name: '-16.75'},
    { Name: '-17.00'},
    { Name: '-17.25'},
    { Name: '-17.50'},
    { Name: '-17.75'},
    { Name: '-18.00'},
    { Name: '-18.25'},
    { Name: '-18.50'},
    { Name: '-18.75'},
    { Name: '-19.00'},
    { Name: '-19.25'},
    { Name: '-19.50'},
    { Name: '-19.75'},
    { Name: '-20.00'},
    { Name: '-20.25'},
    { Name: '-20.50'},
    { Name: '-20.75'},
    { Name: '-21.00'},
    { Name: '-21.25'},
    { Name: '-21.50'},
    { Name: '-21.75'},
    { Name: '-22.00'},
    { Name: '-22.25'},
    { Name: '-22.50'},
    { Name: '-22.75'},
    { Name: '-23.00'},
    { Name: '-23.25'},
    { Name: '-23.50'},
    { Name: '-23.75'},
    { Name: '-24.00'},
    { Name: '-24.25'},
    { Name: '-24.50'},
    { Name: '-24.75'},
    { Name: '-25.00'},
  ];

  dataCYL: any = [
    { Name: '-10.00'},
    { Name: '-9.75'},
    { Name: '-9.50'},
    { Name: '-9.25'},
    { Name: '-9.00'},
    { Name: '-8.75'},
    { Name: '-8.50'},
    { Name: '-8.25'},
    { Name: '-8.00'},
    { Name: '-7.75'},
    { Name: '-7.50'},
    { Name: '-7.25'},
    { Name: '-7.00'},
    { Name: '-6.75'},
    { Name: '-6.50'},
    { Name: '-6.25'},
    { Name: '-6.00'},
    { Name: '-5.75'},
    { Name: '-5.50'},
    { Name: '-5.25'},
    { Name: '-5.00'},
    { Name: '-4.75'},
    { Name: '-4.50'},
    { Name: '-4.25'},
    { Name: '-4.00'},
    { Name: '-3.75'},
    { Name: '-3.50'},
    { Name: '-3.25'},
    { Name: '-3.00'},
    { Name: '-2.75'},
    { Name: '-2.50'},
    { Name: '-2.25'},
    { Name: '-2.00'},
    { Name: '-1.75'},
    { Name: '-1.50'},
    { Name: '-1.25'},
    { Name: '-1.00'},
    { Name: '-0.75'},
    { Name: '-0.50'},
    { Name: '-0.25'},
    { Name: 'PLANO'},
    { Name: '+0.25'},
    { Name: '+0.50'},
    { Name: '+0.75'},
    { Name: '+1.00'},
    { Name: '+1.25'},
    { Name: '+1.50'},
    { Name: '+1.75'},
    { Name: '+2.00'},
    { Name: '+2.25'},
    { Name: '+2.50'},
    { Name: '+2.75'},
    { Name: '+3.00'},
    { Name: '+3.25'},
    { Name: '+3.50'},
    { Name: '+3.75'},
    { Name: '+4.00'},
    { Name: '+4.25'},
    { Name: '+4.50'},
    { Name: '+4.75'},
    { Name: '+5.00'},
    { Name: '+5.25'},
    { Name: '+5.50'},
    { Name: '+5.75'},
    { Name: '+6.00'},
    { Name: '+6.25'},
    { Name: '+6.50'},
    { Name: '+6.75'},
    { Name: '+7.00'},
    { Name: '+7.25'},
    { Name: '+7.50'},
    { Name: '+7.75'},
    { Name: '+8.00'},
    { Name: '+8.25'},
    { Name: '+8.50'},
    { Name: '+8.75'},
    { Name: '+9.00'},
    { Name: '+9.25'},
    { Name: '+9.50'},
    { Name: '+9.75'},
    { Name: '+10.00'},
    
  ];

  dataPVA: any = [
    { Name: '6/6'},
    { Name: '6/6 P'},
{ Name: '6/9'},
{ Name: '6/9 P'},
{ Name: '6/12'},
{ Name: '6/12 P'},
{ Name: '6/18'},
{ Name: '6/18 P'},
{ Name: '6/24'},
{ Name: '6/24 P'},
{ Name: '6/30'},
{ Name: '6/30 P'},
{ Name: '6/36'},
{ Name: '6/36 P'},
{ Name: '6/60'},
{ Name: '6/60 P'},

  ];
  // dropdown values in satics 


  ngOnInit(): void {
    this.data.VisitDate = moment().format('YYYY-MM-DD')
  }

  onsubmit(){
    console.log(this.Check ,'Check');
    console.log(this.data ,'data');
    console.log(this.spectacle,'spectacle' );
    console.log(this.clens,'clens' );
  }

  openModal(content: any) {
     this.modalService.open(content, { centered: true , backdrop : 'static', keyboard: false, size:'md'});
  }

   uploadImage(e:any, mode:any){
    this.img = e.target.files[0];
      // console.log(`Image size before compressed: ${this.img.size} bytes.`)
    this.compressImage.compress(this.img).pipe(take(1)).subscribe((compressedImage: any) => {
      // console.log(`Image size after compressed: ${compressedImage.size} bytes.`)
    this.fu.uploadFileComapny(compressedImage).subscribe((data:any) => {
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

}
