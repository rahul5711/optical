import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { ProductService } from 'src/app/service/product.service';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { PurchaseService } from 'src/app/service/purchase.service';
import { ShopService } from 'src/app/service/shop.service';
import { SupplierService } from 'src/app/service/supplier.service';
import { CalculationService } from 'src/app/service/helpers/calculation.service';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-purchase-return',
  templateUrl: './purchase-return.component.html',
  styleUrls: ['./purchase-return.component.css']
})
export class PurchaseReturnComponent implements OnInit {

  evn = environment;
  user = JSON.parse(localStorage.getItem('user') || '');
  company = JSON.parse(localStorage.getItem('company') || '');
  shop = JSON.parse(localStorage.getItem('shop') || '');
  companysetting = JSON.parse(localStorage.getItem('companysetting') || '');
  selectedShop:any =JSON.parse(localStorage.getItem('selectedShop') || '') ;

  id: any;
  SearchBarCode: any;
  searchValue: any;
  selectedProduct: any;
  prodList:any;
  specList: any;
  shopList: any;
  supplierList: any;
  barCodeList: any;
  xferList: any;
  showAdd = false;
  shopMode = 'false';
  item: any;
  itemList: any = [];
  Req :any= {SearchBarCode : ''} 

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private ps: ProductService,
    private purchaseService: PurchaseService,
    private ss: ShopService,
    private sup: SupplierService,
    public as: AlertService,
    public calculation: CalculationService,

  ){
    this.id = this.route.snapshot.params['id'];
  }

  xferItem: any = {
    ID: null, ProductName: null, Barcode: null, BarCodeCount: null, Quantity:0, Remark : '', UnitPrice: 0.00, SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: 0, GSTAmount: 0.00, GSTType: 'None', TotalAmount: 0.00,  CreatedBy: null, UpdatedBy: null, CreatedOn: null, UpdatedOn: null, 
  };

  selectedPurchaseMaster: any = {
    ID: null, CompanyID: null, SupplierID: null,  ShopID: null, SystemCN:'', SupplierCN:'',  Status: 1, CreatedBy: null, Quantity: 0, SubTotal: 0, DiscountAmount: 0, GSTAmount: 0, TotalAmount: 0, 
  };

  data:any = { PurchaseRetureMaster: null, PurchaseRetureDateil: null };


  ngOnInit(): void {
    this.getProductList();
    this.dropdownShoplist();
    this.dropdownSupplierlist(); 
  }

  dropdownShoplist(){
    const subs: Subscription = this.ss.dropdownShoplist('').subscribe({
      next: (res: any) => {
        this.shopList  = res.data
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  dropdownSupplierlist(){
    const subs: Subscription = this.sup.dropdownSupplierlist('').subscribe({
      next: (res: any) => {
        this.supplierList  = res.data
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getProductList(){
    const subs: Subscription =  this.ps.getList().subscribe({
      next: (res: any) => {
        this.prodList = res.data;
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

  getProductDataByBarCodeNo(){
    const subs: Subscription =  this.purchaseService.productDataByBarCodeNoPR(this.Req, 'false', 'false').subscribe({
      next: (res: any) => {
        this.item  = res.data;
        if (this.item.Barcode === null) {
          Swal.fire({
            icon: 'warning',
            title: 'Product Not Available in this Shop for Selected Barcode for Transfer.',
            text: ' Please Check the Barcode. ',
            footer: '',
            backdrop : false,
          });
        }else{
          this.xferItem.ProductName = (this.item .ProductTypeName + '/' +  this.item.ProductName).toUpperCase();
          this.xferItem.Barcode = this.item.Barcode;
          this.xferItem.BarCodeCount = this.item.BarCodeCount;
        }
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getBarCodeList(index:any) {
    let searchString = "";
    this.specList.forEach((element: any, i: any) => {
      if (i <= index) {
        searchString = searchString + element.SelectedValue + "/" ;
      }
    });
    const subs: Subscription =  this.purchaseService.barCodeListBySearchStringPR(this.shopMode,this.selectedProduct, searchString).subscribe({
      next: (res: any) => {
        this.barCodeList = res.data;
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  onChange(event: { toUpperCase: () => any; toTitleCase: () => any; }) {
    if (this.companysetting.DataFormat === '1') {
      event = event.toUpperCase()
    } else if (this.companysetting.DataFormat == '2') {
      event = event.toTitleCase()
    }
    return event;
  }

  calculateFields(){
    this.xferItem.UnitPrice = this.item .UnitPrice ;
    this.xferItem.DiscountPercentage = this.item.DiscountPercentage;
    this.xferItem.DiscountAmount = this.item.DiscountAmount ;
    this.xferItem.GSTPercentage = this.item.GSTPercentage ;
    this.xferItem.GSTAmount = this.item .GSTAmount ;
    this.xferItem.GSTType = this.item .GSTType ;
    this.xferItem.TotalAmount = this.item .TotalAmount ;
    this.calculation.calculateFields('','',this.xferItem,'')
  }
 
  calculateGrandTotal(){
    this.calculation.calculateGrandTotal(this.selectedPurchaseMaster, this.itemList, '')
  }

  addItem(){
    if(this.item.BarCodeCount >= this.xferItem.Quantity ){
      this.calculateFields()
      this.itemList.unshift(this.xferItem);
      this.calculateGrandTotal();
      this.xferItem = []
      this.item = []
      this.barCodeList = []
      this.prodList = []
      this.specList  = []
      this.Req = {SearchBarCode : ''}
    }else{
      Swal.fire({
        icon: 'warning',
        title: 'Opps !!',
        text: 'Return Quantity Can Not Be More Than Available Quantity',
        footer: '',
        backdrop : false,
      });
      this.xferItem.Quantity = 0;
    }
   
  }

  onSumbit(){
    this.selectedPurchaseMaster.ShopID = this.shop[0].ShopID;
    this.data.PurchaseRetureMaster = this.selectedPurchaseMaster;
    this.data.PurchaseRetureDateil = JSON.stringify(this.itemList);
    console.log(this.data);
  }

}
