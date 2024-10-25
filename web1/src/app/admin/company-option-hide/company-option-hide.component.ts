import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators,ReactiveFormsModule } from '@angular/forms';
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

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cs: CompanyService,
    public as: AlertService,
    private sp: NgxSpinnerService,
    private dataS: DataStorageServiceService,
  ) { }

  data :any ={
    CompanyID :null,
    OrderPricelist: false,
    SearchOrderPricelist: false,
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
  }

  onsubmit() {
    console.log(this.data);
    
  }
}
