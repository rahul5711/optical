import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators,ReactiveFormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2'; 
import * as moment from 'moment';
import { AlertService } from 'src/app/service/alert.service';
import { FileUploadService } from 'src/app/service/file-upload.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FitterService } from 'src/app/service/fitter.service';
import { SupportService } from 'src/app/service/support.service';
import { ShopService } from 'src/app/service/shop.service';

@Component({
  selector: 'app-fitter',
  templateUrl: './fitter.component.html',
  styleUrls: ['./fitter.component.css']
})
export class FitterComponent implements OnInit {

  user = JSON.parse(localStorage.getItem('user') || '');
  env: { production: boolean; apiUrl: string; appUrl: string; };

  id: any;
  userImage: any;
  img: any;
 

  constructor(
    private router: Router,
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private formBuilder: FormBuilder,
    public as: AlertService,
    private fs: FitterService,
    private fu: FileUploadService,
    private sp: NgxSpinnerService,
    private modalService: NgbModal,
    private supps: SupportService,
    private ss: ShopService,
  ) { 
    this.id = this.route.snapshot.params['id'];
    this.env = environment
  }

  data: any = {
    ID: null, ShopID: null, Name: '', MobileNo1: '', MobileNo2: '', PhoneNo: '', Address: '', Email: '', Website: '',
    GSTNo: '', CINNo: '', PhotoURL: '', Remark: '', ContactPerson: '', Fax: '', DOB: '', Anniversary: '',
    Status: 1, CreatedBy: null, CreatedOn: null, UpdatedBy: null, UpdatedOn: null
  };

  rateCard: any = { ID: null, CompanyID: null, FitterID: null, LensType: null, Rate: 0 };
  assignShop: any = { ID: null, CompanyID: null, ShopID: null, FitterID: null };

  rateCardList:any
  LensTypeList: any;
  assignShopList:any
  dropShoplist:any

  ngOnInit(): void {
    if (this.id != 0) {
      this.getFitterById(); 
    }
    this.getList();
    this.dropdownShoplist();
  }

  getList(){
    const subs: Subscription = this.supps.getList('LensType').subscribe({
      next: (res: any) => {
        this.LensTypeList = res.data
      },
    error: (err: any) => console.log(err.message),
    complete: () => subs.unsubscribe(),
    });
  }

  dropdownShoplist(){
    const subs: Subscription = this.ss.dropdownShoplist(this.user).subscribe({
      next: (res: any) => {
        this.dropShoplist = res.data
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  onsubmit() {
    var fitterdate = this.data ?? " ";
    const subs: Subscription =  this.fs.saveFitter(fitterdate).subscribe({
      next: (res: any) => {
        if (res.success) {
          // this.router.navigate(['/inventory/fitterList']); 

          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Your file has been Save.',
            showConfirmButton: false,
            timer: 1200
          }) 
        } else {
          this.as.errorToast(res.message)
        }
      },
      error: (err: any) => {
        console.log(err.msg);
      },
      complete: () => subs.unsubscribe(),
    });
    this.modalService.dismissAll()
  } 

  updateFitter(){
    const subs: Subscription =  this.fs.updateFitter(this.data).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.router.navigate(['/inventory/fitterList']);
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Your file has been Update.',
            showConfirmButton: false,
            timer: 1200
          })   
        } else {
          this.as.errorToast(res.message)
        }
      },
      error: (err: any) => {
        console.log(err.msg);
      },
      complete: () => subs.unsubscribe(),
    });
  }

  getFitterById(){
    const subs: Subscription = this.fs.getFitterById(this.id).subscribe({
      next: (res: any) => {
        this.rateCardList = res.RateCard
        this.assignShopList = res.AssignedShop
        if (res.success) {
          this.as.successToast(res.message)
          this.data = res.data[0]
          this.userImage = this.env.apiUrl + res.data[0].PhotoURL;
        } else {
          this.as.errorToast(res.message)
        }
      },
      error: (err: any) => {
        console.log(err.message);
      },
      complete: () => subs.unsubscribe(),
    })
  }

  onChange(event: { toUpperCase: () => any; toTitleCase: () => any; }) {
    if (this.user.CompanySetting.DataFormat === '1') {
      event = event.toUpperCase()
    } else if (this.user.CompanySetting.DataFormat == '2') {
      event = event.toTitleCase()
    }
    return event;
  }

  uploadImage(e:any, mode:any){
    if(e.target.files.length) {
      this.img = e.target.files[0];
    };
    this.fu.uploadFileComapny(this.img).subscribe((data:any) => {
      if (data.body !== undefined && mode === 'company') {
        this.userImage = this.env.apiUrl + data.body?.download;
        this.data.PhotoURL = data.body?.download
        console.log(this.userImage);
        this.as.successToast(data.body?.message)
      }
    });
  }

  saveRateCard() {
    this.rateCard.FitterID = this.id;
    const subs: Subscription =  this.fs.saveRateCard(this.rateCard).subscribe({
      next: (res: any) => {
        if (res.success) {
          // this.router.navigate(['/inventory/fitterList']); 

          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Your LensType has been Save.',
            showConfirmButton: false,
            timer: 1200
          }) 
          this.getFitterById()
        } else {
          this.as.errorToast(res.message)
        }
      },
      error: (err: any) => {
        console.log(err.msg);
      },
      complete: () => subs.unsubscribe(),
    });
  } 

  deleteRateCard(i:any){
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
        this.sp.show();
        const subs: Subscription = this.fs.deleteRateCard(this.rateCardList[i].ID).subscribe({
          next: (res: any) => {
            this.rateCardList.splice(i, 1);
            this.sp.hide();
            this.as.successToast(res.message)
          },
          error: (err: any) => console.log(err.message),
          complete: () => subs.unsubscribe(),
        });
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

  saveFitterAssignedShop() {
    this.assignShop.FitterID = this.id;
    const subs: Subscription =  this.fs.saveFitterAssignedShop(this.assignShop).subscribe({
      next: (res: any) => {

        if (res.success) {
          // this.router.navigate(['/inventory/fitterList']); 

          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Your AssignShop has been Save.',
            showConfirmButton: false,
            timer: 1200
          }) 
          this.getFitterById()
        } else {
          this.as.errorToast(res.message)
        }
      },
      error: (err: any) => {
        console.log(err.msg);
      },
      complete: () => subs.unsubscribe(),
    });
  } 

  deleteFitterAssignedShop(i:any){
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
        this.sp.show();
        const subs: Subscription = this.fs.deleteFitterAssignedShop(this.assignShopList[i].ID).subscribe({
          next: (res: any) => {
            this.assignShopList.splice(i, 1);
            this.sp.hide();
            this.as.successToast(res.message)
          },
          error: (err: any) => console.log(err.message),
          complete: () => subs.unsubscribe(),
        });
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
  
}
