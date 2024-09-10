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
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';

@Component({
  selector: 'app-transfer-product-invoice',
  templateUrl: './transfer-product-invoice.component.html',
  styleUrls: ['./transfer-product-invoice.component.css']
})
export class TransferProductInvoiceComponent implements OnInit {

  env = environment;
  user = JSON.parse(localStorage.getItem('user') || '');
  company = JSON.parse(localStorage.getItem('company') || '');
  shop = JSON.parse(localStorage.getItem('shop') || '');
  companySetting = JSON.parse(localStorage.getItem('companysetting') || '');
  selectedShop:any =JSON.parse(localStorage.getItem('selectedShop') || '') ;
  id: any;
  constructor( private router: Router,
    private route: ActivatedRoute,
    private ps: ProductService,
    private purchaseService: PurchaseService,
    private ss: ShopService,
    public as: AlertService,
    private modalService: NgbModal,
    private sp: NgxSpinnerService,) {
      this.id = this.route.snapshot.params['id'];
     }

    Req :any= {SearchBarCode : '', searchString: '', SupplierID:0}

    xferItem: any = {
      ID: null, ProductName: null, Barcode: null, BarCodeCount: null, TransferCount: null, AcceptanceCode: null,  TransferStatus: null, CreatedBy: null, UpdatedBy: null, CreatedOn: null, UpdatedOn: null, Remark : ''
    };

    xferMaster: any = {
      ID: null,  CompanyID: null, ToShopID: null, TransferFromShop: null, DateStarted: null, DateCompleted: null, InvoiceNo: null, Status: 1, Quantity: 0, CreatedBy: null, UpdatedBy: null, CreatedOn: null, UpdatedOn: null,
    };
    data: any = { xMaster: null,  xDetail: null,};

    tempItem = { xferItem: null, Spec: null };
    SearchBarCode: any;
    searchValue: any;
    selectedProduct: any;
    prodList:any;
    specList: any;
    shopList: any;
    shopLists: any;
    barCodeList: any;
    xferList: any = [];
    showAdd = false;
    shopMode = 'false';
    item: any;

  ngOnInit(): void {
    this.getProductList();
    this.dropdownShoplist();
  }

  
  getProductList(){
    const subs: Subscription =  this.ps.getList().subscribe({
      next: (res: any) => {
        if(res.success){
          this.prodList = res.data.sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
        }else{
          this.as.errorToast(res.message)
        }
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getFieldList(){
    const subs: Subscription =  this.ps.getFieldList(this.selectedProduct).subscribe({
       next: (res: any) => {
        if(res.success){
          this.specList = res.data;
          this.getSptTableData();
        }else{
          this.as.errorToast(res.message)
        }
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
          if(res.success){
            element.SptTableData = res.data.sort((a: { TableValue: string; }, b: { TableValue: any; }) => (a.TableValue.trim()).localeCompare(b.TableValue));
            element.SptFilterData = res.data.sort((a: { TableValue: string; }, b: { TableValue: any; }) => (a.TableValue.trim()).localeCompare(b.TableValue));
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
            element.SptTableData = res.data.sort((a: { TableValue: string; }, b: { TableValue: any; }) => (a.TableValue.trim()).localeCompare(b.TableValue));
            element.SptFilterData = res.data.sort((a: { TableValue: string; }, b: { TableValue: any; }) => (a.TableValue.trim()).localeCompare(b.TableValue));
          }else{
            this.as.errorToast(res.message)
          }
         },
         error: (err: any) => console.log(err.message),
         complete: () => subs.unsubscribe(),
       });
      }
     });
     this.xferItem.ProductName = ''
     this.xferItem.Barcode = ''
     this.xferItem.BarCodeCount = ''
  }

  onChange(event: any ) {
    if (this.companySetting.DataFormat === '1') {
      event = event.toUpperCase()
    } else if (this.companySetting.DataFormat == '2') {
      event = event.toTitleCase()
    }
    return event;
  }

  dropdownShoplist(){
    this.sp.show()
    const datum = {
      currentPage: 1,
      itemsPerPage: 100
    }
    const subs: Subscription = this.ss.getList(datum).subscribe({
      next: (res: any) => {
        if(res.success){
          let shop = res.data
          this.shopList = shop.filter((s:any) => s.ID !== Number(this.selectedShop[0]));
          this.shopLists = res.data
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  productSelect(data:any){
    this.Req.searchString = data.ProductName
    if(data !== undefined){
      this.Req.SupplierID = data.SupplierID;
    }else{
      this.Req.SupplierID = 0
    }
    this.getProductDataByBarCodeNo()
  }

  getProductDataByBarCodeNo(){
    this.sp.show()
    const subs: Subscription =  this.purchaseService.productDataByBarCodeNo(this.Req, 'false', 'false').subscribe({
      next: (res: any) => {
        if(res.success){
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
            this.xferItem.ProductName = (this.item.ProductTypeName + '/' +  this.item.ProductName).toUpperCase();
            this.xferItem.Barcode = this.item.Barcode;
            this.xferItem.BarCodeCount = this.item.BarCodeCount;
            this.xferItem.TransferCount = 0;
            this.xferItem.ToShopID = null;
            this.xferItem.TransferFromShop = Number(this.selectedShop[0]);
            this.xferItem.TransferStatus = "";

            if (this.item !== undefined || this.item.Barcode !== null && this.item.BarCodeCount !== 0) {
              if (this.xferList.length !== 0 && this.xferItem.ProductName !== "") {
                let itemCount = 0;
                this.xferList.forEach((element: any) => {
                  if (element.ProductName === this.xferItem.ProductName && element.ID === null) {
                    itemCount = itemCount + element.TransferCount;
                  }
                })
                this.xferItem.BarCodeCount = this.item.BarCodeCount - itemCount;
              }
            }

          }
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getBarCodeList(index:any) {
    let searchString = "";
    this.specList.forEach((element: any, i: any) => {
      if (i <= index) {
        searchString = searchString + element.SelectedValue.trim() + "/" ;
      }
    });
    const subs: Subscription =  this.purchaseService.barCodeListBySearchString(this.shopMode,this.selectedProduct, searchString.toString()).subscribe({
      next: (res: any) => {
        if(res.success){
          this.barCodeList = res.data;
        }else{
          this.as.errorToast(res.message)
        }
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  TransferCountLimit(){
    if ( this.xferItem.TransferCount > this.xferItem.BarCodeCount ){
      Swal.fire({
        icon: 'warning',
        title: 'Opps !!',
        text: 'Transfer Count can not be more than Available Count',
        footer: '',
        backdrop : false,
      });
      this.xferItem.TransferCount = 0;
    }
  }

  addItem(){
    this.xferList.unshift(this.xferItem);
    this.xferMaster.Quantity = 0
    this.xferList.forEach((e: any) =>{
      this.xferMaster.Quantity  += e.TransferCount
    })
    console.log(this.xferList);
    this.tempItem = { xferItem: null, Spec: null };
    this.xferItem = {
      ID: null, ProductName: null, Barcode: null, BarCodeCount: null, TransferCount: null, AcceptanceCode: null,  TransferStatus: null, CreatedBy: null, UpdatedBy: null, CreatedOn: null, UpdatedOn: null, Remark : ''
    };
    this.Req = {SearchBarCode : '', searchString: '', SupplierID:0}
    this.SearchBarCode = '';
    this.selectedProduct = '';
    this.specList = []
  }


  onSumbit(){
    this.data.xMaster = this.xferMaster;
    this.data.xDetail = JSON.stringify(this.xferList);
   console.log(this.data);
   
  }
}
