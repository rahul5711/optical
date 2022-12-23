import { Component, OnInit,Output,EventEmitter, Input } from '@angular/core';
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
import { take } from 'rxjs/operators';
import * as moment from 'moment';
import { CustomerModel, SpectacleModel, ContactModel, OtherModel } from 'src/app/interface/Customer';
import { CustomerService } from 'src/app/service/customer.service';
import { outputAst } from '@angular/compiler';
import { CompressImageService } from 'src/app/service/helpers/compress-image.service';

@Component({
  selector: 'app-customer-power-list',
  templateUrl: './customer-power-list.component.html',
  styleUrls: ['./customer-power-list.component.css']
})
export class CustomerPowerListComponent implements OnInit {

  user = JSON.parse(localStorage.getItem('user') || '');
  companysetting = JSON.parse(localStorage.getItem('companysetting') || '');
  env = environment;
  id: any;

  @Input('spectacleChild') public spectacleChild:any=[];
  @Input('contactChild') public contactChild:any=[];
  @Input('otherChild') public otherChild:any=[];


  
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    public as: AlertService,
    private fu: FileUploadService,
    private sp: NgxSpinnerService,
    private modalService: NgbModal,
    private compressImage: CompressImageService,
    private cs: CustomerService
  ) {
    this.id = this.route.snapshot.params['id'];
  }



  ngOnInit(): void {
 
  }
  
  deleteSpec(i:any){
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
        const subs: Subscription = this.cs.deleteSpec(this.spectacleChild[0][i].ID,this.spectacleChild[0][i].CustomerID,'spectacle_rx').subscribe({
          next: (res: any) => {
            this.spectacleChild[0].splice(i, 1);
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


  deleteCon(i:any){
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
        const subs: Subscription = this.cs.deleteSpec(this.contactChild[0][i].ID,this.contactChild[0][i].CustomerID,'contact_lens_rx').subscribe({
          next: (res: any) => {
            this.contactChild[0].splice(i, 1);
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


  deleteOther(i:any){
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
        const subs: Subscription = this.cs.deleteSpec(this.otherChild[0][i].ID,this.otherChild[0][i].CustomerID,'other_rx').subscribe({
          next: (res: any) => {
            this.otherChild[0].splice(i, 1);
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
  
  edits(data:any){
    this.spectacleChild = data;
  }
}
