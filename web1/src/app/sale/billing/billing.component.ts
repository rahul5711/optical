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
    if (event.ctrlKey && event.key === 's') {
      this.onsubmit();
      event.preventDefault();
    }
    if (event.ctrlKey && event.key === 'q') {
      this.clearFrom();
      event.preventDefault();
    }
  }
  @ViewChild('Csearching') Csearching: ElementRef | any;
  @ViewChild('UserNamecontrol') UserNamecontrol: ElementRef | any;
  company = JSON.parse(localStorage.getItem('company') || '');
  user = JSON.parse(localStorage.getItem('user') || '');
  companySetting = JSON.parse(localStorage.getItem('companysetting') || '');
  shop = JSON.parse(localStorage.getItem('shop') || '');
  selectedShop = JSON.parse(localStorage.getItem('selectedShop') || '');
  permission = JSON.parse(localStorage.getItem('permission') || '[]');
  env = environment;
  
  myControl = new FormControl('');
  myControl1 = new FormControl('');
  myControl2 = new FormControl('');
  filteredOptions: any ;

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
  searchValue:any =''
  otherselect:any
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
  ) {
    this.id = this.route.snapshot.params['customerid'];
    this.id2 = this.route.snapshot.params['billid'];

    this.searchKeySubject.pipe(
      debounceTime(500)  // Adjust the debounce time as needed
    ).subscribe(({ searchKey, mode }) => {
      this.performSearch(searchKey, mode);
    });
  }
  searchKeySubject: Subject<{searchKey: any, mode: any}> = new Subject();
  data: any = {
    ID: '', CompanyID: '', Idd: 0, Title:'', Name: '', Sno: '', TotalCustomer: '', VisitDate: '', MobileNo1: '', MobileNo2: '', PhoneNo: '', Address: '', GSTNo: '', Email: '', PhotoURL: null, DOB: '', Age: 0, Anniversary: '', RefferedByDoc: '', ReferenceType: '', Gender: '', Category: '', Other: '', Remarks: '', Status: 1, CreatedBy: 0, UpdatedBy: 0, CreatedOn: '', UpdatedOn: '', tablename: '', spectacle_rx: [], contact_lens_rx: [], other_rx: [],
  };

  spectacle: any = {
    ID: 'null', CustomerID: '', REDPSPH: '', Reminder: '6', REDPCYL: '', REDPAxis: '', REDPVA: '', LEDPSPH: '', LEDPCYL: '', LEDPAxis: '',
    LEDPVA: '', RENPSPH: '', RENPCYL: '', RENPAxis: '', RENPVA: '', LENPSPH: '', LENPCYL: '', LENPAxis: '', LENPVA: '', REPD: '', LEPD: '',
    R_Addition: '', L_Addition: '', R_Prism: '', L_Prism: '', Lens: '', Shade: '', Frame: '', VertexDistance: '', RefractiveIndex: '', FittingHeight: '', ConstantUse: false, NearWork: false, RefferedByDoc: 'Self', DistanceWork: false, UploadBy: 'Upload', PhotoURL: null, FileURL: null, Family: 'Self', ExpiryDate: '0000-00-00', Status: 1, CreatedBy: 0, CreatedOn: '', UpdatedBy: 0, UpdatedOn: '',VisitDate: '',
  };

  clens: any = {
    ID: 'null', CustomerID: '', REDPSPH: '', REDPCYL: '', REDPAxis: '', REDPVA: '', LEDPSPH: '', LEDPCYL: '', LEDPAxis: '',
    LEDPVA: '', RENPSPH: '', RENPCYL: '', RENPAxis: '', RENPVA: '', LENPSPH: '', LENPCYL: '', LENPAxis: '', LENPVA: '', REPD: '', LEPD: '',
    R_Addition: '', L_Addition: '', R_KR: '', L_KR: '', R_HVID: '', L_HVID: '', R_CS: '', L_CS: '', R_BC: '', L_BC: '',
    R_Diameter: '', L_Diameter: '', BR: '', Material: '', Modality: '', RefferedByDoc: 'Self', Other: '', ConstantUse: false,
    NearWork: false, DistanceWork: false, Multifocal: false, PhotoURL: null, FileURL: null, Family: 'Self', Status: 1, CreatedBy: 0,
    CreatedOn: '', UpdatedBy: 0, UpdatedOn: '',VisitDate: '',
  };

  other: any = {
    ID: 'null', CustomerID: '', BP: '', Sugar: '', IOL_Power: '', RefferedByDoc: 'Self', Operation: '', R_VN: '', L_VN: '', R_TN: '', L_TN: '', R_KR: '', L_KR: '', Treatment: '', Diagnosis: '', Family: 'Self', FileURL: null, Status: 1, CreatedBy: 0, CreatedOn: '', UpdatedBy: 0, UpdatedOn: '',VisitDate: '',
  };

  Check: any = { SpectacleCheck: true, ContactCheck: false, OtherCheck: false, };

  param = { Name: '', MobileNo1: '', Address: '', Sno: '' };
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

  // dropdown values in satics 
  showDoctorAdd = false;
  editCustomer = false
  addCustomer = false
  deleteCustomer = false
  CustomerBillView  = false
  numberList:any=[]
  otherLists:any=[]
x:any
currentTime = '';
srcCustomerBox = false

  ngOnInit(): void {
    this.permission.forEach((element: any) => {
      if (element.ModuleName === 'Customer') {
        this.editCustomer = element.Edit;
        this.addCustomer = element.Add;
        
        this.deleteCustomer = element.Delete;
      } if (element.ModuleName === 'CustomerBill') {
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

    this.doctorList()
    this.srcBox = true;
    [this.shop] = this.shop.filter((s:any) => s.ID === Number(this.selectedShop[0]));
  }

 

  op1(){
    this.x = document.getElementById("u");
      if ( this.x.open === false  ) {
        this.x.open = true ;
      } else {
        this.x.open = false ;
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
    this.otherSuppList()
    this.ReferenceSuppList()
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
     

      const PLANOCheck = ['REDPSPH', 'REDPCYL', 'RENPSPH', 'RENPCYL','LEDPSPH','LEDPCYL','LENPSPH','LENPCYL']

      for (const prop of PLANOCheck) {
        if (this.data.spectacle_rx[prop] === 'PLANO') {
          this.data.spectacle_rx[prop] = '+0.00';
        }
      }
      this.spectacle.VisitDate =  moment(this.spectacle.VisitDate).format('YYYY-MM-DD');
      this.spectacle.ExpiryDate = moment().add(Number(this.spectacle.Reminder), 'M').format('YYYY-MM-DD');
    }
    if (this.Check.ContactCheck === true) {
      this.data.tablename = 'contact_lens_rx'
      this.data.contact_lens_rx = this.clens

      const PLANOCheck = ['REDPSPH', 'REDPCYL', 'RENPSPH', 'RENPCYL','LEDPSPH','LEDPCYL','LENPSPH','LENPCYL']

      for (const prop of PLANOCheck) {
        if (this.data.contact_lens_rx[prop] === 'PLANO') {
          this.data.contact_lens_rx[prop] = '+0.00';
        }
      }
      this.clens.VisitDate = this.clens.VisitDate ;
    }
    if (this.Check.OtherCheck === true) {
      this.data.tablename = 'other_rx'
      this.data.other_rx = this.other
      this.other.VisitDate = this.other.VisitDate;
    }

    if (this.data.MobileNo1 !== '') {
      this.param.MobileNo1 = this.data.MobileNo1;
      this.customerSearch(this.param.MobileNo1,'MobileNo1');
      if(this.filteredOptions.length != 0){
        Swal.fire({
          position: 'center',
          icon: 'warning',
          title: 'Duplicate Customer',
          showConfirmButton: true,
          backdrop:false
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
              showConfirmButton: true,
              backdrop:false
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

  getScoList() {
    this.sp.show()
    const subs: Subscription = this.cs.getCustomerById(this.id).subscribe({
      next: (res: any) => {
        if (res.success) {

          this.data = res.data[0]
          this.data.Idd = res.data[0].Idd
          this.data.VisitDate = moment(res.data[0].VisitDate).format('YYYY-MM-DD');
          if (res.data[0].PhotoURL !== "null" && res.data[0].PhotoURL !== '') {
            this.customerImage = this.env.apiUrl + res.data[0].PhotoURL;
          } else {
            this.customerImage = "/assets/images/userEmpty.png"
          }
          this.spectacleLists = res.spectacle_rx
          this.contactList = res.contact_lens_rx
          this.otherList = res.other_rx
          this.getCustomerCategory();
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

  getCustomerById() {
    this.sp.show()
    const subs: Subscription = this.cs.getCustomerById(this.id).subscribe({
      next: (res: any) => {
        if (res.success) {

          this.data = res.data[0]
          this.data.Idd = res.data[0].Idd;
          
          this.data.VisitDate = moment(res.data[0].VisitDate).format('YYYY-MM-DD');
          if (res.data[0].PhotoURL !== "null" && res.data[0].PhotoURL !== '') {
            this.customerImage = this.env.apiUrl + res.data[0].PhotoURL;
          } else {
            this.customerImage = "/assets/images/userEmpty.png"
          }

          if (res.spectacle_rx.length !== 0) {
            this.spectacle = res.spectacle_rx[0]
            this.spectacle.VisitDate = moment(this.spectacle.VisitDate).format('YYYY-MM-DD');
         
            const PLANOCheck = ['REDPSPH', 'REDPCYL', 'RENPSPH', 'RENPCYL','LEDPSPH','LEDPCYL','LENPSPH','LENPCYL'];
            for (const prop of PLANOCheck) {
              if (this.spectacle[prop] === '+0.00' || this.spectacle[prop] === "0") {
                this.spectacle[prop] = 'PLANO';
              }
            }

            if (res.spectacle_rx[0].PhotoURL !== "null" && res.spectacle_rx[0].PhotoURL !== '') {
              this.spectacleImage = this.env.apiUrl + res.spectacle_rx[0].PhotoURL;
            } else {
              this.spectacleImage = "/assets/images/userEmpty.png"
            }
          }

          if (res.contact_lens_rx.length !== 0) {
            this.clens = res.contact_lens_rx[0]
            this.clens.VisitDate = moment(this.clens.VisitDate).format('YYYY-MM-DD');
            const PLANOCheck1 = ['REDPSPH', 'REDPCYL', 'RENPSPH', 'RENPCYL', 'LEDPSPH', 'LEDPCYL', 'LENPSPH', 'LENPCYL']
            for (const prop1 of PLANOCheck1) {
              if (this.clens[prop1] === '+0.00' || this.spectacle[prop1] === "0") {
                this.clens[prop1] = 'PLANO';
              }
            }

            if (res.contact_lens_rx[0].PhotoURL !== "null" && res.contact_lens_rx[0].PhotoURL !== '') {
              this.clensImage = this.env.apiUrl + res.contact_lens_rx[0].PhotoURL;
            } else {
              this.clensImage = "/assets/images/userEmpty.png"
            }
          }

          if (res.other_rx.length !== 0) {
            this.other = res.other_rx[0]
            this.other.VisitDate = moment(this.other.VisitDate).format('YYYY-MM-DD');
          }
          this.getScoList()
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
      ID: '', CompanyID: '', Idd: 0,Title:'', Name: '', Sno: '', TotalCustomer: '', VisitDate: this.data.VisitDate, MobileNo1: '', MobileNo2: '', PhoneNo: '', Address: '', GSTNo: '', Email: '', PhotoURL: null, DOB: '', Age: 0, Anniversary: '', RefferedByDoc: '', ReferenceType: '', Gender: '', Category: '', Other: '', Remarks: '', Status: 1, CreatedBy: 0, UpdatedBy: 0, CreatedOn: '', UpdatedOn: '', tablename: '', spectacle_rx: [], contact_lens_rx: [], other_rx: [],
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
    this.router.navigate(['/sale/billing', 0, 0]);
    this.spectacleLists = [];
    this.contactList = [];
    this.otherList = [];
    this.searchList = [];
    this.filteredOptions = []
    this.sp.hide();
    this.ngOnInit();

  }

  NewVisit(mode: any) {
    if (mode === 'spectacle') {
      this.spectacle = {
        ID: 'null', CustomerID: this.id, REDPSPH: '', Reminder: '6', REDPCYL: '', REDPAxis: '', REDPVA: '', LEDPSPH: '', LEDPCYL: '', LEDPAxis: '', LEDPVA: '', RENPSPH: '', RENPCYL: '', RENPAxis: '', RENPVA: '', LENPSPH: '', LENPCYL: '', LENPAxis: '', LENPVA: '', REPD: '', LEPD: '', R_Addition: '', L_Addition: '', R_Prism: '', L_Prism: '', Lens: '', Shade: '', Frame: '', VertexDistance: '', RefractiveIndex: '', FittingHeight: '', ConstantUse: false, NearWork: false, RefferedByDoc: 'Self', DistanceWork: false, UploadBy: 'Upload', PhotoURL: null, FileURL: null, Family: 'Self', ExpiryDate: '0000-00-00', Status: 1, CreatedBy: 0, CreatedOn: '', UpdatedBy: 0, UpdatedOn: '',VisitDate:  this.spectacle.VisitDate = moment().format('YYYY-MM-DD'),
      };
    }

    if (mode === 'contact') {
      this.clens = {
        ID: 'null', CustomerID: this.id, REDPSPH: '', REDPCYL: '', REDPAxis: '', REDPVA: '', LEDPSPH: '', LEDPCYL: '', LEDPAxis: '',
        LEDPVA: '', RENPSPH: '', RENPCYL: '', RENPAxis: '', RENPVA: '', LENPSPH: '', LENPCYL: '', LENPAxis: '', LENPVA: '', REPD: '', LEPD: '', R_Addition: '', L_Addition: '', R_KR: '', L_KR: '', R_HVID: '', L_HVID: '', R_CS: '', L_CS: '', R_BC: '', L_BC: '',
        R_Diameter: '', L_Diameter: '', BR: '', Material: '', Modality: '', RefferedByDoc: 'Self', Other: '', ConstantUse: false,
        NearWork: false, DistanceWork: false, Multifocal: false, PhotoURL: null, FileURL: null, Family: 'Self', Status: 1, CreatedBy: 0, CreatedOn: '', UpdatedBy: 0, UpdatedOn: '',VisitDate: this.clens.VisitDate = moment().format('YYYY-MM-DD'),
      };
    }

    if (mode === 'other') {
    this.other = {
      ID: 'null', CustomerID: this.id, BP: '', Sugar: '', IOL_Power: '', RefferedByDoc: 'Self', Operation: '', R_VN: '', L_VN: '', R_TN: '', L_TN: '', R_KR: '', L_KR: '', Treatment: '', Diagnosis: '', Family: 'Self', FileURL: null, Status: 1, CreatedBy: 0, CreatedOn: '', UpdatedBy: 0, UpdatedOn: '',VisitDate: this.other.VisitDate = moment().format('YYYY-MM-DD'),
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
    } if (mode === 'contact') {
      this.clens = data;
    } if (mode === 'other') {
      this.other = data;
    }
  }

  updateCustomer() {
    this.sp.show()
    if (this.Check.SpectacleCheck === true) {
      this.data.tablename = 'spectacle_rx';
      this.spectacle.ExpiryDate = moment().add(Number(this.spectacle.Reminder), 'M').format('YYYY-MM-DD');
    this.spectacle.VisitDate =  moment(this.spectacle.VisitDate).format('YYYY-MM-DD');;
      this.data.spectacle_rx = this.spectacle

      const PLANOCheck = ['REDPSPH', 'REDPCYL', 'RENPSPH', 'RENPCYL', 'LEDPSPH', 'LEDPCYL', 'LENPSPH', 'LENPCYL']
      for (const prop of PLANOCheck) {
        if (this.data.spectacle_rx[prop] === 'PLANO') {
          this.data.spectacle_rx[prop] = '+0.00';
        }
      }
    }
    if (this.Check.ContactCheck === true) {
      this.data.tablename = 'contact_lens_rx'
      this.clens.VisitDate = this.clens.VisitDate ;
      this.data.contact_lens_rx = this.clens

      const PLANOCheck = ['REDPSPH', 'REDPCYL', 'RENPSPH', 'RENPCYL', 'LEDPSPH', 'LEDPCYL', 'LENPSPH', 'LENPCYL']
      for (const prop of PLANOCheck) {
        if (this.data.contact_lens_rx[prop] === 'PLANO') {
          this.data.contact_lens_rx[prop] = '+0.00';
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


  // Billing

  // customer search 

  CustomerSelection(mode:any,ID:any){
    if(mode === 'Value'){
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

  dateFormat(date:any){
    return moment(date).format(`${this.companySetting.DateFormat}`);
  }

  onChange(event: { toUpperCase: () => any; toTitleCase: () => any; }) {
    if (this.companySetting.DataFormat === '1') {
      event = event.toUpperCase()
    } else if (this.companySetting.DataFormat == '2') {
      event = event.toTitleCase()
    }
    return event;
  }

  customerPowerPDF(i:any,mode:any) {

    if(mode === 'spectacle'){

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
    if(mode === 'contact'){
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
    if(mode === 'other'){
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

  sendWhatsappPower(i:any,mode: any) {
    let temp = JSON.parse(this.companySetting.WhatsappSetting);
    let WhatsappMsg = '';

    if (mode === 'spectacle') {
      WhatsappMsg = this.getWhatsAppMessage(temp, 'Customer_Eye Prescription');
      var msg = `*Hi ${this.data.Title} ${this.data.Name},*%0A` +
        `${WhatsappMsg}%0A` +
        `*Open Prescription* : ${this.spectacle.FileURL}%0A` + `Reply *‘Hi’* to  download the Prescription%0A%0A` +
        `*${this.shop.Name}* - ${this.shop.AreaName}%0A${this.shop.MobileNo1}%0A${this.shop.Website}%0A` + `*Please give your valuable Review for us !*`;
    } else if(mode === 'other') {
      WhatsappMsg = this.getWhatsAppMessage(temp, 'Customer_Eye Prescription');
      var msg = `*Hi ${this.data.Title} ${this.data.Name},*%0A` +
        `${WhatsappMsg}%0A` +
        `*Open Prescription*  : ${this.other.FileURL}%0A` + `Reply *‘Hi’* to  download the Prescription%0A%0A` + 
        `*${this.shop.Name}* - ${this.shop.AreaName}%0A${this.shop.MobileNo1}%0A${this.shop.Website}%0A` + `*Please give your valuable Review for us !*` 
    }else {
      WhatsappMsg = this.getWhatsAppMessage(temp, 'Customer_Eye Prescription');
      var msg = `*Hi ${this.data.Title} ${this.data.Name},*%0A` +
        `${WhatsappMsg}%0A` +
        `*Open Prescription*  : ${this.clens.FileURL}%0A` + `Reply *‘Hi’* to  download the Prescription%0A%0A` +
        `*${this.shop.Name}* - ${this.shop.AreaName}%0A${this.shop.MobileNo1}%0A${this.shop.Website}%0A` + `*Please give your valuable Review for us !*` 
    }

  
    if(this.data.MobileNo1 != '' && Number(this.data.MobileNo1) == this.data.MobileNo1){
      var mob = this.company.Code + this.data.MobileNo1;
      var url = `https://wa.me/${mob.trim()}?text=${msg}`;
      window.open(url, "_blank");
    }else{
      Swal.fire({
        position: 'center',
        icon: 'warning',
        title: '<b>' + this.data.Name + '</b>' + ' Mobile number is not available.',
        showConfirmButton: true,
      })
    }


  }

  getWhatsAppMessage(temp: any, messageName: any) {
    if (temp && temp !== 'null') {
      const foundElement = temp.find((element: { MessageName1: any; }) => element.MessageName1 === messageName);
      return foundElement ? foundElement.MessageText1 : '';
    }
    return '';
  }

  otherOpne(content: any, i:any,mode:any) {
    this.otherselect = { customer: this.data, spectacle: this.spectacleLists[i], contact: this.contactList[i], other: this.otherList[i], mode, otherSpec:this.otherSpec, otherContant:this.otherContant, otherNoPower:this.otherNoPower }
    this.modalService.open(content, { centered: true, backdrop: 'static', keyboard: false, size: 'sm' });

  }

  selectOtherOption(mode:any ){
      let body = ''

    if(mode === 'sepc'){
      body = this.otherselect
      this.otherSpec = true
      this.otherselect.otherSpec = true
       delete this.otherselect.contact
    }
    if(mode === 'con'){
      body = this.otherselect
      this.otherContant = true
      this.otherselect.otherContant = true
      delete this.otherselect.spectacle
    }
    if(mode === 'nop'){
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
 
 
}
