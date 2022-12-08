import { Component, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators,ReactiveFormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2'; 
import { AlertService } from 'src/app/service/alert.service';
import { MatSelect } from '@angular/material/select';
import { ProductService } from 'src/app/service/product.service';
@Component({
  selector: 'app-product-master',
  templateUrl: './product-master.component.html',
  styleUrls: ['./product-master.component.css']
})
export class ProductMasterComponent implements OnInit {

  user = JSON.parse(localStorage.getItem('user') || '');
  id: any;
  env = environment;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private ps: ProductService,
    public as: AlertService,
    private sp: NgxSpinnerService,

  ) {
    this.id = this.route.snapshot.params['id'];
   }
   
   @ViewChild('singleSelect', { static: true }) singleSelect: MatSelect | undefined;

   specList: any = [
    { SpecID : 33, ProductName : "Frame", CompanyID : 1, FieldName : "Company", Seq : "1", FieldType : "DropDown", Ref : "0", SptTableName : "Company1707741"},
    { SpecID : 34, ProductName : "Frame", CompanyID : 1, FieldName : "Model", Seq : "2", FieldType : "DropDown", Ref : "Company", SptTableName : "Model5984511"},
    ];

    selectedProduct: any;
    EnteredValue:any;
    searchValue:any;
    prodList: any[] | undefined;
    showAdd = false;
    newProduct = {Name: "", HSNCode: ""};
    fieldType: any[] = [{ID: 1, Name: "DropDown"}, {ID: 2, Name: "Text"}, {ID: 3, Name: "boolean"}];


  ngOnInit(): void {
    this.getProductList()
  }

  getProductList(){
    const subs: Subscription =  this.ps.getList().subscribe({
      next: (res: any) => {
        this.prodList = res.data;
        this.as.successToast(res.message)
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }
 
  getFieldList(){
   const subs: Subscription =  this.ps.getFieldList(this.selectedProduct).subscribe({
      next: (res: any) => {
      this.specList = res.data;
      this.getSptTableData();
      this.as.successToast(res.message)
     },
     error: (err: any) => console.log(err.message),
     complete: () => subs.unsubscribe(),
   });
  
  }

  getSptTableData() { 
   this.specList.forEach((element: any) => {
    if (element.FieldType === 'DropDown' && element.Ref === '0') {
      const subs: Subscription =  this.ps.getProductSupportData('0', element.SptTableName).subscribe({
        next: (res: any) => {
          element.SptTableData = res.data;   
          element.SptFilterData = res.data;   
          // this.as.successToast(res.message)
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    }
   });
  }

  getFieldSupportData(index:any) {
   this.specList.forEach((element: any) => {
    if (element.Ref === this.specList[index].FieldName.toString() ) {
      const subs: Subscription =  this.ps.getProductSupportData( this.specList[index].SelectedValue,element.SptTableName).subscribe({
        next: (res: any) => {
          element.SptTableData = res.data;   
          element.SptFilterData = res.data;   
          this.as.successToast(res.message)
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
     }
    });
  }

  displayAddField(i:any){
    this.specList[i].DisplayAdd = 1;
    this.specList[i].SelectedValue = '';
  }

saveFieldData(i:any){
  this.specList[i].DisplayAdd = 0;
  const Ref = this.specList[i]?.Ref;
  let RefValue = 0;
  if (Ref !== 0){
    this.specList.forEach((element:any, j:any)  => {
      if (element.FieldName === Ref){ RefValue = element.SelectedValue; }
    });
  }
  const subs: Subscription =  this.ps.saveProductSupportData(this.specList[i].SptTableName, RefValue,this.specList[i].SelectedValue).subscribe({
    next: (res: any) => {
      const subss: Subscription =  this.ps.getProductSupportData(RefValue,this.specList[i].SptTableName).subscribe({
        next: (res: any) => {
          this.specList[i].SptTableData = res.data;
            this.specList[i].SptFilterData = res.data; 
          this.as.successToast(res.message)
        },
        error: (err: any) => console.log(err.message),
        complete: () => subss.unsubscribe(),
      });
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



  deleteSpecValue(value:any, selectedValue:any, i:any){
    value.SptFilterData.forEach((element: any) => {
      if (element.TableValue === selectedValue) {
    const subs: Subscription =   this.ps.deleteSpecValue( element.ID,'specspttable').subscribe({
      next: (res: any) => {
        // this.specList.splice(i, 1);
        const subss: Subscription =  this.ps.getProductSupportData(value.Ref,this.specList[i].SptTableName).subscribe({
          next: (res: any) => {
            this.specList[i].SptTableData = res.data;
              this.specList[i].SptFilterData = res.data; 
            this.as.successToast(res.message)
          },
          error: (err: any) => console.log(err.message),
          complete: () => subss.unsubscribe(),
        });
        if (res.success) {
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Your file has been deleted.',
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
      })
  }

}
