import { Component, HostListener, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { ProductService } from 'src/app/service/product.service';
import { Subscription, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { SupplierService } from 'src/app/service/supplier.service';
import { SupportService } from 'src/app/service/support.service';
import { CalculationService } from 'src/app/service/helpers/calculation.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { PurchaseService } from 'src/app/service/purchase.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FLAGS } from 'html2canvas/dist/types/dom/element-container';
import { HttpResponse } from '@angular/common/http';
import { BillService } from 'src/app/service/bill.service';
@Component({
  selector: 'app-purchase',
  templateUrl: './purchase.component.html',
  styleUrls: ['./purchase.component.css']
})
export class PurchaseComponent implements OnInit {
  env = environment;
  user = JSON.parse(localStorage.getItem('user') || '');
  company = JSON.parse(localStorage.getItem('company') || '');
  shop = JSON.parse(localStorage.getItem('shop') || '');
  companySetting = JSON.parse(localStorage.getItem('companysetting') || '');
  selectedShop: any = JSON.parse(localStorage.getItem('selectedShop') || '');
  permission = JSON.parse(localStorage.getItem('permission') || '[]');

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.altKey && event.key === 'a' || event.altKey && event.key === 'A'  ) {
       this.addItem();
       event.preventDefault();
    }
    if (event.altKey && event.key === 'c' || event.altKey && event.key === 'C'  ) {
       this.selectBarcode('all');
       event.preventDefault();
    }
    if (event.altKey && event.key === 'p' || event.altKey && event.key === 'P'  ) {
       this.barcodePrintAll();
       event.preventDefault();
    }
    if(this.id != 0){
      if (event.altKey && event.key === 'u' || event.altKey && event.key === 'U'  ) {
        this.updatedPurchase();
        event.preventDefault();
      }
    }
    if(this.id == 0){
      if (event.altKey && event.key === 's' || event.altKey && event.key === 'S'  ) {
        this.onSumbit();
        event.preventDefault();
     }
    }
  }

  editBtn = false;
  addDis: any
  GstTypeDis = false
  searchValue: any = '';
  checked = false;
  selectAllChecked = false
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
    public bill: BillService,
  ) {
    this.id = this.route.snapshot.params['id'];
  }

  selectedPurchaseMaster: any = {
    ID: null, SupplierID: null, SupplierName: null, CompanyID: null, GSTNo: null, ShopID: null, ShopName: null, PurchaseDate: null,
    PaymentStatus: null, InvoiceNo: null, Status: 1, CreatedBy: null, Quantity: 0, SubTotal: 0, DiscountAmount: 0,
    GSTAmount: 0, TotalAmount: 0, RoundOff: 0, preOrder: false,isGrid: false
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
  ngOnInit(): void {

    if(this.company.WholeSale === 'true' || this.shop[0].WholesaleBill === 'true'){
      this.item.WholeSale = true
      this.disabledWholeSale = true
    }else{
      this.item.WholeSale = false
    }

    if((this.company.WholeSale === 'true' && this.company.RetailPrice === 'true' ) || (this.shop[0].WholesaleBill === 'true' && this.shop[0].RetailBill === 'true')){
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
    // this.getProductList();
    // this.getdropdownSupplierlist();
    // this.getGSTList();
    this.chargelist();
     this.bill.productLists$.subscribe((list:any) => {
      this.prodList = list
    });
     this.bill.taxLists$.subscribe((list:any) => {
      this.gstList = list
    });
     this.bill.supplierList$.subscribe((list:any) => {
     this.supplierList = list.sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
    });
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
          this.prodList = res.data.sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
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
    }else{
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

// function removeFiveDigitsAndUnderscore(inputString) {
//     const regex = /^(\d{5})_/; // Regex to match 5 digits followed by underscore
//     const match = inputString.match(regex); // Check if the pattern exists
//     if (match) {
//         return inputString.replace(regex, ''); // Replace the matched pattern with an empty string
//     } else {
//         return inputString; // Return the original string if no match found
//     }
// }

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
          // if (element.SelectedValue !== "") {
          //   this.item.ProductName = this.item.ProductName + element.SelectedValue + "/";
          // }
          

          if (element.SelectedValue !== "") {
              let valueToAdd = element.SelectedValue;
              valueToAdd = valueToAdd.replace(/^\d+_/, "");
              this.item.ProductName = this.item.ProductName + valueToAdd + "/";
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
          if (ele.ID === this.charge.ChargeType) {
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
    const subs: Subscription = this.purchaseService.savePurchase(this.data).subscribe({
      next: (res: any) => {
        if (res.success) {
          if (res.data !== 0) {
            this.id = res.data;
            this.router.navigate(['/inventory/purchase', this.id]); 
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
    this.BarcodeData = data

  }

  BarcodeQty() {
    this.sp.show();
    this.BarcodeData.Quantity = Number(this.BarcodeQuantity)
    const subs: Subscription = this.purchaseService.PrintBarcode(this.BarcodeData).subscribe({
      next: (res: any) => {
        if (res != '') {
          this.getPurchaseById()
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
            ele.SupplierID = this.selectedPurchaseMaster.SupplierID
            tempItem.push({ ...ele, Quantity: 1 });
             // Copy 'ele' using the spread operator
          }
        }else{
            alert('This Page Refresh.')
        }
      });

      const subs: Subscription = this.purchaseService.AllPrintBarcode(tempItem).subscribe({
        next: (res: any) => {
          if (res != '') { 
            this.barcodeListt = [];
            this.selectBarcode('all', false);
            this.itemList.forEach((e: any) =>{
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

}
