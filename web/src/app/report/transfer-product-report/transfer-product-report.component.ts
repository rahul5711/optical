import { Component, OnInit } from '@angular/core';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { ProductService } from 'src/app/service/product.service';
import { Subscription } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import { PurchaseService } from 'src/app/service/purchase.service';
import { ShopService } from 'src/app/service/shop.service';
import * as moment from 'moment';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-transfer-product-report',
  templateUrl: './transfer-product-report.component.html',
  styleUrls: ['./transfer-product-report.component.css']
})
export class TransferProductReportComponent implements OnInit {

  constructor(
    private purchaseService: PurchaseService,
    private ss: ShopService,
    private ps: ProductService,
    public as: AlertService,
    public sp: NgxSpinnerService,
  ) { }

  TransfermasterList:any
  totalQty:any
  shopList :any;
  selectedProduct: any;
  prodList:any;
  specList: any;
  DetailtotalQty: any;

  data: any =  {
    FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ToShop: 0, FromShop : 0,ProductStatus: 0,  ProductCategory : 0, ProductName:''
  };

  ngOnInit(): void {
    this.getProductList();
    this. dropdownShoplist();
    // TransferReport Today Data
    this.data.FromDate = moment().format('YYYY-MM-DD');
    this.data.ToDate = moment().format('YYYY-MM-DD');
    this.getTransferReport();
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
    this.sp.hide()
  }

  getProductList(){
    this.sp.show()
    const subs: Subscription =  this.ps.getList().subscribe({
      next: (res: any) => {
        if(res.success){
          this.prodList = res.data;
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
          }else{
            this.as.errorToast(res.message)
          }
       },
       error: (err: any) => console.log(err.message),
       complete: () => subs.unsubscribe(),
      });
    }else {
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

  filter() {
    let productName = '';
    this.specList.forEach((element: any) => {
     if (productName === '') {
        productName = element.ProductName + '/' + element.SelectedValue;
     } else if (element.SelectedValue !== '') {
        productName += '/' + element.SelectedValue;
     }
    });
    this.data.ProductName = productName;
  }

  getTransferReport(){
    this.sp.show()
    let Parem = '';

    if (this.data.FromDate !== '' && this.data.FromDate !== null){
      let FromDate =  moment(this.data.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and DATE_FORMAT(transfermaster.DateStarted, "%Y-%m-%d") between ' +  `'${FromDate}'`;}

    if (this.data.ToDate !== '' && this.data.ToDate !== null){
      let ToDate =  moment(this.data.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' +  `'${ToDate}'`;}

    if (this.data.ToShop != 0){
      Parem = Parem + ' and transfermaster.TransferToShop IN ' +  `(${this.data.ToShop})`;}
  
    if (this.data.FromShop != 0){
      Parem = Parem + ' and transfermaster.TransferFromShop IN ' +  `(${this.data.FromShop})`;}
  
    if (this.data.ProductStatus !== 0){
      Parem = Parem + ' and transfermaster.TransferStatus = '  + `'${this.data.ProductStatus}'`;}

    if (this.data.ProductCategory  !== 0){
      this.filter();}

    if (this.data.ProductName !== '' ){
      Parem = Parem + ' and transfermaster.ProductName Like ' + "'" + this.data.ProductName + "%'";}

    const subs: Subscription =  this.purchaseService.getproductTransferReport(Parem).subscribe({
      next: (res: any) => {
        if(res.success){
          this.as.successToast(res.message)
          this.TransfermasterList = res.data
          this.totalQty = res.calculation[0].totalQty
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

  exportAsXLSX(): void {
    let element = document.getElementById('ProductTransferExcel');
    const ws: XLSX.WorkSheet =XLSX.utils.table_to_sheet(element);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, 'Product_Transfer_Report.xlsx');
  }

  FromReset(){
    this.data =  { 
      FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ToShop: 0, FromShop : 0,ProductStatus: 0,  ProductCategory : 0, ProductName:''
    };
    this.TransfermasterList = [];
  }

}
