import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { ProductService } from 'src/app/service/product.service';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { SupplierService } from 'src/app/service/supplier.service';
import { SupportService } from 'src/app/service/support.service';
import { CalculationService } from 'src/app/service/helpers/calculation.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { PurchaseService } from 'src/app/service/purchase.service';

@Component({
  selector: 'app-purchase',
  templateUrl: './purchase.component.html',
  styleUrls: ['./purchase.component.css']
})
export class PurchaseComponent implements OnInit {
  evn = environment;
  user = JSON.parse(localStorage.getItem('user') || '');
  company = JSON.parse(localStorage.getItem('company') || '');
  companysetting = JSON.parse(localStorage.getItem('companysetting') || '');
  

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private ps: ProductService,
    private ss: SupplierService,
    private supps: SupportService,
    private purchaseService: PurchaseService,
    public as: AlertService,
    public calculation: CalculationService,
  ){
    this.id = this.route.snapshot.params['id'];
   }

  selectedPurchaseMaster: any = {
    ID: null, SupplierID: null, SupplierName: null, CompanyID: null, GSTNo: null, ShopID: null, ShopName: null, PurchaseDate: null,
    PaymentStatus: null, InvoiceNo: null, Status: 1, CreatedBy: null, Quantity: 0, SubTotal: 0, DiscountAmount: 0,
    GSTAmount: 0, TotalAmount: 0, preOrder:false,
  };

  item: any = {
    ID: null, PurchaseID: null, CompanyID: null, ProductName: '', ProductTypeName: '', ProductTypeID: null, UnitPrice: 0.00,
    Quantity: 0, SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: 0, GSTAmount: 0.00, GSTType: 'None', TotalAmount: 0.00, Multiple: false, RetailPrice: 0.00, WholeSalePrice: 0.00, Ledger: false, WholeSale: false, BaseBarCode: '', NewBarcode: '',  Status: 1, BrandType: false
  };

  charge: any = {
    ID: null, PurchaseID: null, ChargeType: null, CompanyID: null, Description: '', Amount: 0.00, GSTPercentage: 0.00, GSTAmount: 0.00,
    GSTType: '', TotalAmount: 0.00 , Status: 1
  };

  data:any = { PurchaseMaster: null, Product: null, PurchaseDetail: null, Charge: null };

  id: any;
  supplierList:any;
  category = 'Product';
  selectedProduct :any;
  prodList:any;
  specList: any;
  disableAddButtons = false;
  gstperLock = false;
  gstLock = false;
  gstList:any;
  chargeOptions:any;
  tempItem = { Item: null, Spec: null };
  itemList:any = [];
  chargeList:any  = [];
  
  gstdividelist:any = [];
  sgst:any = 0;
  cgst :any = 0;

  ngOnInit(): void {
    this.getProductList();
    this.getdropdownSupplierlist();
    this.getGSTList();
    this.chargelist();
    if (this.id != 0){
      this.getPurchaseById();
    }else{
      this.selectedPurchaseMaster.PurchaseDate = moment().format('YYYY-MM-DD');
    }
  }

  getPurchaseById(){
    const subs: Subscription = this.purchaseService.getPurchaseById(this.id).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.as.successToast(res.message)
          this.selectedPurchaseMaster = res.result.PurchaseMaster[0]
          this.itemList = res.result.PurchaseDetail
          this.chargeList = res.result.Charge
          this.calculateGrandTotal();
        } else {
          this.as.errorToast(res.message)
        }
      },
      error: (err: any) => {
        console.log(err.message);
      },
      complete: () => subs.unsubscribe(),
    })
  }

  getdropdownSupplierlist(){
    const subs: Subscription =  this.ss.dropdownSupplierlist().subscribe({
      next: (res: any) => {
        this.supplierList = res.data;
        this.as.successToast(res.message)
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getProductList(){
    const subs: Subscription =  this.ps.getList().subscribe({
      next: (res: any) => {
        // this.prodList = res.data;
        this.prodList = res.data;
        this.prodList.sort((a:any, b:any) => (a.Name < b.Name)? -1 : 1)
        this.as.successToast(res.message)
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getGSTList(){
    const subs: Subscription = this.supps.getList('TaxType').subscribe({
      next: (res: any) => {
        this.gstList = res.data
        this.gstdividelist = [];
        res.data.forEach((ele: any) => {
          if(ele.Name.toUpperCase() !== 'CGST-SGST'){
            let obj = {GstType: '', Amount: 0};
            obj.GstType = ele.Name;
            this.gstdividelist.push(obj);
          }
        })
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
   const Ref = this.specList[i].Ref;
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

  getSupplierDetails(event:any){
      const index = this.supplierList.findIndex((element:any) => element.ID === event.value);
      this.selectedPurchaseMaster.SupplierID = this.supplierList[index].ID;
      this.selectedPurchaseMaster.SupplierName = this.supplierList[index].Name;
      this.item.GSTType = this.supplierList[index].GSTType; 
  }

  onChange(event: { toUpperCase: () => any; toTitleCase: () => any; }) {
    if (this.companysetting.DataFormat === '1') {
      event = event.toUpperCase()
    } else if (this.companysetting.DataFormat == '2') {
      event = event.toTitleCase()
    }
    return event;
  }

  chargelist(){
    const subs: Subscription = this.supps.chargelist(this.charge).subscribe({
      next: (res: any) => {
        this.chargeOptions = res.data 
        this.chargeOptions.sort((a:any, b:any) => (a.Name < b.Name)? -1 : 1)
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  setChargeValues(){
    this.chargeOptions.forEach((element: any) => {
      if (element.ID === this.charge.ChargeType){
      this.charge.Price = element.Price;
      this.charge.Description = element.Description;
      this.charge.GSTAmount = element.GSTAmount;
      this.charge.GSTPercentage = element.GSTPercentage;
      this.charge.GSTType = element.GSTType;
      this.charge.TotalAmount = element.TotalAmount;
      }
    });
  }

  calculateFields(fieldName:any,mode:any){
    // this.item.UnitPrice = 0 ? '' : this.item.UnitPrice;
   this.calculation.calculateFields(fieldName,mode,this.item,this.charge)
  }

  calculateGrandTotal(){
    this.calculation.calculateGrandTotal(this.selectedPurchaseMaster, this.itemList, this.chargeList, this.sgst ,this.cgst ,this.gstdividelist)
  }

  addItem(){
    if (this.category === 'Product'){
      if (this.selectedPurchaseMaster.ID !== null){this.item.Status = 2; }
        this.item.ProductName = "";
        this.item.ProductExpDate = "0000-00-00";

        this.specList.forEach((element: any) => {
          if(element.SelectedValue !== "") {
            this.item.ProductName = this.item.ProductName  + element.SelectedValue + "/";
          }
          if(element.FieldType === "Date") {
            this.item.ProductExpDate = element.SelectedValue;
          }
        });

        this.prodList.forEach((element: any) => {
          this.item.ProductTypeID =  element.ID
          this.item.ProductTypeName =  element.Name
        });
        this.item.ProductTypeID = this.item.ProductTypeID
        this.item.ProductTypeName = this.item.ProductTypeName
        this.item.ProductName = this.item.ProductName.substring(0, this.item.ProductName.length - 1)
        this.itemList.unshift(this.item);

        this.tempItem = { Item: null, Spec: null };
    
        if(this.gstLock === false && this.gstperLock === false ) {
          this.item = {
            ID: null, PurchaseID: null, CompanyID: null, ProductName: '', ProductTypeName: this.selectedProduct, ProductTypeID: null, UnitPrice: 0.00, Quantity: 0, SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: 0, GSTAmount: 0.00, GSTType: 'None', TotalAmount: 0.00, Multiple: false, RetailPrice: '', WholeSalePrice: 0, Ledger: true, WholeSale:this.item.WholeSale, BaseBarCode: null, NewBarcode: '', Status: 1, BrandType: false, UniqueBarcode: ''
          };
        } else if (this.gstLock === true && this.gstperLock === false) {
          this.item = {
            ID: null, PurchaseID: null, CompanyID: null, ProductName: '', ProductTypeName: this.selectedProduct, ProductTypeID: null, UnitPrice: 0.00, Quantity: 0, SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: 0, GSTAmount: 0.00, GSTType: this.item.GSTType, TotalAmount: 0.00, Multiple: false, RetailPrice: '', WholeSalePrice: 0, Ledger: true, WholeSale:this.item.WholeSale,BaseBarCode: null, NewBarcode: '', Status: 1, BrandType: false, UniqueBarcode: ''
          };
        } else if (this.gstLock === false && this.gstperLock === true) {
          this.item = {
            ID: null, PurchaseID: null, CompanyID: null, ProductName: '', ProductTypeName: this.selectedProduct, ProductTypeID: null, UnitPrice: 0.00, Quantity: 0, SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: this.item.GSTPercentage, GSTAmount: 0.00, GSTType: 'None', TotalAmount: 0.00, Multiple: false, RetailPrice: '', WholeSalePrice: 0, Ledger: true, WholeSale:this.item.WholeSale, BaseBarCode: null, NewBarcode: '', Status: 1, BrandType: false, UniqueBarcode: ''
          };
        } else {
          this.item = {
          ID: null, PurchaseID: null, CompanyID: null, ProductName: '', ProductTypeName: this.selectedProduct, ProductTypeID: null, UnitPrice: 0.00, Quantity: 0, SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: this.item.GSTPercentage, GSTAmount: 0.00, GSTType: this.item.GSTType, TotalAmount: 0.00, Multiple: false, RetailPrice: '', WholeSalePrice: 0, Ledger: true, WholeSale:this.item.WholeSale, BaseBarCode: null, NewBarcode: '', Status: 1, BrandType: false, UniqueBarcode: ''
          }
        }
       
        this.specList.forEach((element: any) => {
          if(element.CheckBoxValue === false || element.CheckBoxValue === undefined) {
            element.SelectedValue = '';
          } else {
            element.SelectedValue = element.SelectedValue;
          }
        });
    }
    if (this.category === 'Charges'){
      if (this.selectedPurchaseMaster.ID !== null){this.charge.Status = 2; }
      this.charge.ID = null;
      this.chargeOptions.forEach((ele: any) => {
      if(ele.ID !== null){
        this.charge.ChargeType = ele.Name
      }
      });
      this.chargeList.push(this.charge);
      this.charge = {
      ID: null, ChargeType: null, CompanyID: null, Description: '', Amount: 0.00, Price: 0.00, GSTPercentage: 0, GSTAmount: 0.00,
      GSTType: '', TotalAmount: 0.00, Status: 1 };
    }
    this.calculateGrandTotal();
  }

  notifyGst() {
    if(this.item.GSTPercentage !== 0 && this.item.GSTPercentage !== "0") {
     if(this.item.GSTType === 'None') {
      alert("please select GstType");
     }
    }
  }

  onSumbit(){
    this.data.PurchaseMaster = this.selectedPurchaseMaster;
    this.data.PurchaseDetail = JSON.stringify(this.itemList);
    this.data.Charge = this.chargeList;
    const subs: Subscription =  this.purchaseService.savePurchase(this.data).subscribe({
      next: (res: any) => {
        if (res.success) {
          if(res.data !== 0) {
            this.id = res.data;
            this.router.navigate(['/inventory/purchase' , this.id]);
            this.getPurchaseById();
            this.selectedProduct = "";
            this.specList = [];
          }
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

  deleteItem(Category:any ,i:any){
    if(Category === 'Product'){
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
            const subs: Subscription = this.purchaseService.deleteProduct(this.itemList[i].ID).subscribe({
              next: (res: any) => {
                this.itemList[i].Status = 0;
                this.calculateGrandTotal();
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
    }else if(Category === 'Charges'){
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
            const subs: Subscription = this.purchaseService.deleteCharge(this.chargeList[i].ID).subscribe({
              next: (res: any) => {
                this.chargeList[i].Status = 0;
                this.calculateGrandTotal();
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
  }
}
