import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { ProductService } from 'src/app/service/product.service';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { NgxSpinnerService } from 'ngx-spinner';
import { PurchaseService } from 'src/app/service/purchase.service';
import { ShopService } from 'src/app/service/shop.service';
import { SupplierService } from 'src/app/service/supplier.service';
import { ExcelService } from 'src/app/service/helpers/excel.service';
import * as moment from 'moment';


@Component({
  selector: 'app-inventory-summary',
  templateUrl: './inventory-summary.component.html',
  styleUrls: ['./inventory-summary.component.css']
})

export class InventorySummaryComponent implements OnInit {

  evn = environment;
  user = JSON.parse(localStorage.getItem('user') || '');
  company = JSON.parse(localStorage.getItem('company') || '');
  shop = JSON.parse(localStorage.getItem('shop') || '');
  companySetting = JSON.parse(localStorage.getItem('companysetting') || '');
  selectedShop:any =JSON.parse(localStorage.getItem('selectedShop') || '') ;

  id: any;
  selectedProduct: any;
  prodList:any;
  specList: any;
  ShopMode = 'false';
  SummaryList:any;
  shopList:any;
  supplierList:any;
  UpdateBarndType = false;
  BarndTypeUp:any = 0;
  searchValue:any

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private ps: ProductService,
    private purchaseService: PurchaseService,
    private ss: ShopService,
    private sup: SupplierService,
    private excelService: ExcelService,
    public as: AlertService,
    public sp: NgxSpinnerService,
  ){
    this.id = this.route.snapshot.params['id'];
  }

  data:any = {PurchaseID: 0, ShopID: 0, ProductCategory : 0, ProductName:'', CurrentStatus : "Available", SupplierID: 0, BrandType:0 ,  Barcode: "", };

  ngOnInit(): void {
    if(this.user.UserGroup === 'Employee'){
      this.shopList  = this.shop;
      this.data.ShopID = this.shopList[0].ShopID
    }else{
      this.dropdownShoplist();
    }
    this.getProductList();
    this.dropdownSupplierlist();
  }

  dropdownShoplist(){
    this.sp.show()
    const subs: Subscription = this.ss.dropdownShoplist('').subscribe({
      next: (res: any) => {
        if(res.success){
          this.shopList  = res.data
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  dropdownSupplierlist(){
    this.sp.show()
    const subs: Subscription = this.sup.dropdownSupplierlist('').subscribe({
      next: (res: any) => {
        if(res.success){
          this.supplierList  = res.data
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getProductList(){
    this.sp.show()
    const subs: Subscription =  this.ps.getList().subscribe({
      next: (res: any) => {
        if(res.success){
          this.prodList  = res.data
          this.as.successToast(res.message)
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getFieldList(){
    if(this.data.ProductCategory !== 0){
      this.prodList.forEach((element: any) => {
        if (element.ID === this.data.ProductCategory) {
          this.selectedProduct = element.Name;
        }
      })
      const subs: Subscription =  this.ps.getFieldList(this.selectedProduct).subscribe({
        next: (res: any) => {
          if(res.success){
            this.specList = res.data;
            this.getSptTableData();
            this.as.successToast(res.message)
          }else{
            this.as.errorToast(res.message)
          }
       },
       error: (err: any) => console.log(err.message),
       complete: () => subs.unsubscribe(),
     });
    }
    else {
      this.specList = [];
      this.data.ProductName = '';
      this.data.ProductCategory = 0;
    }
  }

  getSptTableData() { 
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
          if(res.success){
            element.SptTableData = res.data; 
            element.SptFilterData = res.data;   
          }else{
            this.as.errorToast(res.message)
          }
         },
         error: (err: any) => console.log(err.message),
         complete: () => subs.unsubscribe(),
       });
      }
     });
  }

  onChange(event: any) {
    if (this.companySetting.DataFormat === '1') {
      event = event.toUpperCase()
    } else if (this.companySetting.DataFormat == '2') {
      event = event.toTitleCase()
    }
    return event;
  }

  filter() {
    let productName = '';
    this.specList.forEach((element: any) => {
     if (productName === '') {
        productName = element.SelectedValue;
     } else if (element.SelectedValue !== '') {
        productName += '/' + element.SelectedValue;
     }
    });
    this.data.ProductName = productName;
  }

  getInventoryData(){
    this.sp.show()
    let Parem = '';

    if (this.data.ProductCategory  !== 0){
      Parem = Parem + ' and purchasedetailnew.ProductTypeID = ' +  this.data.ProductCategory ;
      this.filter();}

    if (this.data.ProductName !== '') {
      Parem = Parem + ' and purchasedetailnew.ProductName Like ' + '"' + this.data.ProductName + '%"';}

    if (this.data.CurrentStatus !== ''){
      Parem = Parem + ' and barcodemasternew.CurrentStatus = ' + '"' + this.data.CurrentStatus + '"';}

    if (this.data.BrandType !== ''){
      Parem = Parem + ' and purchasedetailnew.BrandType = ' + '"' + this.data.BrandType + '"';}

    if (this.data.Barcode !== ''){
      Parem = Parem + ' and barcodemasternew.Barcode Like ' + '"' + this.data.Barcode + '%"';}

    if (this.data.ShopID !== 0){
      Parem = Parem + ' and barcodemasternew.ShopID IN ' +  `(${this.data.ShopID})`;}

    if (this.data.SupplierID !== 0){
      Parem = Parem + ' and purchasemasternew.SupplierID = ' +  this.data.SupplierID;}

    const subs: Subscription =  this.purchaseService.getInventorySummary(Parem).subscribe({
      next: (res: any) => {
        if(res.message){
          this.as.successToast(res.message)
          res.data.forEach((el: any) => {
            el.PurchaseDate = moment(el.PurchaseDate).format(`${this.companySetting.DateFormat}`);
          })
          this.SummaryList = res.data;
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  showInput(){
    this.UpdateBarndType = !this.UpdateBarndType;
  }

  updateInventorySummary(data:any){
    this.sp.show()
    const subs: Subscription =  this.purchaseService.updateInventorySummary(data).subscribe({
      next: (res: any) => {
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  exportAsXLSX(): void {
    let data = this.SummaryList.map((e: any) => {
      return{
        ProductTypeName: e.ProductTypeName,
        ProductName : e.ProductName,
        BrandType : e.BrandType,
        PurchaseDate : e.PurchaseDate,
        Quantity : e.Count,
        ShopName : e.ShopName,
        AreaName : e.AreaName,
        CurrentStatus : e.CurrentStatus,
        Barcode : e.Barcode,
        SupplierName : e.SupplierName,
        UnitPrice : e.UnitPrice,
        DiscountPercentage : e.DiscountPercentage,
        GSTPercentage : e.GSTPercentagex,
        GSTType : e.GSTTypex,
        RetailPrice : e.RetailPrice,
        WholeSalePrice : e.WholeSalePrice,
      }
    })
    this.excelService.exportAsExcelFile(data, 'Summary_List');
  }
}
