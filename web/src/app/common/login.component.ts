import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators,ReactiveFormsModule } from '@angular/forms';
import {NgForm} from '@angular/forms';
import * as  particlesJS from 'angular-particle';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  particlesJS: any;
  data = {UserName : '', Password:''}

  constructor(  private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,) { }
  

  ngOnInit(): void {


  }

  onSubmit(){
    console.log(this.data,);
    this.router.navigate(['/admin/CompanyDashborad']);
  }
}
