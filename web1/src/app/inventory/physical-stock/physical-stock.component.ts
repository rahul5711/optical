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
  selector: 'app-physical-stock',
  templateUrl: './physical-stock.component.html',
  styleUrls: ['./physical-stock.component.css']
})
export class PhysicalStockComponent implements OnInit {
  evn = environment;
  user = JSON.parse(localStorage.getItem('user') || '');
  company = JSON.parse(localStorage.getItem('company') || '');
  shop = JSON.parse(localStorage.getItem('shop') || '');
  companySetting = JSON.parse(localStorage.getItem('companysetting') || '');
  selectedShop:any =JSON.parse(localStorage.getItem('selectedShop') || '') ;
  id: any;

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

  Barcode:any= "";
  ProductSearch:any=""
  dataList:any=[]
  totalAvailableQty:any=0
  totalPhysicalQty:any=0


  ngOnInit(): void {
  }
  reset(){
    this.totalAvailableQty = 0
    this.totalPhysicalQty = 0
    this.dataList = []
    this.ProductSearch = ""
    this.Barcode = ""
  }
  getList(){
    this.sp.show()
    let Parem = ''
    if(this.Barcode != ""){
      Parem =  ' and barcodemasternew.Barcode = ' + `${this.Barcode}`;
    }
    const subs: Subscription = this.purchaseService.getPhysicalStockProductList(Parem,this.ProductSearch).subscribe({
      next: (res: any) => {
       this.dataList = res.data
       this.totalAvailableQty = res.calculation[0].totalAvailableQty
       this.totalPhysicalQty = res.calculation[0].totalPhysicalQty
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
  }
}
