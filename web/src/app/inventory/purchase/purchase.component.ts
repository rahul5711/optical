import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import { AlertService } from 'src/app/service/alert.service';
import { ProductService } from 'src/app/service/product.service';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { SupplierService } from 'src/app/service/supplier.service';
import { SupportService } from 'src/app/service/support.service';
import { CalculationService } from 'src/app/service/calculation.service';

@Component({
  selector: 'app-purchase',
  templateUrl: './purchase.component.html',
  styleUrls: ['./purchase.component.css']
})
export class PurchaseComponent implements OnInit {

  user = JSON.parse(localStorage.getItem('user') || '');
  company = JSON.parse(localStorage.getItem('company') || '');
  companysetting = JSON.parse(localStorage.getItem('companysetting') || '');
  

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private ps: ProductService,
    private ss: SupplierService,
    private supps: SupportService,
    public as: AlertService,
    public calculation: CalculationService,
  ) {
    this.id = this.route.snapshot.params['id'];
   }

  selectedPurchaseMaster: any = {
    ID: null, SupplierID: null, SupplierName: null, CompanyID: null, GSTNo: null, ShopID: null, ShopName: null, PurchaseDate: null,
    PaymentStatus: null, InvoiceNo: null, Status: 1, CreatedBy: null, Quantity: 0, SubTotal: 0, DiscountAmount: 0,
    GSTAmount: 0, TotalAmount: 0, preOrder:false,
  };

  item: any = {
    ID: null, PurchaseID: null, CompanyID: null, ProductName: '', ProductTypeName: '', ProductTypeID: null, UnitPrice: 0.00,
    Quantity: 0, SubTotal: 0.00, DiscountPercentage: 0,
    DiscountAmount: 0.00, GSTPercentage: 0, GSTAmount: 0.00, GSTType: 'None', TotalAmount: 0.00, Multiple: false, RetailPrice: 0.00,
    WholeSalePrice: 0.00, Ledger: false, WholeSale: false, BaseBarCode: null, NewBarcode: '',  Status: 1, BrandType: false
  };

  charge: any = {
    ID: null, PurchaseID: null, ChargeType: null, CompanyID: null, Description: '', Amount: 0.00, GSTPercentage: 0.00, GSTAmount: 0.00,
    GSTType: '', TotalAmount: 0.00 , Status: 1
  };


  id: any;
  supplierList:any;
  category = 'Product';
  selectedProduct :any;
  prodList:any;
  specList: any;
  disableAddButtons = false;
  gstperLock:any;
  gstLock:any;
  gstList:any;
  chargeOptions:any;
  gstdividelist = [];
  sgst = 0;
  cgst = 0;

  ngOnInit(): void {
    this.getProductList();
    this.getdropdownSupplierlist();
    this.getGSTList();
    this.chargelist();
    if (this.id == 0){
      this.selectedPurchaseMaster.PurchaseDate = moment().format('YYYY-MM-DD');
    }
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
        this.prodList = res.data;
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
      const index = this.supplierList.findIndex((element:any) => element.Name === event.value);
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
   this.calculation.calculateFields(fieldName,mode,this.item,this.charge)
  }

}
