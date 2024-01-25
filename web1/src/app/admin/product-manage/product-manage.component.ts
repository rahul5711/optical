import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators,ReactiveFormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ProductService } from 'src/app/service/product.service';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-product-manage',
  templateUrl: './product-manage.component.html',
  styleUrls: ['./product-manage.component.css']
})

export class ProductManageComponent implements OnInit {
i: any;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private ps: ProductService,
    public as: AlertService,
    private modalService: NgbModal,
    private sp: NgxSpinnerService,


  ) { this.id = this.route.snapshot.params['id']; }

  id: any;
  env = environment;
  specList :any = [];
  gstList: any;
  prodList:any = [];
  newSpec: any = {ID : null, ProductName: '', Name : '', Seq: null,  Type: '', Ref: 0, SptTableName: '', Required: false  };
  selectedProduct: any = '';
  selectedHSNCode: any = '';
  selectedGSTPercentage: any = 0;
  selectedGSTType: any = '';
  showAdd = false;
  newProduct:any = {ID : null, CompanyID:null, Name: "", HSNCode: "", GSTPercentage: 0, GSTType: "None"};
  fieldType: any[] = [{ID: 1, Name: "DropDown"}, {ID: 2, Name: "Text"}, {ID: 3, Name: "boolean"} , {ID: 4, Name: "Date"}];
  selectedProductID: any;
  searchValue:any;
  disbleProduct = true
  hideSave = true
  showAdds = false
  GstTypeDis = false

  ngOnInit(): void {
    this.getProductList();
  }

  gstType() {
    if (this.newProduct.GSTPercentage !== 0 ) {
      if (this.newProduct.GSTType === 'None') {
        Swal.fire({
          position: 'center',
          icon: 'warning',
          title: 'Please Select GSTType',
          showConfirmButton: true,
          backdrop: false,
        })
        this.GstTypeDis = true
      }else{
       this.GstTypeDis = false
      }
    }

  else if (this.newProduct.GSTType !== 'None') {
      if (this.newProduct.GSTPercentage === 0) {
        Swal.fire({
          position: 'center',
          icon: 'warning',
          title: 'Please Select GSTType',
          showConfirmButton: true,
          backdrop: false,
        })
        this.GstTypeDis = true
      }else{
       this.GstTypeDis = false
      }
    }
    else{
      this.GstTypeDis = false
    }
  }

  addClick(){
    this.newProduct = { ID: null, CompanyID: null, Name: "", HSNCode: "", GSTPercentage: 0, GSTType: "None" };
    this.specList = []
  }

  saveProduct() {
    if ((this.newProduct.GSTType === 'None' && this.newProduct.GSTPercentage !== 0) || (this.newProduct.GSTPercentage === 0 && this.newProduct.GSTType !== 'None') || (this.newProduct.GSTPercentage === null && this.newProduct.GSTType !== 'None')) {
      Swal.fire({
        position: 'center',
        icon: 'warning',
        title: 'Without GSTType, the selected value will not be saved',
        showConfirmButton: true,
        backdrop: false,
      })
      this.GstTypeDis = false
      this.showAdd = true
    }else{
    this.sp.show();
    let count = 0;
    this.prodList.forEach((element: { Name: string; }) => {
      if (element.Name.toLowerCase() === this.newProduct.Name.toLowerCase().trim()){count = count + 1; }
    });
    if (count === 0 && this.newProduct.Name !== ''){
    const subs: Subscription =  this.ps.productSave( this.newProduct).subscribe({
      next: (res: any) => {
        if (res.success) {
        this.ps.getList().subscribe(data => {
        this.prodList = data.data;
          if (this.selectedProduct !== null || this.selectedProduct !== '' ){
             this.ps.getSpec(this.selectedProduct).subscribe(data => {
             this.specList = data.data;
            });
          }
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Your file has been Save.',
            showConfirmButton: false,
            timer: 1200
          })
        });
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => {
        console.log(err.msg);
      },
      complete: () => subs.unsubscribe(),
    });
    }else {
      this.sp.hide();
    Swal.fire({
      icon: 'error',
      title: 'Duplicate or Empty Values are not allowed',
      text: '',
      footer: ''
    });
    this.newProduct.Name = "";
    }
    }
  }

  getProductList(){
    this.sp.show();
      const subs: Subscription =  this.ps.getList().subscribe({
        next: (res: any) => {
          if(res.success){
            this.prodList = res.data;
            this.as.successToast(res.message)
          }else{
            this.as.errorToast(res.message)
          }
          this.sp.hide();
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
  }

  getfieldList(){
    this.prodList.forEach((element: { Name: any; HSNCode: any; GSTPercentage: any; GSTType: any; ID: any; }) => {
      if (element.Name === this.selectedProduct) {
        this.selectedHSNCode = element.HSNCode;
        this.selectedGSTPercentage = element.GSTPercentage;
        this.selectedGSTType = element.GSTType;
        this.selectedProductID = element.ID;
      }
    });

    if (this.selectedProduct !== null || this.selectedProduct !== '' ){
         this.ps.getSpec(this.selectedProduct).subscribe(data => {
         this.specList = data.data;
      });
    }
  }

  deleteProductType(){
    this.sp.show()

      const subs: Subscription =  this.ps.deleteProductType(this.selectedProductID ,'product').subscribe({
        next: (res: any) => {
          if (res.success) {
            this.newProduct.HSNCode = "";
            this.selectedHSNCode = "";
            this.selectedGSTPercentage = 0;
            this.selectedGSTType = "None";
            this.getProductList();
            Swal.fire({
              position: 'center',
              icon: 'success',
              title: 'Your file has been deleted.',
              showConfirmButton: false,
              timer: 1200
            })
          } else {
            this.as.errorToast(res.message)
            Swal.fire({
              icon: 'error',
              title: res.message,
              text: '',
              footer: ''
            });
          }
          this.sp.hide();
        },
        error: (err: any) => {
          console.log(err.msg);
        },
        complete: () => subs.unsubscribe(),
      });
    

  }

  updateProductType() {
    if ((this.newProduct.GSTType === 'None' && this.newProduct.GSTPercentage !== 0) || (this.newProduct.GSTPercentage === 0 && this.newProduct.GSTType !== 'None') || (this.newProduct.GSTPercentage === null && this.newProduct.GSTType !== 'None')) {
      Swal.fire({
        position: 'center',
        icon: 'warning',
        title: 'Without GSTType, the selected value will not be saved',
        showConfirmButton: true,
        backdrop: false,
      })
      this.GstTypeDis = false
    }else{
      this.sp.show()
      this.newProduct.ID = this.selectedProductID
      const subs: Subscription = this.ps.updateProduct(this.newProduct).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.getProductList();
            Swal.fire({
              position: 'center',
              icon: 'success',
              title: 'Your file has been update Product.',
              showConfirmButton: false,
              timer: 1200
            })
            this.specList = []
            this.selectedProduct = '';
            this.selectedHSNCode = '';
            this.selectedGSTPercentage = 0;
            this.selectedGSTType = '';
            this.modalService.dismissAll()
          } else {
            this.as.errorToast(res.message)
          }
          this.sp.hide()
        },
        error: (err: any) => {
          console.log(err.msg);
        },
        complete: () => subs.unsubscribe(),
      });
    }
 
  }

  saveSpec(){
    this.sp.show();
    let count = 0;
    this.specList.forEach((element: { Name: string; }) => {
      if (element.Name.toLowerCase() === this.newSpec.Name.toLowerCase() ){
        count = count + 1;
      }
    });

    if (count === 0 && this.newSpec.Name !== '' && this.newSpec.Type !== ''){
    this.newSpec.ProductName = this.selectedProduct;
    let specData = this.newSpec;
    this.newSpec = {ID : null, ProductName: '', Name : '', Seq: null,  Type: '', Ref: 0, SptTableName: '', Required: false  };
    const subs: Subscription = this.ps.saveSpec(specData).subscribe({
      next: (res: any) => {
        if (res.success || res.message == 'this Seq Already Exist') {
          this.getfieldList();
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Your file has been update.',
            showConfirmButton: false,
            timer: 1200
          })
        } else {
          this.as.errorToast(res.message)
          Swal.fire({
            icon: 'error',
            title: 'Already Exist',
            text: ' this Seq Already Exist ',
            footer: ''
          });
        }
        this.sp.hide();
      },
      error: (err: any) => {
        console.log(err.msg);
      },
      
      complete: () => subs.unsubscribe(),

    });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Duplicate or Empty Values are not allowed',
        text: ' Fill all Required Fields ',
        footer: ''
      });
     }
 
  }

  deleteItem(i:any){
      this.sp.show();
      const subs: Subscription = this.ps.deleteSpec('productspec', this.specList[i].ID).subscribe({
        next: (res: any) => {
          this.specList.splice(i, 1);
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
          this.sp.hide();
        },
        error: (err: any) => {
          console.log(err.msg);
        },
        complete: () => subs.unsubscribe(),
      });
  }

  openModal(content: any,sProduct:any,sHSNCode:any,sGSTPercentage:any,sGSTType:any) {
    this.newProduct.Name = sProduct
    this.newProduct.HSNCode = sHSNCode
    this.newProduct.GSTPercentage = sGSTPercentage
    this.newProduct.GSTType = sGSTType
    this.showAdds = true
    this.modalService.open(content, { centered: true , backdrop : 'static', keyboard: false,size: 'lg' });
    this.getfieldList()
   }

}
