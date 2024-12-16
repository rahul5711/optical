import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { ProductService } from 'src/app/service/product.service';
import { elementAt, Subscription, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { SupplierService } from 'src/app/service/supplier.service';
import { SupportService } from 'src/app/service/support.service';
import { CalculationService } from 'src/app/service/helpers/calculation.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { PurchaseService } from 'src/app/service/purchase.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
interface LensData {
  sph: string;
  [key: string]: any;
}
interface LensDataL {
  sph: string;
  [key: string]: any;
}
@Component({
  selector: 'app-lens-grid-view',
  templateUrl: './lens-grid-view.component.html',
  styleUrls: ['./lens-grid-view.component.css']
})
export class LensGridViewComponent implements OnInit {

  env = environment;
  user = JSON.parse(localStorage.getItem('user') || '');
  company = JSON.parse(localStorage.getItem('company') || '');
  shop = JSON.parse(localStorage.getItem('shop') || '');
  companySetting = JSON.parse(localStorage.getItem('companysetting') || '');
  selectedShop: any = JSON.parse(localStorage.getItem('selectedShop') || '');
  permission = JSON.parse(localStorage.getItem('permission') || '[]');

  editBtn = false;
  addDis: any
  GstTypeDis = false
  searchValue: any = '';
  checked = false;
  selectAllChecked = false;

  sphMin: number = 0.00;
  sphMax: number = 4.00;
  sphStep: number = 0.25;
  cylMin: number = 0.00;
  cylMax: number = 4.00;
  cylStep: number = 0.25;

  sphValues: string[] = [];
  cylValues: string[] = [];

  displayedColumns: string[] = ['cyl'];
  dataSource: LensData[] = [];
  plustoplus: any = '+sph+cyl';

  lens: any = {
    productname: '', purchasePrice: 0, quantity: 0, GSTtype: 'None', GSTPercent: 0, retailPrice: 0, wholesalePrice: 0, axis: '', addtion: '', eye: ''
  }

  lenslist: any = []
  quantities: { [key: string]: { [key: string]: number } } = {};


  sphMinL: number = 0.00;
  sphMaxL: number = 4.00;
  sphStepL: number = 0.25;
  cylMinL: number = 0.00;
  cylMaxL: number = 4.00;
  cylStepL: number = 0.25;
  Base: any = 0
  SVType: any = ''
  sphValuesL: string[] = [];
  cylValuesL: string[] = [];

  displayedColumnsL: string[] = ['cyl'];
  dataSourceL: LensDataL[] = [];
  plustoplusL: any = '';

  lensL: any = {
    productname: '', purchasePrice: 0, quantity: 0, GSTtype: 'None', GSTPercent: 0, retailPrice: 0, wholesalePrice: 0, axis: '', addtion: '', eye: ''
  }

  lenslistL: any = []
  quantitiesL: { [key: string]: { [key: string]: number } } = {};

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private ps: ProductService,
    private ss: SupplierService,
    private supps: SupportService,
    private purchaseService: PurchaseService,
    public as: AlertService,
    public calculation: CalculationService,
    public modalService: NgbModal,
    public sp: NgxSpinnerService,
    private fb: FormBuilder



  ) {
    this.id = this.route.snapshot.params['id'];

  }

  selectedPurchaseMaster: any = {
    ID: null, SupplierID: null, SupplierName: null, CompanyID: null, GSTNo: null, ShopID: null, ShopName: null, PurchaseDate: null,
    PaymentStatus: null, InvoiceNo: null, Status: 1, CreatedBy: null, Quantity: 0, SubTotal: 0, DiscountAmount: 0,
    GSTAmount: 0, TotalAmount: 0, RoundOff: 0, preOrder: false, isGrid: true
  };

  item: any = {
    ID: null, PurchaseID: null, CompanyID: null, ProductName: '', ProductTypeName: '', ProductTypeID: null, UnitPrice: 0.00,
    Quantity: 0, SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: 0, GSTAmount: 0.00, GSTType: 'None', TotalAmount: 0.00, Multiple: false, RetailPrice: 0.00, WholeSalePrice: 0.00, Ledger: false, WholeSale: false, BaseBarCode: '', NewBarcode: '', Status: 1, BrandType: 0, ProductExpDate: '0000-00-00', UpdateProduct: false
  };

  charge: any = {
    ID: null, PurchaseID: null, ChargeType: null, CompanyID: null, Description: '', Amount: 0.00, GSTPercentage: 0.00, GSTAmount: 0.00,
    GSTType: 'None', TotalAmount: 0.00, Status: 1
  };

  data: any = { PurchaseMaster: null, Product: null, PurchaseDetail: null, Charge: null };

  id: any;
  supplierList: any;
  category = 'Product';
  selectedProduct: any;
  prodList: any;
  specList: any;
  disableAddButtons = false;
  gstperLock = false;
  gstLock = false;
  BrandLock = false;
  gstList: any;
  chargeOptions: any;
  tempItem = { Item: null, Spec: null };
  itemList: any = [];
  barcodeListt: any = [];

  chargeList: any = [];

  gst_detail: any = [];
  BarcodeQuantity = 0;
  BarcodeData: any = {};

  disbaleupdate = false;

  editPurchase = false
  addPurchase = false
  deletePurchase = false
  supplierGSTType = '';
  currentTime = '';

  disabledWholeSale = false
  additionList: any = []
  axisList: any = []
  clickedColumnIndex: any | number | null = null;
  hoveredRow: any = null;
  axisAddEyeShow = false
  isActive1 = false;
  isActive2 = false;
  isActive3 = false;
  isActive1L = false;
  isActive2L = false;
  isActive3L = false;
  // Add this method to handle the input click
  onInputClick(index: any): void {
    this.clickedColumnIndex = index;
  }

  onInputFocus(index: number, element: any, sph: string): void {
    this.onInputClick(index); // Keep existing logic here

    // Clear the value to make it blank when focused, if the value is currently 0
    if (element[sph] === 0) {
      element[sph] = '';
    }

    // Clear the cyl value to make it blank when focused, if the value is currently 0
    if (element.cyl === 0) {
      element.cyl = '';
    }
  }

  onInputBlur(element: any, sph: string): void {
    // Set the value back to 0 if left blank
    if (element[sph] === '') {
      element[sph] = 0;
    }

    // Set the cyl value back to 0 if left blank
    if (element.cyl === '') {
      element.cyl = 0;
    }
  }

  // Add this method to check if the row is hovered
  isHoveredRow(row: any): boolean {
    return this.hoveredRow === row;
  }

  ngOnInit(): void {

    if (this.shop[0].WholesaleBill === 'true') {
      this.item.WholeSale = true
      this.disabledWholeSale = true
    } else {
      this.item.WholeSale = false
    }

    if (this.shop[0].WholesaleBill === 'true' && this.shop[0].RetailBill === 'true') {
      this.item.WholeSale = false
      this.disabledWholeSale = false
    }

    this.permission.forEach((element: any) => {
      if (element.ModuleName === 'Purchase') {
        this.editPurchase = element.Edit;
        this.addPurchase = element.Add;
        this.deletePurchase = element.Delete;
      }
    });
    this.getProductList();
    this.getdropdownSupplierlist();
    this.getGSTList();
    this.chargelist();
    if (this.id != 0) {
      this.getPurchaseById();
    } else {
      this.selectedPurchaseMaster.PurchaseDate = moment().format('yyyy-MM-DD');
    }

    this.currentTime = new Date().toLocaleTimeString('en-US', { hourCycle: 'h23' })


  }

  getPurchaseById() {
    this.sp.show();
    const subs: Subscription = this.purchaseService.getPurchaseById(this.id).subscribe({
      next: (res: any) => {
        if (res.success === true) {
          this.selectedPurchaseMaster = res.result.PurchaseMaster[0]
          this.selectedPurchaseMaster.PurchaseDate = moment(res.result.PurchaseMaster[0].PurchaseDate).format('YYYY-MM-DD')
          this.itemList = res.result.PurchaseDetail
          this.chargeList = res.result.Charge
          this.gst_detail = this.selectedPurchaseMaster.gst_detail
          this.calculateGrandTotal();
          this.as.successToast(res.message)
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => {
        console.log(err.message);
      },
      complete: () => subs.unsubscribe(),
    })
  }

  getdropdownSupplierlist() {
    this.sp.show();
    const subs: Subscription = this.ss.dropdownSupplierlist('').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.supplierList = res.data.sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));;
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getProductList() {
    this.sp.show();
    const subs: Subscription = this.ps.getList().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.prodList = res.data.filter((el: any) => {
            return el.Name.toUpperCase() === 'LENS' || el.Name.toUpperCase() === 'CONTACT LENS';
          });
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getGSTList() {
    this.sp.show();
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
        this.sp.hide();
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
      if (element.Ref === this.specList[index].FieldName) {
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
      if (element.TableValue.toLowerCase() === this.specList[i].SelectedValue.toLowerCase().trim()) { count = count + 1; }
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

  getSupplierDetails(event: any) {
    this.supplierGSTType = '';
    const index = this.supplierList.findIndex((element: any) => element.ID === event.value);
    this.selectedPurchaseMaster.SupplierID = this.supplierList[index].ID;
    this.selectedPurchaseMaster.SupplierName = this.supplierList[index].Name;
    this.item.GSTType = this.supplierList[index].GSTType;
    if (this.item.GSTType !== 'None' && this.item.GSTType != undefined) {
      this.supplierGSTType = this.item.GSTType
    } else {
      this.item.GSTType = 'None'
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

  chargelist() {
    const subs: Subscription = this.supps.chargelist(this.charge).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.chargeOptions = res.data
          this.chargeOptions.sort((a: any, b: any) => (a.Name < b.Name) ? -1 : 1)
        } else {
          this.as.errorToast(res.message)
        }
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  setChargeValues() {
    this.chargeOptions.forEach((element: any) => {
      if (element.ID === this.charge.ChargeType) {
        this.charge.Price = element.Price;
        this.charge.Description = element.Description;
        this.charge.GSTAmount = element.GSTAmount;
        this.charge.GSTPercentage = element.GSTPercentage;
        this.charge.GSTType = element.GSTType;
        this.charge.TotalAmount = element.TotalAmount;
      }
    });
  }

  calculateFields(fieldName: any, mode: any,) {
    this.calculation.calculateFields(fieldName, mode, this.item, this.charge)
    // this.GstTypeDis = false
  }

  calculateGrandTotal() {
    this.calculation.calculateGrandTotal(this.selectedPurchaseMaster, this.itemList, this.chargeList)
  }

  addItem() {
    if (this.category === 'Product') {
      if ((this.item.GSTType === 'None' && this.item.GSTPercentage !== 0) || (this.item.GSTPercentage === 0 && this.item.GSTType !== 'None') || (this.item.GSTPercentage === null && this.item.GSTType !== 'None')) {
        Swal.fire({
          position: 'center',
          icon: 'warning',
          title: 'Without GSTType, the selected value will not be saved',
          showConfirmButton: true,
          backdrop: false,
        })
        this.GstTypeDis = true
      } else {


        if (this.selectedPurchaseMaster.ID !== null) { this.item.Status = 2; }
        this.item.ProductName = "";
        this.item.ProductTypeID = ""

        this.specList.forEach((element: any) => {
          this.prodList.forEach((elements: any) => {
            if (elements.Name === element.ProductName) {
              this.item.ProductTypeID = elements.ID
              this.item.ProductTypeName = elements.Name
            }
          });
          if (element.SelectedValue !== "") {
            this.item.ProductName = this.item.ProductName + element.SelectedValue + "/";
          }
          if (element.FieldType === "Date") {
            this.item.ProductExpDate = element.SelectedValue;
          }
        });

        this.item.ProductExpDate = this.item.ProductExpDate === '' ? "0000-00-00" : this.item.ProductExpDate;
        this.item.ProductTypeID = this.item.ProductTypeID
        this.item.ProductTypeName = this.item.ProductTypeName
        this.item.ProductName = this.item.ProductName.substring(0, this.item.ProductName.length - 1)

        let AddQty = 0;
        if (this.item.Quantity !== 0 && this.item.Quantity !== "0") {
          this.itemList.forEach((ele: any) => {
            if (ele.ID === null) {
              if (ele.ProductName === this.item.ProductName && Number(ele.RetailPrice) === Number(this.item.RetailPrice) && ele.UnitPrice === this.item.UnitPrice) {
                ele.Quantity = Number(ele.Quantity) + Number(this.item.Quantity);
                ele.SubTotal = Number(ele.SubTotal) + Number(this.item.SubTotal);
                ele.TotalAmount = Number(ele.TotalAmount) + Number(this.item.TotalAmount);
                ele.GSTAmount = Number(ele.GSTAmount) + Number(this.item.GSTAmount);
                ele.DiscountAmount = Number(ele.DiscountAmount) + Number(this.item.DiscountAmount);
                AddQty = 1;
              }
            }
          })
          if (AddQty === 0) {
            this.itemList.unshift(this.item);
            console.log(this.itemList);

          }
        }

        this.tempItem = { Item: null, Spec: null };

        if (this.gstLock === false && this.gstperLock === false) {
          this.item = {
            ID: null, PurchaseID: null, CompanyID: null, ProductName: '', ProductTypeName: this.selectedProduct, ProductTypeID: null, UnitPrice: 0.00, Quantity: 0, SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: 0, GSTAmount: 0.00, GSTType: 'None', TotalAmount: 0.00, Multiple: false, RetailPrice: 0, WholeSalePrice: 0, Ledger: true, WholeSale: this.item.WholeSale, BaseBarCode: null, NewBarcode: '', Status: 1, BrandType: this.item.BrandType, ProductExpDate: '0000-00-00', UniqueBarcode: ''
          };
        } else if (this.gstLock === true && this.gstperLock === false) {
          this.item = {
            ID: null, PurchaseID: null, CompanyID: null, ProductName: '', ProductTypeName: this.selectedProduct, ProductTypeID: null, UnitPrice: 0.00, Quantity: 0, SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: 0, GSTAmount: 0.00, GSTType: this.item.GSTType, TotalAmount: 0.00, Multiple: false, RetailPrice: 0, WholeSalePrice: 0, Ledger: true, WholeSale: this.item.WholeSale, BaseBarCode: null, NewBarcode: '', Status: 1, BrandType: this.item.BrandType, ProductExpDate: '0000-00-00', UniqueBarcode: ''
          };
        } else if (this.gstLock === false && this.gstperLock === true) {
          this.item = {
            ID: null, PurchaseID: null, CompanyID: null, ProductName: '', ProductTypeName: this.selectedProduct, ProductTypeID: null, UnitPrice: 0.00, Quantity: 0, SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: this.item.GSTPercentage, GSTAmount: 0.00, GSTType: 'None', TotalAmount: 0.00, Multiple: false, RetailPrice: 0, WholeSalePrice: 0, Ledger: true, WholeSale: this.item.WholeSale, BaseBarCode: null, NewBarcode: '', Status: 1, BrandType: this.item.BrandType, ProductExpDate: '0000-00-00', UniqueBarcode: ''
          };
        } else {
          this.item = {
            ID: null, PurchaseID: null, CompanyID: null, ProductName: '', ProductTypeName: this.selectedProduct, ProductTypeID: null, UnitPrice: 0.00, Quantity: 0, SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: this.item.GSTPercentage, GSTAmount: 0.00, GSTType: this.item.GSTType, TotalAmount: 0.00, Multiple: false, RetailPrice: 0, WholeSalePrice: 0, Ledger: true, WholeSale: this.item.WholeSale, BaseBarCode: null, NewBarcode: '', Status: 1, BrandType: this.item.BrandType, ProductExpDate: '0000-00-00', UniqueBarcode: ''
          }
        }

        if (this.BrandLock === true) {
          this.item = {
            ID: null, PurchaseID: null, CompanyID: null, ProductName: '', ProductTypeName: this.selectedProduct, ProductTypeID: null, UnitPrice: 0.00, Quantity: 0, SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: this.item.GSTPercentage, GSTAmount: 0.00, GSTType: this.item.GSTType, TotalAmount: 0.00, Multiple: false, RetailPrice: 0, WholeSalePrice: 0, Ledger: true, WholeSale: this.item.WholeSale, BaseBarCode: null, NewBarcode: '', Status: 1, BrandType: this.item.BrandType, ProductExpDate: '0000-00-00', UniqueBarcode: ''
          }
        } else {
          this.item = {
            ID: null, PurchaseID: null, CompanyID: null, ProductName: '', ProductTypeName: this.selectedProduct, ProductTypeID: null, UnitPrice: 0.00, Quantity: 0, SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: this.item.GSTPercentage, GSTAmount: 0.00, GSTType: this.item.GSTType, TotalAmount: 0.00, Multiple: false, RetailPrice: 0, WholeSalePrice: 0, Ledger: true, WholeSale: this.item.WholeSale, BaseBarCode: null, NewBarcode: '', Status: 1, BrandType: 0, ProductExpDate: '0000-00-00', UniqueBarcode: ''
          }
        }

        if (this.item.WholeSale === true) {
          this.item.WholeSale = true;
        }
        if (this.item.WholeSale === false) {
          this.item.WholeSale = false;
        }

        this.specList.forEach((element: any) => {
          if (element.CheckBoxValue === false || element.CheckBoxValue === undefined) {
            element.SelectedValue = '';
          } else {
            element.SelectedValue = element.SelectedValue;
          }
        });

      }
    }
    if (this.category === 'Charges') {

      if ((this.charge.GSTType === 'None' && this.charge.GSTPercentage !== 0) || (this.charge.GSTPercentage === 0 && this.charge.GSTType !== 'None') || (this.charge.GSTPercentage === null && this.charge.GSTType !== 'None')) {
        Swal.fire({
          position: 'center',
          icon: 'warning',
          title: 'Without GSTType, the selected value will not be saved',
          showConfirmButton: true,
          backdrop: false,
        })
        this.GstTypeDis = true
      } else {
        if (this.selectedPurchaseMaster.ID !== null) { this.charge.Status = 2; }
        this.charge.ID = null;

        this.chargeOptions.forEach((ele: any) => {
          if (ele.ID !== null) {
            this.charge.ChargeType = ele.Name
          }
        });

        this.chargeList.push(this.charge);
        this.charge = {
          ID: null, ChargeType: null, CompanyID: null, Description: '', Amount: 0.00, Price: 0.00, GSTPercentage: 0, GSTAmount: 0.00,
          GSTType: '', TotalAmount: 0.00, Status: 1
        };
      }

    }
    this.calculateGrandTotal();
  }

  notifyGst() {
    if (this.item.GSTPercentage !== 0 && this.item.GSTPercentage !== "0") {
      if (this.item.GSTType === 'None') {
        Swal.fire({
          position: 'center',
          icon: 'warning',
          title: 'Please Select GSTType',
          showConfirmButton: true,
          backdrop: false,
        })
        this.GstTypeDis = true
      }
    }
    if (this.item.GSTType !== 'None') {
      if (this.item.GSTPercentage == "0") {
        Swal.fire({
          position: 'center',
          icon: 'warning',
          title: 'Please Select GSTType',
          showConfirmButton: true,
          backdrop: false,
        })
        this.GstTypeDis = true
      }
    }
    if (this.item.GSTType !== 'None') {
      if (this.item.GSTPercentage !== "0") {
        this.GstTypeDis = false
      }
    }

    if (this.charge.GSTPercentage !== 0 && this.charge.GSTPercentage !== "0") {
      if (this.charge.GSTType === 'None') {
        Swal.fire({
          position: 'center',
          icon: 'warning',
          title: 'Please Select GSTType',
          showConfirmButton: true,
          backdrop: false,
        })
        this.GstTypeDis = true
      }
    }

  }

  onSumbit() {
    this.sp.show();
    this.selectedPurchaseMaster.ShopID = this.shop[0].ShopID;
    this.selectedPurchaseMaster.PurchaseDate = this.selectedPurchaseMaster.PurchaseDate + ' ' + this.currentTime;
    this.data.PurchaseMaster = this.selectedPurchaseMaster;
    this.data.PurchaseDetail = JSON.stringify(this.itemList);
    this.data.Charge = this.chargeList;
    console.log(this.data);
    const subs: Subscription = this.purchaseService.savePurchase(this.data).subscribe({
      next: (res: any) => {
        if (res.success) {
          if (res.data !== 0) {
            this.id = res.data;
            this.router.navigate(['/inventory/lens-grid-view', this.id]);
            this.getPurchaseById();
            this.selectedProduct = "";
            this.specList = [];
          }
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Your file has been Save.',
            showConfirmButton: false,
            timer: 1200
          })
        } else {
          this.currentTime = ''
          this.as.errorToast(res.message)
          Swal.fire({
            position: 'center',
            icon: 'warning',
            title: res.message,
            showConfirmButton: true,
            backdrop: false,
          })
        }
        this.sp.hide();
      },
      error: (err: any) => {
        console.log(err.msg);
      },
      complete: () => subs.unsubscribe(),
    });
  }

  deleteItem(Category: any, i: any) {
    if (Category === 'Product') {
      if (this.itemList[i].ID === null) {
        this.itemList.splice(i, 1);
        this.calculateGrandTotal();
      } else {
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
            if (this.itemList[i].ID !== null || this.itemList[i].Status === 1) {
              this.itemList[i].Status = 0;
              this.calculateGrandTotal();
            }
            const subs: Subscription = this.purchaseService.deleteProduct(this.itemList[i].ID, this.selectedPurchaseMaster).subscribe({
              next: (res: any) => {
                if (res.success) {
                  this.itemList[i].Status = 0;
                  this.getPurchaseById()
                  Swal.fire({
                    position: 'center',
                    icon: 'success',
                    title: 'Your file has been deleted.',
                    showConfirmButton: false,
                    timer: 1000
                  })
                } else {
                  this.as.errorToast(res.message)
                  this.itemList[i].Status = 1;
                  this.calculateGrandTotal();
                  Swal.fire({
                    position: 'center',
                    icon: 'warning',
                    title: res.message,
                    showConfirmButton: true,
                    backdrop: false,
                  })
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

  }

  deleteCharge(Category: any, i: any) {
    if (Category === 'Charges') {
      if (this.chargeList[i].ID === null) {
        this.chargeList.splice(i, 1);
        this.calculateGrandTotal();
      } else {
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
            if (this.chargeList[i].ID !== null || this.chargeList[i].Status === 1) {
              this.chargeList[i].Status = 0;
              this.calculateGrandTotal();
            }
            const subs: Subscription = this.purchaseService.deleteCharge(this.chargeList[i].ID, this.selectedPurchaseMaster).subscribe({
              next: (res: any) => {
                if (res.success) {
                  this.chargeList[i].Status = 0;
                  this.getPurchaseById()
                  Swal.fire({
                    position: 'center',
                    icon: 'success',
                    title: 'Your file has been deleted.',
                    showConfirmButton: false,
                    timer: 1000
                  })
                } else {
                  this.as.errorToast(res.message)
                  this.chargeList[i].Status = 1;
                  this.calculateGrandTotal();
                  Swal.fire({
                    position: 'center',
                    icon: 'warning',
                    title: res.message,
                    showConfirmButton: true,
                    backdrop: false,
                  })
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
  }

  // edititem(mode:any,data:any){
  //   this.editBtn = true
  //   if(mode === 'Product'){
  //     this.selectedProduct = data.ProductTypeName
  //     this.item.ProductName = data.ProductName
  //     this.item = data
  //   }
  // }

  // editUpdate(){
  //   this.itemList.forEach((ele: any) =>{
  //     if(ele.ID !== null && ele.ID === null ){
  //       ele = this.item
  //     }
  //   });
  //   this.calculateGrandTotal()
  //   this.item = {
  //     ID: null, PurchaseID: null, CompanyID: null, ProductName: '', ProductTypeName: '', ProductTypeID: null, UnitPrice: 0.00,
  //     Quantity: 0, SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: 0, GSTAmount: 0.00, GSTType: 'None', TotalAmount: 0.00, Multiple: false, RetailPrice: 0.00, WholeSalePrice: 0.00, Ledger: false, WholeSale: false, BaseBarCode: '', NewBarcode: '',  Status: 1, BrandType: 0
  //   };
  //   this.editBtn = false
  //   this.specList = []
  //   this.selectedProduct = "";
  // }

  updatedPurchase() {
    this.sp.show()
    this.data.UpdateProduct = true
    this.selectedPurchaseMaster.ShopID = this.shop[0].ShopID;
    this.selectedPurchaseMaster.PurchaseDate = this.selectedPurchaseMaster.PurchaseDate + ' ' + this.currentTime;
    this.data.PurchaseMaster = this.selectedPurchaseMaster;
    this.data.Charge = this.chargeList;
    let items: any = [];
    this.selectAllChecked = false;
    this.itemList.forEach((ele: any) => {
      if (ele.ID !== null || ele.ID === null || ele.Status == 0 && ele.UpdatedBy === null) {
        ele.UpdatedBy = this.user.ID;
        ele.Checked = false
        items.push(ele);
      }
    })
    this.data.PurchaseDetail = JSON.stringify(items);
    const subs: Subscription = this.purchaseService.updatePurchase(this.data).subscribe({
      next: (res: any) => {
        if (res.success) {
          if (res.data !== 0) {
            this.getPurchaseById();
            this.selectedProduct = "";
            this.specList = [];
          }
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Your file has been Update.',
            showConfirmButton: false,
            timer: 1200
          })
        } else {
          this.currentTime = ''
          this.as.errorToast(res.message)
          Swal.fire({
            position: 'center',
            icon: 'warning',
            title: res.message,
            showConfirmButton: true,
            backdrop: false,
          })
        }
        this.sp.hide()
      },
      error: (err: any) => {
        console.log(err.msg);
      },
      complete: () => subs.unsubscribe(),
    });
  }

  showInput(data: any) {
    data.UpdateProduct = !data.UpdateProduct
    this.disbaleupdate = true
  }

  calculateFields1(fieldName: any, mode: any, data: any) {
    this.calculation.calculateFields(fieldName, mode, data, '')
  }

  updataEditProdcut(fieldName: any, mode: any, data: any) {

    if ((data.GSTType === 'None' && data.GSTPercentage !== 0) || (data.GSTPercentage === 0 && data.GSTType !== 'None')) {
      Swal.fire({
        position: 'center',
        icon: 'warning',
        title: 'Without GSTType, the selected value will not be saved',
        showConfirmButton: true,
        backdrop: false,
      })
      data.UpdateProduct = true
    } else {
      this.sp.show()
      this.calculateFields1(fieldName, mode, data)
      this.calculateGrandTotal();
      data.BrandType = Number(data.BrandType)
      const dtm = {
        PurchaseMaster: this.selectedPurchaseMaster,
        ...data
      }
      const subs: Subscription = this.purchaseService.updateProduct(dtm).subscribe({
        next: (res: any) => {
          if (res.success === true) {
            // this.showInput(data)
            this.as.successToast(res.message)
            this.showInput(data)
            this.getPurchaseById()
          } else {
            Swal.fire({
              position: 'center',
              icon: 'error',
              title: res.message + ', you can not change anything',
              showConfirmButton: true,
              backdrop: false,
            })
            this.showInput(data)
            this.getPurchaseById()
          }
          this.disbaleupdate = false
          this.sp.hide()
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    }

  }

  PurchaseDetailPDF() {
    let itemList2: any = []
    this.itemList.forEach((ele: any) => {
      if (ele.Status === 1) {
        itemList2.push(ele)
      }
    });
    let body = { PurchaseMaster: this.selectedPurchaseMaster, PurchaseDetails: itemList2, PurchaseCharge: this.chargeList }
    this.sp.show();
    const subs: Subscription = this.purchaseService.purchaseDetailPDF(body).subscribe({
      next: (res: any) => {
        if (res) {
          const url = this.env.apiUrl + "/uploads/" + res;
          window.open(url, "_blank");
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  openModal(content: any, data: any) {
    this.BarcodeQuantity = 0
    this.modalService.open(content, { centered: true, backdrop: 'static', keyboard: false, size: 'sm' });
    let bs = this.shop.filter((s: any) => s.ID === Number(this.selectedShop[0]));
    this.BarcodeData = data

  }

  BarcodeQty() {
    this.sp.show();
    this.BarcodeData.Quantity = Number(this.BarcodeQuantity)
    const subs: Subscription = this.purchaseService.PrintBarcode(this.BarcodeData).subscribe({
      next: (res: any) => {
        if (res != '') {
          window.open(res, "_blank");
          this.modalService.dismissAll();
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  selectBarcode(type: any, toggleCheckbox: any = true) {
    if (type === 'all') {
      if (toggleCheckbox) {
        this.checked = !this.checked; // Toggle the checked property if needed
        this.sp.show();
        this.barcodeListt = [];
        this.itemList.forEach((ele: any, i: any) => {
          if (this.checked && ele.Status !== 0) {
            ele.Checked = 1;
            ele.index = i;
            this.barcodeListt.push(ele);
          } else {
            ele.Checked = 0;
          }
        });
        this.sp.hide();
      } else {
        // If toggleCheckbox is false, uncheck all items
        this.checked = false;
        this.selectAllChecked = false
        this.barcodeListt = [];
        this.itemList.forEach((ele: any) => {
          ele.Checked = 0;
          ele.Checked = false
        });
      }
    }
  }

  singleSelectBarcode(i: any) {
    const currentItem = this.itemList[i];

    if (currentItem.Checked === false || currentItem.Checked === 0) {
      currentItem.index = i;
      this.barcodeListt.push(currentItem);
    } else if (currentItem.Checked === true || currentItem.Checked === 1) {
      // Use filter to remove the item from barcodeListt based on the index
      this.barcodeListt = this.barcodeListt.filter((el: any) => el.index !== i);
    }
  }

  barcodePrintAll() {
    if (this.barcodeListt.length != 0) {
      this.sp.show();
      let tempItem: any = [];
      let Qty = 0;

      this.barcodeListt.forEach((ele: any) => {
        if (ele.Status !== 0 && ele.ID != null && ele.BaseBarCode != null) {
          Qty = Qty + ele.Quantity;
          // Create a copy of 'ele' for each quantity and push it to 'tempItem'
          for (let i = 0; i < ele.Quantity; i++) {
            tempItem.push({ ...ele }); // Copy 'ele' using the spread operator
          }
        } else {
          alert('This Page Refresh.')
        }
      });

      const subs: Subscription = this.purchaseService.AllPrintBarcode(tempItem).subscribe({
        next: (res: any) => {
          if (res != '') {
            this.barcodeListt = [];
            this.selectBarcode('all', false);
            this.itemList.forEach((e: any) => {
              e.Checked = false
            })
            window.open(res, "_blank");

          } else {
            this.as.errorToast(res.message)
          }
          this.sp.hide();
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    } else {
      Swal.fire({
        position: 'center',
        icon: 'warning',
        title: `' Check if there are checkboxes on the page and make sure you've selected the appropriate ones.'`,
        showConfirmButton: true,
        backdrop: false,
      })
    }
  }

  openModalS(content1: any) {
    this.modalService.open(content1, { centered: true, backdrop: 'static', keyboard: false, size: 'xxl' });
    this.isActive1 = false;
    this.isActive2 = false;
    this.isActive3 = false;
    this.toggleActive(1)
    this.plusToplus('+sph+cyl')
    this.getAsix()
    this.getAddition()
    this.generateGrid()
    this.lenslist = []
    this.specList.forEach((element: any) => {
      if (element.CheckBoxValue === false || element.CheckBoxValue === undefined) {
        element.SelectedValue = '';
      } else {
        element.SelectedValue = element.SelectedValue;
        if (element.SelectedValue !== 'SINGLE VISION') {
          this.axisAddEyeShow = true
        } else {
          this.axisAddEyeShow = false
        }
      }
    });
  }

  getAsix() {
    this.sp.show();
    const subs: Subscription = this.supps.getList('Axis').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.axisList = res.data.sort((a: any, b: any) => parseFloat(a.Name) - parseFloat(b.Name));
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getAddition() {
    this.sp.show();
    const subs: Subscription = this.supps.getList('Addition').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.additionList = res.data.sort((a: any, b: any) => parseFloat(a.Name) - parseFloat(b.Name))
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  plusToplus(mode: any) {
    this.plustoplus = mode;
    this.generateGrid()
  }

  toggleActive(buttonNumber: number) {
    if (buttonNumber === 1) {
      this.isActive1 = !this.isActive1;
      this.isActive2 = false; // Optional: deactivate other buttons
      this.isActive3 = false;
    } else if (buttonNumber === 2) {
      this.isActive1 = false;
      this.isActive2 = !this.isActive2;
      this.isActive3 = false;
    } else if (buttonNumber === 3) {
      this.isActive1 = false;
      this.isActive2 = false;
      this.isActive3 = !this.isActive3;
    }
  }

  generateGrid() {
    this.sphValues = this.generateRange(this.sphMin, this.sphMax, this.sphStep, 'sph');
    this.cylValues = this.generateRange(this.cylMin, this.cylMax, this.cylStep, 'cyl');
    this.displayedColumns = ['cyl', ...this.cylValues]; // Include 'cyl' as the first column
    this.dataSource = this.initializeGrid(); // Initialize grid data

  }

  generateRange(min: number, max: number, step: number, type: 'sph' | 'cyl'): string[] {
    const range = [];
    for (let i = min; i <= max; i += step) {
      let value = i.toFixed(2);
      switch (this.plustoplus) {
        case '+sph+cyl':
          value = `+${value}`;
          break;
        case '-sph-cyl':
          value = `-${value}`;
          break;
        case '+sph-cyl':
          value = type === 'sph' ? `+${value}` : `-${value}`;
          break;
      }
      range.push(value);
    }
    return range;
  }

  initializeGrid(): LensData[] {
    const grid: any = [];
    this.sphValues.forEach(sph => {
      const row: LensData = { sph };
      this.cylValues.forEach(cyl => {
        row[cyl] = 0;
      });
      grid.push(row);
    });
    return grid;
  }

  get totalQty(): number {
    return this.dataSource.reduce((sum, row) => {
      return sum + this.cylValues.reduce((sphSum, sph) => {
        return sphSum + parseInt(row[sph], 10);
      }, 0);
    }, 0);
  }

  purchase(mode: any) {
    this.lenslist.forEach((p: any) => {
      if (mode === 'save') {

        let ASIX = '', ADD = '', EYE = '';

        if (this.lens.axis != '') {
          ASIX = '/' + 'Axis' + ' ' + this.lens.axis
        }
        if (this.lens.addtion != '') {
          ADD = '/' + 'Add' + ' ' + this.lens.addtion
        }
        if (this.lens.eye != '') {
          EYE = '/' + this.lens.eye
        }
        p.productname = p.productname + ASIX + ADD + EYE
        p.purchasePrice = this.lens.purchasePrice
        p.GSTtype = this.lens.GSTtype
        p.GSTPercent = this.lens.GSTPercent
        p.retailPrice = this.lens.retailPrice
        p.wholesalePrice = this.lens.wholesalePrice
      }
    })

    this.lenslist.forEach((is: any) => {
      is.ID = null,
        is.PurchaseID = null,
        is.CompanyID = null,
        is.ProductTypeName = this.item.ProductTypeName
      is.ProductTypeID = this.item.ProductTypeID,
        is.ProductName = is.productname
      is.Quantity = is.quantity
      is.UnitPrice = is.purchasePrice
      is.SubTotal = is.Quantity * is.UnitPrice
      is.DiscountPercentage = 0
      is.DiscountAmount = 0
      is.GSTPercentage = is.GSTPercent
      is.GSTType = is.GSTtype
      is.GSTAmount = (+is.UnitPrice * +is.Quantity - is.DiscountAmount) * +is.GSTPercentage / 100;
      is.TotalAmount = +is.SubTotal + +is.GSTAmount;
      is.RetailPrice = is.retailPrice
      is.WholeSalePrice = is.wholesalePrice
      is.BrandType = 0
      is.Multiple = false,
        is.Ledger = false
      is.WholeSale = this.item.WholeSale,
        is.BaseBarCode = '',
        is.NewBarcode = '',
        is.Status = 1,
        is.ProductExpDate = '0000-00-00';

      let AddQty = 0;
      if (is.Quantity !== 0 && is.Quantity !== "0") {
        this.itemList.forEach((ele: any) => {
          if (ele.ID === null) {
            if (ele.ProductName === is.ProductName && Number(ele.RetailPrice) === Number(is.RetailPrice) && ele.UnitPrice === is.UnitPrice) {
              ele.Quantity = Number(ele.Quantity) + Number(is.Quantity);
              ele.SubTotal = Number(ele.SubTotal) + Number(is.SubTotal);
              ele.TotalAmount = Number(ele.TotalAmount) + Number(is.TotalAmount);
              ele.GSTAmount = Number(ele.GSTAmount) + Number(is.GSTAmount);
              ele.DiscountAmount = Number(ele.DiscountAmount) + Number(is.DiscountAmount);
              AddQty = 1;
            }
          }
        })
        if (AddQty === 0) {
          this.itemList.push(is)
        }
      }

      this.selectedPurchaseMaster.Quantity = +this.selectedPurchaseMaster.Quantity + +is.Quantity;
      this.selectedPurchaseMaster.SubTotal = (+this.selectedPurchaseMaster.SubTotal + +is.SubTotal).toFixed(2);
      this.selectedPurchaseMaster.DiscountAmount = (+this.selectedPurchaseMaster.DiscountAmount + +is.DiscountAmount).toFixed(2);
      this.selectedPurchaseMaster.GSTAmount = (+this.selectedPurchaseMaster.GSTAmount + +is.GSTAmount).toFixed(2);
      this.selectedPurchaseMaster.TotalAmount = (+this.selectedPurchaseMaster.TotalAmount + +is.TotalAmount).toFixed(2);
    })

    this.generateGrid()
    this.lens = { productname: '', purchasePrice: 0, quantity: 0, GSTtype: 'None', GSTPercent: 0, retailPrice: 0, wholesalePrice: 0, axis: '', addtion: '', eye: '' }
    this.lenslist = []
  }

  qtyAdd(sph: any, cyl: any, qty: number, lens: any) {
    this.item.ProductName = "";
    this.item.ProductTypeID = "";
    let SphPower = ''
    let CylPower = ''


    if (sph !== "+0.00" && sph !== "-0.00") {
      SphPower = '/' + 'Sph' + ' ' + sph
    }

    if (cyl !== "+0.00" && cyl !== "-0.00") {
      CylPower = '/' + 'Cyl' + ' ' + cyl
    }

    this.lens.productname = SphPower + CylPower
    this.lens.quantity = qty;

    this.specList.forEach((element: any) => {
      this.prodList.forEach((elements: any) => {
        if (elements.Name === element.ProductName) {
          this.item.ProductTypeID = elements.ID
          this.item.ProductTypeName = elements.Name
        }
      });
      if (element.SelectedValue !== "") {
        this.item.ProductName = this.item.ProductName + element.SelectedValue + "/";
      }
      if (element.FieldType === "Date") {
        this.item.ProductExpDate = element.SelectedValue;
      }
    });
    this.item.ProductExpDate = this.item.ProductExpDate === '' ? "0000-00-00" : this.item.ProductExpDate;
    this.item.ProductTypeID = this.item.ProductTypeID
    this.item.ProductTypeName = this.item.ProductTypeName
    this.item.ProductName = this.item.ProductName.substring(0, this.item.ProductName.length - 1)

    this.lens.productname = this.item.ProductName + this.lens.productname
    // this.lenslist.unshift(this.lens);
    let existingProduct = this.lenslist.find((c: any) => c.productname === this.lens.productname);
    if (existingProduct) {
      // Update the quantity if the product already exists
      existingProduct.quantity = this.lens.quantity;
    } else {
      // Add the new product to the beginning of the array
      this.lenslist.unshift(this.lens);
    }

    this.lens = { productname: '', purchasePrice: 0, quantity: 0, GSTtype: 'None', GSTPercent: 0, retailPrice: 0, wholesalePrice: 0, axis: '', addtion: '', eye: '' }

  }

  openModalL(content2: any) {
    this.modalService.open(content2, { centered: true, backdrop: 'static', keyboard: false, size: 'xxl' });
    this.getAsixL()
    this.getAdditionL()
    this.lenslistL = []
    this.specList.forEach((element: any) => {
      if (element.CheckBoxValue === false || element.CheckBoxValue === undefined) {
        element.SelectedValue = '';
      } else {
        element.SelectedValue = element.SelectedValue;
        if (element.SelectedValue !== 'SINGLE VISION') {
          this.axisAddEyeShow = true
        } else {
          this.axisAddEyeShow = false
        }
      }
    });
  }

  getAsixL() {
    this.sp.show();
    const subs: Subscription = this.supps.getList('Axis').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.axisList = res.data.sort((a: any, b: any) => parseFloat(a.Name) - parseFloat(b.Name));
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getAdditionL() {
    this.sp.show();
    const subs: Subscription = this.supps.getList('Addition').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.additionList = res.data.sort((a: any, b: any) => parseFloat(a.Name) - parseFloat(b.Name))
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  // toggleActiveL(buttonNumber: number) {
  //   if (buttonNumber === 1) {
  //     this.isActive1L = !this.isActive1L;
  //     this.isActive2L = false; // Optional: deactivate other buttons
  //     this.isActive3L = false;
  //   } else if (buttonNumber === 2) {
  //     this.isActive1L = false;
  //     this.isActive2L = !this.isActive2L;
  //     this.isActive3L = false;
  //   } else if (buttonNumber === 3) {
  //     this.isActive1L = false;
  //     this.isActive2L = false;
  //     this.isActive3L = !this.isActive3L;
  //   }
  // }

  // generateGridL() {
  //    if(this.Base == 10){
  //     this.sphMinL = 9.25
  //     this.sphMaxL = 10
  //     this.sphStepL = 0.25
  //     this.cylMinL = 0
  //     this.cylMaxL = 6
  //     this.cylStepL = 0.25
  //     this.sphValuesL = this.generateRangeL(this.sphMinL, this.sphMaxL, this.sphStepL, 'sph');
  //     this.cylValuesL = this.generateRangeL(this.cylMinL, this.cylMaxL, this.cylStepL, 'cyl');
  //     this.displayedColumnsL = ['cyl', ...this.cylValuesL]; // Include 'cyl' as the first column
  //     this.dataSourceL = this.initializeGridL(); // Initialize grid data
  //    }
  //    if(this.Base == 9){
  //     this.sphMinL = 8.25
  //     this.sphMaxL = 9
  //     this.sphStepL = 0.25
  //     this.cylMinL = 0
  //     this.cylMaxL = 6
  //     this.cylStepL = 0.25
  //     this.sphValuesL = this.generateRangeL(this.sphMinL, this.sphMaxL, this.sphStepL, 'sph');
  //     this.cylValuesL = this.generateRangeL(this.cylMinL, this.cylMaxL, this.cylStepL, 'cyl');
  //     this.displayedColumnsL = ['cyl', ...this.cylValuesL]; // Include 'cyl' as the first column
  //     this.dataSourceL = this.initializeGridL(); // Initialize grid data
  //    }
  //    if(this.Base == 8){
  //     this.sphMinL = 7.25
  //     this.sphMaxL = 8
  //     this.sphStepL = 0.25
  //     this.cylMinL = 0
  //     this.cylMaxL = 6
  //     this.cylStepL = 0.25
  //     this.sphValuesL = this.generateRangeL(this.sphMinL, this.sphMaxL, this.sphStepL, 'sph');
  //     this.cylValuesL = this.generateRangeL(this.cylMinL, this.cylMaxL, this.cylStepL, 'cyl');
  //     this.displayedColumnsL = ['cyl', ...this.cylValuesL]; // Include 'cyl' as the first column
  //     this.dataSourceL = this.initializeGridL(); // Initialize grid data
  //    }
  //    if(this.Base == 7){
  //     this.sphMinL = 5.25
  //     this.sphMaxL = 7
  //     this.sphStepL = 0.25
  //     this.cylMinL = 0
  //     this.cylMaxL = 6
  //     this.cylStepL = 0.25
  //     this.sphValuesL = this.generateRangeL(this.sphMinL, this.sphMaxL, this.sphStepL, 'sph');
  //     this.cylValuesL = this.generateRangeL(this.cylMinL, this.cylMaxL, this.cylStepL, 'cyl');
  //     this.displayedColumnsL = ['cyl', ...this.cylValuesL]; // Include 'cyl' as the first column
  //     this.dataSourceL = this.initializeGridL(); // Initialize grid data
  //    }
  //    if(this.Base == 6){
  //     this.sphMinL = 4.75
  //     this.sphMaxL = 5.50
  //     this.sphStepL = 0.25
  //     this.cylMinL = 0
  //     this.cylMaxL = 6
  //     this.cylStepL = 0.25
  //     this.sphValuesL = this.generateRangeL(this.sphMinL, this.sphMaxL, this.sphStepL, 'sph');
  //     this.cylValuesL = this.generateRangeL(this.cylMinL, this.cylMaxL, this.cylStepL, 'cyl');
  //     this.displayedColumnsL = ['cyl', ...this.cylValuesL]; // Include 'cyl' as the first column
  //     this.dataSourceL = this.initializeGridL(); // Initialize grid data
  //    }
  //    if(this.Base == 5){
  //     this.sphMinL = 3.75
  //     this.sphMaxL = 4.50
  //     this.sphStepL = 0.25
  //     this.cylMinL = 0
  //     this.cylMaxL = 6
  //     this.cylStepL = 0.25
  //     this.sphValuesL = this.generateRangeL(this.sphMinL, this.sphMaxL, this.sphStepL, 'sph');
  //     this.cylValuesL = this.generateRangeL(this.cylMinL, this.cylMaxL, this.cylStepL, 'cyl');
  //     this.displayedColumnsL = ['cyl', ...this.cylValuesL]; // Include 'cyl' as the first column
  //     this.dataSourceL = this.initializeGridL(); // Initialize grid data
  //    }
  //    if(this.Base == 4){
  //     this.sphMinL = 0.25
  //     this.sphMaxL = 3.50
  //     this.sphStepL = 0.25
  //     this.cylMinL = 0
  //     this.cylMaxL = 6
  //     this.cylStepL = 0.25
  //     this.sphValuesL = this.generateRangeL(this.sphMinL, this.sphMaxL, this.sphStepL, 'sph');
  //     this.cylValuesL = this.generateRangeL(this.cylMinL, this.cylMaxL, this.cylStepL, 'cyl');
  //     this.displayedColumnsL = ['cyl', ...this.cylValuesL]; // Include 'cyl' as the first column
  //     this.dataSourceL = this.initializeGridL(); // Initialize grid data
  //    }


  // }

  baseChange1(base: any, mode: any) {
    if (mode == '1.56') {
      if (base == 4 || base == 5 || base == 6 || base == 7 || base == 8 || base == 10 || base == 12) {
        this.plusToplusL('+sph-cyl')
        this.generateGridL()
      }
      else {
        this.plusToplusL('-sph-cyl')
        this.generateGridL()
      }
    }
    if (mode == '1.61') {
      if (base == 4 || base == 5 || base == 6 || base == 7 || base == 8 || base == 9 || base == 10 || base == 11 || base == 12) {
        this.plusToplusL('+sph-cyl')
        this.generateGridL()
      }
      else {
        this.plusToplusL('-sph-cyl')
        this.generateGridL()
      }
    }
    if (mode == '1.499') {
      if (base == 4 || base == 5 || base == 6 || base == 7 || base == 8 || base == 9 || base == 10 || base == 11 || base == 12) {
        this.plusToplusL('+sph-cyl')
        this.generateGridL()
      }
      else {
        this.plusToplusL('-sph-cyl')
        this.generateGridL()
      }
    }
  }

  plusToplusL(mode: any) {
    this.plustoplusL = mode;
    this.generateGridL()
  }

  generateGridL() {
    let baseConfigurations: any, defaultCylConfig: any

    if (this.SVType == '1.56') {
      baseConfigurations = {
        12: { sphMinL: 10.25, sphMaxL: 11.50, sphStepL: 0.25 },
        10: { sphMinL: 8.25, sphMaxL: 10, sphStepL: 0.25 },
        8: { sphMinL: 7.25, sphMaxL: 8, sphStepL: 0.25 },
        7: { sphMinL: 5.25, sphMaxL: 7, sphStepL: 0.25 },
        6: { sphMinL: 4.75, sphMaxL: 5.5, sphStepL: 0.25 },
        5: { sphMinL: 3.75, sphMaxL: 4.5, sphStepL: 0.25 },
        4: { sphMinL: -1.00, sphMaxL: 3.5, sphStepL: 0.25 },
        3: { sphMinL: 0.00, sphMaxL: 3.75, sphStepL: 0.25 },
        2: { sphMinL: 0, sphMaxL: 6, sphStepL: 0.25 },
        1: { sphMinL: 0.25, sphMaxL: 7.75, sphStepL: 0.25 },
        0.5: { sphMinL: 2, sphMaxL: 18, sphStepL: 0.25 }
      };

      defaultCylConfig = {
        12: { cylMinL: 0, cylMaxL: 6, cylStepL: 0.25 },
        10: { cylMinL: 0, cylMaxL: 6, cylStepL: 0.25 },
        8: { cylMinL: 0, cylMaxL: 6, cylStepL: 0.25 },
        7: { cylMinL: 0, cylMaxL: 6, cylStepL: 0.25 },
        6: { cylMinL: 0, cylMaxL: 6, cylStepL: 0.25 },
        5: { cylMinL: 0, cylMaxL: 6, cylStepL: 0.25 },
        4: { cylMinL: 0, cylMaxL: 6, cylStepL: 0.25 },
        3: { cylMinL: 0, cylMaxL: 3.75, cylStepL: 0.25 },
        2: { cylMinL: 0, cylMaxL: 6, cylStepL: 0.25 },
        1: { cylMinL: 0, cylMaxL: 6, cylStepL: 0.25 },
        0.5: { cylMinL: 0, cylMaxL: 6, cylStepL: 0.25 },
      }
    }

    if (this.SVType == '1.61') {
      baseConfigurations = {
        12: { sphMinL: 11.25, sphMaxL: 13.50, sphStepL: 0.25 },
        11: { sphMinL: 10.25, sphMaxL: 11, sphStepL: 0.25 },
        10: { sphMinL: 8.75, sphMaxL: 10, sphStepL: 0.25 },
        9: { sphMinL: 7.25, sphMaxL: 8.50, sphStepL: 0.25 },
        8: { sphMinL: 6.75, sphMaxL: 7.50, sphStepL: 0.25 },
        7: { sphMinL: 5.75, sphMaxL: 6.50, sphStepL: 0.25 },
        6: { sphMinL: 4.75, sphMaxL: 5.5, sphStepL: 0.25 },
        5: { sphMinL: 3.75, sphMaxL: 4.5, sphStepL: 0.25 },
        4: { sphMinL: 0.25, sphMaxL: 3.5, sphStepL: 0.25 },
        3: { sphMinL: 0.00, sphMaxL: 4, sphStepL: 0.25 },
        2: { sphMinL: 0, sphMaxL: 6, sphStepL: 0.25 },
        1: { sphMinL: 0.25, sphMaxL: 8, sphStepL: 0.25 },
        0.5: { sphMinL: 2.25, sphMaxL: 19, sphStepL: 0.25 }
      };

      defaultCylConfig = {
        // 12: { cylMinL: 0, cylMaxL: 6, cylStepL: 0.25 },
        12: { cylMinL: 0, cylMaxL: 6, cylStepL: 0.25 },
        11: { cylMinL: 0, cylMaxL: 6, cylStepL: 0.25 },
        10: { cylMinL: 0, cylMaxL: 6, cylStepL: 0.25 },
        9: {  cylMinL: 0, cylMaxL: 6, cylStepL: 0.25 },
        8: { cylMinL: 0, cylMaxL: 6, cylStepL: 0.25 },
        7: { cylMinL: 0, cylMaxL: 6, cylStepL: 0.25 },
        6: { cylMinL: 0, cylMaxL: 6, cylStepL: 0.25 },
        5: { cylMinL: 0, cylMaxL: 6, cylStepL: 0.25 },
        4: { cylMinL: 0, cylMaxL: 6, cylStepL: 0.25 },
        3: { cylMinL: 0, cylMaxL: 4, cylStepL: 0.25 },
        2: { cylMinL: 0, cylMaxL: 6, cylStepL: 0.25 },
        1: { cylMinL: 0, cylMaxL: 6, cylStepL: 0.25 },
        0.5: { cylMinL: 0, cylMaxL: 6, cylStepL: 0.25 },
      }
    }

    if (this.SVType == '1.499'){
      baseConfigurations = {
        12: { sphMinL: 10.25, sphMaxL: 11.00, sphStepL: 0.25 },
        11: { sphMinL: 9.25, sphMaxL: 10, sphStepL: 0.25 },
        10: { sphMinL: 8.25, sphMaxL: 9, sphStepL: 0.25 },
        9: { sphMinL: 7.25, sphMaxL: 8, sphStepL: 0.25 },
        8: { sphMinL: 6.25, sphMaxL: 7, sphStepL: 0.25 },
        7: { sphMinL: 5.25, sphMaxL: 6, sphStepL: 0.25 },
        6: { sphMinL: 4.25, sphMaxL: 5, sphStepL: 0.25 },
        5: { sphMinL: 3.25, sphMaxL: 4, sphStepL: 0.25 },
        4: { sphMinL: -3.50, sphMaxL: 3, sphStepL: 0.25 },
        2: { sphMinL: 0, sphMaxL: 6, sphStepL: 0.25 },
        0: { sphMinL: 0.25, sphMaxL: 16, sphStepL: 0.25 },
      };

      defaultCylConfig = {
        // 12: { cylMinL: 0, cylMaxL: 6, cylStepL: 0.25 },
        12: { cylMinL: 0, cylMaxL: 6, cylStepL: 0.25 },
        11: { cylMinL: 0, cylMaxL: 6, cylStepL: 0.25 },
        10: { cylMinL: 0, cylMaxL: 6, cylStepL: 0.25 },
        9: {  cylMinL: 0, cylMaxL: 6, cylStepL: 0.25 },
        8: { cylMinL: 0, cylMaxL: 6, cylStepL: 0.25 },
        7: { cylMinL: 0, cylMaxL: 6, cylStepL: 0.25 },
        6: { cylMinL: 0, cylMaxL: 6, cylStepL: 0.25 },
        5: { cylMinL: 0, cylMaxL: 6, cylStepL: 0.25 },
        4: { cylMinL: 0, cylMaxL: 6, cylStepL: 0.25 },
        2: { cylMinL: 0, cylMaxL: 6, cylStepL: 0.25 },
        0: { cylMinL: 0, cylMaxL: 6, cylStepL: 0.25 },
      
      }
    }

    if (baseConfigurations[this.Base]) {
      const { sphMinL, sphMaxL, sphStepL } = baseConfigurations[this.Base];
      const { cylMinL, cylMaxL, cylStepL } = defaultCylConfig[this.Base];

      this.sphMinL = sphMinL;
      this.sphMaxL = sphMaxL;
      this.sphStepL = sphStepL;
      this.cylMinL = cylMinL;
      this.cylMaxL = cylMaxL;
      this.cylStepL = cylStepL;

      this.sphValuesL = this.generateRangeL(this.sphMinL, this.sphMaxL, this.sphStepL, 'sph');
      this.cylValuesL = this.generateRangeL(this.cylMinL, this.cylMaxL, this.cylStepL, 'cyl');
      this.displayedColumnsL = ['cyl', ...this.cylValuesL]; // Include 'cyl' as the first column
      this.dataSourceL = this.initializeGridL(); // Initialize grid data
    }
  }

  generateRangeL(min: number, max: number, step: number, type: 'sph' | 'cyl'): string[] {
    const range = [];

    for (let i = min; i <= max; i += step) {
      let value = i.toFixed(2);
      switch (this.plustoplusL) {
        case '-sph-cyl':
          value = `-${value}`;
          break;
        case '+sph-cyl':
          value = type === 'sph' ? `+${value}` : `-${value}`;
          break;
      }
      if (this.Base == 4 && value.startsWith("+-")) {
        value = value.replace("+-", "-");
      }
      range.push(value);
    }
    return range;
  }

  initializeGridL(): LensDataL[] {
    const grid: any = [];
    this.sphValuesL.forEach(sph => {
      const row: LensDataL = { sph };
      this.cylValuesL.forEach(cyl => {
        // Define active blue cells based on conditions
      let isBlue = {}
      if (this.SVType == '1.56') {
        if (this.Base == 4) {
          isBlue =
            (parseFloat(sph) != -0.00 || parseFloat(cyl) >= -1.00) &&
            (parseFloat(sph) != -0.25 || parseFloat(cyl) >= -0.75) &&
            (parseFloat(sph) != -0.50 || parseFloat(cyl) >= -0.50) &&
            (parseFloat(sph) != -0.75 || parseFloat(cyl) >= -0.25) &&
            (parseFloat(sph) != -1.00 || parseFloat(cyl) >= -0.00)
        }
        if (this.Base == 3) {
          isBlue =
            (parseFloat(sph) != -0.00 || parseFloat(cyl) <= -1.25) &&
            (parseFloat(sph) != -3.75 || parseFloat(cyl) >= -0.00) &&
            (parseFloat(sph) != -0.25 || parseFloat(cyl) <= -1.00) &&
            (parseFloat(sph) != -3.50 || parseFloat(cyl) >= -0.25) &&
            (parseFloat(sph) != -0.50 || parseFloat(cyl) <= -0.75) &&
            (parseFloat(sph) != -3.25 || parseFloat(cyl) >= -0.50) &&
            (parseFloat(sph) != -0.75 || parseFloat(cyl) <= -0.50) &&
            (parseFloat(sph) != -3.00 || parseFloat(cyl) >= -0.75) &&
            (parseFloat(sph) != -1.00 || parseFloat(cyl) <= -0.25) &&
            (parseFloat(sph) != -2.75 || parseFloat(cyl) >= -1.00) &&
            (parseFloat(sph) != -2.50 || parseFloat(cyl) >= -1.25) &&
            (parseFloat(sph) != -2.25 || parseFloat(cyl) >= -1.50) &&
            (parseFloat(sph) != -2.00 || parseFloat(cyl) >= -1.75) &&
            (parseFloat(sph) != -1.75 || parseFloat(cyl) >= -2.00) &&
            (parseFloat(sph) != -1.50 || parseFloat(cyl) >= -2.25) &&
            (parseFloat(sph) != -1.25 || parseFloat(cyl) >= -2.50) &&
            (parseFloat(sph) != -1.00 || parseFloat(cyl) >= -2.75) &&
            (parseFloat(sph) != -0.75 || parseFloat(cyl) >= -3.00) &&
            (parseFloat(sph) != -0.50 || parseFloat(cyl) >= -3.25) &&
            (parseFloat(sph) != -0.25 || parseFloat(cyl) >= -3.50) &&
            (parseFloat(sph) != -0.00 || parseFloat(cyl) >= -3.75)
        }
        if (this.Base == 2) {
          isBlue =
            (parseFloat(sph) != -0.00 || parseFloat(cyl) <= -4.00) &&
            (parseFloat(sph) != -0.25 || parseFloat(cyl) <= -3.75) &&
            (parseFloat(sph) != -0.25 || parseFloat(cyl) >= -5.75) &&
            (parseFloat(sph) != -0.50 || parseFloat(cyl) <= -3.50) &&
            (parseFloat(sph) != -0.50 || parseFloat(cyl) >= -5.50) &&
            (parseFloat(sph) != -0.75 || parseFloat(cyl) <= -3.25) &&
            (parseFloat(sph) != -0.75 || parseFloat(cyl) >= -5.25) &&
            (parseFloat(sph) != -1.00 || parseFloat(cyl) <= -3.00) &&
            (parseFloat(sph) != -1.00 || parseFloat(cyl) >= -5.00) &&
            (parseFloat(sph) != -1.25 || parseFloat(cyl) <= -2.75) &&
            (parseFloat(sph) != -1.25 || parseFloat(cyl) >= -4.75) &&
            (parseFloat(sph) != -1.50 || parseFloat(cyl) <= -2.50) &&
            (parseFloat(sph) != -1.50 || parseFloat(cyl) >= -4.50) &&
            (parseFloat(sph) != -1.75 || parseFloat(cyl) <= -2.25) &&
            (parseFloat(sph) != -1.75 || parseFloat(cyl) >= -4.25) &&
            (parseFloat(sph) != -2.00 || parseFloat(cyl) <= -2.00) &&
            (parseFloat(sph) != -2.00 || parseFloat(cyl) >= -4.00) &&
            (parseFloat(sph) != -2.25 || parseFloat(cyl) <= -1.75) &&
            (parseFloat(sph) != -2.25 || parseFloat(cyl) >= -3.75) &&
            (parseFloat(sph) != -2.50 || parseFloat(cyl) <= -1.50) &&
            (parseFloat(sph) != -2.50 || parseFloat(cyl) >= -3.50) &&
            (parseFloat(sph) != -2.75 || parseFloat(cyl) <= -1.25) &&
            (parseFloat(sph) != -2.75 || parseFloat(cyl) >= -3.25) &&
            (parseFloat(sph) != -3.00 || parseFloat(cyl) <= -1.00) &&
            (parseFloat(sph) != -3.00 || parseFloat(cyl) >= -3.00) &&
            (parseFloat(sph) != -3.25 || parseFloat(cyl) <= -0.75) &&
            (parseFloat(sph) != -3.25 || parseFloat(cyl) >= -2.75) &&
            (parseFloat(sph) != -3.50 || parseFloat(cyl) <= -0.50) &&
            (parseFloat(sph) != -3.50 || parseFloat(cyl) >= -2.50) &&
            (parseFloat(sph) != -3.75 || parseFloat(cyl) <= -0.25) &&
            (parseFloat(sph) != -3.75 || parseFloat(cyl) >= -2.25) &&
            (parseFloat(sph) != -4.00 || parseFloat(cyl) <= -0.00) &&
            (parseFloat(sph) != -4.00 || parseFloat(cyl) >= -2.00) &&
            (parseFloat(sph) != -4.25 || parseFloat(cyl) >= -1.75) &&
            (parseFloat(sph) != -4.50 || parseFloat(cyl) >= -1.50) &&
            (parseFloat(sph) != -4.75 || parseFloat(cyl) >= -1.25) &&
            (parseFloat(sph) != -5.00 || parseFloat(cyl) >= -1.00) &&
            (parseFloat(sph) != -5.25 || parseFloat(cyl) >= -0.75) &&
            (parseFloat(sph) != -5.50 || parseFloat(cyl) >= -0.50) &&
            (parseFloat(sph) != -5.75 || parseFloat(cyl) >= -0.25) &&
            (parseFloat(sph) != -6.00 || parseFloat(cyl) >= -0.00)
        }
        if (this.Base == 1) {
          isBlue =
            (parseFloat(sph) != -0.25 || parseFloat(cyl) <= -6.00) &&
            (parseFloat(sph) != -0.50 || parseFloat(cyl) <= -5.75) &&
            (parseFloat(sph) != -0.75 || parseFloat(cyl) <= -5.50) &&
            (parseFloat(sph) != -1.00 || parseFloat(cyl) <= -5.25) &&
            (parseFloat(sph) != -1.25 || parseFloat(cyl) <= -5.00) &&
            (parseFloat(sph) != -1.50 || parseFloat(cyl) <= -4.75) &&
            (parseFloat(sph) != -1.75 || parseFloat(cyl) <= -4.50) &&
            (parseFloat(sph) != -2.00 || parseFloat(cyl) <= -4.25) &&
            (parseFloat(sph) != -2.00 || parseFloat(cyl) >= -5.75) &&
            (parseFloat(sph) != -2.25 || parseFloat(cyl) <= -4.00) &&
            (parseFloat(sph) != -2.25 || parseFloat(cyl) >= -5.50) &&
            (parseFloat(sph) != -2.50 || parseFloat(cyl) <= -3.75) &&
            (parseFloat(sph) != -2.50 || parseFloat(cyl) >= -5.25) &&
            (parseFloat(sph) != -2.75 || parseFloat(cyl) <= -3.50) &&
            (parseFloat(sph) != -2.75 || parseFloat(cyl) >= -5.00) &&
            (parseFloat(sph) != -3.00 || parseFloat(cyl) <= -3.25) &&
            (parseFloat(sph) != -3.00 || parseFloat(cyl) >= -4.75) &&
            (parseFloat(sph) != -3.25 || parseFloat(cyl) <= -3.00) &&
            (parseFloat(sph) != -3.25 || parseFloat(cyl) >= -4.50) &&
            (parseFloat(sph) != -3.50 || parseFloat(cyl) <= -2.75) &&
            (parseFloat(sph) != -3.50 || parseFloat(cyl) >= -4.25) &&
            (parseFloat(sph) != -3.75 || parseFloat(cyl) <= -2.50) &&
            (parseFloat(sph) != -3.75 || parseFloat(cyl) >= -4.00) &&
            (parseFloat(sph) != -4.00 || parseFloat(cyl) <= -2.25) &&
            (parseFloat(sph) != -4.00 || parseFloat(cyl) >= -3.75) &&
            (parseFloat(sph) != -4.25 || parseFloat(cyl) <= -2.00) &&
            (parseFloat(sph) != -4.25 || parseFloat(cyl) >= -3.50) &&
            (parseFloat(sph) != -4.50 || parseFloat(cyl) <= -1.75) &&
            (parseFloat(sph) != -4.50 || parseFloat(cyl) >= -3.25) &&
            (parseFloat(sph) != -4.75 || parseFloat(cyl) <= -1.50) &&
            (parseFloat(sph) != -4.75 || parseFloat(cyl) >= -3.00) &&
            (parseFloat(sph) != -5.00 || parseFloat(cyl) <= -1.25) &&
            (parseFloat(sph) != -5.00 || parseFloat(cyl) >= -2.75) &&
            (parseFloat(sph) != -5.25 || parseFloat(cyl) <= -1.00) &&
            (parseFloat(sph) != -5.25 || parseFloat(cyl) >= -2.50) &&
            (parseFloat(sph) != -5.50 || parseFloat(cyl) <= -0.75) &&
            (parseFloat(sph) != -5.50 || parseFloat(cyl) >= -2.25) &&
            (parseFloat(sph) != -5.75 || parseFloat(cyl) <= -0.50) &&
            (parseFloat(sph) != -5.75 || parseFloat(cyl) >= -2.00) &&
            (parseFloat(sph) != -6.00 || parseFloat(cyl) <= -0.25) &&
            (parseFloat(sph) != -6.00 || parseFloat(cyl) >= -1.75) &&
            (parseFloat(sph) != -6.25 || parseFloat(cyl) >= -1.50) &&
            (parseFloat(sph) != -6.50 || parseFloat(cyl) >= -1.25) &&
            (parseFloat(sph) != -6.75 || parseFloat(cyl) >= -1.00) &&
            (parseFloat(sph) != -7.00 || parseFloat(cyl) >= -0.75) &&
            (parseFloat(sph) != -7.25 || parseFloat(cyl) >= -0.50) &&
            (parseFloat(sph) != -7.50 || parseFloat(cyl) >= -0.25) &&
            (parseFloat(sph) != -7.75 || parseFloat(cyl) >= -0.00)
        }
        if (this.Base == 0.5) {
          isBlue =
            (parseFloat(sph) != -2.00 || parseFloat(cyl) <= -6.00) &&
            (parseFloat(sph) != -2.25 || parseFloat(cyl) <= -5.75) &&
            (parseFloat(sph) != -2.50 || parseFloat(cyl) <= -5.50) &&
            (parseFloat(sph) != -2.75 || parseFloat(cyl) <= -5.25) &&
            (parseFloat(sph) != -3.00 || parseFloat(cyl) <= -5.00) &&
            (parseFloat(sph) != -3.25 || parseFloat(cyl) <= -4.75) &&
            (parseFloat(sph) != -3.50 || parseFloat(cyl) <= -4.50) &&
            (parseFloat(sph) != -3.75 || parseFloat(cyl) <= -4.25) &&
            (parseFloat(sph) != -4.00 || parseFloat(cyl) <= -4.00) &&
            (parseFloat(sph) != -4.25 || parseFloat(cyl) <= -3.75) &&
            (parseFloat(sph) != -4.50 || parseFloat(cyl) <= -3.50) &&
            (parseFloat(sph) != -4.75 || parseFloat(cyl) <= -3.25) &&
            (parseFloat(sph) != -5.00 || parseFloat(cyl) <= -3.00) &&
            (parseFloat(sph) != -5.25 || parseFloat(cyl) <= -2.75) &&
            (parseFloat(sph) != -5.50 || parseFloat(cyl) <= -2.50) &&
            (parseFloat(sph) != -5.75 || parseFloat(cyl) <= -2.25) &&
            (parseFloat(sph) != -6.00 || parseFloat(cyl) <= -2.00) &&
            (parseFloat(sph) != -6.25 || parseFloat(cyl) <= -1.75) &&
            (parseFloat(sph) != -6.50 || parseFloat(cyl) <= -1.50) &&
            (parseFloat(sph) != -6.75 || parseFloat(cyl) <= -1.25) &&
            (parseFloat(sph) != -7.00 || parseFloat(cyl) <= -1.00) &&
            (parseFloat(sph) != -7.25 || parseFloat(cyl) <= -0.75) &&
            (parseFloat(sph) != -7.50 || parseFloat(cyl) <= -0.50) &&
            (parseFloat(sph) != -7.75 || parseFloat(cyl) <= -0.25) &&
            (parseFloat(sph) != -8.00 || parseFloat(cyl) <= -0.00) &&
            (parseFloat(sph) != -12.25 || parseFloat(cyl) >= -5.75) &&
            (parseFloat(sph) != -12.50 || parseFloat(cyl) >= -5.50) &&
            (parseFloat(sph) != -12.75 || parseFloat(cyl) >= -5.25) &&
            (parseFloat(sph) != -13.00 || parseFloat(cyl) >= -5.00) &&
            (parseFloat(sph) != -13.25 || parseFloat(cyl) >= -4.75) &&
            (parseFloat(sph) != -13.50 || parseFloat(cyl) >= -4.50) &&
            (parseFloat(sph) != -13.75 || parseFloat(cyl) >= -4.25) &&
            (parseFloat(sph) != -14.00 || parseFloat(cyl) >= -4.00) &&
            (parseFloat(sph) != -14.25 || parseFloat(cyl) >= -3.75) &&
            (parseFloat(sph) != -14.50 || parseFloat(cyl) >= -3.50) &&
            (parseFloat(sph) != -14.75 || parseFloat(cyl) >= -3.25) &&
            (parseFloat(sph) != -15.00 || parseFloat(cyl) >= -3.00) &&
            (parseFloat(sph) != -15.25 || parseFloat(cyl) >= -2.75) &&
            (parseFloat(sph) != -15.50 || parseFloat(cyl) >= -2.50) &&
            (parseFloat(sph) != -15.75 || parseFloat(cyl) >= -2.25) &&
            (parseFloat(sph) != -16.00 || parseFloat(cyl) >= -2.00) &&
            (parseFloat(sph) != -16.25 || parseFloat(cyl) >= -1.75) &&
            (parseFloat(sph) != -16.50 || parseFloat(cyl) >= -1.50) &&
            (parseFloat(sph) != -16.75 || parseFloat(cyl) >= -1.25) &&
            (parseFloat(sph) != -17.00 || parseFloat(cyl) >= -1.00) &&
            (parseFloat(sph) != -17.25 || parseFloat(cyl) >= -0.75) &&
            (parseFloat(sph) != -17.50 || parseFloat(cyl) >= -0.50) &&
            (parseFloat(sph) != -17.75 || parseFloat(cyl) >= -0.25) &&
            (parseFloat(sph) != -18.00 || parseFloat(cyl) >= -0.00)
        }
      }

      if (this.SVType == '1.61') {
        if (this.Base == 3) {
          isBlue =
          (parseFloat(sph) != -4.00 || parseFloat(cyl) >= -0.00) &&
          (parseFloat(sph) != -3.75 || parseFloat(cyl) >= -0.25) &&
          (parseFloat(sph) != -3.50 || parseFloat(cyl) >= -0.50) &&
          (parseFloat(sph) != -3.25 || parseFloat(cyl) >= -0.75) &&
          (parseFloat(sph) != -3.00 || parseFloat(cyl) >= -1.00) &&
          (parseFloat(sph) != -2.75 || parseFloat(cyl) >= -1.25) &&
          (parseFloat(sph) != -2.50 || parseFloat(cyl) >= -1.50) &&
          (parseFloat(sph) != -2.25 || parseFloat(cyl) >= -1.75) &&
          (parseFloat(sph) != -2.00 || parseFloat(cyl) >= -2.00) &&
          (parseFloat(sph) != -1.75 || parseFloat(cyl) >= -2.25) &&
          (parseFloat(sph) != -1.50 || parseFloat(cyl) >= -2.50) &&
          (parseFloat(sph) != -1.25 || parseFloat(cyl) >= -2.75) &&
          (parseFloat(sph) != -1.00 || parseFloat(cyl) >= -3.00) &&
          (parseFloat(sph) != -0.75 || parseFloat(cyl) >= -3.25) &&
          (parseFloat(sph) != -0.50 || parseFloat(cyl) >= -3.50) &&
          (parseFloat(sph) != -0.25 || parseFloat(cyl) >= -3.75) &&
          (parseFloat(sph) != -0.00 || parseFloat(cyl) >= -4.00)
        }
        if (this.Base == 2) {
          isBlue =
            (parseFloat(sph) != -0.00 || parseFloat(cyl) <= -4.25) &&
            (parseFloat(sph) != -0.25 || parseFloat(cyl) <= -4.00) &&
            (parseFloat(sph) != -0.25 || parseFloat(cyl) >= -5.75) &&
            (parseFloat(sph) != -0.50 || parseFloat(cyl) <= -3.75) &&
            (parseFloat(sph) != -0.50 || parseFloat(cyl) >= -5.50)  &&
            (parseFloat(sph) != -0.75 || parseFloat(cyl) <= -3.50) &&
            (parseFloat(sph) != -0.75 || parseFloat(cyl) >= -5.25) &&
            (parseFloat(sph) != -1.00 || parseFloat(cyl) <= -3.25) &&
            (parseFloat(sph) != -1.00 || parseFloat(cyl) >= -5.00) &&
            (parseFloat(sph) != -1.25 || parseFloat(cyl) <= -3.00) &&
            (parseFloat(sph) != -1.25 || parseFloat(cyl) >= -4.75) &&
            (parseFloat(sph) != -1.50 || parseFloat(cyl) <= -2.75) &&
            (parseFloat(sph) != -1.50 || parseFloat(cyl) >= -4.50) &&
            (parseFloat(sph) != -1.75 || parseFloat(cyl) <= -2.50) &&
            (parseFloat(sph) != -1.75 || parseFloat(cyl) >= -4.25) &&
            (parseFloat(sph) != -2.00 || parseFloat(cyl) <= -2.25) &&
            (parseFloat(sph) != -2.00 || parseFloat(cyl) >= -4.00) &&
            (parseFloat(sph) != -2.25 || parseFloat(cyl) <= -2.00) &&
            (parseFloat(sph) != -2.25 || parseFloat(cyl) >= -3.75) &&
            (parseFloat(sph) != -2.50 || parseFloat(cyl) <= -1.75) &&
            (parseFloat(sph) != -2.50 || parseFloat(cyl) >= -3.50) &&
            (parseFloat(sph) != -2.75 || parseFloat(cyl) <= -1.50) &&
            (parseFloat(sph) != -2.75 || parseFloat(cyl) >= -3.25) &&
            (parseFloat(sph) != -3.00 || parseFloat(cyl) <= -1.25) &&
            (parseFloat(sph) != -3.00 || parseFloat(cyl) >= -3.00) &&
            (parseFloat(sph) != -3.25 || parseFloat(cyl) <= -1.00) &&
            (parseFloat(sph) != -3.25 || parseFloat(cyl) >= -2.75) &&
            (parseFloat(sph) != -3.50 || parseFloat(cyl) <= -0.75) &&
            (parseFloat(sph) != -3.50 || parseFloat(cyl) >= -2.50) &&
            (parseFloat(sph) != -3.75 || parseFloat(cyl) <= -0.50) &&
            (parseFloat(sph) != -3.75 || parseFloat(cyl) >= -2.25) &&
            (parseFloat(sph) != -4.00 || parseFloat(cyl) <= -0.25) &&
            (parseFloat(sph) != -4.00 || parseFloat(cyl) >= -2.00) &&
            (parseFloat(sph) != -4.25 || parseFloat(cyl) >= -1.75) &&
            (parseFloat(sph) != -4.50 || parseFloat(cyl) >= -1.50) &&
            (parseFloat(sph) != -4.75 || parseFloat(cyl) >= -1.25) &&
            (parseFloat(sph) != -5.00 || parseFloat(cyl) >= -1.00) &&
            (parseFloat(sph) != -5.25 || parseFloat(cyl) >= -0.75) &&
            (parseFloat(sph) != -5.50 || parseFloat(cyl) >= -0.50) &&
            (parseFloat(sph) != -5.75 || parseFloat(cyl) >= -0.25) &&
            (parseFloat(sph) != -6.00 || parseFloat(cyl) >= -0.00)
        }
        if (this.Base == 1) {
          isBlue =
            (parseFloat(sph) != -0.25 || parseFloat(cyl) <= -6.00) &&
            (parseFloat(sph) != -0.50 || parseFloat(cyl) <= -5.75) &&
            (parseFloat(sph) != -0.75 || parseFloat(cyl) <= -5.50) &&
            (parseFloat(sph) != -1.00 || parseFloat(cyl) <= -5.25) &&
            (parseFloat(sph) != -1.25 || parseFloat(cyl) <= -5.00) &&
            (parseFloat(sph) != -1.50 || parseFloat(cyl) <= -4.75) &&
            (parseFloat(sph) != -1.75 || parseFloat(cyl) <= -4.50) &&
            (parseFloat(sph) != -2.00 || parseFloat(cyl) <= -4.25) &&

            (parseFloat(sph) != -2.25 || parseFloat(cyl) <= -4.00) &&
            (parseFloat(sph) != -2.25 || parseFloat(cyl) >= -5.75) &&
            (parseFloat(sph) != -2.50 || parseFloat(cyl) <= -3.75) &&
            (parseFloat(sph) != -2.50 || parseFloat(cyl) >= -5.50) &&
            (parseFloat(sph) != -2.75 || parseFloat(cyl) <= -3.50) &&
            (parseFloat(sph) != -2.75 || parseFloat(cyl) >= -5.25) &&
            (parseFloat(sph) != -3.00 || parseFloat(cyl) <= -3.25) &&
            (parseFloat(sph) != -3.00 || parseFloat(cyl) >= -5.00) &&
            (parseFloat(sph) != -3.25 || parseFloat(cyl) <= -3.00) &&
            (parseFloat(sph) != -3.25 || parseFloat(cyl) >= -4.75) &&
            (parseFloat(sph) != -3.50 || parseFloat(cyl) <= -2.75) &&
            (parseFloat(sph) != -3.50 || parseFloat(cyl) >= -4.50) &&
            (parseFloat(sph) != -3.75 || parseFloat(cyl) <= -2.50) &&
            (parseFloat(sph) != -3.75 || parseFloat(cyl) >= -4.25) &&
            (parseFloat(sph) != -4.00 || parseFloat(cyl) <= -2.25) &&
            (parseFloat(sph) != -4.00 || parseFloat(cyl) >= -4.00) &&
            (parseFloat(sph) != -4.25 || parseFloat(cyl) <= -2.00) &&
            (parseFloat(sph) != -4.25 || parseFloat(cyl) >= -3.75) &&
            (parseFloat(sph) != -4.50 || parseFloat(cyl) <= -1.75) &&
            (parseFloat(sph) != -4.50 || parseFloat(cyl) >= -3.50) &&
            (parseFloat(sph) != -4.75 || parseFloat(cyl) <= -1.50) &&
            (parseFloat(sph) != -4.75 || parseFloat(cyl) >= -3.25) &&
            (parseFloat(sph) != -5.00 || parseFloat(cyl) <= -1.25) &&
            (parseFloat(sph) != -5.00 || parseFloat(cyl) >= -3.00) &&
            (parseFloat(sph) != -5.25 || parseFloat(cyl) <= -1.00) &&
            (parseFloat(sph) != -5.25 || parseFloat(cyl) >= -2.75) &&
            (parseFloat(sph) != -5.50 || parseFloat(cyl) <= -0.75) &&
            (parseFloat(sph) != -5.50 || parseFloat(cyl) >= -2.50) &&
            (parseFloat(sph) != -5.75 || parseFloat(cyl) <= -0.50) &&
            (parseFloat(sph) != -5.75 || parseFloat(cyl) >= -2.25) &&
            (parseFloat(sph) != -6.00 || parseFloat(cyl) <= -0.25) &&
            (parseFloat(sph) != -6.00 || parseFloat(cyl) >= -2.00) &&

            (parseFloat(sph) != -6.25 || parseFloat(cyl) >= -1.75) &&
            (parseFloat(sph) != -6.50 || parseFloat(cyl) >= -1.50) &&
            (parseFloat(sph) != -6.75 || parseFloat(cyl) >= -1.25) &&
            (parseFloat(sph) != -7.00 || parseFloat(cyl) >= -1.00) &&
            (parseFloat(sph) != -7.25 || parseFloat(cyl) >= -0.75) &&
            (parseFloat(sph) != -7.50 || parseFloat(cyl) >= -0.50) &&
            (parseFloat(sph) != -7.75 || parseFloat(cyl) >= -0.25) &&
            (parseFloat(sph) != -8.00 || parseFloat(cyl) >= -0.00) 
        }
        if (this.Base == 0.5) {
          isBlue =
            (parseFloat(sph) != -2.25 || parseFloat(cyl) <= -6.00) &&
            (parseFloat(sph) != -2.50 || parseFloat(cyl) <= -5.75) &&
            (parseFloat(sph) != -2.75 || parseFloat(cyl) <= -5.50) &&
            (parseFloat(sph) != -3.00 || parseFloat(cyl) <= -5.25) &&
            (parseFloat(sph) != -3.25 || parseFloat(cyl) <= -5.00) &&

            (parseFloat(sph) != -3.50 || parseFloat(cyl) <= -4.75) &&
            (parseFloat(sph) != -3.75 || parseFloat(cyl) <= -4.50) &&
            (parseFloat(sph) != -4.00 || parseFloat(cyl) <= -4.25) &&
            (parseFloat(sph) != -4.25 || parseFloat(cyl) <= -4.00) &&

            (parseFloat(sph) != -4.50 || parseFloat(cyl) <= -3.75) &&
            (parseFloat(sph) != -4.75 || parseFloat(cyl) <= -3.50) &&
            (parseFloat(sph) != -5.00 || parseFloat(cyl) <= -3.25) &&
            (parseFloat(sph) != -5.25 || parseFloat(cyl) <= -3.00) &&

            (parseFloat(sph) != -5.50 || parseFloat(cyl) <= -2.75) &&
            (parseFloat(sph) != -5.75 || parseFloat(cyl) <= -2.50) &&
            (parseFloat(sph) != -6.00 || parseFloat(cyl) <= -2.25) &&
            (parseFloat(sph) != -6.25 || parseFloat(cyl) <= -2.00) &&

            (parseFloat(sph) != -6.50 || parseFloat(cyl) <= -1.75) &&
            (parseFloat(sph) != -6.75 || parseFloat(cyl) <= -1.50) &&
            (parseFloat(sph) != -7.00 || parseFloat(cyl) <= -1.25) &&
            (parseFloat(sph) != -7.25 || parseFloat(cyl) <= -1.00) &&

            (parseFloat(sph) != -7.50 || parseFloat(cyl) <= -0.75) &&
            (parseFloat(sph) != -7.75 || parseFloat(cyl) <= -0.50) &&
            (parseFloat(sph) != -8.00 || parseFloat(cyl) <= -0.25) &&
            (parseFloat(sph) != -8.25 || parseFloat(cyl) <= -0.00) &&

            (parseFloat(sph) != -13.25 || parseFloat(cyl) >= -5.75) &&
            (parseFloat(sph) != -13.50 || parseFloat(cyl) >= -5.50) &&
            (parseFloat(sph) != -13.75 || parseFloat(cyl) >= -5.25) &&
            (parseFloat(sph) != -14.00 || parseFloat(cyl) >= -5.00) &&
            (parseFloat(sph) != -14.25 || parseFloat(cyl) >= -4.75) &&
            (parseFloat(sph) != -14.50 || parseFloat(cyl) >= -4.50) &&
            (parseFloat(sph) != -14.75 || parseFloat(cyl) >= -4.25) &&
            (parseFloat(sph) != -15.00 || parseFloat(cyl) >= -4.00) &&
            (parseFloat(sph) != -15.25 || parseFloat(cyl) >= -3.75) &&
            (parseFloat(sph) != -15.50 || parseFloat(cyl) >= -3.50) &&
            (parseFloat(sph) != -15.75 || parseFloat(cyl) >= -3.25) &&
            (parseFloat(sph) != -16.00 || parseFloat(cyl) >= -3.00) &&
            (parseFloat(sph) != -16.25 || parseFloat(cyl) >= -2.75) &&
            (parseFloat(sph) != -16.50 || parseFloat(cyl) >= -2.50) &&
            (parseFloat(sph) != -16.75 || parseFloat(cyl) >= -2.25) &&
            (parseFloat(sph) != -17.00 || parseFloat(cyl) >= -2.00) &&
            (parseFloat(sph) != -17.25 || parseFloat(cyl) >= -1.75) &&
            (parseFloat(sph) != -17.50 || parseFloat(cyl) >= -1.50) &&
            (parseFloat(sph) != -17.75 || parseFloat(cyl) >= -1.25) &&
            (parseFloat(sph) != -18.00 || parseFloat(cyl) >= -1.00) &&
            (parseFloat(sph) != -18.25 || parseFloat(cyl) >= -0.75) &&
            (parseFloat(sph) != -18.50 || parseFloat(cyl) >= -0.50) &&
            (parseFloat(sph) != -18.75 || parseFloat(cyl) >= -0.25) &&
            (parseFloat(sph) != -19.00 || parseFloat(cyl) >= -0.00)
        }
      }

      if (this.SVType == '1.499') {
        if (this.Base == 4) {
          isBlue =         
          (parseFloat(sph) != 0.00  || parseFloat(cyl) >= -3.50) &&
          (parseFloat(sph) != -0.25 || parseFloat(cyl) >= -3.25) &&
          (parseFloat(sph) != -0.50 || parseFloat(cyl) >= -3.00) &&
          (parseFloat(sph) != -0.75 || parseFloat(cyl) >= -2.75) &&
          (parseFloat(sph) != -1.00 || parseFloat(cyl) >= -2.50) &&
          (parseFloat(sph) != -1.25 || parseFloat(cyl) >= -2.25) &&
          (parseFloat(sph) != -1.50 || parseFloat(cyl) >= -2.00) &&
          (parseFloat(sph) != -1.75 || parseFloat(cyl) >= -1.75) &&
          (parseFloat(sph) != -2.00 || parseFloat(cyl) >= -1.50) &&
          (parseFloat(sph) != -2.25 || parseFloat(cyl) >= -1.25) &&
          (parseFloat(sph) != -2.50 || parseFloat(cyl) >= -1.00) &&
          (parseFloat(sph) != -2.75 || parseFloat(cyl) >= -0.75) &&
          (parseFloat(sph) != -3.00 || parseFloat(cyl) >= -0.50) &&
          (parseFloat(sph) != -3.25 || parseFloat(cyl) >= -0.25) &&
          (parseFloat(sph) != -3.50 || parseFloat(cyl) >= -0.00) 
        }
        if (this.Base == 2) {
          isBlue =
            (parseFloat(sph) != -0.00 || parseFloat(cyl) <= -3.75) &&
            (parseFloat(sph) != -0.25 || parseFloat(cyl) <= -3.50) &&
            (parseFloat(sph) != -0.25 || parseFloat(cyl) >= -5.75) &&
            (parseFloat(sph) != -0.50 || parseFloat(cyl) <= -3.25) &&
            (parseFloat(sph) != -0.50 || parseFloat(cyl) >= -5.50) &&
            (parseFloat(sph) != -0.75 || parseFloat(cyl) <= -3.00) &&
            (parseFloat(sph) != -0.75 || parseFloat(cyl) >= -5.25) &&
            (parseFloat(sph) != -1.00 || parseFloat(cyl) <= -2.75) &&
            (parseFloat(sph) != -1.00 || parseFloat(cyl) >= -5.00) &&
            (parseFloat(sph) != -1.25 || parseFloat(cyl) <= -2.50) &&
            (parseFloat(sph) != -1.25 || parseFloat(cyl) >= -4.75) &&
            (parseFloat(sph) != -1.50 || parseFloat(cyl) <= -2.25) &&
            (parseFloat(sph) != -1.50 || parseFloat(cyl) >= -4.50) &&
            (parseFloat(sph) != -1.75 || parseFloat(cyl) <= -2.00) &&
            (parseFloat(sph) != -1.75 || parseFloat(cyl) >= -4.25) &&
            (parseFloat(sph) != -2.00 || parseFloat(cyl) <= -1.75) &&
            (parseFloat(sph) != -2.00 || parseFloat(cyl) >= -4.00) &&
            (parseFloat(sph) != -2.25 || parseFloat(cyl) <= -1.50) &&
            (parseFloat(sph) != -2.25 || parseFloat(cyl) >= -3.75) &&
            (parseFloat(sph) != -2.50 || parseFloat(cyl) <= -1.25) &&
            (parseFloat(sph) != -2.50 || parseFloat(cyl) >= -3.50) &&
            (parseFloat(sph) != -2.75 || parseFloat(cyl) <= -1.00) &&
            (parseFloat(sph) != -2.75 || parseFloat(cyl) >= -3.25) &&
            (parseFloat(sph) != -3.00 || parseFloat(cyl) <= -0.75) &&
            (parseFloat(sph) != -3.00 || parseFloat(cyl) >= -3.00) &&
            (parseFloat(sph) != -3.25 || parseFloat(cyl) <= -0.50) &&
            (parseFloat(sph) != -3.25 || parseFloat(cyl) >= -2.75) &&
            (parseFloat(sph) != -3.50 || parseFloat(cyl) <= -0.25) &&
            (parseFloat(sph) != -3.50 || parseFloat(cyl) >= -2.50) &&
            (parseFloat(sph) != -3.75 || parseFloat(cyl) <= -0.00) &&
            (parseFloat(sph) != -3.75 || parseFloat(cyl) >= -2.25) &&
            (parseFloat(sph) != -4.00 || parseFloat(cyl) >= -2.00) &&
            (parseFloat(sph) != -4.25 || parseFloat(cyl) >= -1.75) &&
            (parseFloat(sph) != -4.50 || parseFloat(cyl) >= -1.50) &&
            (parseFloat(sph) != -4.75 || parseFloat(cyl) >= -1.25) &&
            (parseFloat(sph) != -5.00 || parseFloat(cyl) >= -1.00) &&
            (parseFloat(sph) != -5.25 || parseFloat(cyl) >= -0.75) &&
            (parseFloat(sph) != -5.50 || parseFloat(cyl) >= -0.50) &&
            (parseFloat(sph) != -5.75 || parseFloat(cyl) >= -0.25) &&
            (parseFloat(sph) != -6.00 || parseFloat(cyl) >= -0.00)
        }
        if (this.Base == 0){
          isBlue =
            (parseFloat(sph) != -0.25 || parseFloat(cyl) <= -6.00) &&
            (parseFloat(sph) != -0.50 || parseFloat(cyl) <= -5.75) &&
            (parseFloat(sph) != -0.75 || parseFloat(cyl) <= -5.50) &&
            (parseFloat(sph) != -1.00 || parseFloat(cyl) <= -5.25) &&
            (parseFloat(sph) != -1.25 || parseFloat(cyl) <= -5.00) &&
            (parseFloat(sph) != -1.50 || parseFloat(cyl) <= -4.75) &&
            (parseFloat(sph) != -1.75 || parseFloat(cyl) <= -4.50) &&
            (parseFloat(sph) != -2.00 || parseFloat(cyl) <= -4.25) &&
            (parseFloat(sph) != -2.25 || parseFloat(cyl) <= -4.00) &&
            (parseFloat(sph) != -2.50 || parseFloat(cyl) <= -3.75) &&
            (parseFloat(sph) != -2.75 || parseFloat(cyl) <= -3.50) &&
            (parseFloat(sph) != -3.00 || parseFloat(cyl) <= -3.25) &&
            (parseFloat(sph) != -3.25 || parseFloat(cyl) <= -3.00) &&
            (parseFloat(sph) != -3.50 || parseFloat(cyl) <= -2.75) &&
            (parseFloat(sph) != -3.75 || parseFloat(cyl) <= -2.50) &&
            (parseFloat(sph) != -4.00 || parseFloat(cyl) <= -2.25) &&
            (parseFloat(sph) != -4.25 || parseFloat(cyl) <= -2.00) &&
            (parseFloat(sph) != -4.50 || parseFloat(cyl) <= -1.75) &&
            (parseFloat(sph) != -4.75 || parseFloat(cyl) <= -1.50) &&
            (parseFloat(sph) != -5.00 || parseFloat(cyl) <= -1.25) &&
            (parseFloat(sph) != -5.25 || parseFloat(cyl) <= -1.00) &&
            (parseFloat(sph) != -5.50 || parseFloat(cyl) <= -0.75) &&
            (parseFloat(sph) != -5.75 || parseFloat(cyl) <= -0.50) &&
            (parseFloat(sph) != -6.00 || parseFloat(cyl) <= -0.25) &&
            (parseFloat(sph) != -6.25 || parseFloat(cyl) <= -0.00) &&

            (parseFloat(sph) != -10.25 || parseFloat(cyl) >= -5.75) &&
            (parseFloat(sph) != -10.50 || parseFloat(cyl) >= -5.50) &&
            (parseFloat(sph) != -10.75 || parseFloat(cyl) >= -5.25) &&
            (parseFloat(sph) != -11.00 || parseFloat(cyl) >= -5.00) &&
            (parseFloat(sph) != -11.25 || parseFloat(cyl) >= -4.75) &&
            (parseFloat(sph) != -11.50 || parseFloat(cyl) >= -4.50) &&
            (parseFloat(sph) != -11.75 || parseFloat(cyl) >= -4.25) &&
            (parseFloat(sph) != -12.00 || parseFloat(cyl) >= -4.00) &&
            (parseFloat(sph) != -12.25 || parseFloat(cyl) >= -3.75) &&
            (parseFloat(sph) != -12.50 || parseFloat(cyl) >= -3.50) &&
            (parseFloat(sph) != -12.75 || parseFloat(cyl) >= -3.25) &&
            (parseFloat(sph) != -13.00 || parseFloat(cyl) >= -3.00) &&
            (parseFloat(sph) != -13.25 || parseFloat(cyl) >= -2.75) &&
            (parseFloat(sph) != -13.50 || parseFloat(cyl) >= -2.50) &&
            (parseFloat(sph) != -13.75 || parseFloat(cyl) >= -2.25) &&
            (parseFloat(sph) != -14.00 || parseFloat(cyl) >= -2.00) &&
            (parseFloat(sph) != -14.25 || parseFloat(cyl) >= -1.75) &&
            (parseFloat(sph) != -14.50 || parseFloat(cyl) >= -1.50) &&
            (parseFloat(sph) != -14.75 || parseFloat(cyl) >= -1.25) &&
            (parseFloat(sph) != -15.00 || parseFloat(cyl) >= -1.00) &&
            (parseFloat(sph) != -15.25 || parseFloat(cyl) >= -0.75) &&
            (parseFloat(sph) != -15.50 || parseFloat(cyl) >= -0.50) &&
            (parseFloat(sph) != -15.75 || parseFloat(cyl) >= -0.25) &&
            (parseFloat(sph) != -16.00 || parseFloat(cyl) >= -0.00) 
        }
      }
        row[cyl] = {
          value: 0,
          isBlue: isBlue, // Mark cell as blue or not
        };
      });
      grid.push(row);
    });
    return grid;
  }

  get totalQtyL(): number {
    return this.dataSourceL.reduce((sum, row) => {
      return sum + this.cylValuesL.reduce((sphSum, sph) => {
        return sphSum + parseInt(row[sph].value, 10);
      }, 0);
    }, 0);
  }

  purchaseL(mode: any) {
    this.lenslistL.forEach((p: any) => {
      if (mode === 'save') {

        let ASIX = '', ADD = '', EYE = '', base = '';

        if (this.lensL.axis != '') {
          ASIX = '/' + 'Axis' + ' ' + this.lensL.axis
        }
        if (this.lensL.addtion != '') {
          ADD = '/' + 'Add' + ' ' + this.lensL.addtion
        }
        if (this.lensL.eye != '') {
          EYE = '/' + this.lensL.eye
        }

        p.productname = p.productname + ASIX + ADD + EYE
        p.purchasePrice = this.lensL.purchasePrice
        p.GSTtype = this.lensL.GSTtype
        p.GSTPercent = this.lensL.GSTPercent
        p.retailPrice = this.lensL.retailPrice
        p.wholesalePrice = this.lensL.wholesalePrice
      }
    })

    this.lenslistL.forEach((is: any) => {
      is.ID = null,
        is.PurchaseID = null,
        is.CompanyID = null,
        is.ProductTypeName = this.item.ProductTypeName
      is.ProductTypeID = this.item.ProductTypeID,
        is.ProductName = is.productname
      is.Quantity = is.quantity
      is.UnitPrice = is.purchasePrice
      is.SubTotal = is.Quantity * is.UnitPrice
      is.DiscountPercentage = 0
      is.DiscountAmount = 0
      is.GSTPercentage = is.GSTPercent
      is.GSTType = is.GSTtype
      is.GSTAmount = (+is.UnitPrice * +is.Quantity - is.DiscountAmount) * +is.GSTPercentage / 100;
      is.TotalAmount = +is.SubTotal + +is.GSTAmount;
      is.RetailPrice = is.retailPrice
      is.WholeSalePrice = is.wholesalePrice
      is.BrandType = 0
      is.Multiple = false,
        is.Ledger = false
      is.WholeSale = this.item.WholeSale,
        is.BaseBarCode = '',
        is.NewBarcode = '',
        is.Status = 1,
        is.ProductExpDate = '0000-00-00';

      let AddQty = 0;
      if (is.Quantity !== 0 && is.Quantity !== "0") {
        this.itemList.forEach((ele: any) => {
          if (ele.ID === null) {
            if (ele.ProductName === is.ProductName && Number(ele.RetailPrice) === Number(is.RetailPrice) && ele.UnitPrice === is.UnitPrice) {
              ele.Quantity = Number(ele.Quantity) + Number(is.Quantity);
              ele.SubTotal = Number(ele.SubTotal) + Number(is.SubTotal);
              ele.TotalAmount = Number(ele.TotalAmount) + Number(is.TotalAmount);
              ele.GSTAmount = Number(ele.GSTAmount) + Number(is.GSTAmount);
              ele.DiscountAmount = Number(ele.DiscountAmount) + Number(is.DiscountAmount);
              AddQty = 1;
            }
          }
        })
        if (AddQty === 0) {
          this.itemList.push(is)
        }
      }

      this.selectedPurchaseMaster.Quantity = +this.selectedPurchaseMaster.Quantity + +is.Quantity;
      this.selectedPurchaseMaster.SubTotal = (+this.selectedPurchaseMaster.SubTotal + +is.SubTotal).toFixed(2);
      this.selectedPurchaseMaster.DiscountAmount = (+this.selectedPurchaseMaster.DiscountAmount + +is.DiscountAmount).toFixed(2);
      this.selectedPurchaseMaster.GSTAmount = (+this.selectedPurchaseMaster.GSTAmount + +is.GSTAmount).toFixed(2);
      this.selectedPurchaseMaster.TotalAmount = (+this.selectedPurchaseMaster.TotalAmount + +is.TotalAmount).toFixed(2);
    })

    this.generateGridL()
    this.lensL = { productname: '', purchasePrice: 0, quantity: 0, GSTtype: 'None', GSTPercent: 0, retailPrice: 0, wholesalePrice: 0, axis: '', addtion: '', eye: '' }
    this.lenslistL = []
  }

  qtyAddL(sph: any, cyl: any, qty: number, lens: any) {
    this.item.ProductName = "";
    this.item.ProductTypeID = "";
    let SphPower = ''
    let CylPower = ''
    let base = ''
    let sv = ''

    if (sph !== "+0.00" && sph !== "-0.00") {
      SphPower = '/' + 'Sph' + ' ' + sph
    }

    if (cyl !== "+0.00" && cyl !== "-0.00") {
      CylPower = '/' + 'Cyl' + ' ' + cyl
    }

    if (this.Base != '') {
      base = '/Base ' + this.Base
    }
    if (this.SVType != '') {
      sv = '/' + this.SVType + ' Index' 
    }

    this.lensL.productname = sv + base + SphPower + CylPower
    this.lensL.quantity = qty;

    this.specList.forEach((element: any) => {
      this.prodList.forEach((elements: any) => {
        if (elements.Name === element.ProductName) {
          this.item.ProductTypeID = elements.ID
          this.item.ProductTypeName = elements.Name
        }
      });
      if (element.SelectedValue !== "") {
        this.item.ProductName = this.item.ProductName + element.SelectedValue + "/";
      }
      if (element.FieldType === "Date") {
        this.item.ProductExpDate = element.SelectedValue;
      }
    });
    this.item.ProductExpDate = this.item.ProductExpDate === '' ? "0000-00-00" : this.item.ProductExpDate;
    this.item.ProductTypeID = this.item.ProductTypeID
    this.item.ProductTypeName = this.item.ProductTypeName
    this.item.ProductName = this.item.ProductName.substring(0, this.item.ProductName.length - 1)

    this.lensL.productname = this.item.ProductName + this.lensL.productname
    // this.lenslist.unshift(this.lens);
    let existingProduct = this.lenslistL.find((c: any) => c.productname === this.lensL.productname);
    if (existingProduct) {
      existingProduct.quantity = this.lensL.quantity;
    } else {
      this.lenslistL.unshift(this.lensL);
      console.log(this.lenslistL);
    }
    this.lensL = { productname: '', purchasePrice: 0, quantity: 0, GSTtype: 'None', GSTPercent: 0, retailPrice: 0, wholesalePrice: 0, axis: '', addtion: '', eye: '' }
  }


}
