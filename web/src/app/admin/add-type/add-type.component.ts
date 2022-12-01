import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators,ReactiveFormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { Subscription } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2'; 
import { AlertService } from 'src/app/service/alert.service';
import { SupportService } from 'src/app/service/support.service';

@Component({
  selector: 'app-add-type',
  templateUrl: './add-type.component.html',
  styleUrls: ['./add-type.component.css']
})
export class AddTypeComponent implements OnInit {

  loggedInCompany:any = (localStorage.getItem('LoggedINCompany'));
  depList: any ;
  showFeild = false;
  showAdd = false;
  selectedDepartment: any;
  selectedDepartmentHead: any;
  selectedProduct: any;

  constructor(
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
    {Name: 'Expense Type',value:'ExpenseType'},
    {Name: 'Location Master',value:'LocationMaster'},
    {Name: 'Other',value:'Other'},
    {Name: 'Lens Type',value:'LensType'},
  ]

  data1: any = { ID : null, CompanyID : null,  Name:'', Category : null, Status : 1, CreatedBy: null, UpdatedBy: null,};
  newDepartment: any  = {ID: null, CompanyID: null, Name: "", TableName:null,   Status: 1};

  ngOnInit(): void {
  }

  getfieldList() {
    if (this.selectedProduct !== null || this.selectedProduct !== '' ){
    this.showFeild = true;
    const subs: Subscription = this.supps.getList(this.selectedProduct).subscribe({
      next: (res: any) => {
        this.depList = res.data
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

}
