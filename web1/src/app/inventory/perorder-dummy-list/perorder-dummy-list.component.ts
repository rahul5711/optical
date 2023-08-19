import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { map, filter, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { fromEvent } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ExcelService } from 'src/app/service/helpers/excel.service';
import { PurchaseService } from 'src/app/service/purchase.service';
import { CalculationService } from 'src/app/service/helpers/calculation.service';
import { ProductService } from 'src/app/service/product.service';
import { SupplierService } from 'src/app/service/supplier.service';

@Component({
  selector: 'app-perorder-dummy-list',
  templateUrl: './perorder-dummy-list.component.html',
  styleUrls: ['./perorder-dummy-list.component.css']
})
export class PerorderDummyListComponent implements OnInit {
  @ViewChild('searching') searching: ElementRef | any;
  companySetting = JSON.parse(localStorage.getItem('companysetting') || '');

  env = environment;
  gridview = true;
  term: any;

  supplierList: any;
  selectedProduct: any;
  prodList:any;
  specList: any;
  dataList: any;
  currentPage = 1;
  itemsPerPage = 10;
  pageSize!: number;
  collectionSize = 0
  page = 4;

  constructor(
    private formBuilder: FormBuilder,
    public as: AlertService,
    private sp: NgxSpinnerService,
    private excelService: ExcelService,
    private purchaseService: PurchaseService,
    public calculation: CalculationService,
    private ps: ProductService,
    private sup: SupplierService,
  ) { }

  selectedPurchaseMaster: any = {
    ID: null, SupplierID: null, SupplierName: null, CompanyID: null, GSTNo: null, ShopID: null, ShopName: null, PurchaseDate: null,
    PaymentStatus: null, InvoiceNo: null, Status: 1, CreatedBy: null, Quantity: 0, SubTotal: 0, DiscountAmount: 0,
    GSTAmount: 0, TotalAmount: 0, preOrder: true,
  };

  PurchaseDetail: any = {
    ID: null, PurchaseID: null, CompanyID: null, ProductName: '', ProductTypeName: '', ProductTypeID: null, UnitPrice: 0.00,
    Quantity: 0, SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: 0, GSTAmount: 0.00, GSTType: 'None', TotalAmount: 0.00, Multiple: false, RetailPrice: 0.00, WholeSalePrice: 0.00, Ledger: false, WholeSale: false, BaseBarCode: '', NewBarcode: '', Status: 1, BrandType: 0, UpdateProduct: false
  };

  data1:any = {SupplierID: 0,  Barcode: "", stringProductName :'', ProductCategory : 0, ProductName:'',  };

  data: any = { PurchaseMaster: null, PurchaseDetail: null };

  ngOnInit(): void {
    this.dropdownSupplierlist();
    this.getProductList();
    this.getList();
  }

  dropdownSupplierlist(){
    this.sp.show()
    const subs: Subscription = this.sup.dropdownSupplierlist('').subscribe({
      next: (res: any) => {
        if(res.success){
          this.supplierList  = res.data
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
    if(this.data1.ProductCategory !== 0){
      this.prodList.forEach((element: any) => {
        if (element.ID === this.data1.ProductCategory) {
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
          this.sp.hide()
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
    this.sp.show()
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
          this.sp.hide()
         },
         error: (err: any) => console.log(err.message),
         complete: () => subs.unsubscribe(),
       });
     }
    });
  }

  getFieldSupportData(index:any) {
    this.sp.show()
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
          this.sp.hide()
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

  getDummyData(){
    this.sp.show()
    let Parem = '';

    if (this.data1.SupplierID !== 0){
      Parem = Parem + ' and purchasemasternew.SupplierID = ' +  this.data1.SupplierID;}

    if (this.data1.Barcode !== ''){
      Parem = Parem + ' and purchasedetailnew.BaseBarCode Like ' + '"' + this.data1.Barcode + '%"';}

    if (this.data1.stringProductName !== ''){
      Parem = Parem + ' and purchasedetailnew.ProductName Like ' + '"' + this.data1.stringProductName + '%"';}

    if (this.data1.ProductCategory  !== 0){
      Parem = Parem + ' and purchasedetailnew.ProductTypeID = ' +  this.data1.ProductCategory ;
      this.filter();}

    if (this.data1.ProductName !== '') {
      Parem = Parem + ' and purchasedetailnew.ProductName Like ' + '"' + this.data1.ProductName + '%"';}

      const dtm = {
        currentPage: 1,
        itemsPerPage: 50000,
        Parem : Parem
      }

      const subs: Subscription = this.purchaseService.listPreOrderDummy(dtm).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.collectionSize = 1;
            this.page = 1;
            this.dataList = res.data;
            this.as.successToast(res.message)
          } else {
            this.as.successToast(res.message)
          }
          this.sp.hide();
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
  }

  changePagesize(num: number): void {
    this.itemsPerPage = this.pageSize + num;
  }

  getList() {
    this.sp.show()
    const dtm = {
      currentPage: this.currentPage,
      itemsPerPage: this.itemsPerPage,
    }
    const subs: Subscription = this.purchaseService.listPreOrderDummy(dtm).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.collectionSize = res.count;
          this.dataList = res.data;
          this.as.successToast(res.message)
        } else {
          this.as.successToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  showInput(data: any) {
    data.UpdateProduct = !data.UpdateProduct
  }

  calculate(fieldName: any, mode: any, data: any) {
    switch (mode) {
      case 'unit':
        data.DiscountAmount = +data.UnitPrice * +data.Quantity * +data.DiscountPercentage / 100;
        data.SubTotal = +data.Quantity * +data.UnitPrice - +data.DiscountAmount;
        data.GSTAmount = (+data.UnitPrice * +data.Quantity - data.DiscountAmount) * +data.GSTPercentage / 100;
        data.TotalAmount = +data.SubTotal + +data.GSTAmount;
        break;
    }
  }

  calculatesss(data: any) {
    data.PurchaseMasterData.DiscountAmount = 0
    data.PurchaseMasterData.SubTotal = 0
    data.PurchaseMasterData.GSTAmount = 0
    data.PurchaseMasterData.TotalAmount = 0

    this.dataList.forEach((ele: any) => {
      if (ele.PurchaseID === data.PurchaseMasterData.ID) {
        if (ele.Status !== 0) {
          data.PurchaseMasterData.DiscountAmount = (+data.PurchaseMasterData.DiscountAmount + + ele.DiscountAmount).toFixed(2);
          data.PurchaseMasterData.SubTotal = (+data.PurchaseMasterData.SubTotal + + ele.SubTotal).toFixed(2);
          data.PurchaseMasterData.GSTAmount = (+data.PurchaseMasterData.GSTAmount + + ele.GSTAmount).toFixed(2);
          data.PurchaseMasterData.TotalAmount = (+data.PurchaseMasterData.TotalAmount + + ele.TotalAmount).toFixed(2);
        }
      }
    })
  }

  updataEditProdcut(fieldName: any, mode: any, data: any) {
    this.sp.show()
    this.calculate(fieldName, mode, data)
    this.calculatesss(data)
    const dtm: any = {
      PurchaseMaster: data.PurchaseMasterData,
    }
    delete data.PurchaseMasterData
    dtm.PurchaseDetail = data

    const subs: Subscription = this.purchaseService.updatePreOrderDummy(dtm).subscribe({
      next: (res: any) => {
        if (res.success) {
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Your file has been Update.',
            showConfirmButton: false,
            timer: 1200
          })
          this.getList();
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => {
        console.log(err.msg);
      },
      complete: () => subs.unsubscribe(),
    });
  }

  deleteItem(Category: any, i: any, data: any) {
    if (Category === 'Product') {
      Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!',
        backdrop: false,
      }).then((result) => {
        if (result.isConfirmed) {
          this.sp.show();
          if (this.dataList[i].ID !== null || this.dataList[i].Status === 1) {
            this.dataList[i].Status = 0;
            this.dataList[i].Quantity = 0;
            this.calculatesss(data)
          }

          const PurchaseMaster = this.dataList[i].PurchaseMasterData
          delete this.dataList[i].PurchaseMasterData
          const PurchaseDetail = this.dataList[i]

          const body = {
            PurchaseMaster: PurchaseMaster,
            PurchaseDetail: PurchaseDetail
          }

          const subs: Subscription = this.purchaseService.deletePreOrderDummy(body).subscribe({
            next: (res: any) => {
              if (res.success) {
                Swal.fire({
                  position: 'center',
                  icon: 'success',
                  title: 'Your file has been delete.',
                  showConfirmButton: false,
                  timer: 1200
                })
                this.getList()
                this.as.successToast(res.message)
              } else {
                this.as.successToast(res.message)
              }
              this.sp.hide();
            },
            error: (err: any) => console.log(err.message),
            complete: () => subs.unsubscribe(),
          });
        }
      })
    }
  }

  exportAsXLSX(): void {
    let data = this.dataList.map((e: any) => {
      return{
        ProductName : e.ProductName,
        ProductTypeName: e.ProductTypeName,
        Quantity : e.Quantity,
        BaseBarCode : e.BaseBarCode,
        UnitPrice : e.UnitPrice,
        DiscountPercentage : e.DiscountPercentage,
        GSTPercentage : e.GSTPercentage,
        GSTType : e.GSTType,
        RetailPrice : e.RetailPrice,
        WholeSalePrice : e.WholeSalePrice,
        ShopName : e.ShopName,
        AreaName : e.AreaName,
      }
    })
    this.excelService.exportAsExcelFile(data, 'PreorderDummyList');
  }


}

