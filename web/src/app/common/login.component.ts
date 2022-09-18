import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators,ReactiveFormsModule } from '@angular/forms';
import {NgForm} from '@angular/forms';
import * as  particlesJS from 'angular-particle';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AlertService } from '../service/alert.service';
import { AuthServiceService } from '../service/auth-service.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  particlesJS: any;
  data = {LoginName : '', Password:''}

  constructor(  private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    public as: AlertService,
    private auth: AuthServiceService
    ) { }
  

  ngOnInit(): void {


  }

  onSubmit(){
    if(this.data.LoginName === "") {
     return this.as.errorToast("please fill up login name")
    }
    if (this.data.Password === "") {
     return this.as.errorToast("please fill up password")
    }

    const subs: Subscription = this.auth.login(this.data).subscribe({
      next: (res: any) => {
        console.log(res , 'response');
        
        if (res.success == true) {

         this.as.successToast(res.message)
         this.router.navigate(['/admin/CompanyDashborad']);
        }
        else {
          this.as.errorToast(res.message);
        }
      },
      error: (err: any) => console.log(err .message),
      complete: () => subs.unsubscribe(),
    });
  
  }
}
