import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription, fromEvent } from 'rxjs';
import { environment } from 'src/environments/environment';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { FileUploadService } from 'src/app/service/helpers/file-upload.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { debounceTime, distinctUntilChanged, map, take } from 'rxjs/operators';
import { CompressImageService } from 'src/app/service/helpers/compress-image.service';
import * as moment from 'moment';
import { CustomerModel, SpectacleModel, ContactModel, OtherModel } from 'src/app/interface/Customer';
import { CustomerService } from 'src/app/service/customer.service';
import { CalculationService } from 'src/app/service/helpers/calculation.service';
import { CustomerPowerCalculationService } from 'src/app/service/helpers/customer-power-calculation.service';
import { EmployeeService } from 'src/app/service/employee.service';
import { BillService } from 'src/app/service/bill.service';
import { ProductService } from 'src/app/service/product.service';
import { trigger, style, animate, transition } from '@angular/animations';
import { DoctorService } from 'src/app/service/doctor.service';
import { SupportService } from 'src/app/service/support.service';
import { Subject } from 'rxjs';
import html2canvas from 'html2canvas';
import { MembershipcardService } from 'src/app/service/membershipcard.service';
import { EMPTY } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ReminderService } from 'src/app/service/reminder.service';

@Component({
  selector: 'app-billing',
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.css'],
  animations: [
    trigger('fade', [
      transition('void => *', [
        style({ opacity: 0 }),
        animate(1000, style({ opacity: 1 }))
      ])
    ])
  ]
})

export class BillingComponent implements OnInit {
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (this.id == 0) {
      if (event.altKey && event.key === 's' || event.altKey && event.key === 'S') {
        this.onsubmit();
        event.preventDefault();
        (document.activeElement as HTMLElement)?.blur();
        document.body.focus();
      }
    }
    if (this.id != 0) {
      if (event.altKey && event.key === 'D' || event.altKey && event.key === 'd') {
        this.updateCustomer();
        event.preventDefault();
      }
      if (event.altKey && event.key === 'h' || event.altKey && event.key === 'H') {
        this.router.navigate(['/sale/billinglist/', this.id]);
        event.preventDefault();
      }
      if (event.altKey && event.key === 'o' || event.altKey && event.key === 'O') {
        this.router.navigate(['/sale/oldBilllist/', this.id]);
        event.preventDefault();
      }
      if (event.altKey && event.key === 'c' || event.altKey && event.key === 'C') {
        this.clearFrom();
        event.preventDefault();
      }
    }
  }

  @ViewChild('nameInput') nameInput!: ElementRef;
  @ViewChild('Csearching') Csearching: ElementRef | any;
  @ViewChild('UserNamecontrol') UserNamecontrol: ElementRef | any;

  company = JSON.parse(localStorage.getItem('company') || '');
  user = JSON.parse(localStorage.getItem('user') || '');
  companySetting = JSON.parse(localStorage.getItem('companysetting') || '');
  shop:any = JSON.parse(localStorage.getItem('shop') || '');
  selectedShop = JSON.parse(localStorage.getItem('selectedShop') || '');
  permission = JSON.parse(localStorage.getItem('permission') || '[]');
  env = environment;

signs = {
  RE: { SPH: '+', CYL: '+' , SPHN:'+' },
  LE: { SPH: '+', CYL: '+' , SPHN:'+'}
};
selectedValues: any = {
  SPH: {
    RE: null,
    LE: null  // if you add this later
  },
  CYL: {
    RE: null,
    LE: null
  },
  ASIX: {
    RE: null,
    LE: null
  },
  SPHN: {
    RE: null,
    LE: null
  },
  VADV: {
    RE: null,
    LE: null
  },
  VANV: {
    RE: null,
    LE: null
  }
};
  // SPH and CYL values
  sphValues: number[][] = [
    [0.00, 0.25, 0.50, 0.75, 1.00, 2.25, 2.50, 2.75, 3.00, 3.25, 3.50, 3.75],
    [4.00, 4.25, 4.50, 4.75, 5.00, 5.25, 5.50, 5.75, 6.00, 6.25, 6.50, 6.75],
    [7.00, 7.25, 7.50, 7.75, 8.00, 9.25, 9.50, 9.75, 10.00, 10.25, 10.50, 10.75]
  ];

  asixValues: number[][] = [
    [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60],
    [65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120],
    [125, 130, 135, 140, 145, 150, 155, 160, 165,170,175,180]
  ];

  cylValues: number[][] = [
    [0.00, 0.25, 0.50, 0.75, 1.00, 2.25, 2.50, 2.75, 3.00, 3.25, 3.50, 3.75],
    [4.00, 4.25, 4.50, 4.75, 5.00, 5.25, 5.50, 5.75, 6.00, 6.25, 6.50, 6.75],
    [7.00, 7.25, 7.50, 7.75, 8.00, 9.25, 9.50, 9.75, 10.00,10.25, 10.50, 10.75]
  ];

    vaDvValues: any[][] = [
    ['6/6', '6/6 P', '6/9', '6/9 P', '6/12', '6/12 P', '6/18', '6/18 P', '6/24', '6/24 P', '6/30', '6/30 P'],
    ['6/36', '6/36 P', '6/60', '6/60 P', ]
  ];

    vaNvValues: any[][] = [
    ['N5', 'N6', 'N8', 'N10', 'N12', 'N18', 'N36' ]
  ];

 
  myControl = new FormControl('');
  myControl1 = new FormControl('');
  myControl2 = new FormControl('');
  filteredOptions: any;
  optometristDisabled = true
  optometristDisabledBTN = true
  otherSpec = false
  otherContant = false
  otherNoPower = false

  id: any = 0;
  id2: any = 0;
  customerImage: any;
  clensImage: any;
  spectacleImage: any;
  img: any;
  familyList: any;
  docList: any;
  ReferenceList: any;
  OtherList: any;
  spectacleLists: any = []
  contactList: any = []
  otherList: any = []
  toggleChecked = false;
  formValue: any = [];
  searchList: any = [];
  srcBox = true;
  customerSearchBillPageHide = true;
  searchValue: any = ''
  otherselect: any
  rewardBalance: any = 0
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    public as: AlertService,
    private fu: FileUploadService,
    private sp: NgxSpinnerService,
    private modalService: NgbModal,
    private compressImage: CompressImageService,
    private cs: CustomerService,
    private es: EmployeeService,
    public calculation: CustomerPowerCalculationService,
    public bill: BillService,
    private ps: ProductService,
    private dc: DoctorService,
    private supps: SupportService,
    private msc: MembershipcardService,
     private rs: ReminderService,
  ) {
    this.id = this.route.snapshot.params['customerid'];
    this.id2 = this.route.snapshot.params['billid'];

    this.searchKeySubject.pipe(
      debounceTime(500)  // Adjust the debounce time as needed
    ).subscribe(({ searchKey, mode }) => {
      this.performSearch(searchKey, mode);
    });
  }
  ngAfterViewInit() {
    // Check if Customer ID is 0 and set focus
    if (this.id == 0) {
      this.nameInput.nativeElement.focus();
    }
  }

  searchKeySubject: Subject<{ searchKey: any, mode: any }> = new Subject();
  ExpiryDateFormember: any
  ActiveDeactive = false
  memberCard: any = {
    CustomerID: '', CompanyID: '', ShopID: '', IssueDate: '', ExpiryDate: '', Status: '', CreatedBy: '', CreatedOn: ''
  }

  data: any = {
    ID: '', CompanyID: '', Idd: 0, Title: '', Name: '', Sno: '', TotalCustomer: '', VisitDate: '', MobileNo1: '', MobileNo2: '', PhoneNo: '', Address: '', GSTNo: '', Email: '', PhotoURL: null, DOB: '', Age: 0, Anniversary: '', RefferedByDoc: '', ReferenceType: '', Gender: '', Category: '', Other: '', Remarks: '', Status: 1, CreatedBy: 0, UpdatedBy: 0, CreatedOn: '', UpdatedOn: '', tablename: '', spectacle_rx: [], contact_lens_rx: [], other_rx: [],
  };

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

  other: any = {
    ID: 'null', CustomerID: '', BP: '', Sugar: '', IOL_Power: '', RefferedByDoc: 'Self', Operation: '', R_VN: '', L_VN: '', R_TN: '', L_TN: '', R_KR: '', L_KR: '', Treatment: '', Diagnosis: '', Family: 'Self', FileURL: null, Status: 1, CreatedBy: 0, CreatedOn: '', UpdatedBy: 0, UpdatedOn: '', VisitDate: '',
  };

  note: any = {
    CustomerID:null, ShopID:null, CreditNumber:null,  CreditDate:'',  Amount:0, Remark:'',
  }

  Check: any = { SpectacleCheck: true, ContactCheck: false, OtherCheck: false, };

  param = { Name: '', MobileNo1: '', Address: '', Sno: '' };
  membarship: any
  membarshipList: any = []
  inputError: boolean = false;
  // dropdown values in satics
  // dataSPH: any = [
  //   { Name: '+25.00' },
  //   { Name: '+24.75' },
  //   { Name: '+24.50' },
  //   { Name: '+24.25' },
  //   { Name: '+24.00' },
  //   { Name: '+23.75' },
  //   { Name: '+23.50' },
  //   { Name: '+23.25' },
  //   { Name: '+23.00' },
  //   { Name: '+22.75' },
  //   { Name: '+22.50' },
  //   { Name: '+22.25' },
  //   { Name: '+22.00' },
  //   { Name: '+21.75' },
  //   { Name: '+21.50' },
  //   { Name: '+21.25' },
  //   { Name: '+21.00' },
  //   { Name: '+20.75' },
  //   { Name: '+20.50' },
  //   { Name: '+20.25' },
  //   { Name: '+20.00' },
  //   { Name: '+19.75' },
  //   { Name: '+19.50' },
  //   { Name: '+19.25' },
  //   { Name: '+19.00' },
  //   { Name: '+18.75' },
  //   { Name: '+18.50' },
  //   { Name: '+18.25' },
  //   { Name: '+18.00' },
  //   { Name: '+17.75' },
  //   { Name: '+17.50' },
  //   { Name: '+17.25' },
  //   { Name: '+17.00' },
  //   { Name: '+16.75' },
  //   { Name: '+16.50' },
  //   { Name: '+16.25' },
  //   { Name: '+16.00' },
  //   { Name: '+15.75' },
  //   { Name: '+15.50' },
  //   { Name: '+15.25' },
  //   { Name: '+15.00' },
  //   { Name: '+14.75' },
  //   { Name: '+14.50' },
  //   { Name: '+14.25' },
  //   { Name: '+14.00' },
  //   { Name: '+13.75' },
  //   { Name: '+13.50' },
  //   { Name: '+13.25' },
  //   { Name: '+13.00' },
  //   { Name: '+12.75' },
  //   { Name: '+12.50' },
  //   { Name: '+12.25' },
  //   { Name: '+12.00' },
  //   { Name: '+11.75' },
  //   { Name: '+11.50' },
  //   { Name: '+11.25' },
  //   { Name: '+11.00' },
  //   { Name: '+10.75' },
  //   { Name: '+10.50' },
  //   { Name: '+10.25' },
  //   { Name: '+10.00' },
  //   { Name: '+9.75' },
  //   { Name: '+9.50' },
  //   { Name: '+9.25' },
  //   { Name: '+9.00' },
  //   { Name: '+8.75' },
  //   { Name: '+8.50' },
  //   { Name: '+8.25' },
  //   { Name: '+8.00' },
  //   { Name: '+7.75' },
  //   { Name: '+7.50' },
  //   { Name: '+7.25' },
  //   { Name: '+7.00' },
  //   { Name: '+6.75' },
  //   { Name: '+6.50' },
  //   { Name: '+6.25' },
  //   { Name: '+6.00' },
  //   { Name: '+5.75' },
  //   { Name: '+5.50' },
  //   { Name: '+5.25' },
  //   { Name: '+5.00' },
  //   { Name: '+4.75' },
  //   { Name: '+4.50' },
  //   { Name: '+4.25' },
  //   { Name: '+4.00' },
  //   { Name: '+3.75' },
  //   { Name: '+3.50' },
  //   { Name: '+3.25' },
  //   { Name: '+3.00' },
  //   { Name: '+2.75' },
  //   { Name: '+2.50' },
  //   { Name: '+2.25' },
  //   { Name: '+2.00' },
  //   { Name: '+1.75' },
  //   { Name: '+1.50' },
  //   { Name: '+1.25' },
  //   { Name: '+1.00' },
  //   { Name: '+0.75' },
  //   { Name: '+0.50' },
  //   { Name: '+0.25' },
  //   { Name: 'PLANO' },
  //   { Name: '-0.25' },
  //   { Name: '-0.50' },
  //   { Name: '-0.75' },
  //   { Name: '-1.00' },
  //   { Name: '-1.25' },
  //   { Name: '-1.50' },
  //   { Name: '-1.75' },
  //   { Name: '-2.00' },
  //   { Name: '-2.25' },
  //   { Name: '-2.50' },
  //   { Name: '-2.75' },
  //   { Name: '-3.00' },
  //   { Name: '-3.25' },
  //   { Name: '-3.50' },
  //   { Name: '-3.75' },
  //   { Name: '-4.00' },
  //   { Name: '-4.25' },
  //   { Name: '-4.50' },
  //   { Name: '-4.75' },
  //   { Name: '-5.00' },
  //   { Name: '-5.25' },
  //   { Name: '-5.50' },
  //   { Name: '-5.75' },
  //   { Name: '-6.00' },
  //   { Name: '-6.25' },
  //   { Name: '-6.50' },
  //   { Name: '-6.75' },
  //   { Name: '-7.00' },
  //   { Name: '-7.25' },
  //   { Name: '-7.50' },
  //   { Name: '-7.75' },
  //   { Name: '-8.00' },
  //   { Name: '-8.25' },
  //   { Name: '-8.50' },
  //   { Name: '-8.75' },
  //   { Name: '-9.00' },
  //   { Name: '-9.25' },
  //   { Name: '-9.50' },
  //   { Name: '-9.75' },
  //   { Name: '-10.00' },
  //   { Name: '-10.25' },
  //   { Name: '-10.50' },
  //   { Name: '-10.75' },
  //   { Name: '-11.00' },
  //   { Name: '-11.25' },
  //   { Name: '-11.50' },
  //   { Name: '-11.75' },
  //   { Name: '-12.00' },
  //   { Name: '-12.25' },
  //   { Name: '-12.50' },
  //   { Name: '-12.75' },
  //   { Name: '-13.00' },
  //   { Name: '-13.25' },
  //   { Name: '-13.50' },
  //   { Name: '-13.75' },
  //   { Name: '-14.00' },
  //   { Name: '-14.25' },
  //   { Name: '-14.50' },
  //   { Name: '-14.75' },
  //   { Name: '-15.00' },
  //   { Name: '-15.25' },
  //   { Name: '-15.50' },
  //   { Name: '-15.75' },
  //   { Name: '-16.00' },
  //   { Name: '-16.25' },
  //   { Name: '-16.50' },
  //   { Name: '-16.75' },
  //   { Name: '-17.00' },
  //   { Name: '-17.25' },
  //   { Name: '-17.50' },
  //   { Name: '-17.75' },
  //   { Name: '-18.00' },
  //   { Name: '-18.25' },
  //   { Name: '-18.50' },
  //   { Name: '-18.75' },
  //   { Name: '-19.00' },
  //   { Name: '-19.25' },
  //   { Name: '-19.50' },
  //   { Name: '-19.75' },
  //   { Name: '-20.00' },
  //   { Name: '-20.25' },
  //   { Name: '-20.50' },
  //   { Name: '-20.75' },
  //   { Name: '-21.00' },
  //   { Name: '-21.25' },
  //   { Name: '-21.50' },
  //   { Name: '-21.75' },
  //   { Name: '-22.00' },
  //   { Name: '-22.25' },
  //   { Name: '-22.50' },
  //   { Name: '-22.75' },
  //   { Name: '-23.00' },
  //   { Name: '-23.25' },
  //   { Name: '-23.50' },
  //   { Name: '-23.75' },
  //   { Name: '-24.00' },
  //   { Name: '-24.25' },
  //   { Name: '-24.50' },
  //   { Name: '-24.75' },
  //   { Name: '-25.00' },
  // ];

  dataCYL1: any = [

    { Name: '-7.75' },
    { Name: '-7.25' },
    { Name: '-6.75' },
    { Name: '-6.25' },
    { Name: '-5.75' },
    { Name: '-5.25' },
    { Name: '-4.75' },
    { Name: '-4.25' },
    { Name: '-3.75' },
    { Name: '-3.25' },
    { Name: '-2.75' },
    { Name: '-2.25' },
    { Name: '-1.75' },
    { Name: '-1.25' },
    { Name: '-0.75' },
    { Name: 'PLANO' },
    { Name: '+0.75' },
    { Name: '+1.25' },
    { Name: '+1.75' },
    { Name: '+2.25' },
    { Name: '+2.75' },
    { Name: '+3.25' },
    { Name: '+3.75' },
    { Name: '+4.25' },
    { Name: '+4.75' },
    { Name: '+5.25' },
    { Name: '+5.75' },
    { Name: '+6.25' },
    { Name: '+6.75' },
    { Name: '+7.25' },
    { Name: '+7.75' },


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
  filteredPVAList: any = []
  // dropdown values in satics 
  showDoctorAdd = false;
  editCustomer = false
  addCustomer = false
  deleteCustomer = false
  CustomerBillView = false
  CustomerPowerView = false
  numberList: any = []
  otherLists: any = []
  x: any
  currentTime = '';
  srcCustomerBox = false
  minHeight = 10 // Default min height
  LogoURL: any
  @Input() Link: any
  OptometristBtn = 'false'
  updateHeightConditions() {
    if (this.data.Remarks == "") {
      this.data.minHeight = 10;
    } else {
      this.data.minHeight = 30;
    }
  }
    dataSPH: any[] = [];
    dataCYL: any[] = [];

  ngOnInit(): void {
    this.updateHeightConditions()
    this.permission.forEach((element: any) => {
      if (element.ModuleName === 'CustomerPower') {
        this.CustomerPowerView = element.View;
      }
      if (element.ModuleName === 'Customer') {
        this.editCustomer = element.Edit;
        this.addCustomer = element.Add;
        this.deleteCustomer = element.Delete;
      }
      if (element.ModuleName === 'CustomerBill') {
        this.CustomerBillView = element.View;
      }
    });

    this.data.VisitDate = moment().format('YYYY-MM-DD');
    this.spectacle.VisitDate = moment().format('YYYY-MM-DD');
    this.clens.VisitDate = moment().format('YYYY-MM-DD');
    this.other.VisitDate = moment().format('YYYY-MM-DD');
    this.currentTime = new Date().toLocaleTimeString('en-IN', { hourCycle: 'h23' })
    if (this.id != 0) {
      this.getCustomerById();
    }

     this.bill.doctor$.subscribe((list:any) => {
      this.docList = list
    });
    this.bill.referenceByList$.subscribe((list:any) => {
      this.ReferenceList = list
    });
    this.bill.otherDataList$.subscribe((list:any) => {
      this.otherLists = list
    });

    // this.doctorList()
    this.srcBox = true;
    [this.shop] = this.shop.filter((s: any) => s.ID === Number(this.selectedShop[0]));
    this.OptometristBtn  = this.shop?.Optometrist
    this.LogoURL = this.env.apiUrl + this.shop?.LogoURL

      const positive = this.generateRange(25, 0.25, true);
    const negative = this.generateRange(25, 0.25, false);
      const positive1 = this.generateRange1(10, 0.25, true);
    const negative1 = this.generateRange1(10, 0.25, false);

    // Arrange the list to have positives first, then "PLANO", then negatives
    this.dataSPH = [
      ...positive.map(v => ({ Name: v })),
      { Name: 'PLANO' },
      ...negative.map(v => ({ Name: v }))
    ];
    this.dataCYL = [
      ...positive1.map(v => ({ Name: v })),
      { Name: 'PLANO' },
      ...negative1.map(v => ({ Name: v }))
    ];

    // Initially show the full list
    this.dataSPH = [...this.dataSPH];
    this.dataCYL = [...this.dataCYL];
  }



  // Helper function to generate range


  generateRange(max: number, step: number, isPositive: boolean): string[] {
  const result: string[] = [];
  for (let i = 0; i <= max; i += step) {
    if (!isPositive && i === 0) continue; // Skip -0.00
    const val = (isPositive ? '+' : '-') + i.toFixed(2);
    result.push(val);
  }
  return result;
}

  generateRange1(max: number, step: number, isPositive: boolean): string[] {
    const result: string[] = [];
    for (let i = 0; i <= max; i += step) {
        if (!isPositive && i === 0) continue; // Skip -0.00
    const val = (isPositive ? '+' : '-') + i.toFixed(2);
    result.push(val);
    }
    return result;
  }

  // dataPVA filter
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


  op1() {
    this.x = document.getElementById("u");
    if (this.x.open === false) {
      this.x.open = true;
    } else {
      this.x.open = false;
    }
  }


  doctorList() {
    this.sp.show();
    const subs: Subscription = this.dc.dropdownDoctorlist().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.docList = res.data.sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }



  specCheck(mode: any) {
    if (mode === 'spec') {
      this.Check.SpectacleCheck = true
      this.Check.ContactCheck = false
      this.Check.OtherCheck = false
    } else if (mode === 'con') {
      this.Check.ContactCheck = true
      this.Check.SpectacleCheck = false
      this.Check.OtherCheck = false
    } else if (mode === 'other') {
      this.Check.SpectacleCheck = false
      this.Check.ContactCheck = false
      this.Check.OtherCheck = true
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
    // this.otherSuppList()
    // this.ReferenceSuppList()
    if (this.id != 0) {
      this.getMembershipcardByCustomerID(this.id)
    }
  }

  otherSuppList() {
    this.sp.show();
    const subs: Subscription = this.supps.getList('Other').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.otherLists = res.data.sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  ReferenceSuppList() {
    this.sp.show();
    const subs: Subscription = this.supps.getList('ReferenceBy').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.ReferenceList = res.data.sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  onsubmit() {
    this.sp.show()
    this.data.VisitDate = this.data.VisitDate + ' ' + this.currentTime;
    if (this.Check.SpectacleCheck === true) {
      this.data.tablename = 'spectacle_rx'
      this.data.spectacle_rx = this.spectacle


      const PLANOCheck = ['REDPSPH', 'REDPCYL', 'RENPSPH', 'RENPCYL', 'LEDPSPH', 'LEDPCYL', 'LENPSPH', 'LENPCYL']
      const DegreeCheck = ['REDPAxis', 'RENPAxis', 'LEDPAxis', 'LENPAxis']

      for (const prop of PLANOCheck) {
        if (this.data.spectacle_rx[prop] === 'PLANO') {
          this.data.spectacle_rx[prop] = '+0.00';
        }
      }
      for (const prop of DegreeCheck) {
        if (this.data.spectacle_rx[prop] !== '') {
          this.data.spectacle_rx[prop] = this.data.spectacle_rx[prop] + '°';
        }
      }
      this.spectacle.VisitDate = moment(this.spectacle.VisitDate).format('YYYY-MM-DD');
      this.spectacle.ExpiryDate = moment().add(Number(this.spectacle.Reminder), 'M').format('YYYY-MM-DD');
    }
    if (this.Check.ContactCheck === true) {
      this.data.tablename = 'contact_lens_rx'
      this.data.contact_lens_rx = this.clens

      const PLANOCheck = ['REDPSPH', 'REDPCYL', 'RENPSPH', 'RENPCYL', 'LEDPSPH', 'LEDPCYL', 'LENPSPH', 'LENPCYL']
      const DegreeCheck = ['REDPAxis', 'RENPAxis', 'LEDPAxis', 'LENPAxis']

      for (const prop of PLANOCheck) {
        if (this.data.contact_lens_rx[prop] === 'PLANO') {
          this.data.contact_lens_rx[prop] = '+0.00';
        }
      }
      for (const prop of DegreeCheck) {
        if (this.data.contact_lens_rx[prop] !== '') {
          this.data.contact_lens_rx[prop] = this.data.contact_lens_rx[prop] + '°';
        }
      }
      this.clens.VisitDate = this.clens.VisitDate;
    }
    if (this.Check.OtherCheck === true) {
      this.data.tablename = 'other_rx'
      this.data.other_rx = this.other
      this.other.VisitDate = this.other.VisitDate;
    }


    if (this.data.MobileNo1 !== '') {
      this.param.MobileNo1 = this.data.MobileNo1;
      this.customerSearch(this.param.MobileNo1, 'MobileNo1');
      if (this.filteredOptions.length != 0) {
        Swal.fire({
          position: 'center',
          icon: 'warning',
          title: 'Duplicate Customer',
          showConfirmButton: true,
          backdrop: false
        })
      }
    }

    const subs: Subscription = this.cs.saveCustomer(this.data).subscribe({
      next: (res: any) => {
        if (res.success) {
          if (res.data[0].ID !== 0) {
            this.id = res.data[0].ID;
            this.spectacle.CustomerID = this.id;
            this.clens.CustomerID = this.id;
            this.other.CustomerID = this.id;
            this.router.navigate(['/sale/billing', res.data[0].ID, 0]);
            this.getCustomerById();
            Swal.fire({
              position: 'center',
              icon: 'success',
              title: 'Your Customer has been Save.',
              showConfirmButton: false,
              timer: 1000
            })
          }
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => {
        console.log(err.msg);
      },
      complete: () => subs.unsubscribe(),
    });
  }

  // getScoList() {
  //   this.sp.show()
  //   const subs: Subscription = this.cs.getCustomerById(this.id).subscribe({
  //     next: (res: any) => {
  //       if (res.success) {
  //         if (this.company.ID == 241 || this.company.ID == 300) {
  //           if (this.shop.RoleName == 'optometrist') {
  //             this.optometristDisabled = false
  //           }
  //           let Parem = 'and billmaster.BillType = 0' + ' and billmaster.CustomerID = ' + `${this.id}`
  //           const subs: Subscription = this.bill.saleServiceReport(Parem).subscribe({
  //             next: (res: any) => {
  //               if (res.success) {
  //                 res.data.forEach((d: any) => {
  //                   const todayDate = moment(new Date()).format('YYYY-MM-DD');
  //                   const BillDate = moment(d.BillDate).format('YYYY-MM-DD');
  //                   if (BillDate === todayDate) {
  //                     if (d.PaymentStatus === 'Unpaid') {
  //                       this.optometristDisabledBTN = false;
  //                     } else {
  //                       this.optometristDisabledBTN = true;
  //                     }
  //                   }
  //                 })
  //                 this.as.successToast(res.message)
  //               } else {
  //                 this.as.errorToast(res.message)
  //               }
  //               this.sp.hide()
  //             },
  //             error: (err: any) => console.log(err.message),
  //             complete: () => subs.unsubscribe(),
  //           })
  //         }
  //         this.data = res.data[0]
  //         this.data.Idd = res.data[0].Idd
  //         this.rewardBalance = res.rewardBalance;
  //         this.data.VisitDate = moment(res.data[0].VisitDate).format('YYYY-MM-DD');
  //         if (res.data[0].PhotoURL !== "null" && res.data[0].PhotoURL !== '') {
  //           this.customerImage = this.env.apiUrl + res.data[0].PhotoURL;
  //         } else {
  //           this.customerImage = "/assets/images/userEmpty.png"
  //         }
  //         // this.spectacleLists =  res.spectacle_rx 
  //         this.spectacleLists =  res.spectacle_rx && res.spectacle_rx.length > 0 ? res.spectacle_rx.slice(0, 10): [];
  //         this.contactList = res.contact_lens_rx && res.contact_lens_rx.length > 0 ? res.contact_lens_rx.slice(0, 10): [];
  //         this.otherList = res.other_rx && res.other_rx.length > 0 ? res.other_rx .slice(0, 10): [];
  //         this.getCustomerCategory();
  //         this.calculateAge()
  //         this.as.successToast(res.message)
  //       } else {
  //         this.as.errorToast(res.message)
  //       }
  //       this.sp.hide()
  //     },
  //     error: (err: any) => {
  //       console.log(err.message);
  //     },
  //     complete: () => subs.unsubscribe(),
  //   })
  // }

  getCustomerById() {
  this.sp.show();
  const subs: Subscription = this.cs.getCustomerById(this.id).subscribe({
    next: (res: any) => {
      if (res.success) {
        // Main Customer Info
        this.data = res.data[0];
        this.data.Idd = res.data[0].Idd;
        this.data.Age = Number(res.data[0].Age);
        this.rewardBalance = res.rewardBalance;
        this.data.VisitDate = moment(this.data.VisitDate).format('YYYY-MM-DD');

        this.customerImage = (res.data[0].PhotoURL && res.data[0].PhotoURL !== "null")
          ? this.env.apiUrl + res.data[0].PhotoURL
          : "/assets/images/userEmpty.png";

        // Rx Lists (top 10)
        this.spectacleLists = res.spectacle_rx?.length ? res.spectacle_rx.slice(0, 10) : [];
        this.contactList = res.contact_lens_rx?.length ? res.contact_lens_rx.slice(0, 10) : [];
        this.otherList = res.other_rx?.length ? res.other_rx.slice(0, 10) : [];

        // Specific Spectacle RX logic
        if (res.spectacle_rx?.length) {
          this.spectacle = res.spectacle_rx[0];
          this.spectacle.VisitDate = moment(this.spectacle.VisitDate).format('YYYY-MM-DD');
          const PLANOCheck = ['REDPSPH', 'REDPCYL', 'RENPSPH', 'RENPCYL', 'LEDPSPH', 'LEDPCYL', 'LENPSPH', 'LENPCYL'];
          PLANOCheck.forEach((prop) => {
            if (this.spectacle[prop] === '+0.00' || this.spectacle[prop] === "0") {
              this.spectacle[prop] = 'PLANO';
            }
          });
          this.spectacleImage = (this.spectacle.PhotoURL && this.spectacle.PhotoURL !== "null")
            ? this.env.apiUrl + this.spectacle.PhotoURL
            : "/assets/images/userEmpty.png";
        }

        // Contact Lens RX logic
        if (res.contact_lens_rx?.length) {
          this.clens = res.contact_lens_rx[0];
          this.clens.VisitDate = moment(this.clens.VisitDate).format('YYYY-MM-DD');
          const PLANOCheck1 = ['REDPSPH', 'REDPCYL', 'RENPSPH', 'RENPCYL', 'LEDPSPH', 'LEDPCYL', 'LENPSPH', 'LENPCYL'];
          PLANOCheck1.forEach((prop) => {
            if (this.clens[prop] === '+0.00' || this.clens[prop] === "0") {
              this.clens[prop] = 'PLANO';
            }
          });
          this.clensImage = (this.clens.PhotoURL && this.clens.PhotoURL !== "null")
            ? this.env.apiUrl + this.clens.PhotoURL
            : "/assets/images/userEmpty.png";
        }

        // Other RX logic
        if (res.other_rx?.length) {
          this.other = res.other_rx[0];
          this.other.VisitDate = moment(this.other.VisitDate).format('YYYY-MM-DD');
        }

        // Optometrist Button Check
        if ((this.company.ID === 241 || this.company.ID === 300) && this.shop.RoleName === 'optometrist') {
          this.optometristDisabled = false;
          const param = `and billmaster.BillType = 0 and billmaster.CustomerID = ${this.id}`;
          const subs2: Subscription = this.bill.saleServiceReport(param).subscribe({
            next: (saleRes: any) => {
              if (saleRes.success) {
                saleRes.data.forEach((d: any) => {
                  const todayDate = moment().format('YYYY-MM-DD');
                  const billDate = moment(d.BillDate).format('YYYY-MM-DD');
                  if (billDate === todayDate) {
                    this.optometristDisabledBTN = d.PaymentStatus !== 'Unpaid';
                  }
                });
                this.as.successToast(saleRes.message);
              } else {
                this.as.errorToast(saleRes.message);
              }
              this.sp.hide();
            },
            error: (err: any) => {
              console.log(err.message);
              this.sp.hide();
            },
            complete: () => subs2.unsubscribe(),
          });
        } else {
          this.sp.hide(); // No call to saleServiceReport
        }

        this.getCustomerCategory();
        // this.calculateAge();
        this.as.successToast(res.message);
      } else {
        this.as.errorToast(res.message);
        this.sp.hide();
      }
    },
    error: (err: any) => {
      console.log(err.message);
      this.sp.hide();
    },
    complete: () => subs.unsubscribe(),
  });
}


  // getCustomerById() {
  //   this.sp.show()
  //   const subs: Subscription = this.cs.getCustomerById(this.id).subscribe({
  //     next: (res: any) => {
  //       if (res.success) {

  //         this.data = res.data[0]
  //         this.data.Idd = res.data[0].Idd;
  //         this.rewardBalance = res.rewardBalance;
  //         this.getScoList()
  //         this.data.VisitDate = moment(res.data[0].VisitDate).format('YYYY-MM-DD');
  //         if (res.data[0].PhotoURL !== "null" && res.data[0].PhotoURL !== '') {
  //           this.customerImage = this.env.apiUrl + res.data[0].PhotoURL;
  //         } else {
  //           this.customerImage = "/assets/images/userEmpty.png"
  //         }

  //         if (res.spectacle_rx.length !== 0) {
  //           this.spectacle = res.spectacle_rx[0]
  //           this.spectacle.VisitDate = moment(this.spectacle.VisitDate).format('YYYY-MM-DD');

  //           const PLANOCheck = ['REDPSPH', 'REDPCYL', 'RENPSPH', 'RENPCYL', 'LEDPSPH', 'LEDPCYL', 'LENPSPH', 'LENPCYL'];
  //           for (const prop of PLANOCheck) {
  //             if (this.spectacle[prop] === '+0.00' || this.spectacle[prop] === "0") {
  //               this.spectacle[prop] = 'PLANO';
  //             }
  //           }

  //           if (res.spectacle_rx[0].PhotoURL !== "null" && res.spectacle_rx[0].PhotoURL !== '') {
  //             this.spectacleImage = this.env.apiUrl + res.spectacle_rx[0].PhotoURL;
  //           } else {
  //             this.spectacleImage = "/assets/images/userEmpty.png"
  //           }
  //         }

  //         if (res.contact_lens_rx.length !== 0) {
  //           this.clens = res.contact_lens_rx[0]
  //           this.clens.VisitDate = moment(this.clens.VisitDate).format('YYYY-MM-DD');
  //           const PLANOCheck1 = ['REDPSPH', 'REDPCYL', 'RENPSPH', 'RENPCYL', 'LEDPSPH', 'LEDPCYL', 'LENPSPH', 'LENPCYL']
  //           for (const prop1 of PLANOCheck1) {
  //             if (this.clens[prop1] === '+0.00' || this.spectacle[prop1] === "0") {
  //               this.clens[prop1] = 'PLANO';
  //             }
  //           }

  //           if (res.contact_lens_rx[0].PhotoURL !== "null" && res.contact_lens_rx[0].PhotoURL !== '') {
  //             this.clensImage = this.env.apiUrl + res.contact_lens_rx[0].PhotoURL;
  //           } else {
  //             this.clensImage = "/assets/images/userEmpty.png"
  //           }


  //         }

  //         if (res.other_rx.length !== 0) {
  //           this.other = res.other_rx[0]
  //           this.other.VisitDate = moment(this.other.VisitDate).format('YYYY-MM-DD');
  //         }

  //         this.as.successToast(res.message)

  //       } else {
  //         this.as.errorToast(res.message)
  //       }
  //       this.sp.hide()
  //     },
  //     error: (err: any) => {
  //       console.log(err.message);
  //     },
  //     complete: () => subs.unsubscribe(),
  //   })
  // }

  getCustomerCategory() {
    let CustomerID = Number(this.id)
    const subs: Subscription = this.cs.getCustomerCategory(CustomerID).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.data.Category = res.data.Category;
        } else {
          this.as.errorToast(res.message)
        }
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
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

  clearFrom() {

    this.data = {
      ID: '', CompanyID: '', Idd: 0, Title: '', Name: '', Sno: '', TotalCustomer: '', VisitDate: this.data.VisitDate, MobileNo1: '', MobileNo2: '', PhoneNo: '', Address: '', GSTNo: '', Email: '', PhotoURL: null, DOB: '', Age: 0, Anniversary: '', RefferedByDoc: '', ReferenceType: '', Gender: '', Category: '', Other: '', Remarks: '', Status: 1, CreatedBy: 0, UpdatedBy: 0, CreatedOn: '', UpdatedOn: '', tablename: '', spectacle_rx: [], contact_lens_rx: [], other_rx: [],
    };

    this.spectacle = {
      ID: '', CustomerID: '', REDPSPH: '', Reminder: '6', REDPCYL: '', REDPAxis: '', REDPVA: '', LEDPSPH: '', LEDPCYL: '', LEDPAxis: '',
      LEDPVA: '', RENPSPH: '', RENPCYL: '', RENPAxis: '', RENPVA: '', LENPSPH: '', LENPCYL: '', LENPAxis: '', LENPVA: '', REPD: '', LEPD: '',
      R_Addition: '', L_Addition: '', R_Prism: '', L_Prism: '', Lens: '', Shade: '', Frame: '', VertexDistance: '', RefractiveIndex: '', FittingHeight: '', ConstantUse: false, NearWork: false, RefferedByDoc: '', DistanceWork: false, UploadBy: 'Upload', PhotoURL: null, FileURL: null, Family: 'Self', ExpiryDate: '0000-00-00', Status: 1, CreatedBy: 0, CreatedOn: '', UpdatedBy: 0, UpdatedOn: '', VisitDate: this.spectacle.other,
    };

    this.clens = {
      ID: ' ', CustomerID: '', REDPSPH: '', REDPCYL: '', REDPAxis: '', REDPVA: '', LEDPSPH: '', LEDPCYL: '', LEDPAxis: '',
      LEDPVA: '', RENPSPH: '', RENPCYL: '', RENPAxis: '', RENPVA: '', LENPSPH: '', LENPCYL: '', LENPAxis: '', LENPVA: '', REPD: '', LEPD: '',
      R_Addition: '', L_Addition: '', R_KR: '', L_KR: '', R_HVID: '', L_HVID: '', R_CS: '', L_CS: '', R_BC: '', L_BC: '',
      R_Diameter: '', L_Diameter: '', BR: '', Material: '', Modality: '', RefferedByDoc: '', Other: '', ConstantUse: false,
      NearWork: false, DistanceWork: false, Multifocal: false, PhotoURL: null, FileURL: null, Family: 'Self', Status: 1, CreatedBy: 0,
      CreatedOn: '', UpdatedBy: 0, UpdatedOn: '', VisitDate: this.clens.VisitDate,
    };

    this.other = {
      ID: '', CustomerID: '', BP: '', Sugar: '', IOL_Power: '', RefferedByDoc: 'Self', Operation: '', R_VN: '', L_VN: '', R_TN: '', L_TN: '',
      R_KR: '', L_KR: '', Treatment: '', Diagnosis: '', Family: 'Self', FileURL: null, Status: 1, CreatedBy: 0, CreatedOn: '', UpdatedBy: 0, UpdatedOn: '', VisitDate: this.other.VisitDate,
    };

    this.sp.show();
    this.Check = { SpectacleCheck: true, ContactCheck: false, OtherCheck: false, };

    this.id = 0;

    this.router.navigateByUrl('', { skipLocationChange: true }).then(() => {
      this.router.navigate(['/sale/billing', 0, 0]);
    });

    this.spectacleLists = [];
    this.contactList = [];
    this.otherList = [];
    this.searchList = [];
    this.filteredOptions = []
    this.optometristDisabled = true
    this.optometristDisabledBTN = true
    this.sp.hide();
    this.ngOnInit();

  }

  NewVisit(mode: any) {
    if (mode === 'spectacle') {
      this.spectacle = {
        ID: 'null', CustomerID: this.id, REDPSPH: '', Reminder: '6', REDPCYL: '', REDPAxis: '', REDPVA: '', LEDPSPH: '', LEDPCYL: '', LEDPAxis: '', LEDPVA: '', RENPSPH: '', RENPCYL: '', RENPAxis: '', RENPVA: '', LENPSPH: '', LENPCYL: '', LENPAxis: '', LENPVA: '', REPD: '', LEPD: '', R_Addition: '', L_Addition: '', R_Prism: '', L_Prism: '', Lens: '', Shade: '', Frame: '', VertexDistance: '', RefractiveIndex: '', FittingHeight: '', ConstantUse: false, NearWork: false, RefferedByDoc: 'Self', DistanceWork: false, UploadBy: 'Upload', PhotoURL: null, FileURL: null, Family: 'Self', ExpiryDate: '0000-00-00', Status: 1, CreatedBy: 0, CreatedOn: '', UpdatedBy: 0, UpdatedOn: '', VisitDate: this.spectacle.VisitDate = moment().format('YYYY-MM-DD'),
      };
      this.spectacleImage = ''
    }

    if (mode === 'contact') {
      this.clens = {
        ID: 'null', CustomerID: this.id, REDPSPH: '', REDPCYL: '', REDPAxis: '', REDPVA: '', LEDPSPH: '', LEDPCYL: '', LEDPAxis: '',
        LEDPVA: '', RENPSPH: '', RENPCYL: '', RENPAxis: '', RENPVA: '', LENPSPH: '', LENPCYL: '', LENPAxis: '', LENPVA: '', REPD: '', LEPD: '', R_Addition: '', L_Addition: '', R_KR: '', L_KR: '', R_HVID: '', L_HVID: '', R_CS: '', L_CS: '', R_BC: '', L_BC: '',
        R_Diameter: '', L_Diameter: '', BR: '', Material: '', Modality: '', RefferedByDoc: 'Self', Other: '', ConstantUse: false,
        NearWork: false, DistanceWork: false, Multifocal: false, PhotoURL: null, FileURL: null, Family: 'Self', Status: 1, CreatedBy: 0, CreatedOn: '', UpdatedBy: 0, UpdatedOn: '', VisitDate: this.clens.VisitDate = moment().format('YYYY-MM-DD'),
      };
      this.clensImage = '';
    }

    if (mode === 'other') {
      this.other = {
        ID: 'null', CustomerID: this.id, BP: '', Sugar: '', IOL_Power: '', RefferedByDoc: 'Self', Operation: '', R_VN: '', L_VN: '', R_TN: '', L_TN: '', R_KR: '', L_KR: '', Treatment: '', Diagnosis: '', Family: 'Self', FileURL: null, Status: 1, CreatedBy: 0, CreatedOn: '', UpdatedBy: 0, UpdatedOn: '', VisitDate: this.other.VisitDate = moment().format('YYYY-MM-DD'),
      }
    };
  }

  deleteSpec(i: any, mode: any) {
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
        this.sp.show()
        if (mode === 'spectacle_rx') {
          const subs: Subscription = this.cs.deleteSpec(this.spectacleLists[i].ID, this.spectacleLists[i].CustomerID, 'spectacle_rx').subscribe({
            next: (res: any) => {
              if (res.success) {
                this.spectacleLists.splice(i, 1);
                this.getCustomerById()
                // if (this.spectacleLists.length === 0) {
                //   let spec: any = []
                //   this.spectacle = spec
                // }
              }
              this.as.successToast(res.message)
            },
            error: (err: any) => console.log(err.message),
            complete: () => subs.unsubscribe(),
          });

        } else if (mode === 'contact') {
          const subs: Subscription = this.cs.deleteSpec(this.contactList[i].ID, this.contactList[i].CustomerID, 'contact_lens_rx').subscribe({
            next: (res: any) => {
              this.contactList.splice(i, 1);
              if (this.contactList.length === 0) {
                let con: any = []
                this.clens = con
              } else {
                this.getCustomerById()
              }
              this.as.successToast(res.message)
            },
            error: (err: any) => console.log(err.message),
            complete: () => subs.unsubscribe(),
          });
        } else if (mode === 'other') {
          const subs: Subscription = this.cs.deleteSpec(this.otherList[i].ID, this.otherList[i].CustomerID, 'other_rx').subscribe({
            next: (res: any) => {
              this.otherList.splice(i, 1);
              if (this.otherList.length === 0) {
                let orx: any = []
                this.other = orx
              } else {
                this.getCustomerById()
              }
              this.as.successToast(res.message)
            },
            error: (err: any) => console.log(err.message),
            complete: () => subs.unsubscribe(),
          });
        }
        this.sp.hide()
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

  edits(data: any, mode: any) {
    if (mode === 'spectacle_rx') {
      this.spectacle = data;
      this.spectacleImage = this.env.apiUrl + data.PhotoURL;
    } if (mode === 'contact') {
      this.clens = data;
      this.clensImage = this.env.apiUrl + data.PhotoURL;
    } if (mode === 'other') {
      this.other = data;
    }
  }

  updateCustomer() {
    this.sp.show()
    if (this.Check.SpectacleCheck === true) {
      this.data.tablename = 'spectacle_rx';
      this.spectacle.ExpiryDate = moment().add(Number(this.spectacle.Reminder), 'M').format('YYYY-MM-DD');
      this.spectacle.VisitDate = moment(this.spectacle.VisitDate).format('YYYY-MM-DD');;
      this.data.spectacle_rx = this.spectacle

      const PLANOCheck = ['REDPSPH', 'REDPCYL', 'RENPSPH', 'RENPCYL', 'LEDPSPH', 'LEDPCYL', 'LENPSPH', 'LENPCYL']
      const DegreeCheck = ['REDPAxis', 'RENPAxis', 'LEDPAxis', 'LENPAxis']

      for (const prop of PLANOCheck) {
        if (this.data.spectacle_rx[prop] === 'PLANO') {
          this.data.spectacle_rx[prop] = '+0.00';
        }
      }
      for (const prop of DegreeCheck) {
        // Check if the value is not empty and does not already contain the degree symbol
        if (this.data.spectacle_rx[prop] !== '' && !this.data.spectacle_rx[prop].includes('°')) {
          this.data.spectacle_rx[prop] = this.data.spectacle_rx[prop] + '°';
        }

        if (this.data.spectacle_rx[prop] == '°') {
          this.data.spectacle_rx[prop] = '';
        }
      }
    }
    if (this.Check.ContactCheck === true) {
      this.data.tablename = 'contact_lens_rx'
      this.clens.VisitDate = this.clens.VisitDate;
      this.data.contact_lens_rx = this.clens

      const PLANOCheck = ['REDPSPH', 'REDPCYL', 'RENPSPH', 'RENPCYL', 'LEDPSPH', 'LEDPCYL', 'LENPSPH', 'LENPCYL']
      const DegreeCheck = ['REDPAxis', 'RENPAxis', 'LEDPAxis', 'LENPAxis']

      for (const prop of PLANOCheck) {
        if (this.data.contact_lens_rx[prop] === 'PLANO') {
          this.data.contact_lens_rx[prop] = '+0.00';
        }
      }
      for (const prop of DegreeCheck) {
        // Check if the value is not empty and does not already contain the degree symbol
        if (this.data.contact_lens_rx[prop] !== '' && !this.data.contact_lens_rx[prop].includes('°')) {
          this.data.contact_lens_rx[prop] = this.data.contact_lens_rx[prop] + '°';
        }

        if (this.data.contact_lens_rx[prop] == '°') {
          this.data.contact_lens_rx[prop] = '';
        }
      }
    }
    if (this.Check.OtherCheck === true) {
      this.data.tablename = 'other_rx'
      this.other.VisitDate = this.other.VisitDate;
      this.data.other_rx = this.other
    }
    const subs: Subscription = this.cs.updateCustomer(this.data).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.getCustomerById()
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
        this.sp.hide()
      },
      error: (err: any) => {
        console.log(err.msg);
      },
      complete: () => subs.unsubscribe(),
    });
  }

  copyPower(mode: any) {
    this.calculation.copyPower(mode, this.spectacle, this.clens)
  }

  calculate(mode: any, x: any, y: any) {
    this.calculation.calculate(mode, x, y, this.spectacle, this.clens)
  }

  calculateContact(mode: any, x: any) {
  const vertexDistance = 0.012;

  if (mode === 'RD') {
  const specPower = Number(this.spectacle.REDPSPH);
  const cr = specPower / (1 - (vertexDistance * specPower));

    const numericPowers = this.dataSPH
    .map((item: any) => item.Name === 'PLANO' ? 0 : Number(item.Name))
    .filter((val: number) => !isNaN(val))
    .filter((val: number) => {
      // Filter values between -25.00 and +25.00 D
      return val >= -25 && val <= 25;
    })
    .filter((val: number) => {
      if (val >= -6.00 && val <= 6.00) {
        // ±6.00 D and in between → 0.25 D step
        return (val * 100) % 25 === 0;
      } else {
        // Beyond ±6.00 D → 0.50 D step
        return (val * 100) % 50 === 0;
      }
    })
    .sort((a, b) => a - b);

  const closestPower = numericPowers.reduce((prev: number, curr: number) =>
      Math.abs(curr - cr) < Math.abs(prev - cr) ? curr : prev
    );
    
    this.clens.REDPSPH = (closestPower >= 0 ? '+' : '') + closestPower.toFixed(2);
  }

  if (mode === 'RDC') {
    const sph = Number(this.spectacle.REDPSPH);
    const cyl = Number(this.spectacle.REDPCYL);

    // Spectacle meridians
    const flatMeridian = sph;
    const steepMeridian = sph + cyl;

    // Apply vertex correction to both meridians
    const flatCL = flatMeridian / (1 - (vertexDistance * flatMeridian));
    const steepCL = steepMeridian / (1 - (vertexDistance * steepMeridian));

    // Calculate CL cylinder
    const cylCL = steepCL - flatCL;

    // Now find closest available contact lens CYL from dataCYL1
    const numericPowers = this.dataCYL1
      .filter((item: any) => item.Name !== 'PLANO')
      .map((item: any) => Number(item.Name))
      .filter((val: number) => !isNaN(val))
      .sort((a: any, b: any) => a - b);

    const closestPower = numericPowers.reduce((prev: number, curr: number) =>
      Math.abs(curr - cylCL) < Math.abs(prev - cylCL) ? curr : prev
    );

    this.clens.REDPCYL = (closestPower >= 0 ? '+' : '') + closestPower.toFixed(2);
  }

   if (mode === 'LD') { 

  const specPower = Number(this.spectacle.LEDPSPH);
  const cr = specPower / (1 - (vertexDistance * specPower));

 const numericPowers = this.dataSPH
    .map((item: any) => item.Name === 'PLANO' ? 0 : Number(item.Name))
    .filter((val: number) => !isNaN(val))
    .filter((val: number) => {
      // Filter values between -25.00 and +25.00 D
      return val >= -25 && val <= 25;
    })
    .filter((val: number) => {
      if (val >= -6.00 && val <= 6.00) {
        // ±6.00 D and in between → 0.25 D step
        return (val * 100) % 25 === 0;
      } else {
        // Beyond ±6.00 D → 0.50 D step
        return (val * 100) % 50 === 0;
      }
    })
    .sort((a, b) => a - b);



   const closestPower = numericPowers.reduce((prev: number, curr: number) =>
      Math.abs(curr - cr) < Math.abs(prev - cr) ? curr : prev
    );
   this.clens.LEDPSPH = (closestPower >= 0 ? '+' : '') + closestPower.toFixed(2);
  }


   if (mode === 'LDC') {
    const sph = Number(this.spectacle.LEDPSPH);
    const cyl = Number(this.spectacle.LEDPCYL);

    // Spectacle meridians
    const flatMeridian = sph;
    const steepMeridian = sph + cyl;

    // Apply vertex correction to both meridians
    const flatCL = flatMeridian / (1 - (vertexDistance * flatMeridian));
    const steepCL = steepMeridian / (1 - (vertexDistance * steepMeridian));

    // Calculate CL cylinder
    const cylCL = steepCL - flatCL;

    // Now find closest available contact lens CYL from dataCYL1
    const numericPowers = this.dataCYL1
      .filter((item: any) => item.Name !== 'PLANO')
      .map((item: any) => Number(item.Name))
      .filter((val: number) => !isNaN(val))
      .sort((a: any, b: any) => a - b);

    const closestPower = numericPowers.reduce((prev: number, curr: number) =>
      Math.abs(curr - cylCL) < Math.abs(prev - cylCL) ? curr : prev
    );

     this.clens.LEDPCYL = (closestPower >= 0 ? '+' : '') + closestPower.toFixed(2);
  }
  
}


  // Billing

  // customer search 

  CustomerSelection(mode: any, ID: any) {
    if (mode === 'Value') {
      this.getCustomerSearchId(ID)
    }
    this.getCustomerCategory()
  }

  // customerSearch(searchKey: any, mode: any) {

  //   this.filteredOptions = [];
  //   this.param = { Name: '', MobileNo1: '', Address: '', Sno: '' };

  //   if (searchKey.length >= 3) {
  //     if (mode === 'Name') {
  //       this.filteredOptions = [];
  //       this.param.Name = searchKey.trim();
  //     }else if (mode === 'MobileNo1') {
  //       this.filteredOptions = [];
  //       this.param.MobileNo1 = searchKey;
  //     }else if (mode === 'Address') {
  //       this.filteredOptions = [];
  //       this.param.Address = searchKey;
  //     }else if (mode === 'Sno') {
  //       this.param.Sno = searchKey;
  //     } 
  //     const subs: Subscription = this.cs.customerSearch(this.param).subscribe({
  //       next: (res: any) => {
  //         if (res) {
  //           this.filteredOptions = res.data;
  //         } else {
  //           this.as.errorToast(res.message)
  //         }
  //       },
  //       error: (err: any) => console.log(err.message),
  //       complete: () => subs.unsubscribe(),
  //     });
  //   }
  // }
  customerSearch(searchKey: any, mode: any) {
    this.searchKeySubject.next({ searchKey, mode });
  }
  performSearch(searchKey: any, mode: any) {
    this.filteredOptions = [];
    this.param = { Name: '', MobileNo1: '', Address: '', Sno: '' };

    if (searchKey.length >= 3) {
      if (mode === 'Name') {
        this.filteredOptions = [];
        this.param.Name = searchKey.trim();
      } else if (mode === 'MobileNo1') {
        this.filteredOptions = [];
        this.param.MobileNo1 = searchKey;
      } else if (mode === 'Address') {
        this.filteredOptions = [];
        this.param.Address = searchKey;
      } else if (mode === 'Sno') {
        this.param.Sno = searchKey;
      }
      const subs: Subscription = this.cs.customerSearch(this.param).subscribe({
        next: (res: any) => {
          if (res) {
            this.filteredOptions = res.data;

          } else {
            this.as.errorToast(res.message);
          }
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    }
  }
  getCustomerSearchId(ID: any) {
    this.sp.show()
    this.filteredOptions = []
    this.id = ID;
    this.router.navigate(['/sale/billing', ID, 0]);
    if (this.company.ID == 241 || this.company.ID == 300) {
      if (this.shop.RoleName == 'optometrist') {
        this.optometristDisabled = false
      }
      let Parem = 'and billmaster.BillType = 0' + ' and billmaster.CustomerID = ' + `${this.id}`
      const subs: Subscription = this.bill.saleServiceReport(Parem).subscribe({
        next: (res: any) => {
          if (res.success) {
            res.data.forEach((d: any) => {
              const todayDate = moment(new Date()).format('YYYY-MM-DD');
              const BillDate = moment(d.BillDate).format('YYYY-MM-DD');
              if (BillDate === todayDate) {
                if (d.PaymentStatus === 'Unpaid') {
                  this.optometristDisabledBTN = false;
                } else {
                  this.optometristDisabledBTN = true;
                }
              }
            })
            this.as.successToast(res.message)
          } else {
            this.as.errorToast(res.message)
          }
          this.sp.hide()
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      })
    }
    this.ngOnInit();
    if (this.id !== 0) {
      this.sp.show()
      const subs: Subscription = this.cs.getCustomerById(this.id).subscribe({
        next: (res: any) => {
          if (res.success) {

            this.data = res.data[0]
            this.data.Idd = res.data[0].Idd
            this.getCustomerCategory()
            if (res.data[0].PhotoURL !== "null" && res.data[0].PhotoURL !== '') {
              this.customerImage = this.env.apiUrl + res.data[0].PhotoURL;
            } else {
              this.customerImage = "/assets/images/userEmpty.png"
            }

            if (res.spectacle_rx.length !== 0) {
              this.spectacle = res.spectacle_rx[0]
              if (res.spectacle_rx[0].PhotoURL !== "null" && res.spectacle_rx[0].PhotoURL !== '') {
                this.spectacleImage = this.env.apiUrl + res.spectacle_rx[0].PhotoURL;
              } else {
                this.spectacleImage = "/assets/images/userEmpty.png"
              }
            }

            if (res.contact_lens_rx.length !== 0) {
              this.clens = res.contact_lens_rx[0]
              if (res.contact_lens_rx[0].PhotoURL !== "null" && res.contact_lens_rx[0].PhotoURL !== '') {
                this.clensImage = this.env.apiUrl + res.contact_lens_rx[0].PhotoURL;
              } else {
                this.clensImage = "/assets/images/userEmpty.png"
              }
            }

            if (res.other_rx.length !== 0) {
              this.other = res.other_rx[0]
            }



            this.as.successToast(res.message)
          } else {
            this.as.errorToast(res.message)
          }
          this.sp.hide()
        },
        error: (err: any) => {
          console.log(err.message);
        },
        complete: () => subs.unsubscribe(),
      })
    }
  }
  // customer search 

  dateFormat(date: any): string {
    if (date == null || date == "") {
      return '0000-00-00'; // Default Value
    }
    return moment(date).format(this.companySetting?.DateFormat || 'YYYY-MM-DD');
  }

  onChange(event: { toUpperCase: () => any; toTitleCase: () => any; }) {
    if (this.companySetting.DataFormat === '1') {
      event = event.toUpperCase()
    } else if (this.companySetting.DataFormat == '2') {
      event = event.toTitleCase()
    }
    return event;
  }

  customerPowerPDF(i: any, mode: any) {

    if (mode === 'spectacle') {

      let body = { customer: this.data, spectacle: this.spectacleLists[i], contact: this.contactList[i], other: this.other[i], mode }
      this.sp.show();
      const subs: Subscription = this.cs.customerPowerPDF(body).subscribe({
        next: (res: any) => {
          if (res) {
            this.spectacle.FileURL = this.env.apiUrl + "/uploads/" + res;
            const url = this.spectacle.FileURL
         
            window.open(url, "_blank");
          } else {
            this.as.errorToast(res.message)
          }
          this.sp.hide();
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    }
    if (mode === 'contact') {
      let body = { customer: this.data, spectacle: this.spectacle, contact: this.clens, other: this.other, mode }
      this.sp.show();
      const subs: Subscription = this.cs.customerPowerPDF(body).subscribe({
        next: (res: any) => {
          if (res) {
            this.clens.FileURL = this.env.apiUrl + "/uploads/" + res;
            const url = this.clens.FileURL;
            window.open(url, "_blank");
          } else {
            this.as.errorToast(res.message)
          }
          this.sp.hide();
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    }
    if (mode === 'other') {
      let body = { customer: this.data, spectacle: this.spectacle, contact: this.clens, other: this.other, mode }
      this.sp.show();
      const subs: Subscription = this.cs.customerPowerPDF(body).subscribe({
        next: (res: any) => {
          if (res) {
            this.other.FileURL = this.env.apiUrl + "/uploads/" + res;
            const url = this.other.FileURL;
            window.open(url, "_blank");
          } else {
            this.as.errorToast(res.message)
          }
          this.sp.hide();
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    }
  }



  sendWhatsappPower(i: any, mode: any) {
    let temp = JSON.parse(this.companySetting.WhatsappSetting);
    let WhatsappMsg = '';
    var msg
    if (mode === 'spectacle') {
        if(this.company.ID == 84){
            let body = { customer: this.data, spectacle: this.spectacleLists[i], contact: this.contactList[i], other: this.other[i], mode }
             const subs: Subscription = this.cs.customerPowerPDF(body).subscribe({
               next: (res: any) => {
                 if (res) {
                   this.spectacle.FileURL = this.env.apiUrl + "/uploads/" + res;
                   this.sendWhatsappMessageInBackground('spectacle')
                 } else {
                   this.as.errorToast(res.message)
                 }
                 this.sp.hide();
               },
               error: (err: any) => console.log(err.message),
               complete: () => subs.unsubscribe(),
          });   
        }else{
           WhatsappMsg = this.getWhatsAppMessage(temp, 'Customer_Eye Prescription');
            msg = `*Hi ${this.data.Title} ${this.data.Name},*%0A` +
           `${WhatsappMsg}%0A` +
            `*Open Prescription* : ${this.spectacle.FileURL}%0A` + `Reply *‘Hi’* to  download the Prescription%0A%0A` +
           `*${this.shop.Name}* - ${this.shop.AreaName}%0A${this.shop.MobileNo1}%0A${this.shop.Website}%0A` + `*Please give your valuable Review for us !*`;
        }
    } else if (mode === 'other') {
       if(this.company.ID == 84){
              let body = { customer: this.data, spectacle: this.spectacle, contact: this.clens, other: this.other, mode }
             const subs: Subscription = this.cs.customerPowerPDF(body).subscribe({
               next: (res: any) => {
                 if (res) {
                    this.other.FileURL = this.env.apiUrl + "/uploads/" + res;
                   this.sendWhatsappMessageInBackground('other')
                 } else {
                   this.as.errorToast(res.message)
                 }
                 this.sp.hide();
               },
               error: (err: any) => console.log(err.message),
               complete: () => subs.unsubscribe(),
          });   
        }else{
      WhatsappMsg = this.getWhatsAppMessage(temp, 'Customer_Eye Prescription');
       msg = `*Hi ${this.data.Title} ${this.data.Name},*%0A` +
        `${WhatsappMsg}%0A` +
        `*Open Prescription*  : ${this.other.FileURL}%0A` + `Reply *‘Hi’* to  download the Prescription%0A%0A` +
        `*${this.shop.Name}* - ${this.shop.AreaName}%0A${this.shop.MobileNo1}%0A${this.shop.Website}%0A` + `*Please give your valuable Review for us !*`
        }
    } else {
       if(this.company.ID == 84){
             let body = { customer: this.data, spectacle: this.spectacle, contact: this.clens, other: this.other, mode }
             const subs: Subscription = this.cs.customerPowerPDF(body).subscribe({
               next: (res: any) => {
                 if (res) {
                   this.clens.FileURL = this.env.apiUrl + "/uploads/" + res;
                   this.sendWhatsappMessageInBackground('clens')
                 } else {
                   this.as.errorToast(res.message)
                 }
                 this.sp.hide();
               },
               error: (err: any) => console.log(err.message),
               complete: () => subs.unsubscribe(),
          });   
        }else{

        
      WhatsappMsg = this.getWhatsAppMessage(temp, 'Customer_Eye Prescription');
       msg = `*Hi ${this.data.Title} ${this.data.Name},*%0A` +
        `${WhatsappMsg}%0A` +
        `*Open Prescription*  : ${this.clens.FileURL}%0A` + `Reply *‘Hi’* to  download the Prescription%0A%0A` +
        `*${this.shop.Name}* - ${this.shop.AreaName}%0A${this.shop.MobileNo1}%0A${this.shop.Website}%0A` + `*Please give your valuable Review for us !*`
          }
      }

 if(this.company.ID != 84){

 
    if (this.data.MobileNo1 != '' && Number(this.data.MobileNo1) == this.data.MobileNo1 ) {
      var mob = this.company.Code + this.data.MobileNo1;
      var url = `https://wa.me/${mob.trim()}?text=${msg}`;
      window.open(url, "_blank");
    } else {
      Swal.fire({
        position: 'center',
        icon: 'warning',
        title: '<b>' + this.data.Name + '</b>' + ' Mobile number is not available.',
        showConfirmButton: true,
      })
    }
    }
  }

  getEmailMessage(temp: any, messageName: any) {
    if (temp && temp !== 'null') {
      const foundElement = temp.find((element: { MessageName2: any; }) => element.MessageName2 === messageName);
      return foundElement ? foundElement.MessageText2 : '';
    }
    return '';
  }


  sendEmail(i: any, mode: any) {
    if (!this.data.Email) {
      Swal.fire({
        position: 'center',
        icon: 'warning',
        title: `Email does't exist`,
        showConfirmButton: true,
      });
      return;
    }

      if (this.shop.IsEmailConfiguration === "false" || this.shop.IsEmailConfiguration === false) {
      Swal.fire({
        position: 'center',
        icon: 'warning',
        title: "Mail Not Configured!",
        showConfirmButton: true,
      });
      return;
    }
    // ✅ Show success message immediately
    Swal.fire({
      position: 'center',
      icon: 'success',
      title: 'Mail Sent Successfully...',
      showConfirmButton: false,
      timer: 1000
    });

    // 🔁 Send print and email in background without blocking UI
    setTimeout(() => {
      this._sendEmailInBackground(i, mode);
    }, 200);
  }

  private _sendEmailInBackground(i: any, mode: any) {
    const temp = JSON.parse(this.companySetting.EmailSetting);

    if (mode === 'spectacle') {
      let body = { customer: this.data, spectacle: this.spectacleLists[i], contact: this.contactList[i], other: this.other[i], mode }

      this.cs.customerPowerPDF(body).pipe(
        switchMap((res: any) => {
          if (!res) return EMPTY;

          this.spectacle.FileURL = this.env.apiUrl + "/uploads/" + res;

          const emailMsg = this.getEmailMessage(temp, 'Customer_Eye Prescription');

          const dtm = {
            mainEmail: this.data.Email,
            mailSubject: `Eye Prescription - ${this.data.Idd} - ${this.data.Name}`,
            mailTemplate: ` ${emailMsg} <br>
                        <div style="padding-top: 10px;">
                          <b> ${this.shop.Name} (${this.shop.AreaName}) </b> <br>
                          <b> ${this.shop.MobileNo1} </b><br>
                              ${this.shop.Website} <br>
                              Please give your valuable Review for us !
                        </div>`,
            attachment: [
              {
                filename: `spectacle_Prescription.pdf`,
                path: this.spectacle.FileURL, // Absolute or relative path
                contentType: 'application/pdf'
              }
            ],
            ShopID: this.data.ShopID,
            CompanyID: this.data.CompanyID,
          }
          return this.bill.sendMail(dtm);
        })
      ).subscribe({
        next: (res: any) => {
          // Optionally log or handle result
          console.log("spectacle Mail sent background:", res);
        },
        error: (err) => {
          console.error("spectacle Mail send error:", err.message);
        }
      });
    } else if (mode == 'other') {
      let body = { customer: this.data, spectacle: this.spectacle, contact: this.clens, other: this.other, mode }

      this.cs.customerPowerPDF(body).pipe(
        switchMap((res: any) => {
          if (!res) return EMPTY;

          this.other.FileURL = this.env.apiUrl + "/uploads/" + res;

          const emailMsg = this.getEmailMessage(temp, 'Customer_Eye Prescription');

          const dtm = {
            mainEmail: this.data.Email,
            mailSubject: `Eye Prescription - ${this.data.Idd} - ${this.data.Name}`,
            mailTemplate: ` ${emailMsg} <br>
                       <div style="padding-top: 10px;">
                         <b> ${this.shop.Name} (${this.shop.AreaName}) </b> <br>
                         <b> ${this.shop.MobileNo1} </b><br>
                             ${this.shop.Website} <br>
                             Please give your valuable Review for us !
                       </div>`,
            attachment: [
              {
                filename: `other_Prescription.pdf`,
                path: this.other.FileURL,
                contentType: 'application/pdf'
              }
            ],
            ShopID: this.data.ShopID,
            CompanyID: this.data.CompanyID,
          }
          return this.bill.sendMail(dtm);
        })
      ).subscribe({
        next: (res: any) => {
          // Optionally log or handle result
          console.log("Other Mail sent background:", res);
        },
        error: (err) => {
          console.error("Other Mail send error:", err.message);
        }
      });
    } else if (mode == 'clens') {
      let body = { customer: this.data, spectacle: this.spectacle, contact: this.clens, other: this.other, mode }

      this.cs.customerPowerPDF(body).pipe(
        switchMap((res: any) => {
          if (!res) return EMPTY;

          this.clens.FileURL = this.env.apiUrl + "/uploads/" + res;

          const emailMsg = this.getEmailMessage(temp, 'Customer_Eye Prescription');

          const dtm = {
            mainEmail: this.data.Email,
            mailSubject: `Eye Prescription - ${this.data.Idd} - ${this.data.Name}`,
            mailTemplate: ` ${emailMsg} <br>
                       <div style="padding-top: 10px;">
                         <b> ${this.shop.Name} (${this.shop.AreaName}) </b> <br>
                         <b> ${this.shop.MobileNo1} </b><br>
                             ${this.shop.Website} <br>
                             Please give your valuable Review for us !
                       </div>`,
            attachment: [
              {
                filename: `contact_lens_Prescription.pdf`,
                path: this.clens.FileURL,
                contentType: 'application/pdf'
              }
            ],
            ShopID: this.data.ShopID,
            CompanyID: this.data.CompanyID,
          }
          return this.bill.sendMail(dtm);
        })
      ).subscribe({
        next: (res: any) => {
          // Optionally log or handle result
          console.log("Contact Lens Mail sent background:", res);
        },
        error: (err) => {
          console.error("Contact Lens Mail send error:", err.message);
        }
      });
    }

  }



  getWhatsAppMessage(temp: any, messageName: any) {
    if (temp && temp !== 'null') {
      const foundElement = temp.find((element: { MessageName1: any; }) => element.MessageName1 === messageName);
      return foundElement ? foundElement.MessageText1 : '';
    }
    return '';
  }

  otherOpne(content: any, i: any, mode: any) {
    this.otherselect = { customer: this.data, spectacle: this.spectacleLists[i], contact: this.contactList[i], other: this.otherList[i], mode, otherSpec: this.otherSpec, otherContant: this.otherContant, otherNoPower: this.otherNoPower }
    this.modalService.open(content, { centered: true, backdrop: 'static', keyboard: false, size: 'sm' });

  }

  selectOtherOption(mode: any) {
    let body = ''

    if (mode === 'sepc') {
      body = this.otherselect
      this.otherSpec = true
      this.otherselect.otherSpec = true
      delete this.otherselect.contact
    }
    if (mode === 'con') {
      body = this.otherselect
      this.otherContant = true
      this.otherselect.otherContant = true
      delete this.otherselect.spectacle
    }
    if (mode === 'nop') {
      body = this.otherselect
      this.otherNoPower = true
      this.otherselect.otherNoPower = true
      delete this.otherselect.contact
      delete this.otherselect.spectacle
    }
    this.sp.show();
    const subs: Subscription = this.cs.customerPowerPDF(body).subscribe({
      next: (res: any) => {
        if (res) {
          this.otherSpec = false
          this.otherContant = false
          this.otherNoPower = false
          this.modalService.dismissAll()
          this.other.FileURL = this.env.apiUrl + "/uploads/" + res;
          const url = this.other.FileURL
          window.open(url, "_blank");
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }



  // shareOnWhatsApp() {
  //   const savedImage = localStorage.getItem('savedImage');
  //   if (savedImage) {
  //     const whatsappUrl = `https://wa.me/?text=Check this membership card &image=${savedImage}`;
  //     window.open(whatsappUrl, '_blank');
  //   } else {
  //     alert('Image not found!');
  //   }
  // }




  shareOnWhatsApp() {

    let body = {
      customer: this.data,
      expiry: this.membarshipList[0]
    }
    this.sp.show();
    const subs: Subscription = this.cs.membershipCard(body).subscribe({
      next: (res: any) => {
        if (res) {
          var url = this.env.apiUrl + "/uploads/" + res;
          this.membarship = url

          if ((this.data.MobileNo1 != '' && Number(this.data.MobileNo1) == this.data.MobileNo1) && this.data.CompanyID != 84) {
            var mob = this.company.Code + this.data.MobileNo1;
            let msg = `This Is Your MemberShip Card.%0A` + `Click On : ${this.membarship}%0A`
            var url1 = `https://wa.me/${mob.trim()}?text=${msg}`;
            window.open(url1, "_blank");
          } else if (this.data.CompanyID == 84) {
            this.sendWhatsappMessageInBackground('MemberShip')
          }
          else {
            Swal.fire({
              position: 'center',
              icon: 'warning',
              title: '<b>' + this.data.Name + '</b>' + ' Mobile number is not available.',
              showConfirmButton: true,
            })
          }
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  membarshipSave() {
    if (this.id != 0) {
      this.sp.show();
      this.memberCard.CustomerID = this.id
      const subs: Subscription = this.msc.saveMemberCard(this.memberCard).subscribe({
        next: (res: any) => {
          if (res) {
            this.memberCard = { CustomerID: '', CompanyID: '', ShopID: '', IssueDate: '', ExpiryDate: '', Status: '', CreatedBy: '', CreatedOn: '' }
            let IDs = res.data[0].CustomerID
            this.ExpiryDateFormember = res.data[0].ExpiryDate
            this.getMembershipcardByCustomerID(IDs)
   

          } else {
            this.as.errorToast(res.message)
          }
          this.sp.hide();
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    } else {
      Swal.fire({
        position: 'center',
        icon: 'warning',
        title: `You can't create a membership card without saving the customer`,
        showConfirmButton: true,
      })
    }
  }

  sendWhatsappMessageInBackground(mode: any) {
  let imageUrl = '';
  let type = '';
  let fileName = '';

  switch (mode) {
    case 'MemberShip':
      imageUrl = this.membarship;
      type = 'opticalguru_prime_member_ship_card_pdf';
      fileName = 'MemberShip Card';
      break;
    case 'spectacle':
      imageUrl = this.spectacle?.FileURL || '';
      type = 'opticalguru_customer_eye_prescription';
      fileName = 'Spectacle Eye Prescription';
      break;
    case 'other':
      imageUrl = this.other?.FileURL || '';
      type = 'opticalguru_customer_eye_prescription';
      fileName = 'Eye Prescription';
      break;
    case 'clens':
      imageUrl = this.clens?.FileURL || '';
      type = 'opticalguru_customer_eye_prescription';
      fileName = 'Contact Eye Prescription';
      break;
    default:
      console.warn('Invalid WhatsApp message mode:', mode);
      return;
  }

    // Validate mobile number
    const mobile = this.data?.MobileNo1?.toString().trim();
    if (!/^\d{10}$/.test(mobile)) {
      this.as.errorToast('Please enter a valid 10-digit mobile number');
      return;
    }

  const dtm = {
    CustomerName: this.data.Name,
    MobileNo1: this.data.MobileNo1,
    ShopID: this.shop.ID, 
    ShopName: `${this.shop.Name} (${this.shop.AreaName})`,
    ShopMobileNumber: this.shop.MobileNo1,
    ImageUrl: imageUrl,
    Type: type,
    FileName: fileName
  };

  const subs: Subscription = this.rs.sendWpMessage(dtm).subscribe({
    next: (res: any) => {
      if (res.success) {
        this.as.successToast(res.message)
      }else{
        this.as.errorToast(res.message);
      }
      this.sp.hide();
    },
    error: (err: any) => {
      console.error('WhatsApp send error:', err.message);
      this.sp.hide();
    },
    complete: () => subs.unsubscribe()
  });
}


  getMembershipcardByCustomerID(ID: any) {
    this.sp.show();
    const subs: Subscription = this.msc.getMembershipcardByCustomerID(ID).subscribe({
      next: (res: any) => {
        if (res) {
          this.membarshipList = res.data
          if (res.data.length != 0) {
            this.ExpiryDateFormember = res.data[0].ExpiryDate
            const today = moment().format("YYYY-MM-DD");
            const expiryDate = moment(this.ExpiryDateFormember).format("YYYY-MM-DD");
            if (expiryDate === today) {
              this.ActiveDeactive = false;
            } else {
              this.ActiveDeactive = true;
            }
          } else {
            this.ExpiryDateFormember = ''
          }

        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  MembershipcardBydelete(ID: any) {
    this.sp.show();
    const subs: Subscription = this.msc.MembershipcardBydelete(ID).subscribe({
      next: (res: any) => {
        if (res) {
          this.getMembershipcardByCustomerID(this.id)
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  // async sendWhatsappMessageInBackground() {
  //   const number = this.company.Code + this.data.MobileNo1;
  //   const type = 'media';
  //   const media_url = this.membarship;
  //   // const media_url = 'https://theopticalguru.relinksys.com/uploads/Bill-829927-1.pdf';
  //   const filename = 'Membership.pdf';
  //   const instance_id = '685EB1392F626';
  //   const access_token = '685eb0f6d4a9e';
  //   // const messageText = `This Is Your Member Ship Card.\nClick On `;
  //   // const message = encodeURIComponent(messageText);

  //    const messageText = `Hi ${this.data.Title} ${this.data.Name},\n` +
  //     `This Is Your MemberShip Card.\n\n` +
  //     `${this.shop.Name} - ${this.shop.AreaName}\n` +
  //     `${this.shop.MobileNo1}\n` +
  //     `${this.shop.Website}\n` +
  //     `Please give your valuable Review for us !`
  //   const message = encodeURIComponent(messageText);

  //   var url21 = `https://web2.connectitapp.in/api/send?number=${number.trim()}&type=${type}&media_url=${media_url}&filename=${filename}&message=${message}&instance_id=${instance_id}&access_token=${access_token}`;
  //   console.log(url21, 'WhatsApp API URL for background send');

  //   try {
  //     // Use the fetch API to make a GET request to the URL
  //     const response = await fetch(url21);
  //     // Check if the request was successful (status code 200-299)
  //     if (response.ok) {
  //       const data = await response.json(); // Assuming the API returns JSON
  //       console.log('WhatsApp message sent successfully:', data);
  //       Swal.fire({
  //         position: 'center',
  //         icon: 'success',
  //         title: 'WhatsApp message sent successfully',
  //         showConfirmButton: true,
  //         backdrop: false,
  //       })
  //       // You can add further logic here, e.g., show a success message to the user
  //     } else {
  //       // Handle HTTP errors (e.g., 404, 500)
  //       console.error('Failed to send WhatsApp message. Status:', response.status);
  //       Swal.fire({
  //         position: 'center',
  //         icon: 'warning',
  //         title: 'Failed to send WhatsApp message',
  //         showConfirmButton: true,
  //         backdrop: false,
  //       })
  //       const errorText = await response.text(); // Get raw error message
  //       console.error('Error response:', errorText);
  //       // You can show an error message to the user
  //     }
  //   } catch (error) {

  //   }
  // }

 

    openModalN(contentN:any){
    this.modalService.open(contentN, { centered: true, backdrop: 'static', keyboard: false, size: 'lg' });
  }

   saveCustomerCredit() {
    this.sp.show();
    this.note.CustomerID = this.id
    this.note.ShopID = this.shop.ID
    const subs: Subscription = this.cs.saveCustomerCredit(this.note).subscribe({
      next: (res: any) => {
        if (res) {
         this.as.successToast(res.message)
          this.modalService.dismissAll();
          this.note = []
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  openModalP(contentP:any){
     this.modalService.open(contentP, { centered: true, backdrop: 'static', keyboard: false, size: 'xl' });
  }

setSign(type: 'SPH' | 'CYL' | 'SPHN', sign: '+' | '-', eye: 'RE' | 'LE') {
  this.signs[eye][type] = sign;
}


formatValue(type: 'SPH' | 'CYL' | 'SPHN' , value: number, eye: 'RE' | 'LE'): string {
  return `${this.signs[eye][type]}${value.toFixed(2)}`;
}

selectValue(type: 'SPH' | 'CYL' | 'SPHN', value: number, eye: 'RE' | 'LE') {
  this.selectedValues[type][eye] = value;
  const signedVal = `${this.signs[eye][type]}${value.toFixed(2)}`;
  if (eye === 'RE') {
    if (type === 'SPH') {
      this.spectacle.REDPSPH = signedVal;
    } else if (type === 'SPHN'){
      this.spectacle.RENPSPH = signedVal;
    }else {
      this.spectacle.REDPCYL = signedVal;
      this.spectacle.RENPCYL = signedVal;
    }
  } else {
    if (type === 'SPH') {
      this.spectacle.LEDPSPH = signedVal;
    }
    else if (type === 'SPHN'){
      this.spectacle.LENPSPH = signedVal;
    }
    else {
      this.spectacle.LEDPCYL = signedVal;
      this.spectacle.LENPCYL = signedVal;
    }
  }
}

selectValue1(value: number, eye: 'RE' | 'LE') {
      this.selectedValues['ASIX'][eye] = value;
  if (eye === 'RE') {
    this.spectacle.REDPAxis = value;
    this.spectacle.RENPAxis = value;
  } else {
    this.spectacle.LEDPAxis = value;
    this.spectacle.LENPAxis = value;
  }
}
selectValue2(value: any, eye: 'RE' | 'LE') {
     this.selectedValues['VADV'][eye] = value;
  if (eye === 'RE') {
    this.spectacle.REDPVA = value;
  } else {
    this.spectacle.LEDPVA = value;
  }
}
selectValue3(value: any, eye: 'RE' | 'LE') {
      this.selectedValues['VANV'][eye] = value;
  if (eye === 'RE') {
    this.spectacle.RENPVA = value;
  } else {
    this.spectacle.LENPVA = value;
  }
}

}



