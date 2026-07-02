
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { FileUploadService } from 'src/app/service/helpers/file-upload.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { map, filter, debounceTime, distinctUntilChanged, take } from 'rxjs/operators';
import { CompressImageService } from 'src/app/service/helpers/compress-image.service';
import { SupportService } from 'src/app/service/support.service';
import { CompanyService } from 'src/app/service/company.service';

@Component({
  selector: 'app-ecom-setting',
  templateUrl: './ecom-setting.component.html',
  styleUrls: ['./ecom-setting.component.css']
})
export class EcomSettingComponent implements OnInit {
  env = environment;
  constructor(
    private router: Router,
    public as: AlertService,
    private fu: FileUploadService,
    private sp: NgxSpinnerService,
    private modalService: NgbModal,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private compressImage: CompressImageService,
    private supps: SupportService,
        private cs: CompanyService,
  ) { }
  images: any[] = ['', '', '', ''];
  data: any = {
    SilderImage:[],
    CouponCode: '', FacebookLink: '', InstagramLink: '', YoutubeLink: '', TwitterLink: '', complimentaryImage:'',
    EcomName:'', EcomAddress:'', EcomMoblieNo1:'', EcomMoblieNo:'', EcomPhoneNo:'', EcomEmail:'', EcomLogo:'',
    PolicyNote :'[{"Content":""},{"Content":""},{"Content":""},{"Content":""},{"Content":""}]',
    TermConditions :'[{"Content":""},{"Content":""},{"Content":""},{"Content":""},{"Content":""}]',
    ReturnNote :'[{"Content":""},{"Content":""},{"Content":""},{"Content":""},{"Content":""}]',
    DayExchange :'[{"Content":""},{"Content":""},{"Content":""},{"Content":""},{"Content":""}]',
  }
  PolicyNoteList: any = [];
  TermConditionsList: any = [];
  ReturnNoteList: any = [];
  DayExchangeList: any = [];
  freeImage: any;
  ecomLogo: any;
  img: any;
companySettingdata:any
  ngOnInit(): void {
    this.PolicyNoteList = JSON.parse(this.data.PolicyNote) || []
    this.TermConditionsList = JSON.parse(this.data.TermConditions) || []
    this.ReturnNoteList = JSON.parse(this.data.TermConditions) || []
    this.DayExchangeList = JSON.parse(this.data.TermConditions) || []
    this.getCompanySetting()
  }



uploadImage(e: any, index: number) {

  const img = e.target.files[0];

  this.compressImage.compress(img)
    .pipe(take(1))
    .subscribe((compressedImage: any) => {

      this.fu.uploadFileComapny(compressedImage)
        .subscribe((data: any) => {

          if (data.body !== undefined) {

            this.images[index] = data.body?.download;

            this.as.successToast(data.body?.message);
            
          }

        });

    });

}
// this.data.SilderImage = JSON.stringify(this.images);
  uploadImage1(e: any, mode: any) {

    this.img = e.target.files[0];
    // console.log(`Image size before compressed: ${this.img.size} bytes.`)
    this.compressImage.compress(this.img).pipe(take(1)).subscribe((compressedImage: any) => {
      // console.log(`Image size after compressed: ${compressedImage.size} bytes.`)
      this.fu.uploadFileComapny(compressedImage).subscribe((data: any) => {
        if (data.body !== undefined && mode === 'water') {
          this.freeImage = data.body?.download;
          this.data.complimentaryImage = data.body?.download
          this.as.successToast(data.body?.message)
        }
       

      });
    })

  }
  uploadImage2(e: any, mode: any) {

    this.img = e.target.files[0];
    // console.log(`Image size before compressed: ${this.img.size} bytes.`)
    this.compressImage.compress(this.img).pipe(take(1)).subscribe((compressedImage: any) => {
      // console.log(`Image size after compressed: ${compressedImage.size} bytes.`)
      this.fu.uploadFileComapny(compressedImage).subscribe((data: any) => {
      
        if (data.body !== undefined && mode === 'ecomLogo') {
          this.ecomLogo = data.body?.download;
          this.data.EcomLogo = data.body?.download
          this.as.successToast(data.body?.message)
        }

      });
    })

  }

  addRow(mode:any) {
    if(mode == 'policy'){
      this.PolicyNoteList.push({ Content: '' });
    }
    if(mode == 'term'){
      this.TermConditionsList.push({ Content: '' });
    }
    if(mode == 'return'){
      this.ReturnNoteList.push({ Content: '' });
    }
    if(mode == 'exchange'){
      this.DayExchangeList.push({ Content: '' });
    }
  }

  delete(i: any,mode:any) {
    if(mode == 'policy'){
      this.PolicyNoteList.splice(i, 1);
    }
    if(mode == 'term'){
      this.TermConditionsList.splice(i, 1);
    }
    if(mode == 'return'){
      this.ReturnNoteList.splice(i, 1);
    }
    if(mode == 'exchange'){
      this.DayExchangeList.splice(i, 1);
    }
  }



getCompanySetting() {

  const companySettingJson = localStorage.getItem('companysetting') || '{}';

  this.companySettingdata = JSON.parse(companySettingJson);

  if (this.companySettingdata?.EcomSettingArray) {

    try {

      let data = this.companySettingdata.EcomSettingArray;

      // Fix invalid array/object strings
      data = data
        .replace(/"\[/g, '[')
        .replace(/\]"/g, ']')
        .replace(/"\{/g, '{')
        .replace(/\}"/g, '}');

      // Parse final json
      this.data = JSON.parse(data);
      this.PolicyNoteList = this.data.PolicyNote
      this.ReturnNoteList = this.data.ReturnNote
      this.TermConditionsList = this.data.TermConditions
      this.DayExchangeList = this.data.DayExchange
      this.freeImage =  this.data.complimentaryImage
      this.images =  this.data.SilderImage
      this.ecomLogo =  this.data.EcomLogo
      console.log(this.data);

    } catch (error) {

      console.error('JSON Error:', error);

      this.data = {};
    }
  }
}

   Sumbit() {
     this.sp.show();
     this.data.SilderImage = JSON.stringify(this.images);
     this.data.PolicyNote = JSON.stringify(this.PolicyNoteList);
     this.data.TermConditions = JSON.stringify(this.TermConditionsList);
     this.data.ReturnNote = JSON.stringify(this.ReturnNoteList);
     this.data.DayExchange = JSON.stringify(this.DayExchangeList);

     this.companySettingdata.EcomSettingArray = JSON.stringify(this.data)
      const subs: Subscription = this.cs.updatecompanysetting(this.companySettingdata).subscribe({
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
}



