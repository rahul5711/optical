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
import * as moment from 'moment';
import { BillService } from 'src/app/service/bill.service';
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
  searchValue: any;
  supplierList: any;
  selectedProduct: any;
  prodList: any;
  specList: any;
  dataList: any;
  Productsearch: any = '';
  dataListt: any = [];
  currentPage = 1;
  itemsPerPage = 10;
  pageSize!: number;
  collectionSize = 0
  page = 4;
  checked = false;

  constructor(
    private formBuilder: FormBuilder,
    public as: AlertService,
    private sp: NgxSpinnerService,
    private excelService: ExcelService,
    private purchaseService: PurchaseService,
    public calculation: CalculationService,
    private ps: ProductService,
    private sup: SupplierService,
        public bill: BillService,
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

  data1: any = { SupplierID: 0, Barcode: "", stringProductName: '', ProductCategory: 0, ProductName: '', };

  data: any = { PurchaseMaster: null, PurchaseDetail: null };

  ngOnInit(): void {
    // this.dropdownSupplierlist();
    this.dropdownlistForPreOrder();
    // this.getProductList();
      this.bill.productLists$.subscribe((list:any) => {
      this.prodList = list
    });
    // this.getList();

  }

  // dropdownSupplierlist() {
  //   this.sp.show()
  //   const subs: Subscription = this.sup.dropdownSupplierlist('').subscribe({
  //     next: (res: any) => {
  //       if (res.success) {
  //         this.supplierList = res.data
  //         this.as.successToast(res.message)
  //       } else {
  //         this.as.errorToast(res.message)
  //       }
  //       this.sp.hide()
  //     },
  //     error: (err: any) => console.log(err.message),
  //     complete: () => subs.unsubscribe(),
  //   });
  // }

  dropdownlistForPreOrder(){
    this.sp.show()
    const subs: Subscription =  this.sup.dropdownlistForPreOrder('').subscribe({
      next: (res: any) => {
        if(res.success){
          this.supplierList = res.data;
          this.data1.SupplierID = this.supplierList[0].ID
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
        let valueToAdd = element.SelectedValue;
        valueToAdd = valueToAdd.replace(/^\d+_/, "");
        productName = valueToAdd;
      } else if (element.SelectedValue !== '') {
        let valueToAdd = element.SelectedValue;
        valueToAdd = valueToAdd.replace(/^\d+_/, "");
        productName += '/' + valueToAdd;
      }
    });
    this.data1.ProductName = productName;
  }

  getDummyData() {
    this.sp.show()
    let Parem = '';

    if (this.data1.SupplierID !== 0) {
      Parem = Parem + ' and purchasemasternew.SupplierID = ' + this.data1.SupplierID;
    }

    if (this.data1.Barcode !== '') {
      Parem = Parem + ' and purchasedetailnew.BaseBarCode like ' + '"' + this.data1.Barcode + '%"';
    }

  
    if (this.data1.ProductCategory !== 0) {
      Parem = Parem + ' and purchasedetailnew.ProductTypeID = ' + this.data1.ProductCategory;
      this.filter();
    }

    if (this.data1.ProductName !== '') {
      Parem = Parem + ' and purchasedetailnew.ProductName like ' + "'%" + this.data1.ProductName.trim() + "%'";
    }

    const dtm = {
      currentPage: 1,
      itemsPerPage: 50000,
      Productsearch :this.Productsearch.trim(),
      Parem: Parem

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
      data.PurchaseMasterData.SubTotal = 0;
      data.PurchaseMasterData.GSTAmount = 0;
      data.PurchaseMasterData.TotalAmount = 0;
      data.PurchaseMasterData.DiscountAmount = 0;

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
 // Create a deep copy of data
 const dataCopy = JSON.parse(JSON.stringify(data));
  
 // Extract PurchaseMasterData
 const purchaseMasterData = data.PurchaseMasterData;
 
 // Prepare the data to be sent
 const dtm: any = {
   PurchaseMaster: purchaseMasterData,
   PurchaseDetail: dataCopy
 };
 delete dtm.PurchaseDetail.PurchaseMasterData;

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
    data.PurchaseMasterData = purchaseMasterData;
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
      return {
        ProductName: e.ProductName,
        ProductTypeName: e.ProductTypeName,
        Quantity: e.Quantity,
        BaseBarCode: e.BaseBarCode,
        UnitPrice: e.UnitPrice,
        DiscountPercentage: e.DiscountPercentage,
        GSTPercentage: e.GSTPercentage,
        GSTType: e.GSTType,
        RetailPrice: e.RetailPrice,
        WholeSalePrice: e.WholeSalePrice,
        ShopName: e.ShopName,
        AreaName: e.AreaName,
      }
    })
    this.excelService.exportAsExcelFile(data, 'PreorderDummyList');
  }

// all delete function not be apply this page 
  selectAllPreorder(type: any) {
    if (type === 'all') {
      this.sp.show();
      this.dataListt = [];

      const isChecked = !this.checked;

      for (let i = 0; i < this.dataList.length; i++) {
        let ele = this.dataList[i];
        ele.Checked = isChecked;
        ele.index = i;

        if (isChecked) {
          this.dataListt.push(ele);
        }
      }
      this.checked = isChecked;
      this.sp.hide();
    }
  }

  singleSelectPreOrder(i: any) {
    const item = this.dataList[i];

    if (item.Checked === false || item.Checked === 0) {
      item.index = i;
      this.dataListt.push(item);
    } else if (item.Checked === true || item.Checked === 1) {
      const indexToRemove = this.dataListt.findIndex((el: any) => el.index === i);
      if (indexToRemove !== -1) {
        this.dataListt.splice(indexToRemove, 1);
      }
    }
  }

  deleteall() {
    if (this.dataListt.length === 0) {
       Swal.fire({
        position: 'center',
        icon: 'warning',
        title: 'Please select checkboxes',
        showConfirmButton: true,
        backdrop:false
      })
    } else {
      let FullData:any = []
      let PurchaseMasterRow:any = []
      let PurchaseDetailRow:any = []
      this.dataListt.forEach((ele: any) =>{
        if (ele.ID !== null || ele.Status === 1) {
          ele.Status = 0;
          ele.Quantity = 0;
          this.calculatesss(ele)
          FullData.push(ele)
          PurchaseMasterRow.push(ele.PurchaseMasterData)
          delete ele.PurchaseMasterData
          PurchaseDetailRow.push(ele)
        }
      })

      const body = {
        PurchaseMaster: PurchaseMasterRow,
        PurchaseDetail: PurchaseDetailRow
      }
      const subs: Subscription = this.purchaseService.deleteAllPreOrderDummy(body).subscribe({
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
  }

  dateFormat(date: any): string {
    if (date == null || date == "") {
      return '0000-00-00'; // Default Value
    }
    return moment(date).format(this.companySetting?.DateFormat || 'YYYY-MM-DD');
  }
}

