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
  selectedProduct: any;
  prodList:any;
  specList: any;
  ShopMode = 'false';
  SummaryList:any;
  shopList:any;
  supplierList:any;
  UpdateBarndType = false;
  BarndTypeUp:any = 0;

  currentPage = 1;
  itemsPerPage = 10;
  pageSize!: number;
  collectionSize = 0
  page = 4;
 

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private ps: ProductService,
    private purchaseService: PurchaseService,
    private ss: ShopService,
    private sup: SupplierService,
    private excelService: ExcelService,
    public as: AlertService,
  ){
    this.id = this.route.snapshot.params['id'];
  }

  data:any = {PurchaseID: 0, ShopID: 0, ProductCategory : 0, ProductName:'', SupplierID: 0,  };

  ngOnInit(): void {
    this.getProductList();
    this.dropdownShoplist();
    this.dropdownSupplierlist();
    this.getList();
    
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
    if(this.data.ProductCategory !== 0){
      this.prodList.forEach((element: any) => {
        if (element.ID === this.data.ProductCategory) {
          this.selectedProduct = element.Name;
        }
      })
      const subs: Subscription =  this.ps.getFieldList(this.selectedProduct).subscribe({
        next: (res: any) => {
        this.specList = res.data;
        this.getSptTableData();
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

  onChange(event: any) {
    if (this.companysetting.DataFormat === '1') {
      event = event.toUpperCase()
    } else if (this.companysetting.DataFormat == '2') {
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

  getReturnData(){
    let Parem = '';
    const dtm = { 
      Parem : "",
      currentPage: 1,
      itemsPerPage: 50000
    }

    if (this.data.ProductCategory  !== 0){
      Parem = Parem + ' and purchasedetailnew.ProductTypeID = ' +  this.data.ProductCategory ;
      this.filter();}

    if (this.data.ProductName !== '') {
      Parem = Parem + ' and purchasedetailnew.ProductName Like ' + '"' + this.data.ProductName + '%"';}

    if (this.data.ShopID !== 0){
      Parem = Parem + ' and barcodemasternew.ShopID IN ' +  `(${this.data.ShopID})`;}

    if (this.data.SupplierID !== 0){
      Parem = Parem + ' and purchasemasternew.SupplierID = ' +  this.data.SupplierID;}

      dtm.Parem = Parem

    const subs: Subscription =  this.purchaseService.getPurchaseReturnList(dtm).subscribe({
      next: (res: any) => {
        if(res.message){
          this.as.successToast(res.message)
          this.collectionSize = 1;
          this.SummaryList = res.data;
        }
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  changePagesize(num: number): void {
    this.itemsPerPage = this.pageSize + num;
  }

  getList() {
    const dtm = {
      Parem : "",
      currentPage: this.currentPage,
      itemsPerPage: this.itemsPerPage
    }
    const subs: Subscription = this.purchaseService.getPurchaseReturnList(dtm).subscribe({
      next: (res: any) => {
        this.collectionSize = res.count;
        this.SummaryList = res.data;
        this.as.successToast(res.message)
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

}
