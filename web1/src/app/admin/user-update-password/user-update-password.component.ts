import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators,ReactiveFormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2'; 
import { environment } from 'src/environments/environment';
import { CompanyService } from 'src/app/service/company.service';
import { AlertService } from 'src/app/service/helpers/alert.service';


@Component({
  selector: 'app-user-update-password',
  templateUrl: './user-update-password.component.html',
  styleUrls: ['./user-update-password.component.css']
})
export class UserUpdatePasswordComponent implements OnInit {
  loggedInUser:any = localStorage.getItem('LoggedINUser');
  env = environment;
  gridview = true;
  stringUrl: string | undefined;
  dataList: any;
  currentPage = 1;
  itemsPerPage = 10;
  pageSize!: number;
  collectionSize = 0
  page = 4;
  ConfirmPassword:any

  data = {ID: null, Password :''}
  id: any;
  permissions: any;
 
  constructor(
    private cs: CompanyService,
    private sp: NgxSpinnerService,
    public as: AlertService,
    private route: ActivatedRoute,
    private modalService: NgbModal
  ) { 
    this.id = this.route.snapshot.params['id'];
  }


   ngOnInit(): void {
    this.getList()
  }
  
  onPageChange(pageNum: number): void {
    this.pageSize = this.itemsPerPage * (pageNum - 1);
  }

  changePagesize(num: number): void {
    this.itemsPerPage = this.pageSize + num;
  }
   
  getList() {
    this.sp.show()
    const dtm = {
      currentPage: this.currentPage,
      itemsPerPage: this.itemsPerPage
    }
    const subs: Subscription = this.cs.getUserList(dtm).subscribe({
      next: (res: any) => {
        if(res.success){
          this.collectionSize = res.count;
          this.dataList = res.data;
          this.dataList.forEach((element: { PhotoURL: any; }) => {
            if(element.PhotoURL !== "null" && element.PhotoURL !== ""){
              element.PhotoURL = (this.env.apiUrl + element.PhotoURL);
            }else{
              element.PhotoURL = "../../../assets/images/userEmpty.png"
            }
          });
          this.as.successToast(res.message)
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
    this.sp.hide();
  }

  openModal(content: any,ID:any) {
    this.data.ID = ID
    this.modalService.open(content, { centered: true , backdrop : 'static', keyboard: false, size:'sm'});
  }

  UpdatePassword(){
    this.sp.show()
    if(this.data.Password === this.ConfirmPassword){
      const subs: Subscription = this.cs.updatePassword(this.data).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.data.Password = '';
            this.ConfirmPassword = '';
            this.modalService.dismissAll()
            Swal.fire({
              position: 'center',
              icon: 'success',
              title: 'User Password has been Updated',
              showConfirmButton: false,
              timer: 1000
            })
            this.as.successToast(res.message)
          } else {
            this.as.errorToast(res.message)
            Swal.fire({
              position: 'center',
              icon: 'error',
              title: 'Oops!! Incorrect Password',
              showConfirmButton: true,
              width: 400,
              backdrop: false
            })
          }
         this.sp.hide()
        },
        error: (err: any) => {
          console.log(err.message);
        },
        complete: () => subs.unsubscribe(),
      })
    }
    this.sp.hide()
  }


}
