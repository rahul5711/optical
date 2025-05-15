import { Component, OnInit } from '@angular/core';
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
  selector: 'app-sms-setting',
  templateUrl: './sms-setting.component.html',
  styleUrls: ['./sms-setting.component.css']
})
export class SmsSettingComponent implements OnInit {
  user = JSON.parse(localStorage.getItem('user') || '');
  company = JSON.parse(localStorage.getItem('company') || '' ).ID;
  companySetting = JSON.parse(localStorage.getItem('companysetting') || '')
  
  constructor(
    private formBuilder: FormBuilder,
    public as: AlertService,
    private cs: CompanyService,
    private sp: NgxSpinnerService,
    private router: Router,
  ) { }

  
  smsSettingList: any = [
    {MessageName: 'Billing (Advance)', MessageID: '', Required: true, MessageText: ''},
    {MessageName: 'Billing (Final Delivery)', MessageID: '', Required: true, MessageText: ''},
    {MessageName: 'Billing (Order Ready)', MessageID: '', Required: true, MessageText: ''},
    {MessageName: 'Birthday', MessageID: '', Required: true, MessageText: ''},
    {MessageName: 'Anniversary', MessageID: '', Required: true, MessageText: ''},
    {MessageName: 'Eye Testing', MessageID: '', Required: true, MessageText: ''},
    {MessageName: 'Contactlens Expiry', MessageID: '', Required: true, MessageText: ''},
    {MessageName: 'Solution Expiry', MessageID: '', Required: true, MessageText: ''},
    {MessageName: 'Credit Note', MessageID: '', Required: true, MessageText: ''},
    {MessageName: 'Comfort Feedback', MessageID: '', Required: true, MessageText: ''},
    {MessageName: 'Service', MessageID: '', Required: true, MessageText: ''},
  ];

  whatsappSettingList: any = [
    {MessageName1: 'Customer_Birthday', MessageText1: ''},
    {MessageName1: 'Customer_Anniversary', MessageText1: ''},
    {MessageName1: 'Customer_Bill Advance', MessageText1: ''},
    {MessageName1: 'Customer_Bill FinalDelivery', MessageText1: ''},
    {MessageName1: 'Customer_Bill OrderReady', MessageText1: ''},
    {MessageName1: 'Customer_Eye Testing', MessageText1: ''},
    {MessageName1: 'Customer_Eye Prescription', MessageText1: ''},
    {MessageName1: 'Customer_Contactlens Expiry', MessageText1: ''},
    {MessageName1: 'Customer_Solution Expiry', MessageText1: ''},
    {MessageName1: 'Customer_Credit Note', MessageText1: ''},
    {MessageName1: 'Customer_Comfort Feedback', MessageText1: ''},
    {MessageName1: 'Customer_Service', MessageText1: ''},
  ];

  EmailSettingList:any = [
    {MessageName2: 'Customer_Birthday', MessageText2: ''},
    {MessageName2: 'Customer_Anniversary', MessageText2: ''},
    {MessageName2: 'Customer_Bill Advance', MessageText2: ''},
    {MessageName2: 'Customer_Bill FinalDelivery', MessageText2: ''},
    {MessageName2: 'Customer_Bill OrderReady', MessageText2: ''},
    {MessageName2: 'Customer_Eye Testing', MessageText2: ''},
    {MessageName2: 'Customer_Eye Prescription', MessageText2: ''},
    {MessageName2: 'Customer_Contactlens Expiry', MessageText2: ''},
    {MessageName2: 'Customer_Solution Expiry', MessageText2: ''},
    {MessageName2: 'Customer_Credit Note', MessageText2: ''},
    {MessageName2: 'Customer_Comfort Feedback', MessageText2: ''},
    {MessageName2: 'Customer_Service', MessageText2: ''},
    {MessageName2: 'Supplier_Order', MessageText2: ''},
    {MessageName2: 'Fitter_Order', MessageText2: ''},
    {MessageName2: 'Expense', MessageText2: ''},
    {MessageName2: 'Summary', MessageText2: ''},
  ]

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings() {
    const tempSMS = JSON.parse(this.companySetting.SmsSetting || '[]');
    if (tempSMS.length > 0) {
      this.smsSettingList = tempSMS;
    }
    this.getWhatsappSettings();
      this.getEmailSettings()
  }

  getWhatsappSettings() {
    const tempWhatsapp = JSON.parse(this.companySetting.WhatsappSetting || '[]');
    if (tempWhatsapp.length > 0) {
      this.whatsappSettingList = tempWhatsapp;
    }
  }

  getEmailSettings() {
    const tempWhatsapp = JSON.parse(this.companySetting.EmailSetting || '[]');
    if (tempWhatsapp.length > 0) {
      this.EmailSettingList = tempWhatsapp;
    }
  }

  updateSMSsetting(settingType:any){
    this.sp.show();

    if (settingType === 'sms') {
      this.companySetting.SmsSetting = JSON.stringify(this.smsSettingList);
    } else if (settingType === 'whatsapp') {
      this.companySetting.WhatsappSetting = JSON.stringify(this.whatsappSettingList);
    }else if (settingType === 'email') {
      this.companySetting.EmailSetting = JSON.stringify(this.EmailSettingList);
    }

    const subs: Subscription =  this.cs.updatecompanysetting(this.companySetting).subscribe({
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

  onChange(event: string) {
    let modifiedEvent = event; // Create a new variable to store the modified result
    if (this.companySetting?.DataFormat === '1') {
      modifiedEvent = event.toUpperCase();
    } else if (this.companySetting?.DataFormat === '2') {
      modifiedEvent = this.toTitleCase(event);
    }
    return modifiedEvent;
  }

  toTitleCase(inputString: string) {
    // Implement a function to convert inputString to title case
    return inputString.toLowerCase().replace(/^(.)|\s(.)/g, function ($1) {
      return $1.toUpperCase();
    });
  }
}
