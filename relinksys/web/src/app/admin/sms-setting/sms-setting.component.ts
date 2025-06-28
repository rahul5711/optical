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
import { CompressImageService } from 'src/app/service/helpers/compress-image.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-sms-setting',
  templateUrl: './sms-setting.component.html',
  styleUrls: ['./sms-setting.component.css']
})
export class SmsSettingComponent implements OnInit {
  user = JSON.parse(localStorage.getItem('user') || '');
  company = JSON.parse(localStorage.getItem('company') || '' ).ID;
  companySetting = JSON.parse(localStorage.getItem('companysetting') || '')
   env = environment;
  signatureImage:any;
  img:any
  constructor(
    private formBuilder: FormBuilder,
    public as: AlertService,
    private cs: CompanyService,
    private sp: NgxSpinnerService,
    private router: Router,
        private compressImage: CompressImageService,
            private fu: FileUploadService,
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
    {MessageName1: 'Customer_Birthday', MessageText1: '',Images:''},
    {MessageName1: 'Customer_Anniversary', MessageText1: '',Images:''},
    {MessageName1: 'Customer_Bill Advance', MessageText1: '',Images:''},
    {MessageName1: 'Customer_Bill FinalDelivery', MessageText1: '',Images:''},
    {MessageName1: 'Customer_Bill OrderReady', MessageText1: '',Images:''},
    {MessageName1: 'Customer_Eye Testing', MessageText1: '',Images:''},
    {MessageName1: 'Customer_Eye Prescription', MessageText1: '',Images:''},
    {MessageName1: 'Customer_Contactlens Expiry', MessageText1: '',Images:''},
    {MessageName1: 'Customer_Solution Expiry', MessageText1: '',Images:''},
    {MessageName1: 'Customer_Credit Note', MessageText1: '',Images:''},
    {MessageName1: 'Customer_Comfort Feedback', MessageText1: '',Images:''},
    {MessageName1: 'Customer_Service', MessageText1: '',Images:''},
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
    {MessageName2: 'Purchase_return', MessageText2: ''},
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
    const tempEmail = JSON.parse(this.companySetting.EmailSetting || '[]');
    if (tempEmail.length > 0) {
      this.EmailSettingList = tempEmail;
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

  
    uploadImage(e: any, mode: any,index: number) {
  
      this.img = e.target.files[0];
       if (!this.img) {
      return; // No file selected
    }
      // console.log(`Image size before compressed: ${this.img.size} bytes.`)
      this.compressImage.compress(this.img).pipe(take(1)).subscribe((compressedImage: any) => {
        // console.log(`Image size after compressed: ${compressedImage.size} bytes.`)
        this.fu.uploadFileComapny(compressedImage).subscribe((data: any) => {
          if (data.body !== undefined && mode === 'signature') {
            this.whatsappSettingList[index].Images = data.body?.download;
            this.as.successToast(data.body?.message)
          }
        });
      })
  
    }
  
}
