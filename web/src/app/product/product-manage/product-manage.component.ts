
import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators,ReactiveFormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router';
import { ThemePalette } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2'; 
@Component({
  selector: 'app-product-manage',
  templateUrl: './product-manage.component.html',
  styleUrls: ['./product-manage.component.css']
})
export class ProductManageComponent implements OnInit {

  constructor(
    private router: Router,
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,

  ) { }

  env = environment;



  specList: any;
  gstList: any;
  
  newSpec: any = {ID : null, ProductName: '', Name : '', Seq: null,  Type: '', Ref: 0, SptTableName: '', Required: false  };
  selectedProduct: any = '';
  selectedHSNCode: any = '';
  selectedGSTPercentage: any = 0;
  selectedGSTType: any = '';
  
  showAdd = false;
  newProduct = {Name: "", HSNCode: "", GSTPercentage: 0, GSTType: "None"};
  fieldType: any[] = [{ID: 1, Name: "DropDown"}, {ID: 2, Name: "Text"}, {ID: 3, Name: "boolean"} , {ID: 4, Name: "Date"}];
    selectedProductID: any;
    searchValue:any;


  ngOnInit(): void {
  }

}
