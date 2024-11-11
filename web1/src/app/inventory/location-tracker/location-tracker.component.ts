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
import * as moment from 'moment';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SupportService } from 'src/app/service/support.service';

@Component({
  selector: 'app-location-tracker',
  templateUrl: './location-tracker.component.html',
  styleUrls: ['./location-tracker.component.css']
})
export class LocationTrackerComponent implements OnInit {

  evn = environment;
  user = JSON.parse(localStorage.getItem('user') || '');
  company = JSON.parse(localStorage.getItem('company') || '');
  shop = JSON.parse(localStorage.getItem('shop') || '');
  companySetting = JSON.parse(localStorage.getItem('companysetting') || '');
  selectedShop: any = JSON.parse(localStorage.getItem('selectedShop') || '');
  id: any;

  term: any;
  searchValue: any;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private ps: ProductService,
    private purchaseService: PurchaseService,
    private ss: ShopService,
    public as: AlertService,
    public sp: NgxSpinnerService,
    private modalService: NgbModal,
    private supps: SupportService,
  ){
    this.id = this.route.snapshot.params['id'];
  }

  data1: any = { Barcode: "",  ProductCategory: 0, ProductName: '',ShopID:'' };

  located: any = { ProductTypeID:'' ,ProductNameType:'', ProductName: '', Barcode: "", TotalQty:0, Located:0, Unloacted:0, LocationID:'', qty:0};



  selectedProduct: any;
  shopList:any=[]
  prodList: any;
  specList: any;
  Productsearch:any="";
  dataList:any=[];
  locationList:any=[];
  locatedList:any=[];
  btnDis = true

  ngOnInit(): void {
    this.getProductList();
    this.dropdownShoplist()
  }

  getLocationList() {
    this.sp.show();
    const subs: Subscription = this.supps.getList('LocationTracker').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.locationList = res.data
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),

    });
    this.sp.hide();
  }

  dropdownShoplist() {
    const subs: Subscription = this.ss.dropdownShoplist('').subscribe({
      next: (res: any) => {
        this.shopList = res.data
        let shop = this.shopList
        this.shopList = shop.filter((s: any) => s.ID === Number(this.selectedShop[0]));
        this.data1.ShopID = this.shopList[0].ID
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getProductList() {
    this.sp.show()
    const subs: Subscription = this.ps.getList().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.prodList = res.data.sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
          this.as.successToast(res.message)
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getFieldList() {
    if (this.data1.ProductCategory !== 0) {
      this.prodList.forEach((element: any) => {
        if (element.ID === this.data1.ProductCategory) {
          this.selectedProduct = element.Name;
        }
      })
      const subs: Subscription = this.ps.getFieldList(this.selectedProduct).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.specList = res.data;
            this.getSptTableData();
            this.as.successToast(res.message)
          } else {
            this.as.errorToast(res.message)
          }
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    }
    else {
      this.specList = [];
      this.data1.ProductName = '';
      this.data1.ProductCategory = 0;
    }
  }

  getSptTableData() {
    this.specList.forEach((element: any) => {
      if (element.FieldType === 'DropDown' && element.Ref === '0') {
        const subs: Subscription = this.ps.getProductSupportData('0', element.SptTableName).subscribe({
          next: (res: any) => {
            if (res.success) {
              element.SptTableData = res.data.sort((a: { TableValue: string; }, b: { TableValue: any; }) => (a.TableValue.trim()).localeCompare(b.TableValue));
              element.SptFilterData = res.data.sort((a: { TableValue: string; }, b: { TableValue: any; }) => (a.TableValue.trim()).localeCompare(b.TableValue));
             
            } else {
              this.as.errorToast(res.message)
            }
          },
          error: (err: any) => console.log(err.message),
          complete: () => subs.unsubscribe(),
        });
      }
    });
  }

  getFieldSupportData(index: any) {
    this.specList.forEach((element: any) => {
      if (element.Ref === this.specList[index].FieldName.toString()) {
        const subs: Subscription = this.ps.getProductSupportData(this.specList[index].SelectedValue, element.SptTableName).subscribe({
          next: (res: any) => {
            if (res.success) {
              element.SptTableData = res.data.sort((a: { TableValue: string; }, b: { TableValue: any; }) => (a.TableValue.trim()).localeCompare(b.TableValue));
              element.SptFilterData = res.data.sort((a: { TableValue: string; }, b: { TableValue: any; }) => (a.TableValue.trim()).localeCompare(b.TableValue));
             
            } else {
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
    this.data1.ProductName = productName;
  }

  getList() {
    this.sp.show();
    let Parem = '';

    if (this.data1.ShopID != "") {
      Parem = Parem + ' and barcodemasternew.ShopID = ' + this.data1.ShopID;
    }

    if (this.data1.Barcode != "") {
      Parem = Parem + ' and barcodemasternew.Barcode = ' + this.data1.Barcode;
    }

    if (this.data1.ProductCategory !== 0) {
      this.filter();
    }

    if (this.data1.ProductName !== '') {
      Parem = Parem + ' and purchasedetailnew.ProductName Like ' + " '%" + this.data1.ProductName.trim() + "%' ";
    }

    const subs: Subscription = this.purchaseService.getLocationStockProductList(Parem,this.Productsearch).subscribe({
      next: (res: any) => {
        this.dataList = res.data;
        this.specList = [];


        if (res.success) {
          this.as.successToast(res.message);
        } else {
          this.as.errorToast(res.message);
        }
        this.sp.hide();
      },
      error: (err: any) => {
        console.log(err.message);
      },
      complete: () => subs.unsubscribe(),
    });
  }

  Reset(){
    this.located = []
    this.data1 = []
    this.specList = [];
    this.Productsearch = "";
    this.dataList = [];
    this.locationList = [];
    this.locatedList = [];
    let shop = this.shopList
    this.shopList = shop.filter((s: any) => s.ID === Number(this.selectedShop[0]));
    this.data1.ShopID = this.shopList[0].ID
    this.data1.ProductCategory = 0
    this.data1.Barcode = 0
  }
  
  openModal(content: any, data: any) {
    this.modalService.open(content, { centered: true, backdrop: 'static', keyboard: false, size: 'md' });
    this.getLocationList()
    this.located = data
    this.getProductLocationByBarcodeNumber(this.located.Barcode)
  }


  savelocation(){
    this.sp.show()
    const subs: Subscription = this.purchaseService.saveProductLocation(this.located).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.id = res.data
          this.getProductLocationByBarcodeNumber(this.located.Barcode)
          this.located.LocationID = '';
          this.located.Qty = '';
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getProductLocationByBarcodeNumber(Barcode:any){
    this.sp.show()
    let dtm = {
      Barcode:Barcode
    }
    const subs: Subscription = this.purchaseService.getProductLocationByBarcodeNumber(dtm).subscribe({
      next: (res: any) => {
        if (res.success) {
              this.locatedList = res.data
              this.located.Located = 0
              this.locatedList.forEach((e:any)=>{
                this.located.Located += e.Qty
              })
              
              this.located.Unloacted = this.located.TotalQty - this.located.Located
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  edit(data:any){
      this.located.ID = data.ID
      this.located.LocationID = data.LocationID
      this.located.Qty = data.Qty
      this.btnDis = false
  }

  updatelocation(){
    this.sp.show()
    const subs: Subscription = this.purchaseService.updateProductLocation(this.located).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.id = res.data
          this.getProductLocationByBarcodeNumber(this.located.Barcode);
          this.located.LocationID = '';
          this.located.Qty = '';
          this.btnDis = true
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }
  deleteProductLocation(data:any){
    this.sp.show()
   let bacode= data.Barcode
    const subs: Subscription = this.purchaseService.deleteProductLocation(data).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.getProductLocationByBarcodeNumber(bacode)
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }


}
