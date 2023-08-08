import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators,ReactiveFormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2'; 
import { AlertService } from 'src/app/service/helpers/alert.service';
import { FileUploadService } from 'src/app/service/helpers/file-upload.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DoctorService } from 'src/app/service/doctor.service';
import { take } from 'rxjs/operators';
import { CompressImageService } from 'src/app/service/helpers/compress-image.service';


@Component({
  selector: 'app-doctor',
  templateUrl: './doctor.component.html',
  styleUrls: ['./doctor.component.css']
})
export class DoctorComponent implements OnInit {

  user = JSON.parse(localStorage.getItem('user') || '');
  companysetting = JSON.parse(localStorage.getItem('companysetting') || '');
  permission = JSON.parse(localStorage.getItem('permission') || '[]');
  env: { production: boolean; apiUrl: string; appUrl: string; };

  id: any;
  userImage: any;
  img: any;


  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    public as: AlertService,
    private ds: DoctorService,
    private fu: FileUploadService,
    private sp: NgxSpinnerService,
    private modalService: NgbModal,
    private compressImage: CompressImageService
  ) {
    this.id = this.route.snapshot.params['id'];
    this.env = environment
   }

   data: any = {
    ID: null, CompanyID: null, Name: '', DOB: '', Anniversary: '', Designation: '', Qualification: null, HospitalName: null, MobileNo1: null,
    MobileNo2: null, PhoneNo: null, Email: null, Address: null, Branch: null, Landmark: null, PhotoURL: null, DoctorType: null,
    DoctorLoyalty: null, LoyaltyPerPatient: null, LoginPermission: 0, LoginName: '', Password: '', Status: 1, CreatedBy: null,
    UpdatedBy: null, CreatedOn: null, UpdatedOn: null, CommissionType: 0, CommissionMode: 0, CommissionValue: 0, CommissionValueNB: 0
  };

  editDoctor = false
  addDoctor = false
  deleteDoctor = false

  ngOnInit(): void {
    this.permission.forEach((element: any) => {
      if (element.ModuleName === 'Doctor') {
        this.editDoctor = element.Edit;
        this.addDoctor = element.Add;
        this.deleteDoctor = element.Delete;
      }
    });
    if (this.id != 0) {
      this.getDoctorById(); 
    }
  }

  uploadImage(e:any, mode:any){
    this.img = e.target.files[0];
      // console.log(`Image size before compressed: ${this.img.size} bytes.`)
    this.compressImage.compress(this.img).pipe(take(1)).subscribe((compressedImage: any) => {
      // console.log(`Image size after compressed: ${compressedImage.size} bytes.`)
    this.fu.uploadFileComapny(compressedImage).subscribe((data:any) => {
      if (data.body !== undefined && mode === 'company') {
        this.userImage = this.env.apiUrl + data.body?.download;
        this.data.PhotoURL = data.body?.download;
        this.as.successToast(data.body?.message)
      }
     });
   })
  }

  onsubmit() {
    this.sp.show()
    const subs: Subscription =  this.ds.saveDoctor( this.data).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.router.navigate(['/sale/doctorList']); 
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
        this.sp.hide()
      },
      error: (err: any) => {
        console.log(err.msg);
      },
      complete: () => subs.unsubscribe(),
    });
    this.modalService.dismissAll()
  } 

  updateDoctor(){
    this.sp.show()
    const subs: Subscription =  this.ds.updateDoctor( this.data).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.router.navigate(['/sale/doctorList']);
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
        this.sp.hide()
      },
      error: (err: any) => {
        console.log(err.msg);
      },
      complete: () => subs.unsubscribe(),
    });
  }

  getDoctorById(){
    this.sp.show()
    const subs: Subscription = this.ds.getDoctorById(this.id).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.as.successToast(res.message)
          this.data = res.data[0]
          if (res.data[0].PhotoURL !== "null" && res.data[0].PhotoURL !== '') {
            this.userImage = this.env.apiUrl + res.data[0].PhotoURL;
          } else {
            this.userImage = "/assets/images/userEmpty.png"
          }
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

  onChange(event: { toUpperCase: () => any; toTitleCase: () => any; }) {
    if (this.companysetting.DataFormat === '1') {
      event = event.toUpperCase()
    } else if (this.companysetting.DataFormat == '2') {
      event = event.toTitleCase()
    }
    return event;
  }

 

}
