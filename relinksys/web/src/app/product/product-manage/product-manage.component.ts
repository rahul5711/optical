import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ProductService } from 'src/app/service/product.service';
import { BillService } from 'src/app/service/bill.service';

@Component({
  selector: 'app-product-manage',
  templateUrl: './product-manage.component.html',
  styleUrls: ['./product-manage.component.css']
})

export class ProductManageComponent implements OnInit {
  permission = JSON.parse(localStorage.getItem('permission') || '[]');
  companySetting = JSON.parse(localStorage.getItem('companysetting') || '');

  i: any;

  constructor(
    private route: ActivatedRoute,
    private ps: ProductService,
    public as: AlertService,
    private sp: NgxSpinnerService,
    private modalService: NgbModal,
     public bill: BillService,
  ) { this.id = this.route.snapshot.params['id']; }

  id: any;
  env = environment;
  specList: any = [];
  gstList: any;
  prodList: any = [];
  selectedProduct: any = '';
  selectedHSNCode: any = '';
  selectedGSTPercentage: any = 0;
  selectedGSTType: any = '';
  showAdd = false;

  newProduct = { ID: null, CompanyID: null, Name: "", HSNCode: "", GSTPercentage: 0, GSTType: "None" };
  newSpec: any = { ID: null, ProductName: '', Name: '', Seq: null, Type: '', Ref: 0, SptTableName: '', Required: false };
  fieldType: any[] = [{ ID: 1, Name: "DropDown" }, { ID: 2, Name: "Text" }, { ID: 3, Name: "boolean" }, { ID: 4, Name: "Date" }];

  selectedProductID: any;
  searchValue: any = '';
  disbleProduct = true
  hideSave = true
  showAdds = false

  editProductType = false
  addProductType = false
  deleteProductTypes = false

  GstTypeDis = false


  ngOnInit(): void {
    this.permission.forEach((element: any) => {
      if (element.ModuleName === 'ProductType') {
        this.editProductType = element.Edit;
        this.addProductType = element.Add;
        this.deleteProductTypes = element.Delete;
      }
    });
    this.getProductList();
   
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
      this.sp.show()
      let count = 0;
      this.prodList.forEach((element: { Name: string; }) => {
        if (element.Name.toLowerCase() === this.newProduct.Name.toLowerCase().trim()) { count = count + 1; }
      });
  
      if (this.newProduct.Name !== '') {
        const subs: Subscription = this.ps.productSave(this.newProduct).subscribe({
          next: (res: any) => {
            if (res.success) {
               this.bill.productLists$.subscribe((list:any) => {
                this.prodList = list
              });
              this.ps.getList().subscribe(data => {
                this.prodList = data.data;
                if (this.selectedProduct !== null || this.selectedProduct !== '') {
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
              Swal.fire({
                icon: 'error',
                title: res.message,
                showConfirmButton: true,
                backdrop: false
              });
            }
            this.sp.hide()
          },
          error: (err: any) => {
            console.log(err.msg);
          },
          complete: () => subs.unsubscribe(),
        });
      } else {
        this.sp.hide()
        Swal.fire({
          icon: 'error',
          title: ' Empty Values are not allowed',
          backdrop: false
        });
        this.newProduct.Name = "";
      }
    }
 

  }

  getProductList() {
    this.sp.show()
    const subs: Subscription = this.ps.getList().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.prodList = res.data.sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
          this.as.successToast(res.message)
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  addClick(){
    this.newProduct = { ID: null, CompanyID: null, Name: "", HSNCode: "", GSTPercentage: 0, GSTType: "None" };
    this.specList = []
  }
  
  getfieldList() {
    this.prodList.forEach((element: { Name: any; HSNCode: any; GSTPercentage: any; GSTType: any; ID: any; }) => {
      if (element.Name === this.selectedProduct) {
        this.selectedHSNCode = element.HSNCode;
        this.selectedGSTPercentage = element.GSTPercentage;
        this.selectedGSTType = element.GSTType;
        this.selectedProductID = element.ID;
      }
    });
    this.sp.show()
    if (this.selectedProduct !== null || this.selectedProduct !== '') {
      const subs: Subscription = this.ps.getSpec(this.selectedProduct).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.specList = res.data;
            this.as.successToast(res.message)
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

  deleteProductType() {
    this.sp.show();
    if (this.specList.length === 0 && this.selectedProductID !== undefined) {
      const subs: Subscription = this.ps.deleteProductType(this.selectedProductID, 'product').subscribe({
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
          this.sp.hide();
        },
        error: (err: any) => {
          console.log(err.msg);
        },
        complete: () => subs.unsubscribe(),
      });
    } else {
      this.sp.hide();
      Swal.fire({
        icon: 'error',
        title: 'ERROR',
        text: 'First delete related Feild',
        footer: '',
        backdrop: false,
      });
    }
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

  saveSpec() {

    let count = 0;
    this.specList.forEach((element: { Name: string; }) => {
      if (element.Name.toLowerCase() === this.newSpec.Name.toLowerCase()) {
        count = count + 1;
      }
    });

    if (count === 0 && this.newSpec.Name !== '' && this.newSpec.Type !== '') {
      this.newSpec.ProductName = this.selectedProduct;
      let specData = this.newSpec;
      this.newSpec = { ID: null, ProductName: '', Name: '', Seq: null, Type: '', Ref: 0, SptTableName: '', Required: false };
      this.sp.show()
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
              footer: '',
              backdrop: false
            });
          }
          this.sp.hide()
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
        footer: '',
        backdrop: false
      });
    }

  }

  deleteItem(i: any) {
    this.sp.show()
    const subs: Subscription = this.ps.deleteSpec('productspec', this.specList[i].ID).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.specList.splice(i, 1);
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
       this.sp.hide()
      },
      error: (err: any) => {
        console.log(err.msg);
      },
      complete: () => subs.unsubscribe(),
    });
  }

  openModal(content: any, sProduct: any, sHSNCode: any, sGSTPercentage: any, sGSTType: any) {
    if(sProduct !== ''){
    this.newProduct.Name = sProduct
    this.newProduct.HSNCode = sHSNCode
    this.newProduct.GSTPercentage = sGSTPercentage
    this.newProduct.GSTType = sGSTType
    this.showAdds = true
    this.modalService.open(content, { centered: true, backdrop: 'static', keyboard: false, size: 'lg' });
  }else{
    Swal.fire({
      icon: 'error',
      title: 'Opps!! <br> Value is not found',
      footer: '',
      backdrop: false
    });
  }
}

onChange(event: { toUpperCase: () => any; toTitleCase: () => any; }) {
  if (this.companySetting.DataFormat === '1') {
    event = event.toUpperCase()
  } else if (this.companySetting.DataFormat == '2') {
    event = event.toTitleCase()
  }
  return event;
}


}
