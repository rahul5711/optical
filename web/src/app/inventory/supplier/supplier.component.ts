import { Component, OnInit, ViewEncapsulation } from '@angular/core';
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
import { SupplierService } from 'src/app/service/supplier.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-supplier',
  templateUrl: './supplier.component.html',
  styleUrls: ['./supplier.component.css'],
  encapsulation: ViewEncapsulation.None

})

export class SupplierComponent implements OnInit {

  user = JSON.parse(localStorage.getItem('user') || '');
  env: { production: boolean; apiUrl: string; appUrl: string; };

  id: any;
  companyImage: any;
  img: any;
  dataList: any;
  currentPage = 1;
  itemsPerPage = 10;
  pageSize!: number;
  collectionSize = 0
  page = 4;
  suBtn = false;

  constructor(
    private router: Router,
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private formBuilder: FormBuilder,
    public as: AlertService,
    private ss: SupplierService,
    private fu: FileUploadService,
    private sp: NgxSpinnerService,
    private modalService: NgbModal

  ) {
    this.id = this.route.snapshot.params['id'];
    this.env = environment
  }

  data: any = { ID : null, Sno: 0, Name : null, MobileNo1 : null, MobileNo2 : '', PhoneNo : '', Address : null, Email : '', Website : '',
  GSTNo : '', CINNo : '', PhotoURL : '', Remark : '', ContactPerson : '', Fax : '', DOB: '', Anniversary: '',
  Status : 1, CreatedBy : null, CreatedOn : null, UpdatedBy : null, UpdatedOn : null
  };

  ngOnInit(): void {
    this.getList(); 
  }

  onsubmit() {
    var supplierdate = this.data ?? " ";
    const subs: Subscription =  this.ss.supplierSave(supplierdate).subscribe({
      next: (res: any) => {
        if (res.success) {
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Your file has been Save.',
            showConfirmButton: false,
            timer: 1200
          }) 
          this.data = [];
          this.getList();
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

  getList() {
    this.sp.show()
    const dtm = {
      currentPage: this.currentPage,
      itemsPerPage: this.itemsPerPage
    }
    const subs: Subscription = this.ss.getList(dtm).subscribe({
      next: (res: any) => {
        this.collectionSize = res.count;
        this.dataList = res.data
        
        console.log(res.data);
        this.sp.hide();
        this.as.successToast(res.message)
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });

  }

  

  uploadImage(e:any, mode:any){
    if(e.target.files.length) {
      this.img = e.target.files[0];
    };
    this.fu.uploadFileComapny(this.img).subscribe((data:any) => {
      if (data.body !== undefined && mode === 'company') {
        this.companyImage = this.env.apiUrl + data.body?.download;
        this.data.PhotoURL = data.body?.download
        console.log(this.companyImage);
        this.as.successToast(data.body?.message)
      }
    });
  }

  deleteItem(i:any){
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

        const subs: Subscription = this.ss.deleteData(this.dataList[i].ID).subscribe({
          next: (res: any) => {
            this.dataList.splice(i, 1);
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
        this.getList();
      }
    })
  }

  getSupplierById(datas:any){
    this.suBtn = true;
    this.router.navigate(['/inventory/supplier',datas.ID]); 
    this.data = datas;
  }

  Clear(){
  this.suBtn = false;
  this.id = 0;
  this.data = { ID : null, Sno: this.data.Sno, Name : null, MobileNo1 : null, MobileNo2 : '', PhoneNo : '', Address : null, Email : '', Website : '',
  GSTNo : '', CINNo : '', PhotoURL : '', Remark : '', ContactPerson : '', Fax : '', DOB: '', Anniversary: '',
  Status : 1, CreatedBy : null, CreatedOn : null, UpdatedBy : null, UpdatedOn : null
   };
  }

  supplierUpdate(){
    const subs: Subscription =  this.ss.supplierUpdate( this.data).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.getList();
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
    this.modalService.dismissAll()
  }

  onChange(event: { toUpperCase: () => any; toTitleCase: () => any; }) {
    if (this.user.CompanySetting.DataFormat === '1') {
      event = event.toUpperCase()
    } else if (this.user.CompanySetting.DataFormat == '2') {
      event = event.toTitleCase()
    }
    return event;
  }

  openModal(content: any) {
   this.suBtn = false;
   this.id = 0;

   if(this.dataList.length == 0) {
    this.data.Sno = Number(this.data.Sno) + 1;
   }else {
    if(this.dataList[0].Sno != 'null') {
      this.data.Sno = Number(this.dataList[0].Sno) + 1;
    } else {
      this.data.Sno = 1
    }
   }
   
   this.data = { ID : null, Sno: this.data.Sno, Name : null, MobileNo1 : null, MobileNo2 : '', PhoneNo : '', Address : null, Email : '', Website : '',
    GSTNo : '', CINNo : '', PhotoURL : '', Remark : '', ContactPerson : '', Fax : '', DOB: '', Anniversary: '',
    Status : 1, CreatedBy : null, CreatedOn : null, UpdatedBy : null, UpdatedOn : null
   };
    this.modalService.open(content, { centered: true , backdrop : 'static', keyboard: false, size:'xl'});
  }
}
