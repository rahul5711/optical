import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators,ReactiveFormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2'; 
import { AlertService } from 'src/app/service/helpers/alert.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CustomerPowerCalculationService } from 'src/app/service/helpers/customer-power-calculation.service';

@Component({
  selector: 'app-optometrist',
  templateUrl: './optometrist.component.html',
  styleUrls: ['./optometrist.component.css']
})
export class OptometristComponent implements OnInit {

  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private drawing = false;

  user = JSON.parse(localStorage.getItem('user') || '');
  companysetting = JSON.parse(localStorage.getItem('companysetting') || '');
  companyData = JSON.parse(localStorage.getItem('company') || '');
  permission = JSON.parse(localStorage.getItem('permission') || '[]');

  constructor(
        private router: Router,
        private route: ActivatedRoute,
        private formBuilder: FormBuilder,
        public as: AlertService,
        private sp: NgxSpinnerService,
        private modalService: NgbModal,
            public calculation: CustomerPowerCalculationService,
  ) { }

  filteredPVAList: any = []
  inputError: boolean = false;

  masterObject :any = {
    ID:null, CustomerID : 0, CompanyID: 0, 
       Comprehensive: {
        Reasonforvisit:'', Occupation:'', Nearworkinghours:'', BreakFrequencyduringnearwork:'',
        coList: [],
        ocularHistoryList :[],
        systemicHistoryList :[],
        familySystmeicList :[],
        birthHistoryList :[],
        socialHistoryList :[],
        PreviousGlassPrescription:'None',
        PreviousGlassPWR:{
          REDPSPH: '',  REDPCYL: '', REDPAxis: '', REDPVA: '', LEDPSPH: '', LEDPCYL: '', LEDPAxis: '',LEDPVA: '',
        },
        VisualAcuity:'',
        Unaided:{
           REDPVA: '',  RENPVA: '', LEDPVA: '', LENPVA: '', BEDPVA: '', BENPVA: '', 
        },
        Retinoscopy : false,
        Autorefractomer:{
             REDPSPH: '',  REDPCYL: '', REDPAxis: '', RE_KH: '', RE_KV: '', LEDPSPH: '', LEDPCYL: '',LEDPAxis:'', LE_KH: '',LE_KV:''
        },
        RetinoscopyPWR:{
             REDPSPH: '',  REDPCYL: '', REDPAxis: '', LEDPSPH: '', LEDPCYL: '',LEDPAxis:''
        },
        CycloplegiaPWR:{
            CycloplegiaDate:'',UnderCycloplegia:'', REDPSPH: '',  REDPCYL: '', REDPAxis: '', REDPVA: '',  LEDPSPH: '', LEDPCYL: '',LEDPAxis:'', LEDPVA: '',
        },
        PostMydriaticPWR:{
            PostMydriaticDate:'', REDPSPH: '',  REDPCYL: '', REDPAxis: '', REDPVA: '',  LEDPSPH: '', LEDPCYL: '',LEDPAxis:'', LEDPVA: '',
        },
        SubjectivePWR:  {
           REDPSPH: '',  REDPCYL: '', REDPAxis: '', REDPVA: '', LEDPSPH: '', LEDPCYL: '', LEDPAxis: '', LEDPVA: '', RENPSPH: '', RENPCYL: '', RENPAxis: '', RENPVA: '', LENPSPH: '', LENPCYL: '', LENPAxis: '', LENPVA: '', R_Addition: '', L_Addition: '', 
        },
        ColorVisionChart :{
          ColorVisionChart :'', ColorVision:'',ColorVisionLE:'',ColorVisionBE:''
        },
       SlitLamp:{
        drawingImg:'', LIDLASHES_R:'',  LIDLASHES_L:'',  CONJUNCTIVA_R:'',  CONJUNCTIVA_L:'',  CORNEA_R:'',  CORNEA_L:'',  IRIS_R:'',  IRIS_L:'',
        PUPIL_R:'',PUPIL_L:'',ANTERIORCHAMBER_R:'',ANTERIORCHAMBER_L:'',CRYSTALLINELENS_R:'',CRYSTALLINELENS_L:'',SCLERA_R:'', SCLERA_L:'', LACRIMALSYSTEM_R:'', LACRIMALSYSTEM_L:''
       },
       PosteriorSegment:{
        CUPDISCRATIO:'', MACULAFOVEA:'', ABNORMALITIES:'',
       },
       additionalTestList:[],
       ADVICE:''
     }
  }

  co:any = {
    Co:'', CoText:''
  }

  coList:any = []

  ocularHistory:any = {
    OcularHistory:'', OcularHistoryText:''
  }
  ocularHistoryList:any = []

  systemicHistory:any = {
    SystemicHistory:'', SystemicHistoryText:''
  }
  systemicHistoryList:any = []

  familySystmeic:any = {
    FamilySystmeicHistory:'', FamilySystmeicHistoryText:''
  }
  familySystmeicList:any = []

  BirthHistory:any = {
    BirthHistory:'', BirthHistoryText:''
  }
  birthHistoryList:any = []

  socialHistory:any = {
    SocialHistory:'', SocialHistoryText:''
  }
  socialHistoryList:any = []

  previousGlassPrescription:any = {
    PreviousGlassPrescription:'None', PreviousGlassPrescriptionText:''
  }
  previousGlassPrescriptionList:any = []

  additionalTest:any = {
    AdditionalTest:'', AdditionalTest_R_Text:'',AdditionalTest_L_Text:''
  }
  additionalTestList:any = []

    masterObject2 :any = {
      ID:null, CustomerID : 0, CompanyID: 0, 
        Binocular: {
          TypeDistance:'', TypeIntermediate:'', TypeNear:'', DeviationDistance:'', DeviationIntermediate:'', DeviationNear:'', EyeDistance:'', EyeIntermediate:'', EyeNear:'',PrismDioptreDistance:'', PrismDioptreIntermediate:'', PrismDioptreNear:'', RecoveryDistance:'', RecoveryIntermediate:'', RecoveryNear:'', NPCBreak:'', NPCRecovery:'', NPCBlurrRE:'', NPCRecoveryRE:'', NPCBlurrLE:'', NPCRecoveryLE:'',NPCBlurrBE:'', NPCRecoveryBE:'',Smooth :false, Accurate :false, Full :false, Extensive :false,Flipper:'',FlipperRE:'', FlipperLE:'',  FlipperBE:'',Stereopsis:'', Advice:'',
          states:  {
            red1: false,
            red2: false,
            green1: false,
            green2: false,
            green3: false
          }
        }
    }

    masterObject3 :any = {
      ID: null, CustomerID : 0, CompanyID: 0, 
      Contact:{
        FIRSTTIMECLUSERyes : false,
        FIRSTTIMECLUSERNo : false,
        PREVIOUSLYWEARING_TEXT : '',
        TYPE_TEXT : '',
        SOLUTIONUSED_TEXT : '',
        MEASUREMENTS:{
          RE_HK:'', RE_VK:'', RE_HVID:'', RE_PFH:'', LE_HK:'', LE_VK:'', LE_HVID:'', LE_PFH:'',
        },
        OCULAR_RE:false,  OCULAR_LE:false,
        OCULARPWE :{
            REDPSPH: '', REDPCYL: '', REDPAxis: '', REDPVA: '', LEDPSPH: '', LEDPCYL: '', LEDPAxis: '', LEDPVA: '', RENPSPH: '', RENPCYL: '', RENPAxis: '', RENPVA: '', LENPSPH: '', LENPCYL: '', LENPAxis: '', LENPVA: '', R_Addition: '', L_Addition: '',
        },
        trialList: [],
        FITASSESSMENT:'',
        FITASSESSMENTtext:'',
        ImageContact:'',
        ADVICE:''
      }
    };

    trial:any = { TYPE:'', TRIALNAME:'',DIA:'',POWER:'',BASECURVE:'',MODAILTY:'',OverRefraction:'',powerCheck: false, 
      trialPWR:{
        REDPSPH: '', REDPCYL: '', REDPAxis: '', REDPVA: '', LEDPSPH: '', LEDPCYL: '', LEDPAxis: '', LEDPVA: '', RENPSPH: '', RENPCYL: '', RENPAxis: '', RENPVA: '', LENPSPH: '', LENPCYL: '', LENPAxis: '', LENPVA: '', R_Addition: '', L_Addition: '',
      }
     }

    masterObject4 :any = {
      ID: null, CustomerID : 0, CompanyID: 0, 
      lowVision : {
        Reasonforvisit:'', Occupation:'', 
        coList: [],
        ocularHistoryList :[],
        systemicHistoryList :[],
        familySystmeicList :[],
        birthHistoryList :[],
        PosturalAbnormalitiesList :[],
        MobilityList :[],
        ApperanceList :[],
        lowVisionAidsList :[],
        Unaided:{
           RED: '',  REN: '', REDC: '',  RENC: '', LED: '', LEN: '', LEDC: '', LENC: '', BED: '', BEN: '', BEDC: '', BENC: '', 
        },
        instrumentUsed :{
          InstrumentUsed:'',REDPSPH: '',  REDPCYL: '', REDPAxis: '', RE_KH: '', RE_KV: '', LEDPSPH: '', LEDPCYL: '',LEDPAxis:'', LE_KH: '',LE_KV:''
        },
           SubjectivePWR:  {
           REDPSPH: '',  REDPCYL: '', REDPAxis: '', REDPVA: '', LEDPSPH: '', LEDPCYL: '', LEDPAxis: '', LEDPVA: '', RENPSPH: '', RENPCYL: '', RENPAxis: '', RENPVA: '', LENPSPH: '', LENPCYL: '', LENPAxis: '', LENPVA: '', R_Addition: '', L_Addition: '', 
        },
        OPTICALAID:'', NONOPTICALAID:'', ENIVRMENTALCHANGES:'', ANYOTHER:'', ADVICE:'',
      }
    }

coLow:any = { Co:'', CoText:'' }

ocularHistoryLow:any = { OcularHistory:'', OcularHistoryText:''}

systemicHistoryLow:any = { SystemicHistory:'', SystemicHistoryText:''}

familySystmeicLow:any = { FamilySystmeicHistory:'', FamilySystmeicHistoryText:''}

BirthHistoryLow:any = { BirthHistory:'', BirthHistoryText:''}

PosturalAbnormalitiesLow:any = { PosturalAbnormalities:'', PosturalAbnormalitiesText:''}

MobilityLow:any = { Mobility:'',  MobilityText:''}
ApperanceLow:any = { Apperance:'',  ApperanceText:''}

lowVisionAids :any ={ InstrumentUsed:'', patientCompliance: '', distanceNear:''}


customerImage:any

  data: any = {
    Reasonforvisit:'', Occupation:'', Nearworkinghours:'',  OcularHistory:'', Systemichistory:'', FamilySystmeicHistory:'', BirthHistory:'', SocialHistory:'', PreviousGlassPrescription:'', Unaided:'', Chart:'', Near:'',
  }

  data2:any = {
    DCoverTest:'',ICoverTest:'', NCoverTest:''
  }
  
  
  
  SocialHistoryC = false


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


  firstTimeYes = false
  firstTimeNo = false
  leftEye =false
  rightEye =false

   ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;

    this.ctx.strokeStyle = 'limegreen';
    this.ctx.lineWidth = 3;
    this.ctx.lineCap = 'round';

    canvas.addEventListener('mousedown', this.startPosition.bind(this));
    canvas.addEventListener('mouseup', this.endPosition.bind(this));
    canvas.addEventListener('mouseout', this.endPosition.bind(this));
    canvas.addEventListener('mousemove', this.draw.bind(this));
  }

  startPosition(event: MouseEvent): void {
    this.drawing = true;
    this.ctx.beginPath();
    const pos = this.getMousePos(event);
    this.ctx.moveTo(pos.x, pos.y);
  }

  endPosition(): void {
    this.drawing = false;
    this.ctx.beginPath(); // reset path
  }

  draw(event: MouseEvent): void {
    if (!this.drawing) return;

    const pos = this.getMousePos(event);
    this.ctx.lineTo(pos.x, pos.y);
    this.ctx.stroke();
  }

  getMousePos(event: MouseEvent) {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  ngOnInit(): void {
    console.log(this.masterObject.Comprehensive.Unaided.REDPVA);
    
  }

  checkChange(mode:any){
    if(mode == 'Retinoscopy'){
        this.masterObject.Retinoscopy = true
    }else{
      this.masterObject.Retinoscopy = false
    }
   
  }

  AddItam(mode:any){
    if(mode == 'CO'){
      this.masterObject.Comprehensive.coList.push(this.co)
      this.co = {}
    }else if(mode == 'OcularHistory'){
      this.masterObject.Comprehensive.ocularHistoryList.push(this.ocularHistory)
      this.ocularHistory = {}
    }else if(mode == 'SystemicHistory'){
      this.masterObject.Comprehensive.systemicHistoryList.push(this.systemicHistory)
      this.systemicHistory = {}
    }else if(mode == 'FamilySystmeic'){
      this.masterObject.Comprehensive.familySystmeicList.push(this.familySystmeic)
      this.familySystmeic = {}
    }else if(mode == 'BirthHistory'){
     this.masterObject.Comprehensive.birthHistoryList.push(this.BirthHistory)
      this.BirthHistory = {}
    }else if(mode == 'SocialHistory'){
      this.masterObject.Comprehensive.socialHistoryList.push(this.socialHistory)
      this.socialHistory = {}
    }else if(mode == 'PreviousGlassPrescription'){
      this.masterObject.Comprehensive.previousGlassPrescriptionList.push(this.previousGlassPrescription)
      this.previousGlassPrescription = {}
    }else if(mode == 'AdditionalTest'){
     this.masterObject.Comprehensive.additionalTestList.push(this.additionalTest)
      this.additionalTest = {}
    }
//  low vision
    else if(mode == 'lowCO'){
      this.masterObject4.lowVision.coList.push(this.coLow)
      this.coLow = {}
    }else if(mode == 'lowOcularHistory'){
       this.masterObject4.lowVision.ocularHistoryList.push(this.ocularHistoryLow)
      this.ocularHistoryLow = {}
    }else if(mode == 'lowSystemicHistory'){
       this.masterObject4.lowVision.systemicHistoryList.push(this.systemicHistoryLow)
      this.systemicHistoryLow = {}
    }else if(mode == 'lowFamilySystmeic'){
       this.masterObject4.lowVision.familySystmeicList.push(this.familySystmeicLow)
      this.familySystmeicLow = {}
    }else if(mode == 'lowBirthHistory'){
      this.masterObject4.lowVision.birthHistoryList.push(this.BirthHistoryLow)
      this.BirthHistoryLow = {}
    } else if(mode == 'lowPosturalAbnormalities'){
       this.masterObject4.lowVision.PosturalAbnormalitiesList.push(this.PosturalAbnormalitiesLow)
      this.PosturalAbnormalitiesLow = {}
    }else if(mode == 'lowMobility'){
       this.masterObject4.lowVision.MobilityList.push(this.MobilityLow)
      this.MobilityLow = {}
    }else if(mode == 'lowApperance'){
      this.masterObject4.lowVision.ApperanceList.push(this.ApperanceLow)
      this.ApperanceLow = {}
    } else if(mode == 'lowVisionAids'){
       this.masterObject4.lowVision.lowVisionAidsList.push(this.lowVisionAids)
      this.lowVisionAids = {}
    } else if(mode == 'TRIAL'){
       this.masterObject3.Contact.trialList.push(this.trial)
      this.trial = {}
    }
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
  
      let fieldValue = this.spectacle[fieldName];
  
      if ((fieldValue == 0 || fieldValue == 0.00) && fieldValue !== "") {
        fieldValue = 'PLANO';
      }
  
      this.spectacle[fieldName] = fieldValue;
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
      this.spectacle[fieldName] = formattedInput;
  
      if (fieldName === 'RENPCYL') {
        this.spectacle.REDPCYL = formattedInput;
      }
  
      // Validate the formatted input
      if (formattedInput != "") {
        this.inputError = !validValues.includes(formattedInput);
      } else {
        this.spectacle[fieldName] = formattedInput;
      }
  
      if (this.inputError) {
        this.spectacle[fieldName] = '';  // Reset to '0.00' if invalid
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
  
      let fieldValue = this.spectacle[fieldName];
  
      // Handle special case for PLANO
      if ((fieldValue == 0 || fieldValue == 0.00) && fieldValue !== "") {
        fieldValue = 'PLANO';
      }
  
      this.spectacle[fieldName] = fieldValue;
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
      this.spectacle[fieldName] = formattedInput;
  
      // Validate the formatted input
      if (formattedInput != "") {
        this.inputError = !validValues.includes(formattedInput);
      } else {
        this.spectacle[fieldName] = formattedInput;
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
  
      let fieldValue = this.spectacle[fieldName];
  
      if ((fieldValue == 0 || fieldValue == 0.00) && fieldValue !== "") {
        fieldValue = 'PLANO';
      }
  
      this.spectacle[fieldName] = fieldValue;
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
      this.spectacle[fieldName] = formattedInput;
  
      if (fieldName === 'LENPCYL') {
        this.spectacle.LEDPCYL = formattedInput;
      }
  
      // Validate the formatted input
      if (formattedInput != "") {
        this.inputError = !validValues.includes(formattedInput);
      } else {
        this.spectacle[fieldName] = formattedInput;
      }
  
      if (this.inputError) {
        this.spectacle[fieldName] = '';  // Reset to '0.00' if invalid
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
  
      let fieldValue = this.spectacle[fieldName];
  
      // Handle special case for PLANO
      if ((fieldValue == 0 || fieldValue == 0.00) && fieldValue !== "") {
        fieldValue = 'PLANO';
      }
  
      this.spectacle[fieldName] = fieldValue;
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
      this.spectacle[fieldName] = formattedInput;
  
      // Validate the formatted input
      if (formattedInput != "") {
        this.inputError = !validValues.includes(formattedInput);
      } else {
        this.spectacle[fieldName] = formattedInput;
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

    calculate(mode: any, x: any, y: any) {
    this.calculation.calculate(mode, x, y, this.masterObject.Comprehensive.SubjectivePWR, this.clens)
  }

   toggle(key: string) {
    this.masterObject2.Binocular.states[key] = !this.masterObject2.Binocular.states[key];
  }

  getStyle(key: string) {
    if (this.masterObject2.Binocular.states[key]) {
      if (key.includes('red')) {
        return { 'background-color': 'red', 'color': 'white' };
      } else if (key.includes('green')) {
        return { 'background-color': 'green', 'color': 'white' };
      }
    }
    return {};
  }

  onSubmitCom(){
    console.log(this.masterObject);
  }

  onSubmitBinocular(){
    console.log(this.masterObject2);
  }
  onSubmitContact(){
    console.log(this.masterObject3);
  }
  onSubmitLowVision(){
    console.log(this.masterObject4);
  }

 
}
