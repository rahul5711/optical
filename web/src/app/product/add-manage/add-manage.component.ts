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
import { ProductService } from '../../service/product.service';
import { AlertService } from 'src/app/service/alert.service';
import { SupportService } from 'src/app/service/support.service';

@Component({
  selector: 'app-add-manage',
  templateUrl: './add-manage.component.html',
  styleUrls: ['./add-manage.component.css']
})
export class AddManageComponent implements OnInit {

  loggedInCompany:any = (localStorage.getItem('LoggedINCompany'));
  depList: any ;
  showFeild = false;
  showAdd = false;
  showAddService = false;
  selectedDepartment: any;
  selectedDepartmentHead: any;
  selectedProduct: any;

  constructor(
    private router: Router,
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private supps: SupportService,
    public as: AlertService,
    private sp: NgxSpinnerService,
  ) { }

  productType = [
    {Name: 'Fitting Type',value:'LensType'},
    {Name: 'Reference By',value:'ReferenceBy'},
    {Name: 'Doctor Type',value:'DoctorType'},
    {Name: 'PaymentMode Type',value:'PaymentModeType'},
    {Name: 'Tax Type',value:'TaxType'},
    {Name: 'Tray No',value:'TrayNo'},
    {Name: 'Gender',value:'Gender'},
    {Name: 'Customer Category',value:'CustomerCategory'},
    {Name: 'Location Master',value:'LocationMaster'},
    {Name: 'Other',value:'Other'},
  ]

  data1: any = { ID : null, CompanyID : null,  Name:'', Category : null, Status : 1, CreatedBy: null, UpdatedBy: null,};
  newDepartment: any  = {ID: null, CompanyID: null, Name: "", TableName:null,   Status: 1};

  selectedRow: any = {ID: null, CompanyID: null, Name: null, Description:null,  Price: 0, GSTPercentage: 0, GSTAmount: 0, GSTType: "None" };
  Service: any = {ID: null, CompanyID: null, Name: null, Description:null,  Price: 0, GSTPercentage: 0, GSTAmount: 0, GSTType: "None" };

  dataList:any
  serviceList:any
  gstList:any
  
  ngOnInit(): void {
    this.chargelist();
    this.servicelist();
    this.getList();
  }

  getfieldList(){
    if (this.selectedProduct !== null || this.selectedProduct !== '' ){
    this.showFeild = true;
    const subs: Subscription = this.supps.getList(this.selectedProduct).subscribe({
      next: (res: any) => {
        this.depList = res.data;
        this.sp.hide();
        this.as.successToast(res.message)
      },
    error: (err: any) => console.log(err.message),
    complete: () => subs.unsubscribe(),
    });
  }
  }

  showData(){
    this.depList.forEach((element: { Name: any; DepartmentHead: any; ID: any; }) => {
      if (element.Name === this.selectedDepartment) {this.selectedDepartmentHead = element.DepartmentHead; this.selectedDepartment = element.ID; }
    });
  }

  saveDepartment(){
    let count = 0;
    this.depList.forEach((element: { Name: string; }) => {
    if (element.Name.toLowerCase() === this.newDepartment.Name.toLowerCase() ){count = count + 1; }
    });
    if (count === 0 && this.newDepartment.Name !== ''){
      this.newDepartment.TableName = this.selectedProduct;
      this.supps.saveData(this.newDepartment.TableName, this.newDepartment.Name).subscribe(data => {
      this.newDepartment.Name = "";
      this.getfieldList();
      });
    }else { 
      Swal.fire({
        icon: 'error',
        title: 'Duplicate or Empty Values are not allowed',
        text: '',
        footer: ''
      });
    this.newDepartment.Name = ""; }
  }

  delSupport(){
    if (this.data1.Category === null) {
      Swal.fire({
        position: 'center',
        icon: 'warning',
        title: 'Please Select Value.',
        showConfirmButton: false,
        timer: 2000
      }) 
    }else{
    this.depList.forEach((element: { Name: any; ID: any; }) => {
      if(element.Name === this.data1.Category) {
        const subs: Subscription =   this.supps.deleteSupport(this.selectedProduct, element.Name).subscribe({
        next: (res: any) => {
          if (res.success) {
            Swal.fire({
              position: 'center',
              icon: 'success',
              title: 'Your file has been deleted.',
              showConfirmButton: false,
              timer: 1200
            }) 
          }else {
              this.as.errorToast(res.message)
          }
        },
        error: (err: any) => {
          console.log(err.msg);
        },
        complete: () => subs.unsubscribe(),
        });
        this.getfieldList();
      }
    });
    }
  }

  setValues(){
    this.dataList.forEach((element: { ID: any; Name:any; Price: any; Description: any; GSTAmount: any; GSTPercentage: any; GSTType: any; TotalAmount: any; }) => {
      if (element.Name === this.selectedRow.Name) {
      this.selectedRow.Price = element.Price;
      this.selectedRow.Description = element.Description;
      this.selectedRow.GSTAmount = element.GSTAmount;
      this.selectedRow.GSTPercentage = element.GSTPercentage;
      this.selectedRow.GSTType = element.GSTType;
      this.selectedRow.TotalAmount = element.TotalAmount;
      }
    });
  }

  calculate(fieldName: string, mode: any){
    switch (mode) {
      case 'chgst':
        if (fieldName === 'GSTPercentage') {
          this.selectedRow.GSTAmount =+this.selectedRow.Price * +this.selectedRow.GSTPercentage / 100;
        }
        if (fieldName === 'GSTAmount') {
          this.selectedRow.GSTPercentage = 100 * +this.selectedRow.GSTAmount / (+this.selectedRow.Price);
        }
        break;
        case 'chtotal':
          this.selectedRow.TotalAmount = +this.selectedRow.GSTAmount + +this.selectedRow.Price;
        break;
    }
  
  }

  resetData(){
    this.selectedRow = {ID: null, CompanyID: null, Name: null, Cost: 0, Price: 0, GSTPercentage: 0, GSTAmount: 0, GSTType: "None" };
  }

  chargesave(){
    const subs: Subscription =  this.supps.chargesave( this.selectedRow).subscribe({
      next: (res: any) => {
        // this.dataList = res.result;
        // console.log(this.dataList);
        if (res.success) {
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Your file has been Save.',
            showConfirmButton: false,
            timer: 1200
          }) 
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Duplicate or Empty Values are not allowed',
            text: '',
            footer: ''
          }); 
          this.as.errorToast(res.message)
        }
      },
      error: (err: any) => {
        console.log(err.msg);
      },
      complete: () => subs.unsubscribe(),
    });
    
    this.resetData();
    this.chargelist();
  }

  chargedelete(i: string | number){
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
        const subs: Subscription = this.supps.chargedelete(this.dataList[i].Name).subscribe({
          next: (res: any) => {
            this.dataList.splice(i, 1);
            this.sp.hide();
            this.as.successToast(res.message)
          },
          error: (err: any) => console.log(err.message),
          complete: () => subs.unsubscribe(),
        });
      this.selectedRow = {ID: null, CompanyID: null, Name: null, Description: null, Price: 0, GSTPercentage: 0, GSTAmount: 0, GSTType: "None" };
        this.chargelist();
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

  chargelist(){
    const subs: Subscription = this.supps.chargelist(this.selectedRow).subscribe({
      next: (res: any) => {
        this.dataList = res.data
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getList(){
    const subs: Subscription = this.supps.getList('TaxType').subscribe({
      next: (res: any) => {
        this.gstList = res.data
        this.sp.hide();
        
      },
    error: (err: any) => console.log(err.message),
    complete: () => subs.unsubscribe(),
    });
  }

  setValuesService(){
    this.serviceList.forEach((element: { ID: any; Name:any; Price: any; Description: any; GSTAmount: any; GSTPercentage: any; GSTType: any; TotalAmount: any; }) => {
      if (element.Name === this.Service.Name) {
      this.Service.Price = element.Price;
      this.Service.Description = element.Description;
      this.Service.GSTAmount = element.GSTAmount;
      this.Service.GSTPercentage = element.GSTPercentage;
      this.Service.GSTType = element.GSTType;
      this.Service.TotalAmount = element.TotalAmount;
      }
    });
  }

  calculateSevice(fieldName: string, mode: any){
    switch (mode) {
      case 'chgst1':
        if (fieldName === 'GSTPercentage') {
          this.Service.GSTAmount =+this.Service.Price * +this.Service.GSTPercentage / 100;
        }
        if (fieldName === 'GSTAmount') {
          this.Service.GSTPercentage = 100 * +this.Service.GSTAmount / (+this.Service.Price);
        }
        break;
        case 'chtotal1':
          this.Service.TotalAmount = +this.Service.GSTAmount + +this.Service.Price;
        break;
    }
  
  }
  
  serviceresetData(){
    this.Service = {ID: null, CompanyID: null, Name: null, Cost: 0, Price: 0, GSTPercentage: 0, GSTAmount: 0, GSTType: "None" };
  }

  servicesave(){
    const subs: Subscription =  this.supps.servicesave(this.Service).subscribe({
      next: (res: any) => {
        // this.serviceList = res.result;
        // console.log(this.dataList);
        if (res.success) {
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Your file has been Save.',
            showConfirmButton: false,
            timer: 1200
          }) 
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Duplicate or Empty Values are not allowed',
            text: '',
            footer: ''
          }); 
          this.as.errorToast(res.message)
        }
      },
      error: (err: any) => {
        console.log(err.msg);
      },
      complete: () => subs.unsubscribe(),
    });
    this.serviceresetData();
    this.servicelist();
  
  }

  servicedelete(i: string | number){
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
        const subs: Subscription = this.supps.servicedelete(this.serviceList[i].Name).subscribe({
          next: (res: any) => {
            this.serviceList.splice(i, 1);
            this.sp.hide();
            this.as.successToast(res.message)
          },
          error: (err: any) => console.log(err.message),
          complete: () => subs.unsubscribe(),
        });
      this.Service = {ID: null, CompanyID: null, Name: null, Description: null, Price: 0, GSTPercentage: 0, GSTAmount: 0, GSTType: "None" };
        this.servicelist();
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

  servicelist(){
    const subs: Subscription = this.supps.servicelist(this.Service).subscribe({
      next: (res: any) => {
        this.serviceList = res.data
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

}
