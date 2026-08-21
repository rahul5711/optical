import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CustomerPowerCalculationService } from 'src/app/service/helpers/customer-power-calculation.service';
import { CustomerService } from 'src/app/service/customer.service';
import { FileUploadService } from 'src/app/service/helpers/file-upload.service';
import { take } from 'rxjs/operators';
import { CompressImageService } from 'src/app/service/helpers/compress-image.service';
import * as moment from 'moment';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-examination',
  templateUrl: './examination.component.html',
  styleUrls: ['./examination.component.css']
})
export class ExaminationComponent implements OnInit {

  env: { production: boolean; apiUrl: string; appUrl: string; };
  user = JSON.parse(localStorage.getItem('user') || '');
  permission = JSON.parse(localStorage.getItem('permission') || '[]');
  company = JSON.parse(localStorage.getItem('company') || '');
  companySetting = JSON.parse(localStorage.getItem('companysetting') || '');
  shop = JSON.parse(localStorage.getItem('shop') || '');
  selectedShop = JSON.parse(localStorage.getItem('selectedShop') || '');

  id: any
  img: any;
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    public as: AlertService,
    private sp: NgxSpinnerService,
    private modalService: NgbModal,
    public calculation: CustomerPowerCalculationService,
    private cs: CustomerService,
    private fu: FileUploadService,
    private compressImage: CompressImageService,
    private cdr: ChangeDetectorRef,
  ) {
    this.id = this.route.snapshot.params['customerid'];
    this.env = environment
  }
  currentPowerID: number | null = null;
  filteredPVAList: any = []
  inputError: boolean = false;
  pdfLink: any = '';
  loginShop: any
  customerDate: any
  spectacleLists: any
  spectacleImage: any
  selectedObjectList: any = []
  autoImage:any
  masterObject: any = {
    ID: null, CustomerID: 0, CompanyID: 0,
    Exam: {
      ExaminationDate: '', visionproblem: false, DistanceNear: false, Headache: false, EyeStrain: false, Watering: false, NightDrivingProblem: false, ComputerUsage: false, ExitingGlasses: false,

      Unaided: {
        REDPVA: '', RENPVA: '', LEDPVA: '', LENPVA: '', BEDPVA: '', BENPVA: '', BEGDPVA: '', BEGNPVA: ''
      },

      Autorefractomer: {
        REDPSPH: '', REDPCYL: '', REDPAxis: '', LEDPSPH: '', LEDPCYL: '', LEDPAxis: '',RefractometerImg:'',
      },

      SubjectivePWR: {
       ID: 'null', CustomerID: '', REDPSPH: '', REDPCYL: '', REDPAxis: '', REDPVA: '', LEDPSPH: '', LEDPCYL: '', LEDPAxis: '', LEDPVA: '', RENPSPH: '', RENPCYL: '', RENPAxis: '', RENPVA: '', LENPSPH: '', LENPCYL: '', LENPAxis: '', LENPVA: '', R_Addition: '', L_Addition: '',
      },



      PDMeasure: {
                    REDPD: '', LEDPD: '', RENPD: '', LENPD: '', BEPD: ''
                  },

     EyePain:false,  Redness:false,  BasicWatering:false,  Irritation:false,  ReferralRequired:false,   

      OfficeUser: false, BlueLightProtection: false, AntiGlare: false, LightweightLens: false, NightDrivingLens: false, Photochromic: false, OutdoorUser: false, PolarizedSunglasses: false,
      UVProtection: false, Glass: false, ProgressiveLens: false, ReadingGlasses: false, HighContrast: false,

      ADVICE: ''
    }
  }

  spectacle: any = {
    ID: 'null', CustomerID: '', REDPSPH: '', Reminder: '6', REDPCYL: '', REDPAxis: '', REDPVA: '', LEDPSPH: '', LEDPCYL: '', LEDPAxis: '',
    LEDPVA: '', RENPSPH: '', RENPCYL: '', RENPAxis: '', RENPVA: '', LENPSPH: '', LENPCYL: '', LENPAxis: '', LENPVA: '', REPD: '', LEPD: '',
    R_Addition: '', L_Addition: '', R_Prism: '', L_Prism: '', Lens: '', Shade: '', Frame: '', VertexDistance: '', RefractiveIndex: '', FittingHeight: '', ConstantUse: false, NearWork: false, RefferedByDoc: 'Self', DistanceWork: false, UploadBy: 'Upload', PhotoURL: null, FileURL: null, Family: 'Self', ExpiryDate: '0000-00-00', Status: 1, CreatedBy: 0, CreatedOn: '', UpdatedBy: 0, UpdatedOn: '', VisitDate: '',
  };

  clens: any = {
    ID: 'null', CustomerID: '', REDPSPH: '', REDPCYL: '', REDPAxis: '', REDPVA: '', LEDPSPH: '', LEDPCYL: '', LEDPAxis: '',
    LEDPVA: '', RENPSPH: '', RENPCYL: '', RENPAxis: '', RENPVA: '', LENPSPH: '', LENPCYL: '', LENPAxis: '', LENPVA: '', REPD: '', LEPD: '',
    R_Addition: '', L_Addition: '', R_KR: '', L_KR: '', R_HVID: '', L_HVID: '', R_CS: '', L_CS: '', R_BC: '', L_BC: '',
    R_Diameter: '', L_Diameter: '', BR: '', Material: '', Modality: '', RefferedByDoc: 'Self', Other: '', ConstantUse: false,
    NearWork: false, DistanceWork: false, Multifocal: false, PhotoURL: null, FileURL: null, Family: 'Self', Status: 1, CreatedBy: 0,
    CreatedOn: '', UpdatedBy: 0, UpdatedOn: '', VisitDate: '',
  };

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
    { Name: 'PLANO' },
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

  dataPNVA: any = [
    { Name: 'N5' },
    { Name: 'N6' },
    { Name: 'N8' },
    { Name: 'N10' },
    { Name: 'N12' },
    { Name: 'N18' },
    { Name: 'N36' },
  ];

  ngOnInit(): void {
     this.getCustomerById()
      if (this.masterObject.ID != 0 || this.masterObject.ID != null) {
      this.PatientRecordList('Examination')
    }
   
  }

   uploadImage(e: any, mode: any) {
  
      this.img = e.target.files[0];
      // console.log(`Image size before compressed: ${this.img.size} bytes.`)
      this.compressImage.compress(this.img).pipe(take(1)).subscribe((compressedImage: any) => {
        // console.log(`Image size after compressed: ${compressedImage.size} bytes.`)
        this.fu.uploadFileComapny(compressedImage).subscribe((data: any) => {
          if (data.body !== undefined && mode === 'signature') {
            this.autoImage =  data.body?.download;
            this.masterObject.Exam.Autorefractomer.RefractometerImg = data.body?.download
            this.as.successToast(data.body?.message)
          } 
          this.cdr.detectChanges();
        });
      })
  
    }

  getCustomerById() {
    this.sp.show();
    const subs: Subscription = this.cs.getCustomerById(this.id).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.customerDate = res.data[0];
          this.customerDate.Age = this.customerDate.Age || 0
          
             if (res.spectacle_rx?.length > 0) {

          this.spectacle = {
            ...this.spectacle,
            ...res.spectacle_rx[0]
          };

          // ⭐ Existing Power ID
          this.currentPowerID = Number(res.spectacle_rx[0].ID);

          console.log('Current Power ID:', this.currentPowerID);

        } else {

          // Customer ki koi power visit nahi hai
          this.currentPowerID = null;

          this.spectacle = {
            ...this.spectacle,
            ID: null,
            CustomerID: Number(this.id)
          };
        }

        this.spectacleLists = res.spectacle_rx?.length
          ? res.spectacle_rx.slice(0, 10)
          : [];

          // if (res.spectacle_rx?.length) {
          //   this.masterObject.Exam.SubjectivePWR = res.spectacle_rx[0];

          //   const PLANOCheck = ['REDPSPH', 'REDPCYL', 'RENPSPH', 'RENPCYL', 'LEDPSPH', 'LEDPCYL', 'LENPSPH', 'LENPCYL'];
          //   PLANOCheck.forEach((prop) => {
          //     if (this.masterObject.Exam.SubjectivePWR[prop] === '+0.00' || this.masterObject.Exam.SubjectivePWR[prop] === "0") {
          //       this.masterObject.Exam.SubjectivePWR[prop] = 'PLANO';
          //     }
          //   });
          // }
          this.as.successToast(res.message);
        }
        else {
          this.as.errorToast(res.message);
          this.sp.hide();
        }
        this.sp.hide();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.log(err.message);
        this.sp.hide();
      },
      complete: () => subs.unsubscribe(),
    });
  }


  VAList() {
    this.filteredPVAList = [...this.dataPVA];
  }

  filterPVAList(event: any) {
    const searchValue = event.target.value.toLowerCase();
    this.filteredPVAList = this.dataPVA.filter((d: any) => d.Name.toLowerCase().includes(searchValue));
  }

  // spectacle input validtion

  validateCyLInputRight(fieldName: string) {
    const validValues = this.dataCYL.map((c: { Name: any; }) => c.Name);

    let fieldValue = this.masterObject.SubjectivePWR[fieldName];

    if ((fieldValue == 0 || fieldValue == 0.00) && fieldValue !== "") {
      fieldValue = 'PLANO';
    }

    this.masterObject.SubjectivePWR[fieldName] = fieldValue;
    let formattedInput = fieldValue;

    // Format only if the value is not PLANO
    if (formattedInput !== 'PLANO' && formattedInput !== '') {
      // Preserve the sign (+ or -)
      let sign = '';
      if (formattedInput.startsWith('+') || formattedInput.startsWith('-')) {
        sign = formattedInput[0];  // Store the + or - sign
        formattedInput = formattedInput.substring(1);  // Remove the sign from the number
      }

      let numericValue = parseFloat(formattedInput);

      // Round only the decimal part to the nearest 0.25, keeping the integer part unchanged
      let integerPart = Math.floor(numericValue);
      let decimalPart = numericValue - integerPart;

      // Round decimal part to nearest .00, .25, .50, .75
      let roundedDecimalPart = (Math.round(decimalPart * 4) / 4).toFixed(2).substring(1);  // Get decimal part like ".00", ".25"

      formattedInput = sign + integerPart + roundedDecimalPart;  // Combine sign, integer part, and rounded decimal part
    }

    // Update both fields (if you want to synchronize them)
    this.masterObject.SubjectivePWR[fieldName] = formattedInput;

    if (fieldName === 'RENPCYL') {
      this.masterObject.SubjectivePWR.REDPCYL = formattedInput;
    }

    // Validate the formatted input
    if (formattedInput != "") {
      this.inputError = !validValues.includes(formattedInput);
    } else {
      this.masterObject.SubjectivePWR[fieldName] = formattedInput;
    }

    if (this.inputError) {
      this.masterObject.SubjectivePWR[fieldName] = '';  // Reset to '0.00' if invalid
      Swal.fire({
        position: 'center',
        icon: 'warning',
        title: 'Invalid value!',
        text: `Please Valid values`,
        showConfirmButton: true,
        backdrop: false
      });
    }
  }

  validateSphInputRight(fieldName: string) {
    const validValues = this.dataSPH.map((c: { Name: any; }) => c.Name);

    let fieldValue = this.masterObject.SubjectivePWR[fieldName];

    // Handle special case for PLANO
    if ((fieldValue == 0 || fieldValue == 0.00) && fieldValue !== "") {
      fieldValue = 'PLANO';
    }

    this.masterObject.SubjectivePWR[fieldName] = fieldValue;
    let formattedInput = fieldValue;

    if (formattedInput !== 'PLANO' && formattedInput !== '') {
      // Preserve the sign (+ or -)
      let sign = '';
      if (formattedInput.startsWith('+') || formattedInput.startsWith('-')) {
        sign = formattedInput[0];  // Store the + or - sign
        formattedInput = formattedInput.substring(1);  // Remove the sign from the number
      }

      let numericValue = parseFloat(formattedInput);

      // Round only the decimal part to the nearest 0.25, keeping the integer part unchanged
      let integerPart = Math.floor(numericValue);
      let decimalPart = numericValue - integerPart;

      // Round decimal part to nearest .00, .25, .50, .75
      let roundedDecimalPart = (Math.round(decimalPart * 4) / 4).toFixed(2).substring(1);  // Get decimal part like ".00", ".25"

      formattedInput = sign + integerPart + roundedDecimalPart;  // Combine sign, integer part, and rounded decimal part
    }

    // Update both fields (if you want to synchronize them)
    this.masterObject.SubjectivePWR[fieldName] = formattedInput;

    // Validate the formatted input
    if (formattedInput != "") {
      this.inputError = !validValues.includes(formattedInput);
    } else {
      this.masterObject.SubjectivePWR[fieldName] = formattedInput;
    }


    if (this.inputError) {
      this.spectacle[fieldName] = '';  // Reset to '0.00' if invalid
      Swal.fire({
        position: 'center',
        icon: 'warning',
        title: 'Invalid value!',
        text: `Please Valid values.`,
        showConfirmButton: true,
        backdrop: false
      });
    }
  }

  validateCyLInputLeft(fieldName: string) {
    const validValues = this.dataCYL.map((c: { Name: any; }) => c.Name);

    let fieldValue = this.masterObject.SubjectivePWR[fieldName];

    if ((fieldValue == 0 || fieldValue == 0.00) && fieldValue !== "") {
      fieldValue = 'PLANO';
    }

    this.masterObject.SubjectivePWR[fieldName] = fieldValue;
    let formattedInput = fieldValue;

    // Format only if the value is not PLANO
    if (formattedInput !== 'PLANO' && formattedInput !== '') {
      // Preserve the sign (+ or -)
      let sign = '';
      if (formattedInput.startsWith('+') || formattedInput.startsWith('-')) {
        sign = formattedInput[0];  // Store the + or - sign
        formattedInput = formattedInput.substring(1);  // Remove the sign from the number
      }

      let numericValue = parseFloat(formattedInput);

      // Round only the decimal part to the nearest 0.25, keeping the integer part unchanged
      let integerPart = Math.floor(numericValue);
      let decimalPart = numericValue - integerPart;

      // Round decimal part to nearest .00, .25, .50, .75
      let roundedDecimalPart = (Math.round(decimalPart * 4) / 4).toFixed(2).substring(1);  // Get decimal part like ".00", ".25"

      formattedInput = sign + integerPart + roundedDecimalPart;  // Combine sign, integer part, and rounded decimal part
    }

    // Update both fields (if you want to synchronize them)
    this.masterObject.SubjectivePWR[fieldName] = formattedInput;

    if (fieldName === 'LENPCYL') {
      this.masterObject.SubjectivePWR.LEDPCYL = formattedInput;
    }

    // Validate the formatted input
    if (formattedInput != "") {
      this.inputError = !validValues.includes(formattedInput);
    } else {
      this.masterObject.SubjectivePWR[fieldName] = formattedInput;
    }

    if (this.inputError) {
      this.masterObject.SubjectivePWR[fieldName] = '';  // Reset to '0.00' if invalid
      Swal.fire({
        position: 'center',
        icon: 'warning',
        title: 'Invalid value!',
        text: `Please Valid values`,
        showConfirmButton: true,
        backdrop: false
      });
    }
  }

  validateSphInputLeft(fieldName: string) {
    const validValues = this.dataSPH.map((c: { Name: any; }) => c.Name);

    let fieldValue = this.masterObject.SubjectivePWR[fieldName];

    // Handle special case for PLANO
    if ((fieldValue == 0 || fieldValue == 0.00) && fieldValue !== "") {
      fieldValue = 'PLANO';
    }

    this.masterObject.SubjectivePWR[fieldName] = fieldValue;
    let formattedInput = fieldValue;

    if (formattedInput !== 'PLANO' && formattedInput !== '') {
      // Preserve the sign (+ or -)
      let sign = '';
      if (formattedInput.startsWith('+') || formattedInput.startsWith('-')) {
        sign = formattedInput[0];  // Store the + or - sign
        formattedInput = formattedInput.substring(1);  // Remove the sign from the number
      }

      let numericValue = parseFloat(formattedInput);

      // Round only the decimal part to the nearest 0.25, keeping the integer part unchanged
      let integerPart = Math.floor(numericValue);
      let decimalPart = numericValue - integerPart;

      // Round decimal part to nearest .00, .25, .50, .75
      let roundedDecimalPart = (Math.round(decimalPart * 4) / 4).toFixed(2).substring(1);  // Get decimal part like ".00", ".25"

      formattedInput = sign + integerPart + roundedDecimalPart;  // Combine sign, integer part, and rounded decimal part
    }

    // Update both fields (if you want to synchronize them)
    this.masterObject.SubjectivePWR[fieldName] = formattedInput;

    // Validate the formatted input
    if (formattedInput != "") {
      this.inputError = !validValues.includes(formattedInput);
    } else {
      this.masterObject.SubjectivePWR[fieldName] = formattedInput;
    }

    if (this.inputError) {
      this.masterObject.SubjectivePWR[fieldName] = '';  // Reset to '0.00' if invalid
      Swal.fire({
        position: 'center',
        icon: 'warning',
        title: 'Invalid value!',
        text: `Please Valid values.`,
        showConfirmButton: true,
        backdrop: false
      });
    }
  }

  // contact input validtion

  validateCont_SphInputRight(fieldName: string) {
    const validValues = this.dataSPH.map((c: { Name: any; }) => c.Name);

    let fieldValue = this.clens[fieldName];

    // Handle special case for PLANO
    if ((fieldValue == 0 || fieldValue == 0.00) && fieldValue !== "") {
      fieldValue = 'PLANO';
    }

    this.clens[fieldName] = fieldValue;
    let formattedInput = fieldValue;

    if (formattedInput !== 'PLANO' && formattedInput !== '') {
      // Preserve the sign (+ or -)
      let sign = '';
      if (formattedInput.startsWith('+') || formattedInput.startsWith('-')) {
        sign = formattedInput[0];  // Store the + or - sign
        formattedInput = formattedInput.substring(1);  // Remove the sign from the number
      }

      let numericValue = parseFloat(formattedInput);

      // Round only the decimal part to the nearest 0.25, keeping the integer part unchanged
      let integerPart = Math.floor(numericValue);
      let decimalPart = numericValue - integerPart;

      // Round decimal part to nearest .00, .25, .50, .75
      let roundedDecimalPart = (Math.round(decimalPart * 4) / 4).toFixed(2).substring(1);  // Get decimal part like ".00", ".25"

      formattedInput = sign + integerPart + roundedDecimalPart;  // Combine sign, integer part, and rounded decimal part
    }

    // Update both fields (if you want to synchronize them)
    this.clens[fieldName] = formattedInput;

    // Validate the formatted input
    if (formattedInput != "") {
      this.inputError = !validValues.includes(formattedInput);
    } else {
      this.clens[fieldName] = formattedInput;
    }

    if (this.inputError) {
      this.clens[fieldName] = '';  // Reset to '0.00' if invalid
      Swal.fire({
        position: 'center',
        icon: 'warning',
        title: 'Invalid value!',
        text: `Please Valid values.`,
        showConfirmButton: true,
        backdrop: false
      });
    }
  }

  validateCont_SphInputLeft(fieldName: string) {
    const validValues = this.dataSPH.map((c: { Name: any; }) => c.Name);

    let fieldValue = this.clens[fieldName];

    // Handle special case for PLANO
    if ((fieldValue == 0 || fieldValue == 0.00) && fieldValue !== "") {
      fieldValue = 'PLANO';
    }

    this.clens[fieldName] = fieldValue;
    let formattedInput = fieldValue;

    if (formattedInput !== 'PLANO' && formattedInput !== '') {
      // Preserve the sign (+ or -)
      let sign = '';
      if (formattedInput.startsWith('+') || formattedInput.startsWith('-')) {
        sign = formattedInput[0];  // Store the + or - sign
        formattedInput = formattedInput.substring(1);  // Remove the sign from the number
      }

      let numericValue = parseFloat(formattedInput);

      // Round only the decimal part to the nearest 0.25, keeping the integer part unchanged
      let integerPart = Math.floor(numericValue);
      let decimalPart = numericValue - integerPart;

      // Round decimal part to nearest .00, .25, .50, .75
      let roundedDecimalPart = (Math.round(decimalPart * 4) / 4).toFixed(2).substring(1);  // Get decimal part like ".00", ".25"

      formattedInput = sign + integerPart + roundedDecimalPart;  // Combine sign, integer part, and rounded decimal part
    }

    // Update both fields (if you want to synchronize them)
    this.clens[fieldName] = formattedInput;

    // Validate the formatted input
    if (formattedInput != "") {
      this.inputError = !validValues.includes(formattedInput);
    } else {
      this.clens[fieldName] = formattedInput;
    }

    if (this.inputError) {
      this.clens[fieldName] = '';  // Reset to '0.00' if invalid
      Swal.fire({
        position: 'center',
        icon: 'warning',
        title: 'Invalid value!',
        text: `Please Valid values.`,
        showConfirmButton: true,
        backdrop: false
      });
    }
  }

  calculate(mode: any, x: any, y: any, Type: any) {
    let subjectivePWR = {
      ID: 'null', CustomerID: '', REDPSPH: '', Reminder: '6', REDPCYL: '', REDPAxis: '', REDPVA: '', LEDPSPH: '', LEDPCYL: '', LEDPAxis: '',
      LEDPVA: '', RENPSPH: '', RENPCYL: '', RENPAxis: '', RENPVA: '', LENPSPH: '', LENPCYL: '', LENPAxis: '', LENPVA: '', REPD: '', LEPD: '',
      R_Addition: '', L_Addition: '', R_Prism: '', L_Prism: '', Lens: '', Shade: '', Frame: '', VertexDistance: '', RefractiveIndex: '', FittingHeight: '', ConstantUse: false, NearWork: false, RefferedByDoc: 'Self', DistanceWork: false, UploadBy: 'Upload', PhotoURL: null, FileURL: null, Family: 'Self', ExpiryDate: '0000-00-00', Status: 1, CreatedBy: 0, CreatedOn: '', UpdatedBy: 0, UpdatedOn: '', VisitDate: '',
    };

    let subjectiveCON = {
      ID: 'null', CustomerID: '', REDPSPH: '', REDPCYL: '', REDPAxis: '', REDPVA: '', LEDPSPH: '', LEDPCYL: '', LEDPAxis: '',
      LEDPVA: '', RENPSPH: '', RENPCYL: '', RENPAxis: '', RENPVA: '', LENPSPH: '', LENPCYL: '', LENPAxis: '', LENPVA: '', REPD: '', LEPD: '',
      R_Addition: '', L_Addition: '', R_KR: '', L_KR: '', R_HVID: '', L_HVID: '', R_CS: '', L_CS: '', R_BC: '', L_BC: '',
      R_Diameter: '', L_Diameter: '', BR: '', Material: '', Modality: '', RefferedByDoc: 'Self', Other: '', ConstantUse: false,
      NearWork: false, DistanceWork: false, Multifocal: false, PhotoURL: null, FileURL: null, Family: 'Self', Status: 1, CreatedBy: 0,
      CreatedOn: '', UpdatedBy: 0, UpdatedOn: '', VisitDate: '',
    };

    // if (Type == 'low') {
    //   subjectivePWR = this.masterObject4.lowVision.SubjectivePWR
    // } else if (Type == 'com') {
    //   subjectivePWR = this.masterObject.Comprehensive.SubjectivePWR
    // } else if (Type === 'con1') {
    //   subjectiveCON = this.masterObject3.Contact.OCULARPWE
    // } else if (Type === 'con') {
    //   subjectiveCON = this.trial.trialPWR
    // }
    subjectivePWR = this.masterObject.Exam.SubjectivePWR
    this.calculation.calculate(mode, x, y, subjectivePWR, subjectiveCON)
  }

syncPower(source: 'spectacle' | 'examination') {

  const powerFields = [
    'REDPSPH',
    'REDPCYL',
    'REDPAxis',
    'REDPVA',

    'LEDPSPH',
    'LEDPCYL',
    'LEDPAxis',
    'LEDPVA',

    'RENPSPH',
    'RENPCYL',
    'RENPAxis',
    'RENPVA',

    'LENPSPH',
    'LENPCYL',
    'LENPAxis',
    'LENPVA',

    'R_Addition',
    'L_Addition'
  ];

  // Examination -> Customer
  if (source === 'examination') {

    if (!this.masterObject.Exam) {
      this.masterObject.Exam = {};
    }

    if (!this.masterObject.Exam.SubjectivePWR) {
      this.masterObject.Exam.SubjectivePWR = {};
    }

    powerFields.forEach(field => {

      if (this.masterObject.Exam.SubjectivePWR[field] !== undefined) {

        this.spectacle[field] =
          this.masterObject.Exam.SubjectivePWR[field];

      }

    });
  }


  // Customer -> Examination
  if (source === 'spectacle') {

    if (!this.masterObject.Exam) {
      this.masterObject.Exam = {};
    }

    if (!this.masterObject.Exam.SubjectivePWR) {
      this.masterObject.Exam.SubjectivePWR = {};
    }

    powerFields.forEach(field => {

      if (this.spectacle[field] !== undefined) {

        this.masterObject.Exam.SubjectivePWR[field] =
          this.spectacle[field];

      }

    });
  }
}

  onSubmit(Type: string) {
    this.sp.show();
    let selectedObject: any;

    if (Type === 'Examination') {
      selectedObject = this.masterObject
        this.syncPower('examination');
    }

    selectedObject.ID = null;
    selectedObject.Type = Type;
    selectedObject.CustomerID = Number(this.id);
    selectedObject.Examination = selectedObject.Exam;

    const subs: Subscription = this.cs.savePatientRecord(selectedObject).subscribe({
      next: (res: any) => {
        if (res.success) {
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Your file has been Save.',
            showConfirmButton: false,
            timer: 1200
          });
          this.PatientRecordList(Type)
          this.spectacle.ID = null;
         this.updateCustomer(false, true);
        } else {
          this.as.errorToast(res.message);
        }
        this.sp.hide();
      },
      error: (err: any) => {
        console.log(err.msg);
        this.sp.hide();
      },
      complete: () => subs.unsubscribe(),
    });
  }

updateCustomer(showSpinner: boolean = true, isNewVisit: boolean = false) {

  if (showSpinner) {
    this.sp.show();
  }

  this.syncPower('examination');

  this.customerDate.tablename = 'spectacle_rx';

  this.spectacle.CustomerID = Number(this.id);

  // ⭐ VERY IMPORTANT
  if (isNewVisit) {
    this.spectacle.ID = null;
  } else {
    this.spectacle.ID = this.currentPowerID;
  }

  this.customerDate.spectacle_rx = {
    ...this.spectacle
  };

  console.log('POWER ID:', this.customerDate.spectacle_rx.ID);

  this.cs.updateCustomer(this.customerDate).subscribe({

    next: (res: any) => {

      if (res.success) {

        console.log('Power updated successfully');

      } else {

        this.as.errorToast(res.message);
      }

      if (showSpinner) {
        this.sp.hide();
      }
    },

    error: (err: any) => {

      console.log(err);

      if (showSpinner) {
        this.sp.hide();
      }
    }

  });
}

//   updateCustomer(showSpinner: boolean = true) {

//   if (showSpinner) {
//     this.sp.show();
//   }

//   // Customer spectacle -> Examination SubjectivePWR
//   this.syncPower('spectacle');



//     this.customerDate.tablename = 'spectacle_rx';

//     this.spectacle.ExpiryDate =
//       moment()
//         .add(Number(this.spectacle.Reminder), 'M')
//         .format('YYYY-MM-DD');

//     this.spectacle.VisitDate =
//       moment(this.spectacle.VisitDate).format('YYYY-MM-DD');

//     this.customerDate.spectacle_rx = this.spectacle;

//     // PLANO conversion
//     const PLANOCheck = [
//       'REDPSPH',
//       'REDPCYL',
//       'RENPSPH',
//       'RENPCYL',
//       'LEDPSPH',
//       'LEDPCYL',
//       'LENPSPH',
//       'LENPCYL'
//     ];

//     const DegreeCheck = [
//       'REDPAxis',
//       'RENPAxis',
//       'LEDPAxis',
//       'LENPAxis'
//     ];

//     for (const prop of PLANOCheck) {

//       if (this.customerDate.spectacle_rx[prop] === 'PLANO') {
//         this.customerDate.spectacle_rx[prop] = '+0.00';
//       }
//     }

//     for (const prop of DegreeCheck) {

//       if (
//         this.customerDate.spectacle_rx[prop] !== '' &&
//         !this.customerDate.spectacle_rx[prop].includes('°')
//       ) {
//         this.customerDate.spectacle_rx[prop] += '°';
//       }

//       if (this.customerDate.spectacle_rx[prop] === '°') {
//         this.customerDate.spectacle_rx[prop] = '';
//       }
//     }
  

//   const subs: Subscription =
//     this.cs.updateCustomer(this.customerDate).subscribe({

//       next: (res: any) => {

//         if (res.success) {
//           this.PatientRecordList('Examination')
//           // Customer update ke baad Examination ko bhi save/update
//           // this.onUpdate('Examination');

//         } else {

//           this.as.errorToast(res.message);

//           if (showSpinner) {
//             this.sp.hide();
//           }
//         }
//       },

//       error: (err: any) => {

//         console.log(err.msg);

//         if (showSpinner) {
//           this.sp.hide();
//         }
//       },

//       complete: () => subs.unsubscribe()
//     });
// }

  PatientRecordList(Type: string) {
    this.sp.show();
    let selectedObject: any;

    if (Type === 'Examination') {
      selectedObject = this.masterObject
    }

    delete selectedObject.ID;
    delete selectedObject.CompanyID;
    selectedObject.Type = Type;
    selectedObject.Examination = selectedObject.Exam
    selectedObject.CustomerID = Number(this.id);
    selectedObject.currentPage = 1;
    selectedObject.itemsPerPage = 100;

    const subs: Subscription = this.cs.getPatientRecordList(selectedObject).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.selectedObjectList = res.data
          if (res?.data?.length > 0) {
            if (Type === 'Examination') {
              this.masterObject = res.data[0];
              this.masterObject.Exam = res.data[0].Examination
                 this.autoImage = this.masterObject.Exam.Autorefractomer.RefractometerImg;
            }
          } else {
            if (Type === 'Examination') {
              this.masterObject = {
                ID: null, CustomerID: 0, CompanyID: 0,
                Exam: {
                  ExaminationDate: '', visionproblem: false, DistanceNear: false, Headache: false, EyeStrain: false, Watering: false, NightDrivingProblem: false, ComputerUsage: false, ExitingGlasses: false,

                  Unaided: {
                    REDPVA: '', RENPVA: '', LEDPVA: '', LENPVA: '', BEDPVA: '', BENPVA: '', BEGDPVA: '', BEGNPVA: ''
                  },

                  Autorefractomer: {
                    REDPSPH: '', REDPCYL: '', REDPAxis: '', LEDPSPH: '', LEDPCYL: '', LEDPAxis: '',
                  },

                  SubjectivePWR: {
                    REDPSPH: '', REDPCYL: '', REDPAxis: '', REDPVA: '', LEDPSPH: '', LEDPCYL: '', LEDPAxis: '', LEDPVA: '', RENPSPH: '', RENPCYL: '', RENPAxis: '', RENPVA: '', LENPSPH: '', LENPCYL: '', LENPAxis: '', LENPVA: '', R_Addition: '', L_Addition: '',
                  },

                  PDMeasure: {
                    REDPD: '', LEDPD: '', RENPD: '', LENPD: '', BEPD: ''
                  },

                  OfficeUser: false, BlueLightProtection: false, AntiGlare: false, LightweightLens: false, NightDrivingLens: false, Photochromic: false, OutdoorUser: false, PolarizedSunglasses: false,
                  UVProtection: false, Glass: false, ProgressiveLens: false, ReadingGlasses: false, HighContrast: false,

                  ADVICE: ''
                }
              }
            }
          }

        } else {
          this.as.errorToast(res.message);
        }
        this.sp.hide();
      },
      error: (err: any) => {
        console.log(err.msg);
        this.sp.hide();
      },
      complete: () => subs.unsubscribe(),
    });
  }


  editMainList(date: any, Type: any) {
    if (Type == 'Examination') {
      this.masterObject = date
    }
  }

   onUpdate(Type: any) {
      this.sp.show();
      let selectedObject: any;
  
      if (Type === 'Examination') {
          selectedObject = this.masterObject
           this.syncPower('examination');
      }
    
      selectedObject.Type = Type;
      selectedObject.CustomerID = Number(this.id);
      selectedObject.Examination = selectedObject.Exam
  
      const subs: Subscription = this.cs.updatePatientRecord(selectedObject).subscribe({
        next: (res: any) => {
          if (res.success) {
            Swal.fire({
              position: 'center',
              icon: 'success',
              title: 'Your file has been Update.',
              showConfirmButton: false,
              timer: 1200
            });
            this.PatientRecordList(Type)
           this.updateCustomer(false, false);
          } else {
            this.as.errorToast(res.message);
          }
          this.sp.hide();
        },
        error: (err: any) => {
          console.log(err.msg);
          this.sp.hide();
        },
        complete: () => subs.unsubscribe(),
      });
    }


  deletetype(ID: any, Type: any) {
    const subs: Subscription = this.cs.deletePatientRecord(ID, Type).subscribe({
      next: (res: any) => {
        if (res.success) {
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Your file has been Delete.',
            showConfirmButton: false,
            timer: 1200
          });
          this.PatientRecordList(Type)
        } else {
          this.as.errorToast(res.message);
        }
        this.sp.hide();
      },
      error: (err: any) => {
        console.log(err.msg);
        this.sp.hide();
      },
      complete: () => subs.unsubscribe(),
    });
  }

  optometristPDF(data: any) {
    this.sp.show();
    data.mode = 'Examination'
    let body = {
      
      masterData: data
    }
    const subs: Subscription = this.cs.optometristPDF(body).subscribe({
      next: (res: any) => {
        if (res) {
          const url = this.env.apiUrl + "/uploads/" + res;
          this.pdfLink = url
          window.open(url, "_blank");
        } else {
          this.as.errorToast(res.message);
        }
        this.sp.hide();
      },
      error: (err: any) => {
        console.log(err.msg);
        this.sp.hide();
      },
      complete: () => subs.unsubscribe(),
    });
  }

  optometristPDFWhats() {

    let msg = ''
    let WhatsappMsg = `Report Link : ${this.pdfLink}`;
    [this.loginShop] = this.shop.filter((s: any) => s.ID === Number(this.selectedShop[0]));
    if (this.customerDate.MobileNo1 != '') {
      var mob = this.company.Code + this.customerDate.MobileNo1;
      msg = `*Hi ${this.customerDate.Title} ${this.customerDate.Name},*%0A` +
        `${WhatsappMsg}%0A` +
        `*${this.loginShop.Name}* - ${this.loginShop.AreaName}%0A` +
        `${this.loginShop.MobileNo1}%0A` +
        `${this.loginShop.Website}%0A` +
        `*Please give your valuable Review for us !*`
      // var url = `https://wa.me/${mob}?text=${msg}`;
      var url = `https://api.whatsapp.com/send?phone=${mob.trim()}&text=${msg}`;
      window.open(url, "_blank");
    } else {
      Swal.fire({
        position: 'center',
        icon: 'warning',
        title: '<b>' + this.customerDate.Name + '</b>' + ' Mobile number is not available.',
        showConfirmButton: true,
      })
    }
  }

   NewVisit(Type: string) {

  if (Type === 'Examination') {

    // New Examination
    this.masterObject = {
      ID: null,
      CustomerID: Number(this.id),
      CompanyID: 0,

      Exam: {
        ExaminationDate: '',
        visionproblem: false,
        DistanceNear: false,
        Headache: false,
        EyeStrain: false,
        Watering: false,
        NightDrivingProblem: false,
        ComputerUsage: false,
        ExitingGlasses: false,

        Unaided: {
          REDPVA: '',
          RENPVA: '',
          LEDPVA: '',
          LENPVA: '',
          BEDPVA: '',
          BENPVA: '',
          BEGDPVA: '',
          BEGNPVA: ''
        },

        Autorefractomer: {
          REDPSPH: '',
          REDPCYL: '',
          REDPAxis: '',
          LEDPSPH: '',
          LEDPCYL: '',
          LEDPAxis: ''
        },

        SubjectivePWR: {
          REDPSPH: '',
          REDPCYL: '',
          REDPAxis: '',
          REDPVA: '',

          LEDPSPH: '',
          LEDPCYL: '',
          LEDPAxis: '',
          LEDPVA: '',

          RENPSPH: '',
          RENPCYL: '',
          RENPAxis: '',
          RENPVA: '',

          LENPSPH: '',
          LENPCYL: '',
          LENPAxis: '',
          LENPVA: '',

          R_Addition: '',
          L_Addition: ''
        },

        VisionBalance: {
          REDPVA: '',
          RENPVA: '',
          LEDPVA: '',
          LENPVA: ''
        },

        PDMeasure: {
          REDPD: '',
          LEDPD: '',
          RENPD: '',
          LENPD: '',
          BEPD: ''
        },

        OfficeUser: false,
        BlueLightProtection: false,
        AntiGlare: false,
        LightweightLens: false,
        NightDrivingLens: false,
        Photochromic: false,
        OutdoorUser: false,
        PolarizedSunglasses: false,
        UVProtection: false,
        Glass: false,
        ProgressiveLens: false,
        ReadingGlasses: false,
        HighContrast: false,

        ADVICE: ''
      }
    };

    // ⭐ VERY IMPORTANT
    // New visit ke liye power ID null
      this.currentPowerID = null;
    this.spectacle = {
      ...this.spectacle,
      ID: null,
      CustomerID: Number(this.id),

      REDPSPH: '',
      REDPCYL: '',
      REDPAxis: '',
      REDPVA: '',

      LEDPSPH: '',
      LEDPCYL: '',
      LEDPAxis: '',
      LEDPVA: '',

      RENPSPH: '',
      RENPCYL: '',
      RENPAxis: '',
      RENPVA: '',

      LENPSPH: '',
      LENPCYL: '',
      LENPAxis: '',
      LENPVA: '',

      R_Addition: '',
      L_Addition: ''
    };
  }
}
  
}
