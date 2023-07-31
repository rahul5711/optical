import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { FileUploadService } from 'src/app/service/helpers/file-upload.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FitterService } from 'src/app/service/fitter.service';
import { SupportService } from 'src/app/service/support.service';
import { ShopService } from 'src/app/service/shop.service';
import { take } from 'rxjs/operators';
import { CompressImageService } from 'src/app/service/helpers/compress-image.service';


@Component({
  selector: 'app-fitter',
  templateUrl: './fitter.component.html',
  styleUrls: ['./fitter.component.css']
})
export class FitterComponent implements OnInit {

  user = JSON.parse(localStorage.getItem('user') || '');
  companysetting = JSON.parse(localStorage.getItem('companysetting') || '');
  env: { production: boolean; apiUrl: string; appUrl: string; };

  id: any;
  userImage: any;
  img: any;


  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    public as: AlertService,
    private fs: FitterService,
    private fu: FileUploadService,
    private sp: NgxSpinnerService,
    private modalService: NgbModal,
    private supps: SupportService,
    private ss: ShopService,
    private compressImage: CompressImageService
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

  rateCardList: any
  LensTypeList: any;
  assignShopList: any
  dropShoplist: any

  ngOnInit(): void {
    if (this.id != 0) {
      this.getFitterById();
    }
    this.getList();
    this.dropdownShoplist();
  }

  getList() {
    this.sp.show();
    const subs: Subscription = this.supps.getList('LensType').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.LensTypeList = res.data
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
    this.sp.hide();
  }

  dropdownShoplist() {
    this.sp.show();
    const subs: Subscription = this.ss.dropdownShoplist(this.user).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.dropShoplist = res.data
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
    this.sp.hide();
  }

  onsubmit() {
    this.sp.show();
    var fitterdate = this.data ?? " ";
    const subs: Subscription = this.fs.saveFitter(fitterdate).subscribe({
      next: (res: any) => {
        if (res.success) {
          if (res.data !== 0) {
            this.id = res.data;
            this.router.navigate(['/inventory/fitter', this.id]);
            Swal.fire({
              position: 'center',
              icon: 'success',
              title: 'Your file has been Save.',
              showConfirmButton: false,
              timer: 1200
            })
            this.getFitterById();
          }
          this.modalService.dismissAll()
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
    this.sp.hide();
  }

  updateFitter() {
    this.sp.show();
    const subs: Subscription = this.fs.updateFitter(this.data).subscribe({
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
        this.sp.hide();
      },
      error: (err: any) => {
        console.log(err.msg);
      },
      complete: () => subs.unsubscribe(),
    });
    this.sp.hide();
  }

  getFitterById() {
    this.sp.show();
    const subs: Subscription = this.fs.getFitterById(this.id).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.rateCardList = res.RateCard
          this.assignShopList = res.AssignedShop
          this.data = res.data[0]
          this.userImage = this.env.apiUrl + res.data[0].PhotoURL;
          this.as.successToast(res.message)
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => {
        console.log(err.message);
      },
      complete: () => subs.unsubscribe(),
    })
    this.sp.hide();
  }

  onChange(event: { toUpperCase: () => any; toTitleCase: () => any; }) {
    if (this.companysetting.DataFormat === '1') {
      event = event.toUpperCase()
    } else if (this.companysetting.DataFormat == '2') {
      event = event.toTitleCase()
    }
    return event;
  }

  uploadImage(e: any, mode: any) {

    this.img = e.target.files[0];
    // console.log(`Image size before compressed: ${this.img.size} bytes.`)
    this.compressImage.compress(this.img).pipe(take(1)).subscribe((compressedImage: any) => {
      // console.log(`Image size after compressed: ${compressedImage.size} bytes.`)
      this.fu.uploadFileComapny(compressedImage).subscribe((data: any) => {
        if (data.body !== undefined && mode === 'company') {
          this.userImage = this.env.apiUrl + data.body?.download;
          this.data.PhotoURL = data.body?.download;
          this.as.successToast(data.body?.message)
        }
      });
    })
  }

  saveRateCard() {
    this.sp.show();
    this.rateCard.FitterID = this.id;
    const subs: Subscription = this.fs.saveRateCard(this.rateCard).subscribe({
      next: (res: any) => {
        if (res.success) {
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
        this.sp.hide();
      },
      error: (err: any) => {
        console.log(err.msg);
      },
      complete: () => subs.unsubscribe(),
    });
    this.sp.hide();
  }

  deleteRateCard(i: any) {
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
            if (res.success) {
              this.rateCardList.splice(i, 1);
              this.as.successToast(res.message)
              Swal.fire({
                position: 'center',
                icon: 'success',
                title: 'Your file has been deleted.',
                showConfirmButton: false,
                timer: 1000
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
    })
    this.sp.hide();
  }

  saveFitterAssignedShop() {
    this.sp.show();
    this.assignShop.FitterID = this.id;
    const subs: Subscription = this.fs.saveFitterAssignedShop(this.assignShop).subscribe({
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
        this.sp.hide();
      },
      error: (err: any) => {
        console.log(err.msg);
      },
      complete: () => subs.unsubscribe(),
    });
    this.sp.hide();
  }

  deleteFitterAssignedShop(i: any) {
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
            if (res.success) {
              this.assignShopList.splice(i, 1);
              this.as.successToast(res.message)
              Swal.fire({
                position: 'center',
                icon: 'success',
                title: 'Your file has been deleted.',
                showConfirmButton: false,
                timer: 1000
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
    })
   this.sp.hide();
  }

}
