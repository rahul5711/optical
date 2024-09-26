import { Component, OnInit } from '@angular/core';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { ProductService } from 'src/app/service/product.service';
import { Subscription, fromEvent } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import { PurchaseService } from 'src/app/service/purchase.service';
import { ShopService } from 'src/app/service/shop.service';
import * as moment from 'moment';
import * as XLSX from 'xlsx';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { SupplierService } from 'src/app/service/supplier.service';
import { SupportService } from 'src/app/service/support.service';
import { environment } from 'src/environments/environment';
import { LedgeService } from 'src/app/service/ledge.service';
import Swal from 'sweetalert2';
import { FitterService } from 'src/app/service/fitter.service';
import { EmployeeService } from 'src/app/service/employee.service';
import { DoctorService } from 'src/app/service/doctor.service';

@Component({
  selector: 'app-ledge-report',
  templateUrl: './ledge-report.component.html',
  styleUrls: ['./ledge-report.component.css'] 
})
export class LedgeReportComponent implements OnInit {
  env = environment;
  shop: any = JSON.parse(localStorage.getItem('shop') || '');
  user: any = JSON.parse(localStorage.getItem('user') || '');
  selectedShop: any = JSON.parse(localStorage.getItem('selectedShop') || '');
  permission = JSON.parse(localStorage.getItem('permission') || '[]');
  companySetting = JSON.parse(localStorage.getItem('companysetting') || '');
  
  searchValue: any = '';
  myControl = new FormControl('');
  filteredOptions: any;

  constructor(
    private ss: ShopService,
    private ps: ProductService,
    public as: AlertService,
    public sp: NgxSpinnerService,
    private fb: FormBuilder,
    private sup: SupplierService,
    private fitters: FitterService,
    private supps: SupportService,
    private emp: EmployeeService,
    private doctors: DoctorService,
    private ledge: LedgeService,

  ) { }

  data: any = {
    FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), CustomerID: '',
  };

  supplier: any = {
    FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'),  SupplierID: '',
  };

  fitter: any = {
    FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'),  FitterID: '',
  };

  employee: any = {
    FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'),  UserID: '',
  };

  doctor: any = {
    FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'),  DoctorID: '',
  };

  shopList: any;
  selectsShop: any;
  supplierList: any = []
  fitterList: any = []
  employeeList: any = []
  doctorList: any = []
  billerList: any = []
  pdfLink:any;

  ngOnInit(): void {
    this.dropdownSupplierlist()
    this.dropdownfitterlist()
    this.dropdownUserlist()
    this.dropdownDoctorlist()
  }

  dropdownSupplierlist() {
    const subs: Subscription = this.sup.dropdownSupplierlist('').subscribe({
      next: (res: any) => {
        this.supplierList = res.data
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  dropdownfitterlist() {
    const subs: Subscription = this.fitters.dropdownlist().subscribe({
      next: (res: any) => {
        this.fitterList = res.data.sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  dropdownUserlist() {
    const subs: Subscription = this.emp.dropdownUserlist('').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.employeeList = res.data
        } else {
          this.as.errorToast(res.message)
        }
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  dropdownDoctorlist() {
    this.sp.show();
    const subs: Subscription = this.doctors.dropdownDoctorlist().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.doctorList = res.data.sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
          this.sp.hide();
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),

    });
  }

  customerSearch(searchKey: any, mode: any, type: any) {
    this.filteredOptions = []

    let dtm:any = { Type: '', Name: '', MobileNo1: ''}

    if (type === 'Customer') {
      dtm = {
        Type: 'Customer',
        Name: this.data.CustomerID
      };
    }

    if (searchKey.length >= 2) {
      if (mode === 'Name') {
        dtm.Name = searchKey;
      }else if (mode === 'MobileNo1') {
        this.filteredOptions = [];
        dtm.MobileNo1 = searchKey;
      }

      const subs: Subscription = this.supps.dropdownlistBySearch(dtm).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.filteredOptions = res.data
          } else {
            this.as.errorToast(res.message)
          }
          this.sp.hide()
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    }

  }

  CustomerSelection(mode: any, ID: any) {

    if (mode === 'customer') {
      this.data.CustomerID = ID
    }

    if (mode === 'All') {
      this.filteredOptions = []
      this.data.CustomerID = 0
    }
  }

  FromReset(mode:any) {
    if(mode === 'customer'){
      this.data = {
        FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: '', CustomerID: '',
      };
      this.myControl = new FormControl('');
      this.filteredOptions = []
    }
    if(mode === 'supplier'){
      this.supplier = {
        FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: '', SupplierID: '',
      };
    }
    if(mode === 'fitter'){
      this.fitter = {
        FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: '', FitterID: '',
      };
    }
    if(mode === 'employee'){
      this.employee = {
        FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: '', EmployeeID: '',
      };
    }
    if(mode === 'doctor'){
      this.doctor = {
        FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: '', DoctorID: '',
      };
    }
  }

  onChange(event: { toUpperCase: () => any; toTitleCase: () => any; }) {
    if (this.companySetting.DataFormat === '1') {
      event = event.toUpperCase()
    } else if (this.companySetting.DataFormat == '2') {
      event = event.toTitleCase()
    }
    return event;
  }

  getCustomerLedgeReport() {
    this.sp.show()
    const subs: Subscription = this.ledge.getCustomerLedgeReport(this.data.FromDate,this.data.ToDate,this.data.CustomerID).subscribe({
      next: (res: any) => {
        if (res === "customer_ladger.pdf") {
          const url = this.env.apiUrl + "/uploads/" + res;
          this.pdfLink = url;
          window.open(url, "_blank");

        } else {
          this.as.errorToast(res.message)
          Swal.fire({
            position: 'center',
            icon: 'warning',
            title: res.message,
            showConfirmButton: true,
          })
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getSupplierLedgeReport() {
    this.sp.show()
    const subs: Subscription = this.ledge.getSupplierLedgeReport(this.supplier.FromDate,this.supplier.ToDate,this.supplier.SupplierID).subscribe({
      next: (res: any) => {
        if (res === "supplier_ladger.pdf") {
          const url = this.env.apiUrl + "/uploads/" + res;
          this.pdfLink = url;
          window.open(url, "_blank");

        } else {
          this.as.errorToast(res.message)
          Swal.fire({
            position: 'center',
            icon: 'warning',
            title: res.message,
            showConfirmButton: true,
          })
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getFitterLedgeReport() {
    this.sp.show()
    const subs: Subscription = this.ledge.getFitterLedgeReport(this.fitter.FromDate,this.fitter.ToDate,this.fitter.FitterID).subscribe({
      next: (res: any) => {
        if (res === "fitter_ladger.pdf") {
          const url = this.env.apiUrl + "/uploads/" + res;
          this.pdfLink = url;
          window.open(url, "_blank");

        } else {
          this.as.errorToast(res.message)
          Swal.fire({
            position: 'center',
            icon: 'warning',
            title: res.message,
            showConfirmButton: true,
          })
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getEmployeeLedgeReport() {
    this.sp.show()
    const subs: Subscription = this.ledge.getEmployeeLedgeReport(this.employee.FromDate,this.employee.ToDate,this.employee.UserID).subscribe({
      next: (res: any) => {
        if (res === "employee_ladger.pdf") {
          const url = this.env.apiUrl + "/uploads/" + res;
          this.pdfLink = url;
          window.open(url, "_blank");

        } else {
          this.as.errorToast(res.message)
          Swal.fire({
            position: 'center',
            icon: 'warning',
            title: res.message,
            showConfirmButton: true,
          })
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getDoctorLedgeReport() {
    this.sp.show()
    const subs: Subscription = this.ledge.getDoctorLedgeReport(this.doctor.FromDate,this.doctor.ToDate,this.doctor.DoctorID).subscribe({
      next: (res: any) => {
        if (res === "doctor_ladger.pdf") {
          const url = this.env.apiUrl + "/uploads/" + res;
          this.pdfLink = url;
          window.open(url, "_blank");

        } else {
          this.as.errorToast(res.message)
          Swal.fire({
            position: 'center',
            icon: 'warning',
            title: res.message,
            showConfirmButton: true,
          })
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }


}
