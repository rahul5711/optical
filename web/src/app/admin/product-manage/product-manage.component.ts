import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators,ReactiveFormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2'; 
import { ProductService } from '../../service/product.service';
import { AlertService } from 'src/app/service/alert.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

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
    private sp: NgxSpinnerService,
    private modalService: NgbModal


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

  ngOnInit(): void {
    this.sp.show();
    this.getProductList();
    this.sp.hide();
  }

  saveProduct() {
    this.sp.show();
    let count = 0;
    this.prodList.forEach((element: { Name: string; }) => {
      if (element.Name.toLowerCase() === this.newProduct.Name.toLowerCase().trim()){count = count + 1; }
    });

    if (count === 0 && this.newProduct.Name !== ''){
    const subs: Subscription =  this.ps.productSave( this.newProduct).subscribe({
      next: (res: any) => {
        this.ps.getList().subscribe(data => {
        this.prodList = data.data;
          if (this.selectedProduct !== null || this.selectedProduct !== '' ){
             this.ps.getSpec(this.selectedProduct).subscribe(data => {
             this.specList = data.data;
            });
          }
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
    }else {
    Swal.fire({
      icon: 'error',
      title: 'Duplicate or Empty Values are not allowed',
      text: '',
      footer: ''
    });
    this.newProduct.Name = ""; 
    }
    this.sp.hide();
  } 

  getProductList(){
    this.sp.show();
      const subs: Subscription =  this.ps.getList().subscribe({
        next: (res: any) => {
          this.prodList = res.data;
          this.as.successToast(res.message)
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    this.sp.hide();
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
      if (this.specList.length === 0 ) {
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
          }
        },
        error: (err: any) => {
          console.log(err.msg);
        },
        complete: () => subs.unsubscribe(),
      });
    }else {
      Swal.fire({
        icon: 'error',
        title: 'ERROR',
        text: 'First delete related Feild',
        footer: ''
      }); 
    }
  }

  updateProductType(){
    this.newProduct.ID = this.selectedProductID
    const subs: Subscription =  this.ps.updateProduct(this.newProduct).subscribe({
      next: (res: any) => {
        if (res.success) {
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Your file has been update Product.',
            showConfirmButton: false,
            timer: 1200,
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
     this.selectedProduct = '';
     this.selectedHSNCode = '';
     this.selectedGSTPercentage = 0;
     this.selectedGSTType = '';
     this.specList = [];
     this.router.navigate(['/admin/productManageAssign'])
     .then(() => {
       window.location.reload();
     });
    this.modalService.dismissAll()
 
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
            title: 'Your record has been update Product.',
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
     this.sp.hide();

  }

  deleteItem(i:any){
      const subs: Subscription =   this.ps.deleteSpec('productspec', this.specList[i].ID).subscribe({
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
