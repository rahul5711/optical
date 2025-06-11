import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { ProductService } from 'src/app/service/product.service';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { NgxSpinnerService } from 'ngx-spinner';
import { PurchaseService } from 'src/app/service/purchase.service';


@Component({
  selector: 'app-search-barcode',
  templateUrl: './search-barcode.component.html',
  styleUrls: ['./search-barcode.component.css']
})

export class SearchBarcodeComponent implements OnInit {

  evn = environment;
  user = JSON.parse(localStorage.getItem('user') || '');
  company = JSON.parse(localStorage.getItem('company') || '');
  shop = JSON.parse(localStorage.getItem('shop') || '');
  companySetting = JSON.parse(localStorage.getItem('companysetting') || '');
  selectedShop:any =JSON.parse(localStorage.getItem('selectedShop') || '') ;
  Productsearch:any = '';
  id: any;
  SearchBarCode: any;
  searchString:any='';
  selectedProduct: any;
  prodList:any;
  specList: any;
  barCodeList: any;
  searchList: any;
  ShopMode = 'false';
  UpdateBarcode = false;
  searchValue:any;
  Req: any = { SearchBarCode: '', searchString: '', SupplierID : 0 }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private ps: ProductService,
    private purchaseService: PurchaseService,
    public as: AlertService,
    public sp: NgxSpinnerService,
  ){
    this.id = this.route.snapshot.params['id'];
  }

  ngOnInit(): void {
    this.getProductList();
  }

  getProductList(){
    this.sp.show()
    const subs: Subscription =  this.ps.getList().subscribe({
      next: (res: any) => {
        if(res.success){
          this.prodList = res.data.sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
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
  }

  onChange(event: { toUpperCase: () => any; toTitleCase: () => any; }) {
    if (this.companySetting.DataFormat === '1') {
      event = event.toUpperCase()
    } else if (this.companySetting.DataFormat == '2') {
      event = event.toTitleCase()
    }
    return event;
  }

  getBarCodeList(index:any) {
    this.sp.show()
    let searchString = "";
    this.specList.forEach((element: any, i: any) => {
      if (i <= index) {
          let valueToAdd = element.SelectedValue ;
        valueToAdd = valueToAdd.replace(/^\d+_/, "");
        searchString = searchString + valueToAdd.trim() + "/" ;
      }
    });
    const subs: Subscription =  this.purchaseService.barCodeListBySearchString(this.ShopMode, this.selectedProduct, searchString).subscribe({
      next: (res: any) => {
        if(res.success){
          this.barCodeList = res.data;  
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
    this.searchString = data.ProductName

    if(data !== undefined){
      this.Req.SupplierID = data.SupplierID;
    }else{
      this.Req.SupplierID = 0
    }
    this.getBarcodeDataByBarcodeNo('search')
  }

  getBarcodeDataByBarcodeNo(mode:any){
    this.sp.show()
    const subs: Subscription =  this.purchaseService.barcodeDataByBarcodeNo(this.SearchBarCode, this.searchString, mode, this.ShopMode).subscribe({
      next: (res: any) => {
        if(res.success){
          this.searchList = res.data;      
          if (this.searchList.length === 0) {
            Swal.fire({
              icon: 'warning',
              title:'Please Enter Correct Barcode ',
              text: 'Incorrect Barcode OR Product not available in this Shop.',
              footer: '',
              backdrop : false,
            });
          }  
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  updateBarcode(data:any){
    this.sp.show()
    const subs: Subscription =  this.purchaseService.updateBarcode(data).subscribe({
      next: (res: any) => {
        if (res.success) {
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Your file has been Update.',
            showConfirmButton: false,
            timer: 1500
          })   
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
    this.UpdateBarcode = !this.UpdateBarcode;
  }

  searchAll(index:any){
    this.sp.show()
    let searchString = "";
    this.specList.forEach((element: any, i: any) => {
      if (i <= index) {
        let valueToAdd = element.SelectedValue ;
        valueToAdd = valueToAdd.replace(/^\d+_/, "");
        searchString = searchString + valueToAdd.trim() + "/" ;
      }
    });
    const subs: Subscription =  this.purchaseService.barCodeListBySearchStringSearch(this.ShopMode, this.selectedProduct, searchString).subscribe({
      next: (res: any) => {
        if(res.success){
          this.searchList = res.data; 
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }


}
