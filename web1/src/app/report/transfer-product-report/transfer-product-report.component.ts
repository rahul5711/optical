import { Component, OnInit } from '@angular/core';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { ProductService } from 'src/app/service/product.service';
import { Subscription ,fromEvent} from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import { PurchaseService } from 'src/app/service/purchase.service';
import { ShopService } from 'src/app/service/shop.service';
import * as moment from 'moment';
import * as XLSX from 'xlsx';
import { FormBuilder,FormGroup } from '@angular/forms';

@Component({
  selector: 'app-transfer-product-report',
  templateUrl: './transfer-product-report.component.html',
  styleUrls: ['./transfer-product-report.component.scss']
})
export class TransferProductReportComponent implements OnInit {
  user:any =JSON.parse(localStorage.getItem('user') || '');
  shop:any =JSON.parse(localStorage.getItem('shop') || '');
  selectedShop:any =JSON.parse(localStorage.getItem('selectedShop') || '');
  permission = JSON.parse(localStorage.getItem('permission') || '[]');
  companySetting = JSON.parse(localStorage.getItem('companysetting') || '');
 searchValue :any = '';
   form :any | FormGroup;

  constructor(
    private purchaseService: PurchaseService,
    private ss: ShopService,
    private ps: ProductService,
    public as: AlertService,
    public sp: NgxSpinnerService,
    private fb: FormBuilder,

  ) {
    this.form = this.fb.group({
      billerIds: []
    })
   }

  TransfermasterList:any
  totalQty:any
  shopList :any;
  selectsShop :any;
  selectedProduct: any;
  prodList:any;
  specList: any;
  DetailtotalQty: any;
  billerList :any = []
  
  data: any =  {
    FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ToShop: 0, FromShop : 0,ProductStatus: 0,  ProductCategory : 0, ProductName:''
  };

  viewProductTransferReport = false
  editProductTransferReport = false
  addProductTransferReport = false
  deleteProductTransferReport = false
  
  searchby = true;

  ngOnInit(): void {
    this.permission.forEach((element: any) => {
      if (element.ModuleName === 'ProductTransferReport') {
        this.viewProductTransferReport = element.View;
        this.editProductTransferReport = element.Edit;
        this.addProductTransferReport = element.Add;
        this.deleteProductTransferReport = element.Delete;
      }
    });
    if(this.user.UserGroup === 'Employee'){
      this.dropdownShoplist();
      this.shopList  = this.shop;
      this.data.FromShop = this.shopList[0].ShopID
    }else{
      this.dropdownShoplist();
    }

    this.getProductList();
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
          let shop = res.data
          this.selectsShop = shop.filter((s:any) => s.ID === Number(this.selectedShop[0]));
          this.selectsShop =  '/ ' + this.selectsShop[0].Name + ' (' + this.selectsShop[0].AreaName + ')'

          this.billerList = res.data.map((o: any) => {
            return {
              id: o.ID,
              text: `${o.Name}`,
              // text: `${o.blr_id}`,
            };
          });

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
      Parem = Parem + ' and transfermaster.ProductName Like ' + "'" + this.data.ProductName.trim() + "%'";}

    const subs: Subscription =  this.purchaseService.getproductTransferReport(Parem).subscribe({
      next: (res: any) => {
        if(res.success){
          this.searchby = false
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

  public onSelectAll() {
    const selected = this.billerList.map((item: any) => item.id);
    this.form.get('billerIds').patchValue(selected);
  }
  
  public onClearAll() {
    this.form.get('billerIds').patchValue([]);
  }

  onClose() {
    const doc = document.getElementsByClassName('.ng-dropdown-panel')
}

dateFormat(date:any){
  return moment(date).format(`${this.companySetting.DateFormat}`);
}

onChange(event: { toUpperCase: () => any; toTitleCase: () => any; }) {
  if (this.companySetting.DataFormat === '1') {
    event = event.toUpperCase()
  } else if (this.companySetting.DataFormat == '2') {
    event = event.toTitleCase()
  }
  return event;
}

showFitter(){
  this.searchby = true
 }
}
