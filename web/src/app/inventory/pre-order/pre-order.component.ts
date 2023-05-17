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
  selector: 'app-pre-order',
  templateUrl: './pre-order.component.html',
  styleUrls: ['./pre-order.component.css']
})
export class PreOrderComponent implements OnInit {
  evn = environment;
  user = JSON.parse(localStorage.getItem('user') || '');
  company = JSON.parse(localStorage.getItem('company') || '');
  shop = JSON.parse(localStorage.getItem('shop') || '');
  companysetting = JSON.parse(localStorage.getItem('companysetting') || '');
  selectedShop:any =JSON.parse(localStorage.getItem('selectedShop') || '') ;
  editBtn = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private ps: ProductService,
    private ss: SupplierService,
    private supps: SupportService,
    private purchaseService: PurchaseService,
    public as: AlertService,
    public calculation: CalculationService,
    public sp: NgxSpinnerService,
  ){
    this.id = this.route.snapshot.params['id'];
   }

   selectedPurchaseMaster: any = {
    ID: null, SupplierID: null, SupplierName: null, CompanyID: null, GSTNo: null, ShopID: null, ShopName: null, PurchaseDate: null,
    PaymentStatus: null, InvoiceNo: null, Status: 1, CreatedBy: null, Quantity: 0, SubTotal: 0, DiscountAmount: 0,
    GSTAmount: 0, TotalAmount: 0, preOrder:true,
  };

  item: any = {
    ID: null, PurchaseID: null, CompanyID: null, ProductName: '', ProductTypeName: '', ProductTypeID: null, UnitPrice: 0.00,
    Quantity: 1, SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: 0, GSTAmount: 0.00, GSTType: 'None', TotalAmount: 0.00, Multiple: false, RetailPrice: 0.00, WholeSalePrice: 0.00, Ledger: false, WholeSale: false, BaseBarCode: '', NewBarcode: '',  Status: 1, BrandType: 0
  };

  data:any = { PurchaseMaster: null,  PurchaseDetail: null };

  id: any;
  supplierList:any;
  category = 'Product';
  selectedProduct :any;
  prodList:any;
  specList: any;
  disableAddButtons = false;
  gstperLock = false;
  gstLock = false;
  BrandLock = false;
  gstList:any;
  tempItem = { Item: null, Spec: null };
  itemList:any = [];
  gst_detail:any = [];

  ngOnInit(): void {
    this.getProductList();
    this.getdropdownSupplierlist();
    this.getGSTList();
    if (this.id != 0){
      this.getPurchaseByIdPreOrder();
    }else{
      this.selectedPurchaseMaster.PurchaseDate = moment().format('YYYY-MM-DD');
    }
  }

  getPurchaseByIdPreOrder(){
    this.sp.show()
    const subs: Subscription = this.purchaseService.getPurchaseByIdPreOrder(this.id).subscribe({
      next: (res: any) => {
        this.selectedPurchaseMaster = res.result.PurchaseMaster[0]
        this.itemList = res.result.PurchaseDetail
        this.gst_detail = this.selectedPurchaseMaster.gst_detail
        this.calculateGrandTotal();
        if (res.success) {
          this.as.successToast(res.message)
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => {
        console.log(err.message);
      },
      complete: () => subs.unsubscribe(),
    })
    this.sp.hide()
  }

  getdropdownSupplierlist(){
    this.sp.show()
    const subs: Subscription =  this.ss.dropdownSupplierlist('').subscribe({
      next: (res: any) => {
        if(res.success){
          this.supplierList = res.data;
          this.as.successToast(res.message)
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
    this.sp.hide()
  }

  getProductList(){
    this.sp.show()
    const subs: Subscription =  this.ps.getList().subscribe({
      next: (res: any) => {
        if(res.success){
        // this.prodList = res.data;
        this.prodList = res.data;
        this.prodList.sort((a:any, b:any) => (a.Name < b.Name)? -1 : 1)
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
    this.sp.hide()
  }

  getGSTList(){
    this.sp.show()
    const subs: Subscription = this.supps.getList('TaxType').subscribe({
      next: (res: any) => {
        if(res.success){
          this.gstList = res.data
          this.gst_detail = [];
          res.data.forEach((ele: any) => {
            if(ele.Name !== ' '){
             let obj = {GSTType: '', Amount: 0};
              obj.GSTType = ele.Name;
              this.gst_detail.push(obj);
            }
          })
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
    error: (err: any) => console.log(err.message),
    complete: () => subs.unsubscribe(),
    });
    this.sp.hide()
  }

  getFieldList(){
    this.sp.show()
    const subs: Subscription =  this.ps.getFieldList(this.selectedProduct).subscribe({
       next: (res: any) => {
        if(res.success){
          this.specList = res.data;
          this.getSptTableData();
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
    this.sp.hide()
  
  }

  getSptTableData() { 
    this.sp.show()
    this.specList.forEach((element: any) => {
     if (element.FieldType === 'DropDown' && element.Ref === '0') {
       const subs: Subscription =  this.ps.getProductSupportData('0', element.SptTableName).subscribe({
         next: (res: any) => {
          if(res.success){
            element.SptTableData = res.data;   
            element.SptFilterData = res.data;  
          }else{
            this.as.errorToast(res.message)
          }
          this.sp.hide()
         },
         error: (err: any) => console.log(err.message),
         complete: () => subs.unsubscribe(),
       });
     }
    });
    this.sp.hide()
  }

  getFieldSupportData(index:any) {
    this.sp.show()
    this.specList.forEach((element: any) => {
     if (element.Ref === this.specList[index].FieldName.toString() ) {
       const subs: Subscription =  this.ps.getProductSupportData( this.specList[index].SelectedValue,element.SptTableName).subscribe({
         next: (res: any) => {
          if(res.success){
            element.SptTableData = res.data; 
            element.SptFilterData = res.data;  
          }else{
            this.as.errorToast(res.message)
          }
          this.sp.hide()
         },
         error: (err: any) => console.log(err.message),
         complete: () => subs.unsubscribe(),
       });
      }
     });
     this.sp.hide()
  }

  displayAddField(i:any){
     this.specList[i].DisplayAdd = 1;
     this.specList[i].SelectedValue = '';
  }

  saveFieldData(i:any){
    this.sp.show()
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
          if(res.success){
            this.specList[i].SptTableData = res.data;
            this.specList[i].SptFilterData = res.data;
            Swal.fire({
              position: 'center',
              icon: 'success',
              title: 'Your file has been Save.',
              showConfirmButton: false,
              timer: 1200
            })
          }else{
            this.as.errorToast(res.message)
          }
          this.sp.hide()
         },
         error: (err: any) => console.log(err.message),
         complete: () => subss.unsubscribe(),
       });
     },
     error: (err: any) => {
       console.log(err.msg);
     },
     complete: () => subs.unsubscribe(),
   });
   this.sp.hide()
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

  calculateFields(fieldName:any,mode:any){
   this.calculation.calculateFields(fieldName,mode,this.item,'')
  }

  calculateGrandTotal(){
    this.calculation.calculateGrandTotal(this.selectedPurchaseMaster, this.itemList,'')
  }

  addItem(){
    if (this.category === 'Product'){
      if (this.selectedPurchaseMaster.ID !== null){this.item.Status = 2; }
        this.item.ProductName = "";
        this.item.ProductTypeID = "";
        this.item.ProductExpDate = "0000-00-00";

        this.specList.forEach((element: any) => {
            this.prodList.forEach((elements: any) => {
              if(elements.Name === element.ProductName){
                this.item.ProductTypeID = elements.ID
                this.item.ProductTypeName = elements.Name
              }
            });
          if(element.SelectedValue !== "") {
            this.item.ProductName = this.item.ProductName  + element.SelectedValue + "/";
          }
          if(element.FieldType === "Date") {
            this.item.ProductExpDate = element.SelectedValue;
          }
        });

        this.item.ProductTypeID = this.item.ProductTypeID
        this.item.ProductTypeName = this.item.ProductTypeName
        this.item.ProductName = this.item.ProductName.substring(0, this.item.ProductName.length - 1)
        this.itemList.unshift(this.item);
          
        this.tempItem = { Item: null, Spec: null };

        if(this.gstLock === false && this.gstperLock === false ) {
          this.item = {
            ID: null, PurchaseID: null, CompanyID: null, ProductName: '', ProductTypeName: this.selectedProduct, ProductTypeID: null, UnitPrice: 0.00, Quantity: 1, SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: 0, GSTAmount: 0.00, GSTType: 'None', TotalAmount: 0.00, Multiple: false, RetailPrice: '', WholeSalePrice: 0, Ledger: true, WholeSale:this.item.WholeSale, BaseBarCode: null, NewBarcode: '', Status: 1, BrandType: this.item.BrandType, UniqueBarcode: ''
          };
        } else if (this.gstLock === true && this.gstperLock === false) {
          this.item = {
            ID: null, PurchaseID: null, CompanyID: null, ProductName: '', ProductTypeName: this.selectedProduct, ProductTypeID: null, UnitPrice: 0.00, Quantity: 1, SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: 0, GSTAmount: 0.00, GSTType: this.item.GSTType, TotalAmount: 0.00, Multiple: false, RetailPrice: '', WholeSalePrice: 0, Ledger: true, WholeSale:this.item.WholeSale,BaseBarCode: null, NewBarcode: '', Status: 1, BrandType: this.item.BrandType, UniqueBarcode: ''
          };
        } else if (this.gstLock === false && this.gstperLock === true) {
          this.item = {
            ID: null, PurchaseID: null, CompanyID: null, ProductName: '', ProductTypeName: this.selectedProduct, ProductTypeID: null, UnitPrice: 0.00, Quantity: 1, SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: this.item.GSTPercentage, GSTAmount: 0.00, GSTType: 'None', TotalAmount: 0.00, Multiple: false, RetailPrice: '', WholeSalePrice: 0, Ledger: true, WholeSale:this.item.WholeSale, BaseBarCode: null, NewBarcode: '', Status: 1, BrandType: this.item.BrandType, UniqueBarcode: ''
          };
        } else {
          this.item = {
          ID: null, PurchaseID: null, CompanyID: null, ProductName: '', ProductTypeName: this.selectedProduct, ProductTypeID: null, UnitPrice: 0.00, Quantity: 1, SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: this.item.GSTPercentage, GSTAmount: 0.00, GSTType: this.item.GSTType, TotalAmount: 0.00, Multiple: false, RetailPrice: '', WholeSalePrice: 0, Ledger: true, WholeSale:this.item.WholeSale, BaseBarCode: null, NewBarcode: '', Status: 1, BrandType: this.item.BrandType, UniqueBarcode: ''
          }
        }

        if(this.BrandLock === true){
          this.item = {
            ID: null, PurchaseID: null, CompanyID: null, ProductName: '', ProductTypeName: this.selectedProduct, ProductTypeID: null, UnitPrice: 0.00, Quantity: 1, SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: this.item.GSTPercentage, GSTAmount: 0.00, GSTType: this.item.GSTType, TotalAmount: 0.00, Multiple: false, RetailPrice: '', WholeSalePrice: 0, Ledger: true, WholeSale:this.item.WholeSale, BaseBarCode: null, NewBarcode: '', Status: 1, BrandType: this.item.BrandType, UniqueBarcode: ''
          }
        }else{
          this.item = {
            ID: null, PurchaseID: null, CompanyID: null, ProductName: '', ProductTypeName: this.selectedProduct, ProductTypeID: null, UnitPrice: 0.00, Quantity: 1, SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: this.item.GSTPercentage, GSTAmount: 0.00, GSTType: this.item.GSTType, TotalAmount: 0.00, Multiple: false, RetailPrice: '', WholeSalePrice: 0, Ledger: true, WholeSale:this.item.WholeSale, BaseBarCode: null, NewBarcode: '', Status: 1, BrandType: 0, UniqueBarcode: ''
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
    this.sp.show()
    // this.selectedPurchaseMaster.ShopID = this.shop[0].ShopID;
    this.data.PurchaseDetail = JSON.stringify(this.itemList);
    this.data.PurchaseMaster = this.selectedPurchaseMaster;
    const subs: Subscription = this.purchaseService.createPreOrder(this.data).subscribe({
      next: (res: any) => {
        if (res.success) {
          if(res.data !== 0) {
            this.id = res.data;
            this.router.navigate(['/inventory/pre-order' , this.id]);
            this.getPurchaseByIdPreOrder();
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
       this.sp.hide()
      },
      error: (err: any) => {
        console.log(err.msg);
      },
      complete: () => subs.unsubscribe(),
    });
    this.sp.hide()
  }

  deleteItem(Category:any ,i:any){
    if(Category === 'Product'){
      if (this.itemList[i].ID === null){
        this.itemList.splice(i, 1);
      }else{
        Swal.fire({
          title: 'Are you sure?',
          text: "You won't be able to revert this!",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Yes, delete it!',
          backdrop : false,
        }).then((result) => {
          if (result.isConfirmed) {
           this.sp.show()
           if(this.itemList[i].ID !== null || this.itemList[i].Status === 1){
            this.itemList[i].Status = 0;
            this.calculateGrandTotal();
          }
            const subs: Subscription = this.purchaseService.deleteProductPreOrder(this.itemList[i].ID,this.selectedPurchaseMaster).subscribe({
              next: (res: any) => {
                if(res.success){
                  this.itemList[i].Status = 0;
                  this.getPurchaseByIdPreOrder()
                  this.as.successToast(res.message)
                  Swal.fire({
                    position: 'center',
                    icon: 'success',
                    title: 'Your file has been deleted.',
                    showConfirmButton: false,
                    timer: 1000
                  })
                }else{
                  this.as.errorToast(res.message)
                  this.itemList[i].Status = 1;
                  this.calculateGrandTotal();
                  Swal.fire({
                    position: 'center',
                    icon: 'warning',
                    title: res.message ,
                    showConfirmButton: true,
                    backdrop: false,
                  })
                }
              this.sp.hide()
              },
              error: (err: any) => console.log(err.message),
              complete: () => subs.unsubscribe(),
            });

          }
        })
      }
    }
    this.sp.hide()
  }

  edititem(mode:any,data:any){
    this.editBtn = true
    if(mode === 'Product'){
      this.selectedProduct = data.ProductTypeName
      this.item.ProductName = data.ProductName
      this.item = data
    }
  }

  editUpdate(){
    this.itemList.forEach((ele: any) =>{
      if(ele.ID !== null && ele.ID === null ){
        ele = this.item
      }
    });
    this.calculateGrandTotal()
    this.item = {
      ID: null, PurchaseID: null, CompanyID: null, ProductName: '', ProductTypeName: '', ProductTypeID: null, UnitPrice: 0.00,
      Quantity: 1, SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: 0, GSTAmount: 0.00, GSTType: 'None', TotalAmount: 0.00, Multiple: false, RetailPrice: 0.00, WholeSalePrice: 0.00, Ledger: false, WholeSale: false, BaseBarCode: '', NewBarcode: '',  Status: 1, BrandType: 0
    };
    this.editBtn = false
    this.specList = []
    this.selectedProduct = "";
  }

  updatedPurchase(){
    this.sp.show()
    // this.selectedPurchaseMaster.ShopID = this.shop[0].ShopID;
    let items:any = [];
    this.itemList.forEach((ele: any) => {
      if(ele.ID !== null || ele.ID === null || ele.Status == 0 && ele.UpdatedBy === null) {
        ele.UpdatedBy = this.user.ID;
        items.push(ele);
      }
    })
    this.data.PurchaseDetail = JSON.stringify(items) ;
    this.selectedPurchaseMaster.preOrder = true;
    this.data.PurchaseMaster = this.selectedPurchaseMaster;
    const subs: Subscription =  this.purchaseService.updatePreOrder(this.data).subscribe({
      next: (res: any) => {
        if (res.success) {
          if(res.data !== 0) {
            this.getPurchaseByIdPreOrder();
            this.selectedProduct = "";
            this.specList = [];
          }
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Your file has been Update.',
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
    this.sp.hide()
  }

}
