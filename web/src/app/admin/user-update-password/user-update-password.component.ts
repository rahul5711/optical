import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators,ReactiveFormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CompanyService } from '../../service/company.service';
import { Subscription } from 'rxjs';
import { AlertService } from '../../service/alert.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2'; 
import { environment } from '../../../environments/environment';

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
        this.collectionSize = res.count;
        this.dataList = res.data;
        this.dataList.forEach((element: { PhotoURL: any; }) => {
          if(element.PhotoURL !== "null" && element.PhotoURL !== ""){
            element.PhotoURL = (this.env.apiUrl + element.PhotoURL);
          }else{
            element.PhotoURL = "../../../assets/images/userEmpty.png"
          }
        });
        this.sp.hide();
        this.as.successToast(res.message)
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  openModal(content: any,ID:any) {
    this.data.ID = ID
    this.modalService.open(content, { centered: true , backdrop : 'static', keyboard: false, size:'sm'});
  }

  UpdatePassword(){
    if(this.data.Password === this.ConfirmPassword){
      const subs: Subscription = this.cs.updatePassword(this.data).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.as.successToast(res.message)
          } else {
            this.as.errorToast(res.message)
          }
        },
        error: (err: any) => {
          console.log(err.message);
        },
        complete: () => subs.unsubscribe(),
      })
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
    }else{
      Swal.fire({
        position: 'center',
        icon: 'error',
        title: 'Oops!! Incorrect Password',
        // text: 'Password don`t match',
        showConfirmButton: true,
        // background: '#fff url(../../../assets/images/relinksyslogo.png)',
        width: 400,
        backdrop: false
      
      })
    }
    
  }

 
 

}
