import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import * as moment from 'moment';
import { DateAdapter } from '@angular/material/core';
import { CompanyService } from 'src/app/service/company.service';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { DataStorageServiceService } from 'src/app/service/helpers/data-storage-service.service';

@Component({
  selector: 'app-company-option-hide',
  templateUrl: './company-option-hide.component.html',
  styleUrls: ['./company-option-hide.component.css']
})
export class CompanyOptionHideComponent implements OnInit {
  companySetting = JSON.parse(localStorage.getItem('companysetting') || '');

  searchValue:any
  dropComlist: any
  
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cs: CompanyService,
    public as: AlertService,
    private sp: NgxSpinnerService,
    private dataS: DataStorageServiceService,
  ) { }

  data: any = {
    CompanyID: null,
    OrderPriceList: false,
    SearchOrderPriceList: false,
    LensGridView: false,
    CustomerWithPower: false,
    Doctor: false,
    LensOrderModule: false,
    FitterOrderModule: false,
    DoctorLedgerReport: false,
    FitterLedgerReport: false,
    EyeTestReport: false,
  }



  ngOnInit(): void {
    this.dropdownShoplist()
  }

  onChange(event: { toUpperCase: () => any; toTitleCase: () => any; }) {
    if (this.companySetting.DataFormat === '1') {
      event = event.toUpperCase()
    } else if (this.companySetting.DataFormat == '2') {
      event = event.toTitleCase()
    }
    return event;
  }

  dropdownShoplist() {
    this.sp.show()
    const subs: Subscription = this.cs.dropdownlist('').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.dropComlist = res.data
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getCompanySettingByCompanyID() {
    this.sp.show()
    const subs: Subscription = this.cs.getCompanySettingByCompanyID(this.data).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.as.successToast(res.message)
          const stringToBoolean = (value: string) => value.toLowerCase() === 'true';
          this.data.OrderPriceList = stringToBoolean(res.data[0].OrderPriceList.toString());
          this.data.SearchOrderPriceList = stringToBoolean(res.data[0].SearchOrderPriceList.toString());
          this.data.LensGridView = stringToBoolean(res.data[0].LensGridView.toString());
          this.data.CustomerWithPower = stringToBoolean(res.data[0].CustomerWithPower.toString());
          this.data.Doctor = stringToBoolean(res.data[0].Doctor.toString());
          this.data.LensOrderModule = stringToBoolean(res.data[0].LensOrderModule.toString());
          this.data.FitterOrderModule = stringToBoolean(res.data[0].FitterOrderModule.toString());
          this.data.DoctorLedgerReport = stringToBoolean(res.data[0].DoctorLedgerReport.toString());
          this.data.FitterLedgerReport = stringToBoolean(res.data[0].FitterLedgerReport.toString());
          this.data.EyeTestReport = stringToBoolean(res.data[0].EyeTestReport.toString());
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
    const subs: Subscription = this.cs.updateCompanySettingByCompanyID(this.data).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.getCompanySettingByCompanyID()
          // const stringToBoolean = (value: string) => value.toLowerCase() === 'true';
          // this.data.OrderPriceList = stringToBoolean(res.data[0].OrderPriceList.toString());
          // this.data.SearchOrderPriceList = stringToBoolean(res.data[0].SearchOrderPriceList.toString());
          // this.data.LensGridView = stringToBoolean(res.data[0].LensGridView.toString());
          // this.data.CustomerWithPower = stringToBoolean(res.data[0].CustomerWithPower.toString());
          // this.data.Doctor = stringToBoolean(res.data[0].Doctor.toString());
          // this.data.LensOrderModule = stringToBoolean(res.data[0].LensOrderModule.toString());
          // this.data.FitterOrderModule = stringToBoolean(res.data[0].FitterOrderModule.toString());
          // this.data.DoctorLedgerReport = stringToBoolean(res.data[0].DoctorLedgerReport.toString());
          // this.data.FitterLedgerReport = stringToBoolean(res.data[0].FitterLedgerReport.toString());
          // this.data.EyeTestReport = stringToBoolean(res.data[0].EyeTestReport.toString());
            
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Your file has been update.',
            showConfirmButton: false,
            timer: 1200
          })
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

