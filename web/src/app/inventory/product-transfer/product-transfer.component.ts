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

@Component({
  selector: 'app-product-transfer',
  templateUrl: './product-transfer.component.html',
  styleUrls: ['./product-transfer.component.css']
})

export class ProductTransferComponent implements OnInit {

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
  secretCode: any;
  prodList:any;
  specList: any;
  shopList: any;
  barCodeList: any;
  xferList: any;
  showAdd = false;
  shopMode = 'false';
  item: any;
  Req :any= {SearchBarCode : ''}

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private ps: ProductService,
    private purchaseService: PurchaseService,
    private ss: ShopService,
    public as: AlertService,
  ){
    this.id = this.route.snapshot.params['id'];
  }

  xferItem: any = {
    ID: null, ProductName: null, Barcode: null, BarCodeCount: null, TransferCount: null,ToShopID: null, TransferFromShop: null, AcceptanceCode: null, DateStarted: null, DateCompleted: null, TransferStatus: null, CreatedBy: null, UpdatedBy: null, CreatedOn: null, UpdatedOn: null, Remark : ''
  };

  ngOnInit(): void {
    this.getProductList();
    this.dropdownShoplist();
    this.getTransferList();
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

  onChange(event: { toUpperCase: () => any; toTitleCase: () => any; }) {
    if (this.companysetting.DataFormat === '1') {
      event = event.toUpperCase()
    } else if (this.companysetting.DataFormat == '2') {
      event = event.toTitleCase()
    }
    return event;
  }

  dropdownShoplist(){
    const subs: Subscription = this.ss.dropShoplist().subscribe({
      next: (res: any) => {
        let shop = res.data
        this.shopList = shop.filter((s:any) => s.ID !== Number(this.selectedShop[0]));
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getProductDataByBarCodeNo(){
    const subs: Subscription =  this.purchaseService.productDataByBarCodeNo(this.Req, 'false', 'false').subscribe({
      next: (res: any) => {
        this.item  = res.data;
        this.xferItem.ProductName = (this.item .ProductTypeName + '/' +  this.item.ProductName).toUpperCase();
        this.xferItem.Barcode = this.item.Barcode;
        this.xferItem.BarCodeCount = this.item.BarCodeCount;
        this.xferItem.TransferCount = 0;
        this.xferItem.ToShopID = null;
        this.xferItem.TransferFromShop = Number(this.selectedShop[0]);
        this.xferItem.TransferStatus = "";
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
    const subs: Subscription =  this.purchaseService.barCodeListBySearchString(this.shopMode,this.selectedProduct, searchString).subscribe({
      next: (res: any) => {
        this.barCodeList = res.data;
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  TransferCountLimit(){
    if ( this.xferItem.TransferCount > this.xferItem.BarCodeCount ){
      // alert('Transfer Count can not be more than Available Count');
      Swal.fire({
        icon: 'warning',
        title: 'Opps !!',
        text: 'Transfer Count can not be more than Available Count',
        footer: ''
      });
      this.xferItem.TransferCount = 0;
    }
  }
  
  onSubmit(){
    const subs: Subscription =  this.purchaseService.transferProduct(this.xferItem).subscribe({
      next: (res: any) => {
        this.xferList = res.data;
        console.log(this.xferList);
        
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getTransferList(){
    const subs: Subscription =  this.purchaseService.getTransferList(this.id).subscribe({
      next: (res: any) => {
        this.xferList = res.data;
        console.log(this.xferList);
        
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  cancelTransfer(i:any){
    this.xferList[i].Remark = 'Cancel';
    const subs: Subscription =  this.purchaseService.cancelTransfer(this.xferList[i]).subscribe({
      next: (res: any) => {
        this.xferList = res.data; 
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }


  acceptTransfer(i:any){

    const subs: Subscription =  this.purchaseService.acceptTransfer(this.xferList[i]).subscribe({
      next: (res: any) => {
        this.xferList = res.data;
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

}
