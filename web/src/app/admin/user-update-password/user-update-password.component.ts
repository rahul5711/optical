import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators,ReactiveFormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router';

import { ThemePalette } from '@angular/material/core';

import { MatSnackBar } from '@angular/material/snack-bar';
import { CompanyService } from '../../service/company.service';
import { Subscription } from 'rxjs';
import { AlertService } from '../../service/alert.service';
import { environment } from 'src/environments/environment';
import { NgxSpinnerService } from 'ngx-spinner';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2'; 

@Component({
  selector: 'app-user-update-password',
  templateUrl: './user-update-password.component.html',
  styleUrls: ['./user-update-password.component.css']
})
export class UserUpdatePasswordComponent implements OnInit {
  loggedInUser:any = localStorage.getItem('LoggedINUser');
  evn = environment;
  stringUrl: string | undefined;
  dataList: any;
  currentPage = 1;
  itemsPerPage = 10;
  pageSize!: number;
  collectionSize = 0
  page = 4;
 

  data = {ID: null, Password :''}
  id: any;
  permissions: any;
 
  constructor(
    private cs: CompanyService,
    private sp: NgxSpinnerService,
    private snackBar: MatSnackBar,
    public as: AlertService,
    private route: ActivatedRoute,
    private modalService: NgbModal
  ) { 
    this.id = this.route.snapshot.params['id'];
  }


  
  
   ngOnInit(): void {
    
    console.log(this.id);
    
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
        this.dataList = res.data
        console.log(res.data);
        this.sp.hide();
        this.as.successToast(res.message)
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  openModal(content: any,ID:any) {
    this.data.ID = ID
    console.log(this.data.ID);
    this.modalService.open(content, { centered: true , backdrop : 'static', keyboard: false,});
  }

  UpdatePassword(){
    
    const subs: Subscription = this.cs.updatePassword(this.data).subscribe({
      next: (res: any) => {
        console.log(res.data);
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
    Swal.fire({
      position: 'center',
      icon: 'success',
      title: 'User Password has been Updated',
      showConfirmButton: false,
      timer: 1000
    })
  }

 
 

}
