import { Component, OnInit, HostListener } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { ProductService } from 'src/app/service/product.service';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { SupplierService } from 'src/app/service/supplier.service';
import { SupportService } from 'src/app/service/support.service';
import { CalculationService } from 'src/app/service/helpers/calculation.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { PurchaseService } from 'src/app/service/purchase.service';
import { BillService } from 'src/app/service/bill.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { fromEvent } from 'rxjs';
import { take } from 'rxjs/operators';
import { CompressImageService } from 'src/app/service/helpers/compress-image.service';
import { FileUploadService } from 'src/app/service/helpers/file-upload.service';
import { EcomService } from 'src/app/service/ecom.service';

@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.css']
})

export class ProductComponent implements OnInit {
  evn = environment;
  user = JSON.parse(localStorage.getItem('user') || '');
  company = JSON.parse(localStorage.getItem('company') || '');
  shop = JSON.parse(localStorage.getItem('shop') || '');
  companySetting = JSON.parse(localStorage.getItem('companysetting') || '');
  selectedShop: any = JSON.parse(localStorage.getItem('selectedShop') || '');
  permission = JSON.parse(localStorage.getItem('permission') || '[]');

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.altKey && event.key === 'a' || event.altKey && event.key === 'A') {
      this.addItem();
      event.preventDefault();
    }

    if (this.id != 0) {
      if (event.altKey && event.key === 'u' || event.altKey && event.key === 'U') {
        event.preventDefault();
      }
    }
    if (this.id == 0) {
      if (event.altKey && event.key === 's' || event.altKey && event.key === 'S') {
        this.onSumbit();
        event.preventDefault();
      }
    }
  }

  editBtn = false;
  searchValue: any;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private ps: ProductService,
    private ss: SupplierService,
    private supps: SupportService,
    private purchaseService: PurchaseService,
    private ec: EcomService,
    public as: AlertService,
    public calculation: CalculationService,
    public sp: NgxSpinnerService,
    public bill: BillService,
    private modalService: NgbModal,
    private compressImage: CompressImageService,
    private fu: FileUploadService,
  ) {
    this.id = this.route.snapshot.params['id'];
  }
  img: any
  uploadPhoto: any
  item: any = {
    ID: null, CompanyID: null, ProductName: '', ProductTypeName: '', ProductTypeID: null, Description:'',Gender:'', SalePrice: 0.00, Quantity: 1, OfferPrice: 0.00, Status: 1,
    IsPublished: 0, IsOutOfStock: 0, PublishCode: '', Images: [],
  };

  data: any = { PurchaseMaster: null, PurchaseDetail: null };
  GstTypeDis = false

  id: any;
  category = 'Product';
  selectedProduct: any;
  prodList: any;
  specList: any;
  disableAddButtons = false;
  gstperLock = false;
  gstLock = false;
  BrandLock = false;
  gstList: any;
  tempItem = { Item: null, Spec: null };
  itemList: any = [];
  dataListt: any = [];
  checked = false;
  gst_detail: any = [];

  editOrderPrice = false
  addOrderPrice = false
  deleteOrderPrice = false
  currentTime = ''
  prodLists: any = []

  ngOnInit(): void {
    this.getProductsList()
    this.item.Images = Array.from({ length: 5 }, () => ({
      ImageName: '',

    }));
    // this.getProductList();
    this.bill.productLists$.subscribe((list: any) => {
      this.prodList = list
    });
    this.bill.taxList$.subscribe((list: any) => {
      this.gstList = list
      this.gst_detail = [];
      list.forEach((ele: any) => {
        if (ele.Name !== ' ') {
          let obj = { GSTType: '', Amount: 0 };
          obj.GSTType = ele.Name;
          this.gst_detail.push(obj);
        }
      })
    });

    this.currentTime = new Date().toLocaleTimeString('en-US', { hourCycle: 'h23' })
  }


  getProductList() {
    this.sp.show()
    const subs: Subscription = this.ps.getList().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.prodList = res.data.sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getGSTList() {
    this.sp.show()
    const subs: Subscription = this.supps.getList('TaxType').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.gstList = res.data
          this.gst_detail = [];
          res.data.forEach((ele: any) => {
            if (ele.Name !== ' ') {
              let obj = { GSTType: '', Amount: 0 };
              obj.GSTType = ele.Name;
              this.gst_detail.push(obj);
            }
          })
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
    const subs: Subscription = this.ps.getFieldList(this.selectedProduct).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.specList = res.data;
          this.getSptTableData();
        } else {
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

  displayAddField(i: any) {
    this.specList[i].DisplayAdd = 1;
    this.specList[i].SelectedValue = '';
  }

  saveFieldData(i: any) {

    this.specList[i].DisplayAdd = 0;
    let count = 0;
    this.specList[i].SptTableData.forEach((element: { TableValue: string; }) => {
      if (element.TableValue.toLowerCase() === this.specList[i].SelectedValue.toLowerCase()) { count = count + 1; }
    });
    if (count !== 0 || this.specList[i].SelectedValue === '') {
      //  alert ("Duplicate or Empty Values are not allowed");
      Swal.fire({
        icon: 'error',
        title: 'Duplicate or Empty values are not allowed',
        footer: ''
      });
    } else {
      const Ref = this.specList[i].Ref;
      let RefValue = 0;
      if (Ref !== 0) {
        this.specList.forEach((element: any, j: any) => {
          if (element.FieldName === Ref) { RefValue = element.SelectedValue; }
        });
      }
      this.sp.show()
      const subs: Subscription = this.ps.saveProductSupportData(this.specList[i].SptTableName, RefValue, this.specList[i].SelectedValue).subscribe({
        next: (res: any) => {
          const subss: Subscription = this.ps.getProductSupportData(RefValue, this.specList[i].SptTableName).subscribe({
            next: (res: any) => {
              if (res.success) {
                this.specList[i].SptTableData = res.data;
                this.specList[i].SptFilterData = res.data;
                this.as.successToast(res.message)
              } else {
                this.as.errorToast(res.message)
              }
              this.sp.hide()
            },
            error: (err: any) => console.log(err.message),
            complete: () => subss.unsubscribe(),
          });
          if (res.success) { }
          else { this.as.errorToast(res.message) }
        },
        error: (err: any) => {
          console.log(err.msg);
        },
        complete: () => subs.unsubscribe(),
      });
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

  calculateFields(fieldName: any, mode: any) {
    this.calculation.calculateFields(fieldName, mode, this.item, '')
  }

  calculateGrandTotal() {
    this.calculation.calculateGrandTotal('', this.itemList, '')
  }

  // addItem() {
  //   if (this.category === 'Product') {
  //     if ((this.item.GSTType === 'None' && this.item.GSTPercentage !== 0) || (this.item.GSTPercentage === 0 && this.item.GSTType !== 'None') || (this.item.GSTPercentage === null && this.item.GSTType !== 'None')) {
  //       Swal.fire({
  //         position: 'center',
  //         icon: 'warning',
  //         title: 'Without GSTType, the selected value will not be saved',
  //         showConfirmButton: true,
  //         backdrop: false,
  //       })
  //       this.GstTypeDis = true
  //     } else {

  //       this.item.ProductName = "";
  //       this.item.ProductTypeID = "";

  //       this.specList.forEach((element: any) => {
  //         this.prodList.forEach((elements: any) => {
  //           if (elements.Name === element.ProductName) {
  //             this.item.ProductTypeID = elements.ID
  //             this.item.ProductTypeName = elements.Name
  //           }
  //         });

  //         if (element.SelectedValue !== "") {
  //           let valueToAdd = element.SelectedValue;
  //           valueToAdd = valueToAdd.replace(/^\d+_/, "");
  //           this.item.ProductName = this.item.ProductName + valueToAdd + "/";
  //         }
  //         if (element.FieldType === "Date") {
  //           this.item.ProductExpDate = element.SelectedValue;
  //         }
  //       });

  //       this.item.ProductExpDate = this.item.ProductExpDate === '' ? "0000-00-00" : this.item.ProductExpDate;
  //       this.item.ProductTypeID = this.item.ProductTypeID
  //       this.item.ProductTypeName = this.item.ProductTypeName
  //       this.item.imgArray = this.item.imgArray
  //       this.item.ProductName = this.item.ProductName.substring(0, this.item.ProductName.length - 1)
  //       this.itemList.unshift(this.item);

  //       this.tempItem = { Item: null, Spec: null };

  //       if (this.gstLock === false && this.gstperLock === false) {
  //         this.item = {
  //           ID: null, PurchaseID: null, CompanyID: null, ProductName: '', ProductTypeName: this.selectedProduct, ProductTypeID: null, UnitPrice: 0.00, Quantity: 1, SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: 0, GSTAmount: 0.00, GSTType: 'None', TotalAmount: 0.00, Multiple: false, RetailPrice: '', WholeSalePrice: 0, Ledger: true, WholeSale: this.item.WholeSale, BaseBarCode: null, NewBarcode: '', Status: 1, BrandType: this.item.BrandType, ProductExpDate: '0000-00-00', UniqueBarcode: '',imgArray: []
  //         };
  //       } else if (this.gstLock === true && this.gstperLock === false) {
  //         this.item = {
  //           ID: null, PurchaseID: null, CompanyID: null, ProductName: '', ProductTypeName: this.selectedProduct, ProductTypeID: null, UnitPrice: 0.00, Quantity: 1, SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: 0, GSTAmount: 0.00, GSTType: this.item.GSTType, TotalAmount: 0.00, Multiple: false, RetailPrice: '', WholeSalePrice: 0, Ledger: true, WholeSale: this.item.WholeSale, BaseBarCode: null, NewBarcode: '', Status: 1, BrandType: this.item.BrandType, ProductExpDate: '0000-00-00', UniqueBarcode: '',imgArray: []
  //         };
  //       } else if (this.gstLock === false && this.gstperLock === true) {
  //         this.item = {
  //           ID: null, PurchaseID: null, CompanyID: null, ProductName: '', ProductTypeName: this.selectedProduct, ProductTypeID: null, UnitPrice: 0.00, Quantity: 1, SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: this.item.GSTPercentage, GSTAmount: 0.00, GSTType: 'None', TotalAmount: 0.00, Multiple: false, RetailPrice: '', WholeSalePrice: 0, Ledger: true, WholeSale: this.item.WholeSale, BaseBarCode: null, NewBarcode: '', Status: 1, BrandType: this.item.BrandType, ProductExpDate: '0000-00-00', UniqueBarcode: '',imgArray: []
  //         };
  //       } else {
  //         this.item = {
  //           ID: null, PurchaseID: null, CompanyID: null, ProductName: '', ProductTypeName: this.selectedProduct, ProductTypeID: null, UnitPrice: 0.00, Quantity: 1, SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: this.item.GSTPercentage, GSTAmount: 0.00, GSTType: this.item.GSTType, TotalAmount: 0.00, Multiple: false, RetailPrice: '', WholeSalePrice: 0, Ledger: true, WholeSale: this.item.WholeSale, BaseBarCode: null, NewBarcode: '', Status: 1, BrandType: this.item.BrandType, ProductExpDate: '0000-00-00', UniqueBarcode: '',imgArray: []
  //         }
  //       }

  //       if (this.BrandLock === true) {
  //         this.item = {
  //           ID: null, PurchaseID: null, CompanyID: null, ProductName: '', ProductTypeName: this.selectedProduct, ProductTypeID: null, UnitPrice: 0.00, Quantity: 1, SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: this.item.GSTPercentage, GSTAmount: 0.00, GSTType: this.item.GSTType, TotalAmount: 0.00, Multiple: false, RetailPrice: '', WholeSalePrice: 0, Ledger: true, WholeSale: this.item.WholeSale, BaseBarCode: null, NewBarcode: '', Status: 1, BrandType: this.item.BrandType, ProductExpDate: '0000-00-00', UniqueBarcode: '',imgArray: []
  //         }
  //       } else {
  //         this.item = {
  //           ID: null, PurchaseID: null, CompanyID: null, ProductName: '', ProductTypeName: this.selectedProduct, ProductTypeID: null, UnitPrice: 0.00, Quantity: 1, SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: this.item.GSTPercentage, GSTAmount: 0.00, GSTType: this.item.GSTType, TotalAmount: 0.00, Multiple: false, RetailPrice: '', WholeSalePrice: 0, Ledger: true, WholeSale: this.item.WholeSale, BaseBarCode: null, NewBarcode: '', Status: 1, BrandType: 0, ProductExpDate: '0000-00-00', UniqueBarcode: '',imgArray: []
  //         }
  //       }

  //        this.item.imgArray = Array.from({ length: 5 }, () => ({
  //            ImageName: '',
  //        }));

  //       this.specList.forEach((element: any) => {
  //         if (element.CheckBoxValue === false || element.CheckBoxValue === undefined) {
  //           element.SelectedValue = '';
  //         } else {
  //           element.SelectedValue = element.SelectedValue;
  //         }
  //       });

  //     }

  //     this.calculateGrandTotal();

  //   }
  // }

  // getDataByID() {
  //   const subs: Subscription = this.ec.getDataByID(ID).subscribe({
  //     next: (res: any) => {
  //       if (res.success) {
  //         this.specList = res.data;
  //         this.getSptTableData();
  //       } else {
  //         this.as.errorToast(res.message)
  //       }
  //     },
  //     error: (err: any) => console.log(err.message),
  //     complete: () => subs.unsubscribe(),
  //   });
  // }


  addItem() {
    this.sp.show()
    this.item.ProductName = "";
    this.item.ProductTypeID = "";

    this.specList.forEach((element: any) => {
      this.prodList.forEach((elements: any) => {
        if (elements.Name === element.ProductName) {
          this.item.ProductTypeID = elements.ID
          this.item.ProductTypeName = elements.Name
        }
      });

      if (element.SelectedValue !== "") {
        let valueToAdd = element.SelectedValue;
        valueToAdd = valueToAdd.replace(/^\d+_/, "");
        this.item.ProductName = this.item.ProductName + valueToAdd + "/";
      }
    });

    this.item.ProductTypeID = this.item.ProductTypeID
    this.item.ProductTypeName = this.item.ProductTypeName
    this.item.ProductName = this.item.ProductName.substring(0, this.item.ProductName.length - 1)
    const subs: Subscription = this.ec.save(this.item).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.editBtn = false
          this.item = {
            ID: null, CompanyID: null, ProductName: '', ProductTypeName: '', ProductTypeID: null,Description:'', Gender:'', SalePrice: 0.00, Quantity: 1, OfferPrice: 0.00, Status: 1,
            IsPublished: 0, IsOutOfStock: 0, PublishCode: '', Images: [],
          }
          this.selectedProduct = ''
          this.specList = []
          this.item.Images = Array.from({ length: 5 }, () => ({
            ImageName: '',
          }));
          this.getProductsList()
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getProductsList() {
    this.sp.show()
    const subs: Subscription = this.ec.getList('').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.itemList = res.data;
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  notifyGst() {
    if (this.item.GSTPercentage !== 0 && this.item.GSTPercentage !== "0") {
      if (this.item.GSTType === 'None') {
        alert("please select GstType");
      }
    }
  }

  onSumbit() {

  }

  deleteItem(Category: any, data: any) {
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
          this.sp.show()
          data.Status = 0
          const subs: Subscription = this.ec.save(data).subscribe({
            next: (res: any) => {
              if (res.success) {
                this.getProductsList()
              } else {
                this.as.errorToast(res.message)
              }
              this.sp.hide()
            },
            error: (err: any) => console.log(err.message),
            complete: () => subs.unsubscribe(),
          });

        }
      })
    }
  }

  edititem(mode: any, data: any) {
    this.editBtn = true
    if (mode === 'Product') {
      this.selectedProduct = data.ProductTypeName
      this.item.ProductName = data.ProductName
      this.item = data
    }
  }

  editUpdate() {
    this.sp.show()
    const subs: Subscription = this.ec.save(this.item).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.getProductsList()
          this.itemList = res.data
          this.editBtn = false
          this.item = {
            ID: null, CompanyID: null, ProductName: '', ProductTypeName: '', ProductTypeID: null,Description:'', Gender:'', SalePrice: 0.00, Quantity: 1, OfferPrice: 0.00, Status: 1,
            IsPublished: 0, IsOutOfStock: 0, PublishCode: '', Images: [],
          }
          this.selectedProduct = ''
          this.specList = []
          this.item.Images = Array.from({ length: 5 }, () => ({
            ImageName: '',
          }));
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  published(data:any, mode:any) {
    this.sp.show()
    if(mode == 'Published'){
      data.IsPublished = 1
    }else{
        data.IsPublished = 0
    }

    const subs: Subscription = this.ec.save(data).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.getProductsList()
          this.itemList = res.data
          this.editBtn = false
          this.item = {
            ID: null, CompanyID: null, ProductName: '', ProductTypeName: '', ProductTypeID: null,Description:'', Gender:'', SalePrice: 0.00, Quantity: 1, OfferPrice: 0.00, Status: 1,
            IsPublished: 0, IsOutOfStock: 0, PublishCode: '', Images: [],
          }
          this.selectedProduct = ''
          this.specList = []
          this.item.Images = Array.from({ length: 5 }, () => ({
            ImageName: '',
          }));
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  OutOfStock(data:any,mode:any) {
    this.sp.show()
      if(mode == 'OutOfStock'){
      data.IsOutOfStock = 0
    }else{
        data.IsOutOfStock = 1
    }
    const subs: Subscription = this.ec.save(data).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.getProductsList()
          this.itemList = res.data
          this.editBtn = false
          this.item = {
            ID: null, CompanyID: null, ProductName: '', ProductTypeName: '', ProductTypeID: null,Description:'', Gender:'', SalePrice: 0.00, Quantity: 1, OfferPrice: 0.00, Status: 1,
            IsPublished: 0, IsOutOfStock: 0, PublishCode: '', Images: [],
          }
          this.selectedProduct = ''
          this.specList = []
          this.item.Images = Array.from({ length: 5 }, () => ({
            ImageName: '',
          }));
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }



  selectAllPreorder(type: any) {
    if (type === 'all') {
      this.sp.show();
      this.dataListt = [];

      const isChecked = !this.checked;

      for (let i = 0; i < this.itemList.length; i++) {
        let ele = this.itemList[i];
        ele.Checked = isChecked;
        ele.index = i;
        if (isChecked) {
          if (ele.Status === 1) {
            this.dataListt.push(ele);
          }
        }
      }
      this.checked = isChecked;
      this.sp.hide();
    }
  }

  singleSelectPreOrder(i: any) {
    const item = this.itemList[i];

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

  deleteAllItem() {
    if (this.dataListt.length === 0) {
      Swal.fire({
        position: 'center',
        icon: 'warning',
        title: 'Please select checkboxes. || Note that rows have already been deleted.',
        showConfirmButton: true,
        backdrop: false
      })
    } else {
      Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
      }).then((result) => {
        if (result.isConfirmed) {
        }
      })

    }
  }

  openModal(content: any) {
    this.modalService.open(content, { centered: true, backdrop: 'static', keyboard: false, size: 'md' });
    this.item.Images = Array.from({ length: 5 }, () => ({
      ImageName: '',

    }));
  }

  add() {
    this.item.Images.push({ ImageName: '' });
  }

  download(Images: any) {
    const url = 'http://opticalguru.relinksys.com:50080/zip?id=' + JSON.stringify(Images);
    window.open(url, '_blank');
  }

  uploadImage1(e: any, i: any) {

    this.img = e.target.files[0];
    const subs: Subscription = this.compressImage.compress(this.img).pipe(take(1)).subscribe({
      next: (compressedImage: any) => {
        const subss: Subscription = this.fu.uploadFileEmployee(compressedImage).subscribe({
          next: (data: any) => {
            if (data.body !== undefined) {
              this.item.Images[i].ImageName = this.evn.apiUrl + data.body?.download;
              this.as.successToast(data.body.message)
            }
          },
          error: (err: any) => {
            console.log(err.message);
          },
          complete: () => subss.unsubscribe(),
        })
      },
      error: (err: any) => {
        console.log(err.message);
      },
      complete: () => subs.unsubscribe(),
    })
  }

  uploadImage(e: any, mode: any) {

    this.img = e.target.files[0];
    // console.log(`Image size before compressed: ${this.img.size} bytes.`)
    this.compressImage.compress(this.img).pipe(take(1)).subscribe((compressedImage: any) => {
      // console.log(`Image size after compressed: ${compressedImage.size} bytes.`)
      this.fu.uploadFileComapny(compressedImage).subscribe((data: any) => {
        if (data.body !== undefined && mode === 'e-photo') {
          this.uploadPhoto = data.body?.download;
          this.as.successToast(data.body?.message)
        }

      });
    })

  }
}