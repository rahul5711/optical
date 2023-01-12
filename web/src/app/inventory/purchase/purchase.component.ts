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
    Quantity: 0, SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: 0, GSTAmount: 0.00, GSTType: 'None', TotalAmount: 0.00, Multiple: false, RetailPrice: 0.00, WholeSalePrice: 0.00, Ledger: false, WholeSale: false, BaseBarCode: '', NewBarcode: '',  Status: 1, BrandType: 0
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
  BrandLock = false;
  gstList:any;
  chargeOptions:any;
  tempItem = { Item: null, Spec: null };
  itemList:any = [];
  chargeList:any  = [];
  
  gst_detail:any = [];


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
        this.selectedPurchaseMaster = res.result.PurchaseMaster[0]
        this.itemList = res.result.PurchaseDetail
        this.chargeList = res.result.Charge
        this.gst_detail = this.selectedPurchaseMaster.gst_detail
        this.calculateGrandTotal();
        if (res.success) {
          this.as.successToast(res.message)
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
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getGSTList(){
    const subs: Subscription = this.supps.getList('TaxType').subscribe({
      next: (res: any) => {
        this.gstList = res.data
        this.gst_detail = [];
        res.data.forEach((ele: any) => {
          if(ele.Name !== ' '){
           let obj = {GSTType: '', Amount: 0};
            obj.GSTType = ele.Name;    
            this.gst_detail.push(obj);
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
   this.calculation.calculateFields(fieldName,mode,this.item,this.charge)
  }

  calculateGrandTotal(){
    this.calculation.calculateGrandTotal(this.selectedPurchaseMaster, this.itemList, this.chargeList)
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

        let AddQty = 0;
        if (this.item.Quantity !== 0 && this.item.Quantity !== "0") {
        this.itemList.forEach((ele: any) => {
          if(ele.ID === null) {
            if(ele.ProductName === this.item.ProductName && Number(ele.RetailPrice) === Number(this.item.RetailPrice)  && ele.UnitPrice === this.item.UnitPrice) {
              ele.Quantity = Number(ele.Quantity) + Number(this.item.Quantity);
              ele.SubTotal = Number(ele.SubTotal) + Number(this.item.SubTotal);
              ele.TotalAmount = Number(ele.TotalAmount) + Number(this.item.TotalAmount);
              ele.GSTAmount = Number(ele.GSTAmount) + Number(this.item.GSTAmount);
              ele.DiscountAmount = Number(ele.DiscountAmount) + Number(this.item.DiscountAmount);
              AddQty = 1;
            }
          }
        })
          if(AddQty === 0){
          this.itemList.unshift(this.item);
          }
        }

        this.tempItem = { Item: null, Spec: null };
    
        if(this.gstLock === false && this.gstperLock === false ) {
          this.item = {
            ID: null, PurchaseID: null, CompanyID: null, ProductName: '', ProductTypeName: this.selectedProduct, ProductTypeID: null, UnitPrice: 0.00, Quantity: 0, SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: 0, GSTAmount: 0.00, GSTType: 'None', TotalAmount: 0.00, Multiple: false, RetailPrice: '', WholeSalePrice: 0, Ledger: true, WholeSale:this.item.WholeSale, BaseBarCode: null, NewBarcode: '', Status: 1, BrandType: this.item.BrandType, UniqueBarcode: ''
          };
        } else if (this.gstLock === true && this.gstperLock === false) {
          this.item = {
            ID: null, PurchaseID: null, CompanyID: null, ProductName: '', ProductTypeName: this.selectedProduct, ProductTypeID: null, UnitPrice: 0.00, Quantity: 0, SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: 0, GSTAmount: 0.00, GSTType: this.item.GSTType, TotalAmount: 0.00, Multiple: false, RetailPrice: '', WholeSalePrice: 0, Ledger: true, WholeSale:this.item.WholeSale,BaseBarCode: null, NewBarcode: '', Status: 1, BrandType: this.item.BrandType, UniqueBarcode: ''
          };
        } else if (this.gstLock === false && this.gstperLock === true) {
          this.item = {
            ID: null, PurchaseID: null, CompanyID: null, ProductName: '', ProductTypeName: this.selectedProduct, ProductTypeID: null, UnitPrice: 0.00, Quantity: 0, SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: this.item.GSTPercentage, GSTAmount: 0.00, GSTType: 'None', TotalAmount: 0.00, Multiple: false, RetailPrice: '', WholeSalePrice: 0, Ledger: true, WholeSale:this.item.WholeSale, BaseBarCode: null, NewBarcode: '', Status: 1, BrandType: this.item.BrandType, UniqueBarcode: ''
          };
        } else {
          this.item = {
          ID: null, PurchaseID: null, CompanyID: null, ProductName: '', ProductTypeName: this.selectedProduct, ProductTypeID: null, UnitPrice: 0.00, Quantity: 0, SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: this.item.GSTPercentage, GSTAmount: 0.00, GSTType: this.item.GSTType, TotalAmount: 0.00, Multiple: false, RetailPrice: '', WholeSalePrice: 0, Ledger: true, WholeSale:this.item.WholeSale, BaseBarCode: null, NewBarcode: '', Status: 1, BrandType: this.item.BrandType, UniqueBarcode: ''
          }
        }

        if(this.BrandLock === true){
          this.item = {
            ID: null, PurchaseID: null, CompanyID: null, ProductName: '', ProductTypeName: this.selectedProduct, ProductTypeID: null, UnitPrice: 0.00, Quantity: 0, SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: this.item.GSTPercentage, GSTAmount: 0.00, GSTType: this.item.GSTType, TotalAmount: 0.00, Multiple: false, RetailPrice: '', WholeSalePrice: 0, Ledger: true, WholeSale:this.item.WholeSale, BaseBarCode: null, NewBarcode: '', Status: 1, BrandType: this.item.BrandType, UniqueBarcode: ''
          }
        }else{
          this.item = {
            ID: null, PurchaseID: null, CompanyID: null, ProductName: '', ProductTypeName: this.selectedProduct, ProductTypeID: null, UnitPrice: 0.00, Quantity: 0, SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: 0, GSTAmount: 0.00, GSTType: 'None', TotalAmount: 0.00, Multiple: false, RetailPrice: '', WholeSalePrice: 0, Ledger: true, WholeSale:this.item.WholeSale, BaseBarCode: null, NewBarcode: '', Status: 1, BrandType: 0, UniqueBarcode: ''
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
    this.selectedPurchaseMaster.ShopID = this.shop[0].ShopID;
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
            const subs: Subscription = this.purchaseService.deleteProduct(this.itemList[i].ID,this.selectedPurchaseMaster).subscribe({
              next: (res: any) => {
                if(res.message === "You have product already sold"){
                  Swal.fire({
                    position: 'center',
                    icon: 'warning',
                    title: 'You have product'  + `<span style ="font-size:20px;color:red;font-weight:bold;"> ${this.itemList[i].ProductName}</span>` + ' already sold',
                    showConfirmButton: true,
                    backdrop : false,
                  })
                }else{
                  this.itemList[i].Status = 0;
                  this.getPurchaseById()
                  Swal.fire({
                    position: 'center',
                    icon: 'success',
                    title: 'Your file has been deleted.',
                    showConfirmButton: false,
                    timer: 1000
                  })
                  this.as.successToast(res.message)
                }
              },
              error: (err: any) => console.log(err.message),
              complete: () => subs.unsubscribe(),
            });

          }
        })
      }
    }
   
  }

  deleteCharge(Category:any ,i:any){
   if(Category === 'Charges'){
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
            const subs: Subscription = this.purchaseService.deleteCharge(this.chargeList[i].ID, this.selectedPurchaseMaster).subscribe({
              next: (res: any) => {
                this.chargeList[i].Status = 0;
                this.getPurchaseById()
                Swal.fire({
                  position: 'center',
                  icon: 'success',
                  title: 'Your file has been deleted.',
                  showConfirmButton: false,
                  timer: 1000
                })
                this.as.successToast(res.message)
              },
              error: (err: any) => console.log(err.message),
              complete: () => subs.unsubscribe(),
            });
          }
        })
    }
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
      if(ele.ID === null){
        ele = this.item
        
      }
    });
    this.calculateGrandTotal()
    this.item = {
      ID: null, PurchaseID: null, CompanyID: null, ProductName: '', ProductTypeName: '', ProductTypeID: null, UnitPrice: 0.00,
      Quantity: 0, SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: 0, GSTAmount: 0.00, GSTType: 'None', TotalAmount: 0.00, Multiple: false, RetailPrice: 0.00, WholeSalePrice: 0.00, Ledger: false, WholeSale: false, BaseBarCode: '', NewBarcode: '',  Status: 1, BrandType: 0
    };
    this.editBtn = false
    this.specList = []
  }

  updatedPurchase(){
    this.selectedPurchaseMaster.ShopID = this.shop[0].ShopID;
    this.data.PurchaseMaster = this.selectedPurchaseMaster;
    this.data.Charge = this.chargeList;
    let items:any = [];
    this.itemList.forEach((ele: any) => {
      if(ele.ID === null || ele.Status == 0 && ele.UpdatedBy === null) {
        ele.UpdatedBy = this.user.ID;
        items.push(ele);
      }
    })
    this.data.PurchaseDetail = JSON.stringify(items) ;
    const subs: Subscription =  this.purchaseService.updatePurchase(this.data).subscribe({
      next: (res: any) => {
        if (res.success) {
          if(res.data !== 0) {
            this.getPurchaseById();
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
      },
      error: (err: any) => {
        console.log(err.msg);
      },
      complete: () => subs.unsubscribe(),
    });


  }

  

}
