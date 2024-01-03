import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { ProductService } from 'src/app/service/product.service';
import { Subscription } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import { PurchaseService } from 'src/app/service/purchase.service';
import { ShopService } from 'src/app/service/shop.service';
import { SupplierService } from 'src/app/service/supplier.service';
import * as moment from 'moment';
import * as XLSX from 'xlsx';
import { SupportService } from 'src/app/service/support.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-inventory-report',
  templateUrl: './inventory-report.component.html',
  styleUrls: ['./inventory-report.component.css']
})

export class InventoryReportComponent implements OnInit {
  user:any =JSON.parse(localStorage.getItem('user') || '') ;
  shop:any =JSON.parse(localStorage.getItem('shop') || '') ;
  selectedShop:any =JSON.parse(localStorage.getItem('selectedShop') || '') ;
  permission = JSON.parse(localStorage.getItem('permission') || '[]');
  companySetting:any = JSON.parse(localStorage.getItem('companysetting') || '[]');

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private purchaseService: PurchaseService,
    private ss: ShopService,
    private sup: SupplierService,
    private supps: SupportService,
    private ps: ProductService,
    public as: AlertService,
    private modalService: NgbModal,
    private sp: NgxSpinnerService,
  ) { }

  myControl = new FormControl('All');
  filteredOptions: any ;
  searchValue:any='';
  supplierList :any;
  shopList :any;
  selectsShop :any;
  inventoryList: any;
  selectedProduct: any;
  prodList:any;
  specList: any;
  gstList: any;
  DetailtotalQty: any;
  DetailtotalDiscount: any;
  DetailtotalUnitPrice: any;
  DetailtotalSubTotal: any;
  DetailtotalAmount: any;
  DetailtotalGstAmount: any;
  DetailtotalRetailPrice: any;
  DetailtotalWholeSalePricet: any;
  gstdetails:any
  TtlR:any = 0
  TtlW:any = 0

  ProductExpiryList:any
  specList1:any
  ExpirytotalQty :any 
  ExpirytotalDiscount :any 
  ExpirytotalUnitPrice :any
  ExpirytotalGstAmount :any
  ExpirytotalAmount :any 
  gstExpirys :any 
  todaydate: any;


  inventory: any =  {
    FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, SupplierID: 0, Barcode:'', CurrentStatus:'Available', PaymentStatus: 0,  ProductCategory : 0, ProductName:'', GSTType: 0, GSTPercentage: 0,StringProductName:''
  };

  data: any =  {
    FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'),SupplierID:0, ShopID: 0, 
  };

  ProductExpiry: any =  {
    FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, SupplierID: 0,  
    PaymentStatus: 0,  ProductCategory : 0, ProductName:'', GSTType: 0, GSTPercentage: 0
  };

  viewInventoryReport = false
  addInventoryReport = false
  editInventoryReport = false
  deleteInventoryReport = false

  viewProductSummaryReport = false
  addProductSummaryReport = false
  editProductSummaryReport = false
  deleteProductSummaryReport = false

  viewPurchaseProductExpiryReport = false
  addPurchaseProductExpiryReport = false
  editPurchaseProductExpiryReport = false
  deletePurchaseProductExpiryReport = false



  ngOnInit(): void {
    this.permission.forEach((element: any) => {
      if (element.ModuleName === 'InventoryReport') {
        this.viewInventoryReport = element.View;
        this.addInventoryReport = element.Add;
        this.editInventoryReport = element.Edit;
        this.deleteInventoryReport = element.Delete;
      }else if (element.ModuleName === 'ProductSummaryReport') {
        this.viewProductSummaryReport = element.View;
        this.addProductSummaryReport = element.Add;
        this.editProductSummaryReport = element.Edit;
        this.deleteProductSummaryReport = element.Delete;
      }else if (element.ModuleName === 'PurchaseProductExpiryReport') {
        this.viewPurchaseProductExpiryReport = element.View;
        this.addPurchaseProductExpiryReport = element.Add;
        this.editPurchaseProductExpiryReport = element.Edit;
        this.deletePurchaseProductExpiryReport = element.Delete;
      }
    });

    if(this.user.UserGroup === 'Employee'){
      this.shopList  = this.shop;
      this.inventory.ShopID = this.shopList[0].ShopID
      this.data.ShopID = this.shopList[0].ShopID
      this.ProductExpiry.ShopID = this.shopList[0].ShopID
    }else{
      this.dropdownShoplist()
    }

    // this.dropdownSupplierlist();
    this.getProductList();
    this.getGSTList();
    this.inventory.FromDate = moment().format('YYYY-MM-DD');
    this.inventory.ToDate = moment().format('YYYY-MM-DD');
    this.getInventory()

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
    if(this.inventory.ProductCategory !== 0){
      this.prodList.forEach((element: any) => {
        if (element.ID === this.inventory.ProductCategory) {
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
    }
    else {
      this.specList = [];
      this.inventory.ProductName = '';
      this.inventory.ProductCategory = 0;
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

  getGSTList(){
    const subs: Subscription = this.supps.getList('TaxType').subscribe({
      next: (res: any) => {
        if(res.success){
          this.gstList = res.data
        }else{
          this.as.errorToast(res.message)
        }
      },
    error: (err: any) => console.log(err.message),
    complete: () => subs.unsubscribe(),
    });
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
    this.inventory.ProductName = productName;
  }

  getInventory(){
    this.sp.show()
    let Parem = '';
    this.TtlR = 0
    this.TtlW = 0

    if (this.inventory.FromDate !== '' && this.inventory.FromDate !== null){
      let FromDate =  moment(this.inventory.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and  DATE_FORMAT(purchasemasternew.PurchaseDate, "%Y-%m-%d")  between ' +  `'${FromDate}'`; }

    if (this.inventory.ToDate !== '' && this.inventory.ToDate !== null){
      let ToDate =  moment(this.inventory.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' +  `'${ToDate}'`; }

    if (this.inventory.SupplierID !== 0){
      Parem = Parem + ' and purchasemasternew.SupplierID = ' +  this.inventory.SupplierID; }
    
    if (this.inventory.ShopID != 0){
      Parem = Parem + ' and barcodemasternew.ShopID IN ' +  `(${this.inventory.ShopID})`;}

    if (this.inventory.Barcode !== '') {
      Parem = Parem + ' and barcodemasternew.Barcode Like ' + '"' + this.inventory.Barcode + '%"';}
      
      // if (this.inventory.StringProductName !== '' ) {
      //   Parem = Parem + ' and purchasedetailnew.ProductName LIKE ' + "'" + this.inventory.StringProductName + "%'"; }
  
    if (this.inventory.CurrentStatus !== 0) {
      Parem = Parem + ' and barcodemasternew.CurrentStatus = ' + '"' + this.inventory.CurrentStatus + '"';}

    if (this.inventory.GSTPercentage !== 0){
      Parem = Parem + ' and purchasedetailnew.GSTPercentage = '  + `'${this.inventory.GSTPercentage}'`; }
  
    if (this.inventory.GSTType !== 0){
      Parem = Parem + ' and purchasedetailnew.GSTType = '  + `'${this.inventory.GSTType}'`; }

    if (this.inventory.ProductCategory  !== 0){
      Parem = Parem + ' and purchasedetailnew.ProductTypeID = ' +  this.inventory.ProductCategory;
      this.filter();}

    if (this.inventory.ProductName !== '' ) {
      Parem = Parem + ' and purchasedetailnew.ProductName Like ' + "'" + this.inventory.ProductName.trim() + "%'"; }


    const subs: Subscription =  this.purchaseService.getProductInventoryReport(Parem).subscribe({
      next: (res: any) => {
        if(res.success){
          this.as.successToast(res.message)
          this.inventoryList = res.data
          this.inventoryList.forEach((element: any) => {
            this.TtlR  =+ this.TtlR + element.RetailPrice * element.Count
            this.TtlW  =+ this.TtlW + element.WholeSalePrice * element.Count
           });
          this.DetailtotalQty = res.calculation[0].totalQty;
          this.DetailtotalDiscount = res.calculation[0].totalDiscount.toFixed(2);
          this.DetailtotalUnitPrice = res.calculation[0].totalUnitPrice.toFixed(2);
          this.DetailtotalSubTotal = res.calculation[0].totalSubTotal.toFixed(2);
          this.DetailtotalGstAmount = res.calculation[0].totalGstAmount.toFixed(2);
          this.DetailtotalAmount = res.calculation[0].totalAmount.toFixed(2);
          this.DetailtotalRetailPrice = res.calculation[0].totalRetailPrice.toFixed(2);
          this.DetailtotalWholeSalePricet = res.calculation[0].totalWholeSalePrice.toFixed(2);
          this.TtlR = res.calculation[0].totalRetailPrice.toFixed(2);
          this.TtlW = res.calculation[0].totalWholeSalePrice.toFixed(2);
          this.gstdetails = res.calculation[0].gst_details
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  exportAsXLSXDetail(): void {
    let element = document.getElementById('inventoryExcel');
    const ws: XLSX.WorkSheet =XLSX.utils.table_to_sheet(element);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, 'inventory_Report.xlsx');
  }

  PDFdetail(){
  }

  inventorysFromReset(){
    this.inventory =  { 
      FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, SupplierID: 0, Barcode:'', CurrentStatus:'Available', PaymentStatus: 0,  ProductCategory : 0, ProductName:'', GSTType: 0, GSTPercentage: 0
    };
    this.inventoryList = [];
    this.DetailtotalQty = ''
    this.DetailtotalDiscount = ''
    this.DetailtotalUnitPrice = ''
    this.DetailtotalGstAmount =''
    this.DetailtotalSubTotal = ''
    this.DetailtotalAmount = ''
    this.TtlR = 0
    this.TtlW = 0
  }

  openModal(content: any) {
    this.modalService.open(content, { centered: true , backdrop : 'static', keyboard: false,size: 'sm'});
  }

    // purchase product expiry

    getFieldList1(){
      if(this.ProductExpiry.ProductCategory !== 0){
        this.prodList.forEach((element: any) => {
          if (element.ID === this.ProductExpiry.ProductCategory) {
            this.selectedProduct = element.Name;
          }
        })
        const subs: Subscription =  this.ps.getFieldList(this.selectedProduct).subscribe({
          next: (res: any) => {
            if(res.success){
              this.specList1 = res.data;
              this.getSptTableData1();
            }else{
              this.as.errorToast(res.message)
            }
         },
         error: (err: any) => console.log(err.message),
         complete: () => subs.unsubscribe(),
       });
      }
      else {
        this.specList1 = [];
        this.ProductExpiry.ProductName = '';
        this.ProductExpiry.ProductCategory = 0;
      }
    }
  
    getSptTableData1() { 
      this.specList1.forEach((element: any) => {
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
  
    getFieldSupportData1(index:any) {
      this.specList1.forEach((element: any) => {
       if (element.Ref === this.specList1[index].FieldName.toString() ) {
         const subs: Subscription =  this.ps.getProductSupportData( this.specList1[index].SelectedValue,element.SptTableName).subscribe({
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
  
    filter1() {
      let productName = '';
      this.specList1.forEach((element: any) => {
       if (productName === '') {
          productName = element.SelectedValue;
       } else if (element.SelectedValue !== '') {
          productName += '/' + element.SelectedValue;
       }
      });
      this.ProductExpiry.ProductName = productName;
    }
  
    purchaseProductExpiry(){

      this.sp.show()
      this.todaydate = moment(new Date()).format('YYYY-MM-DD');
      let Parem = '';
  
      if (this.ProductExpiry.FromDate !== '' && this.ProductExpiry.FromDate !== null){
        let FromDate =  moment(this.ProductExpiry.FromDate).format('YYYY-MM-DD')
        Parem = Parem + ' and  DATE_FORMAT(purchasedetailnew.ProductExpDate, "%Y-%m-%d")  between ' +  `'${FromDate}'`; }
  
      if (this.ProductExpiry.ToDate !== '' && this.ProductExpiry.ToDate !== null){
        let ToDate =  moment(this.ProductExpiry.ToDate).format('YYYY-MM-DD')
        Parem = Parem + ' and ' +  `'${ToDate}'`; }
  
      if (this.ProductExpiry.ProductCategory  !== 0){
        Parem = Parem + ' and purchasedetailnew.ProductTypeID = ' +  this.ProductExpiry.ProductCategory;
        this.filter1();}
  
      if (this.ProductExpiry.ProductName !== '' ) {
        Parem = Parem + ' and purchasedetailnew.ProductName Like ' + "'" + this.ProductExpiry.ProductName.trim() + "%'"; }
  
      if (this.ProductExpiry.ShopID != 0){
        Parem = Parem + ' and purchasemasternew.ShopID IN ' +  `(${this.ProductExpiry.ShopID})`;}
  
      if (this.ProductExpiry.SupplierID !== 0){
        Parem = Parem + ' and purchasemasternew.SupplierID = ' +  this.ProductExpiry.SupplierID; }
  
      if (this.ProductExpiry.GSTPercentage !== 0){
        Parem = Parem + ' and purchasedetailnew.GSTPercentage = '  + `'${this.ProductExpiry.GSTPercentage}'`; }
  
      if (this.ProductExpiry.GSTType !== 0){
        Parem = Parem + ' and purchasedetailnew.GSTType = '  + `'${this.ProductExpiry.GSTType}'`; }
  
      const subs: Subscription =  this.purchaseService.getPurchasereportsDetail(Parem).subscribe({
        next: (res: any) => {
          if(res.success){
            this.ProductExpiryList = res.data
            this.ProductExpiryList.forEach((element: any) => {
              element.ProductName = element.ProductName.trim()
              if(element.ProductExpDate < this.todaydate) {
                element.Color = true;
              } else {
                element.Color = false;
              }
            });
            this.ExpirytotalQty = res.calculation[0].totalQty;
            this.ExpirytotalDiscount = res.calculation[0].totalDiscount.toFixed(2);
            this.ExpirytotalUnitPrice = res.calculation[0].totalUnitPrice.toFixed(2);
            this.ExpirytotalGstAmount = res.calculation[0].totalGstAmount.toFixed(2);
            this.ExpirytotalAmount = res.calculation[0].totalAmount.toFixed(2);
            this.gstExpirys = res.calculation[0].gst_details
          }else{
            this.as.errorToast(res.message)
          }
          this.sp.hide()
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    }
  
    openModal2(content2: any) {
      this.modalService.open(content2, { centered: true , backdrop : 'static', keyboard: false,size: 'sm'});
    }
    
    exportAsXLSXExpiry(): void {
      let element = document.getElementById('ProductExpiry');
      const ws: XLSX.WorkSheet =XLSX.utils.table_to_sheet(element);
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      XLSX.writeFile(wb, 'PurchaseProductExpiry_Report.xlsx');
    }
  
    productExpiryFromReset(){
      this.ProductExpiry =  {
        FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, SupplierID: 0,  
        PaymentStatus: 0,  ProductCategory : 0, ProductName:'', GSTType: 0, GSTPercentage: 0
      };
      this.ProductExpiryList= [];
      this.ExpirytotalQty = '';
      this.ExpirytotalDiscount = '';
      this.ExpirytotalUnitPrice = '';
      this.ExpirytotalGstAmount = '';
      this.ExpirytotalAmount = '';
      this.gstExpirys = '' ;
    }

    dateFormat(date:any){
      return moment(date).format(`${this.companySetting.DateFormat}`);
    }

    customerSearch(searchKey: any, mode: any, type:any) {
      this.filteredOptions = [];
  
      let supplierID = 0;
  
      if (type === 'Supplier') {
          switch(mode) {
              case 'inventory':
                  supplierID = this.inventory.SupplierID;
                  break;
              case 'data':
                  supplierID = this.data.SupplierID;
                  break;
              case 'ProductExpiry':
                  supplierID = this.ProductExpiry.SupplierID;
                  break;
              default:
                  break;
          }
      }
  
      let dtm = {
          Type: 'Supplier',
          Name: supplierID.toString()
      };
  
      if (searchKey.length >= 2 && mode === 'Name') {
          dtm.Name = searchKey;
      }
  
      const subs: Subscription = this.supps.dropdownlistBySearch(dtm).subscribe({
          next: (res: any) => {
              if(res.success){
                  this.filteredOptions = res.data;
              } else {
                  this.as.errorToast(res.message);
              }
              this.sp.hide();
          },
          error: (err: any) => console.log(err.message),
          complete: () => subs.unsubscribe(),
      });
  }
  
  CustomerSelection(mode: any, ID: any) {
      switch(mode) {
          case 'inventory':
              this.inventory.SupplierID = ID;
              break;
          case 'PurchaseDetail':
              this.data.SupplierID = ID;
              break;
          case 'ProductExpiry':
              this.ProductExpiry.SupplierID = ID;
              break;
          case 'All':
              this.filteredOptions = [];
              this.inventory.SupplierID = 0;
              this.data.SupplierID = 0;
              this.ProductExpiry.SupplierID = 0;
              break;
          default:
              break;
      }
  }

  onChange(event: { toUpperCase: () => any; toTitleCase: () => any; }) {
    if (this.companySetting.DataFormat === '1') {
      event = event.toUpperCase()
    } else if (this.companySetting.DataFormat == '2') {
      event = event.toTitleCase()
    }
    return event;
  }

}
