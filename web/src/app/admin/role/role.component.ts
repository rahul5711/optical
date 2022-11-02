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
import { AlertService } from 'src/app/service/alert.service';
import { RoleService } from 'src/app/service/role.service';

@Component({
  selector: 'app-role',
  templateUrl: './role.component.html',
  styleUrls: ['./role.component.css']
})
export class RoleComponent implements OnInit {

  constructor(
    private router: Router,
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private role: RoleService,
    public as: AlertService,
    private sp: NgxSpinnerService,
  ) { }

  loggedInCompany:any = (localStorage.getItem('LoggedINCompany') || '');
  user = (localStorage.getItem('user') || '');

  selectedRole :any = {ID: null, Name: "", CompanyID: this.loggedInCompany, Permission: "[]", Status: 1};

  roleList :any
  showAdd = false;
  displayModule :any= true;

  moduleList: any = [
    {ModuleName: 'CompanyInfo', MView: true, Edit: true, Add: true, View: true, Delete: true},
  ];

  ngOnInit(): void {
    this.getList();
  }

  saveRole(){
    const subs: Subscription =  this.role.roleSave(this.selectedRole.Name,this.selectedRole.Permission).subscribe({
      next: (res: any) => {
        this.roleList = res.result;
        console.log(this.roleList);
        this.getList();
        if (res.success) {
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
    
  }

  deleteRole(){
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
        const subs: Subscription = this.role.deleteRole(this.selectedRole.ID).subscribe({
          next: (res: any) => {
            this.getList();
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

  getList(){
    const subs: Subscription = this.role.getList().subscribe({
      next: (res: any) => {
        this.roleList = res.data
        console.log(this.roleList);
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }


  

}
