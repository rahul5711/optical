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
import Swal from 'sweetalert2';
import * as saveAs from 'file-saver';


@Component({
  selector: 'app-inventory-report',
  templateUrl: './inventory-report.component.html',
  styleUrls: ['./inventory-report.component.css']
})

export class InventoryReportComponent implements OnInit {

  FilterTypes: any = 'Date'
  FilterTypes1: any = 'Date'
  Productsearch :any = '';
  env = environment;
  company: any = JSON.parse(localStorage.getItem('company') || '');
  user: any = JSON.parse(localStorage.getItem('user') || '');
  shop: any = JSON.parse(localStorage.getItem('shop') || '');
  selectedShop: any = JSON.parse(localStorage.getItem('selectedShop') || '');
  permission = JSON.parse(localStorage.getItem('permission') || '[]');
  companySetting: any = JSON.parse(localStorage.getItem('companysetting') || '[]');

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

  UpdatePriceEdit = false;

  myControl = new FormControl('All');
  filteredOptions: any;
  searchValue: any = '';
  supplierList: any;
  shopList: any;
  selectsShop: any;
  inventoryList: any = []
  selectedProduct: any;
  prodList: any;
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
  gstdetails: any
  TtlR: any = 0
  TtlW: any = 0

  ProductExpiryList: any
  specList1: any
  ExpirytotalQty: any
  ExpirytotalDiscount: any
  ExpirytotalUnitPrice: any
  ExpirytotalGstAmount: any
  ExpirytotalAmount: any
  gstExpirys: any
  todaydate: any;

  QtyStockList: any
  AmtStockList: any

  OpeningStock: any;
  AddPurchase: any;
  DeletePurchase: any;
  AddSale: any;
  DeleteSale: any;
  OtherDeleteStock: any;
  InitiateTransfer: any;
  CancelTransfer: any;
  AcceptTransfer: any;
  ClosingStock: any;

  AmtOpeningStock: any;
  AmtAddPurchase: any;
  AmtDeletePurchase: any;
  AmtAddSale: any;
  AmtDeleteSale: any;
  AmtOtherDeleteStock: any;
  AmtInitiateTransfer: any;
  AmtCancelTransfer: any;
  AmtAcceptTransfer: any;
  AmtClosingStock: any;
  lastDayOfMonth: any
  lastDayOfMonth1: any
  inventory: any = {
    FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, SupplierID: 0, Barcode: '', CurrentStatus: 'Available', PaymentStatus: 0, ProductCategory: 0, ProductName: '', GSTType: 0, GSTPercentage: 0, StringProductName: ''
  };

  data: any = {
    FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), SupplierID: 0, ShopID: 0,
  };

  ProductExpiry: any = {
    FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, SupplierID: 0,
    PaymentStatus: 0, ProductCategory: 0, ProductName: '', GSTType: 0, GSTPercentage: 0
  };

  QtyStock: any = {
    FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0,
  }

  AmtStock: any = {
    FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0,
  }
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

  columnVisibility: any = {
    SNo: true,
    InvoiceNo: true,
    InvoiceDate: true,
    CurrentShop: true,
    Supplier: true,
    ProductCategory: true,
    ProductName: true,
    Status: true,
    Barcode: true,
    Quantity: true,
    UnitPrice: true,
    Discount: true,
    SubTotal: true,
    TAXType: true,
    TAX: true,
    TAXAmount: true,
    GrandTotal: true,
    RetailPrice: true,
    RetailTotal: true,
    WholeSalePrice: true,
    WholeSaleTotal: true,
  };

  columnVisibility1: any = {
    SNo: true,
    InvoiceNo: true,
    InvoiceDate: true,
    ProductCategory: true,
    ProductName: true,
    CurrentShop: true,
    Supplier: true,
    Quantity: true,
    UnitPrice: true,
    Discount: true,
    SubTotal: true,
    TAX: true,
    TAXAmount: true,
    TAXType: true,
    GrandTotal: true,
    PaymentStatus: true,
    RetailPrice: true,
    WholeSalePrice: true,
    ProductExpiryDate: true,
  };
  temp:any = [];
  checked = false;
  selectAllChecked = false;
  barcodeListt: any = [];

  ngOnInit(): void {
    this.permission.forEach((element: any) => {
      if (element.ModuleName === 'InventoryReport') {
        this.viewInventoryReport = element.View;
        this.addInventoryReport = element.Add;
        this.editInventoryReport = element.Edit;
        this.deleteInventoryReport = element.Delete;
      } else if (element.ModuleName === 'ProductSummaryReport') {
        this.viewProductSummaryReport = element.View;
        this.addProductSummaryReport = element.Add;
        this.editProductSummaryReport = element.Edit;
        this.deleteProductSummaryReport = element.Delete;
      } else if (element.ModuleName === 'PurchaseProductExpiryReport') {
        this.viewPurchaseProductExpiryReport = element.View;
        this.addPurchaseProductExpiryReport = element.Add;
        this.editPurchaseProductExpiryReport = element.Edit;
        this.deletePurchaseProductExpiryReport = element.Delete;
      }
    });

    if (this.user.UserGroup === 'Employee') {
      this.shopList = this.shop;
      this.inventory.ShopID = this.shopList[0].ShopID
      this.data.ShopID = this.shopList[0].ShopID
      this.ProductExpiry.ShopID = this.shopList[0].ShopID
    } else {
      this.dropdownShoplist()
    }

    // this.dropdownSupplierlist();
    this.getProductList();
    this.getGSTList();
    this.inventory.FromDate = moment().format('YYYY-MM-DD');
    this.inventory.ToDate = moment().format('YYYY-MM-DD');
    // this.getInventory()

  }

  dropdownShoplist() {
    this.sp.show()
    const subs: Subscription = this.ss.dropdownShoplist('').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.shopList = res.data
          let shop = res.data
          this.selectsShop = shop.filter((s: any) => s.ID === Number(this.selectedShop[0]));
          this.selectsShop = '/ ' + this.selectsShop[0].Name + ' (' + this.selectsShop[0].AreaName + ')'
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  dropdownSupplierlist() {
    this.sp.show()
    const subs: Subscription = this.sup.dropdownSupplierlist('').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.supplierList = res.data
        } else {
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
    if (this.inventory.ProductCategory !== 0) {
      this.prodList.forEach((element: any) => {
        if (element.ID === this.inventory.ProductCategory) {
          this.selectedProduct = element.Name;
        }
      })
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
    else {
      this.specList = [];
      this.inventory.ProductName = '';
      this.inventory.ProductCategory = 0;
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

  getGSTList() {
    const subs: Subscription = this.supps.getList('TaxType').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.gstList = res.data
        } else {
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

  getInventory() {
    this.sp.show()
    let Parem = '';
    this.TtlR = 0
    this.TtlW = 0

    if (this.inventory.FromDate !== '' && this.inventory.FromDate !== null) {
      let FromDate = moment(this.inventory.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and  DATE_FORMAT(purchasemasternew.PurchaseDate, "%Y-%m-%d")  between ' + `'${FromDate}'`;
    }

    if (this.inventory.ToDate !== '' && this.inventory.ToDate !== null) {
      let ToDate = moment(this.inventory.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'`;
    }

    if (this.inventory.SupplierID !== 0) {
      Parem = Parem + ' and purchasemasternew.SupplierID = ' + this.inventory.SupplierID;
    }

    if (this.inventory.ShopID != 0) {
      Parem = Parem + ' and barcodemasternew.ShopID IN ' + `(${this.inventory.ShopID})`;
    }

    if (this.inventory.Barcode !== '') {
      Parem = Parem + ' and barcodemasternew.Barcode Like ' + '"' + this.inventory.Barcode + '%"';
    }

    // if (this.inventory.StringProductName !== '' ) {
    //   Parem = Parem + ' and purchasedetailnew.ProductName LIKE ' + "'" + this.inventory.StringProductName + "%'"; }

    if (this.inventory.CurrentStatus !== 0) {
      Parem = Parem + ' and barcodemasternew.CurrentStatus = ' + '"' + this.inventory.CurrentStatus + '"';
    }

    if (this.inventory.GSTPercentage !== 0) {
      Parem = Parem + ' and purchasedetailnew.GSTPercentage = ' + `'${this.inventory.GSTPercentage}'`;
    }

    if (this.inventory.GSTType !== 0) {
      Parem = Parem + ' and purchasedetailnew.GSTType = ' + `'${this.inventory.GSTType}'`;
    }

    if (this.inventory.ProductCategory !== 0) {
      Parem = Parem + ' and purchasedetailnew.ProductTypeID = ' + this.inventory.ProductCategory;
      this.filter();
    }

    if (this.inventory.ProductName !== '') {
      Parem = Parem + ' and purchasedetailnew.ProductName Like ' + "'" + this.inventory.ProductName.trim() + "%'";
    }


    const subs: Subscription = this.purchaseService.getProductInventoryReport(Parem,this.Productsearch).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.as.successToast(res.message)
          this.inventoryList = res.data
          this.inventoryList.forEach((element: any) => {
            this.TtlR = + this.TtlR + element.RetailPrice * element.Count
            this.TtlW = + this.TtlW + element.WholeSalePrice * element.Count
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
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }
  getInventoryExport() {
    this.sp.show()
    let Parem = '';
    this.TtlR = 0
    this.TtlW = 0

    if (this.inventory.FromDate !== '' && this.inventory.FromDate !== null) {
      let FromDate = moment(this.inventory.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and  DATE_FORMAT(purchasemasternew.PurchaseDate, "%Y-%m-%d")  between ' + `'${FromDate}'`;
    }

    if (this.inventory.ToDate !== '' && this.inventory.ToDate !== null) {
      let ToDate = moment(this.inventory.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'`;
    }

    if (this.inventory.SupplierID !== 0) {
      Parem = Parem + ' and purchasemasternew.SupplierID = ' + this.inventory.SupplierID;
    }

    if (this.inventory.ShopID != 0) {
      Parem = Parem + ' and barcodemasternew.ShopID IN ' + `(${this.inventory.ShopID})`;
    }

    if (this.inventory.Barcode !== '') {
      Parem = Parem + ' and barcodemasternew.Barcode Like ' + '"' + this.inventory.Barcode + '%"';
    }

    // if (this.inventory.StringProductName !== '' ) {
    //   Parem = Parem + ' and purchasedetailnew.ProductName LIKE ' + "'" + this.inventory.StringProductName + "%'"; }

    if (this.inventory.CurrentStatus !== 0) {
      Parem = Parem + ' and barcodemasternew.CurrentStatus = ' + '"' + this.inventory.CurrentStatus + '"';
    }

    if (this.inventory.GSTPercentage !== 0) {
      Parem = Parem + ' and purchasedetailnew.GSTPercentage = ' + `'${this.inventory.GSTPercentage}'`;
    }

    if (this.inventory.GSTType !== 0) {
      Parem = Parem + ' and purchasedetailnew.GSTType = ' + `'${this.inventory.GSTType}'`;
    }

    if (this.inventory.ProductCategory !== 0) {
      Parem = Parem + ' and purchasedetailnew.ProductTypeID = ' + this.inventory.ProductCategory;
      this.filter();
    }

    if (this.inventory.ProductName !== '') {
      Parem = Parem + ' and purchasedetailnew.ProductName Like ' + "'" + this.inventory.ProductName.trim() + "%'";
    }


    const subs: Subscription = this.purchaseService.getProductInventoryReportExport(Parem,this.Productsearch).subscribe({
      next: (res: any) => {
        this.downloadFile(res);
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  public downloadFile(response: any, fileName: any = '') {
    const blob = new Blob([response.body], { type: response.headers.get('content-type') });
    fileName = fileName || response.headers.get('Content-Disposition').split(';')[1].split('=')[1].replace(/\"/g, '')
    const file = new File([blob], fileName, { type: response.headers.get('content-type') });
    saveAs(file);
  }
  
  inventoryAll() {
    this.sp.show()
    let Parem = '';
    this.TtlR = 0
    this.TtlW = 0


    Parem = Parem + ' and  DATE_FORMAT(purchasemasternew.PurchaseDate, "%Y-%m-%d")  between ' + '0001-01-01';
    Parem = Parem + ' and ' + '9000-01-01';

    if (this.inventory.SupplierID !== 0) {
      Parem = Parem + ' and purchasemasternew.SupplierID = ' + this.inventory.SupplierID;
    }

    if (this.inventory.ShopID != 0) {
      Parem = Parem + ' and barcodemasternew.ShopID IN ' + `(${this.inventory.ShopID})`;
    }

    if (this.inventory.Barcode !== '') {
      Parem = Parem + ' and barcodemasternew.Barcode Like ' + '"' + this.inventory.Barcode + '%"';
    }

    // if (this.inventory.StringProductName !== '' ) {
    //   Parem = Parem + ' and purchasedetailnew.ProductName LIKE ' + "'" + this.inventory.StringProductName + "%'"; }

    if (this.inventory.CurrentStatus !== 0) {
      Parem = Parem + ' and barcodemasternew.CurrentStatus = ' + '"' + this.inventory.CurrentStatus + '"';
    }

    if (this.inventory.GSTPercentage !== 0) {
      Parem = Parem + ' and purchasedetailnew.GSTPercentage = ' + `'${this.inventory.GSTPercentage}'`;
    }

    if (this.inventory.GSTType !== 0) {
      Parem = Parem + ' and purchasedetailnew.GSTType = ' + `'${this.inventory.GSTType}'`;
    }

    if (this.inventory.ProductCategory !== 0) {
      Parem = Parem + ' and purchasedetailnew.ProductTypeID = ' + this.inventory.ProductCategory;
      this.filter();
    }

    if (this.inventory.ProductName !== '') {
      Parem = Parem + ' and purchasedetailnew.ProductName Like ' + "'" + this.inventory.ProductName.trim() + "%'";
    }


    const subs: Subscription = this.purchaseService.getProductInventoryReport(Parem,this.Productsearch).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.as.successToast(res.message)
          this.inventoryList = res.data
          this.inventoryList.forEach((element: any) => {
            this.TtlR = + this.TtlR + element.RetailPrice * element.Count
            this.TtlW = + this.TtlW + element.WholeSalePrice * element.Count
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
        } else {
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
    const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(element);
    delete ws['A2'];
    // Initialize column widths array
    const colWidths: number[] = [];

    // Iterate over all cells to determine maximum width for each column
    XLSX.utils.sheet_to_json(ws, { header: 1 }).forEach((row: any = []) => {
      row.forEach((cell: any, index: number) => {
        const cellValue = cell ? String(cell) : '';
        colWidths[index] = Math.max(colWidths[index] || 0, cellValue.length);
      });
    });

    // Set column widths in the worksheet
    ws['!cols'] = colWidths.map((width: number) => ({ wch: width + 2 }));

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, 'inventory_Report.xlsx');
  }

  PDFdetail() {
  }

  inventorysFromReset() {
    this.inventory = {
      FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, SupplierID: 0, Barcode: '', CurrentStatus: 'Available', PaymentStatus: 0, ProductCategory: 0, ProductName: '', GSTType: 0, GSTPercentage: 0
    };
    this.inventoryList = [];
    this.DetailtotalQty = ''
    this.DetailtotalDiscount = ''
    this.DetailtotalUnitPrice = ''
    this.DetailtotalGstAmount = ''
    this.DetailtotalSubTotal = ''
    this.DetailtotalAmount = ''
    this.TtlR = 0
    this.TtlW = 0
  }
  
  openModal(content: any) {
    this.modalService.open(content, { centered: true, backdrop: 'static', keyboard: false, size: 'sm' });
  }


  // purchase product expiry

  getFieldList1() {
    if (this.ProductExpiry.ProductCategory !== 0) {
      this.prodList.forEach((element: any) => {
        if (element.ID === this.ProductExpiry.ProductCategory) {
          this.selectedProduct = element.Name;
        }
      })
      const subs: Subscription = this.ps.getFieldList(this.selectedProduct).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.specList1 = res.data;
            this.getSptTableData1();
          } else {
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

  getFieldSupportData1(index: any) {
    this.specList1.forEach((element: any) => {
      if (element.Ref === this.specList1[index].FieldName.toString()) {
        const subs: Subscription = this.ps.getProductSupportData(this.specList1[index].SelectedValue, element.SptTableName).subscribe({
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

  purchaseProductExpiry() {

    this.sp.show()
    this.todaydate = moment(new Date()).format('YYYY-MM-DD');
    let Parem = '';

    if (this.ProductExpiry.FromDate !== '' && this.ProductExpiry.FromDate !== null) {
      let FromDate = moment(this.ProductExpiry.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and  DATE_FORMAT(purchasedetailnew.ProductExpDate, "%Y-%m-%d")  between ' + `'${FromDate}'`;
    }

    if (this.ProductExpiry.ToDate !== '' && this.ProductExpiry.ToDate !== null) {
      let ToDate = moment(this.ProductExpiry.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'`;
    }

    if (this.ProductExpiry.ProductCategory !== 0) {
      Parem = Parem + ' and purchasedetailnew.ProductTypeID = ' + this.ProductExpiry.ProductCategory;
      this.filter1();
    }

    if (this.ProductExpiry.ProductName !== '') {
      Parem = Parem + ' and purchasedetailnew.ProductName Like ' + "'" + this.ProductExpiry.ProductName.trim() + "%'";
    }

    if (this.ProductExpiry.ShopID != 0) {
      Parem = Parem + ' and purchasemasternew.ShopID IN ' + `(${this.ProductExpiry.ShopID})`;
    }

    if (this.ProductExpiry.SupplierID !== 0) {
      Parem = Parem + ' and purchasemasternew.SupplierID = ' + this.ProductExpiry.SupplierID;
    }

    if (this.ProductExpiry.GSTPercentage !== 0) {
      Parem = Parem + ' and purchasedetailnew.GSTPercentage = ' + `'${this.ProductExpiry.GSTPercentage}'`;
    }

    if (this.ProductExpiry.GSTType !== 0) {
      Parem = Parem + ' and purchasedetailnew.GSTType = ' + `'${this.ProductExpiry.GSTType}'`;
    }

    const subs: Subscription = this.purchaseService.getPurchasereportsDetail(Parem,this.Productsearch).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.ProductExpiryList = res.data
          this.ProductExpiryList.forEach((element: any) => {
            element.ProductName = element.ProductName.trim()
            if (element.ProductExpDate < this.todaydate) {
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
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  openModal2(content2: any) {
    this.modalService.open(content2, { centered: true, backdrop: 'static', keyboard: false, size: 'sm' });
  }

  exportAsXLSXExpiry(): void {
    let element = document.getElementById('ProductExpiry');
    const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(element);
    delete ws['A2'];
    // Initialize column widths array
    const colWidths: number[] = [];

    // Iterate over all cells to determine maximum width for each column
    XLSX.utils.sheet_to_json(ws, { header: 1 }).forEach((row: any = []) => {
      row.forEach((cell: any, index: number) => {
        const cellValue = cell ? String(cell) : '';
        colWidths[index] = Math.max(colWidths[index] || 0, cellValue.length);
      });
    });

    // Set column widths in the worksheet
    ws['!cols'] = colWidths.map((width: number) => ({ wch: width + 2 }));

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, 'PurchaseProductExpiry_Report.xlsx');
  }

  productExpiryFromReset() {
    this.ProductExpiry = {
      FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, SupplierID: 0,
      PaymentStatus: 0, ProductCategory: 0, ProductName: '', GSTType: 0, GSTPercentage: 0
    };
    this.ProductExpiryList = [];
    this.ExpirytotalQty = '';
    this.ExpirytotalDiscount = '';
    this.ExpirytotalUnitPrice = '';
    this.ExpirytotalGstAmount = '';
    this.ExpirytotalAmount = '';
    this.gstExpirys = '';
  }

  dateFormat(date: any) {
    return moment(date).format(`${this.companySetting.DateFormat}`);
  }

  customerSearch(searchKey: any, mode: any, type: any) {
    this.filteredOptions = [];

    let supplierID = 0;

    if (type === 'Supplier') {
      switch (mode) {
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
        if (res.success) {
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
    switch (mode) {
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
  print(mode: any) {
    let shop = this.shopList
    this.selectsShop = shop.filter((s: any) => s.ID === Number(this.selectedShop[0]));
    let printContent: any = '';
    let printTitle: any = '';

    if (mode === 'Inventory-content') {
      printContent = document.getElementById('Inventory-content');
      printTitle = 'Inventory Report'
    }
    if (mode === 'ProductSummary-content') {
      printContent = document.getElementById('ProductSummary-content');
      printTitle = 'Product Summary Report'
    }
    if (mode === 'ProductExpiry-content') {
      printContent = document.getElementById('ProductExpiry-content');
      printTitle = 'Purchase (Product Expiry) Report'
    }
    if (mode === 'QtyStockExcel-content') {
      printContent = document.getElementById('QtyStockExcel-content');
      printTitle = 'opening/closing_stock_(QTY) Report'
    }
    if (mode === 'AmtStockExcel-content') {
      printContent = document.getElementById('AmtStockExcel-content');
      printTitle = 'opening/closing_stock_(AMT) Report'
    }

    let printWindow: any = window.open('pp', '_blank');
    printWindow.document.write(`
    <html>
      <head>
      <title> ${printTitle}</title>
        <style>
          @media print {
  
            body {
              margin:0;
              padding:0;
              zoom:100%;
              width:100%;
              font-family: 'Your Font Family', sans-serif;
            }
            .header-body{
              width:100%;
              height:120px;
            }
            .main-body{
              width:100%;
            }
            .header-body .print-title {
              width:60%;
              text-align: left;
              margin-bottom: 20px;
              float:right;
            }
            .header-body .print-logo {
              width:20%;
              text-align: center;
              margin-bottom: 0px;
              float:left;
            }
            .print-logo img{
              width: 100%;
              height: 110px;
              object-fit: cover;
            }
            thead{
              background-color: #dcdcdc;
              height:50px;
            }
            thead tr{
              height:30px;
            }
            th{
              padding:0px;
              margin:0px;
  
            }
            table  {
              width:100%;
              padding:0px;
              margin:0px;
              text-align: center;
            }
            td  {
              padding:0px;
              margin:0px;
            }
            tr:nth-child(even) {
              background-color: #f2f2f2;
          }
          th.hide-on-print,totolRow,
          td.hide-on-print {
            display: none;
          }
          tfoot.hide-on-print {
            display: block;
          }
          .totolRow  td{
            color:red !important;
            font-weight: 600 !important;
          }
          .button-container {
            display: none;
          }
          }
        </style>
      </head>
      <body>
      <div class="header-body">
        <div class="print-logo ">
          <img src="${this.env.apiUrl + this.selectsShop[0].LogoURL}" alt="Logo" >
        </div>
        <div class="print-title">
        <h3>${this.selectsShop[0].Name + ' (' + this.selectsShop[0].AreaName + ')'}</h3>
        <h4 style="font-weight: 300; letter-spacing: 1px;">${this.selectsShop[0].Address}</h4>
        </div>
      </div>
      <div class="main-body">
        ${printContent.innerHTML}
      </div>
      </body>
    </html>
  `);

    printWindow.document.querySelectorAll('.hide-on-print').forEach((element: any) => {
      element.classList.add('hide-on-print');
    });

    printWindow.document.close();
    printWindow.print();
  }

  toggleColumnVisibility(column: string): void {
    this.columnVisibility[column] = !this.columnVisibility[column];
  }

  toggleColumnVisibility1(column: string): void {
    this.columnVisibility1[column] = !this.columnVisibility1[column];
  }

  exportAsXLSXQtyStock(): void {
    let element = document.getElementById('QtyStockExcel');
    const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(element);
    delete ws['A2'];
    // Initialize column widths array
    const colWidths: number[] = [];

    // Iterate over all cells to determine maximum width for each column
    XLSX.utils.sheet_to_json(ws, { header: 1 }).forEach((row: any = []) => {
      row.forEach((cell: any, index: number) => {
        const cellValue = cell ? String(cell) : '';
        colWidths[index] = Math.max(colWidths[index] || 0, cellValue.length);
      });
    });

    // Set column widths in the worksheet
    ws['!cols'] = colWidths.map((width: number) => ({ wch: width + 2 }));

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, 'opening/closing_stock_(QTY).xlsx');
  }
  exportAsXLSXAmtStock(): void {
    let element = document.getElementById('AmtStockExcel');
    const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(element);
    delete ws['A2'];
    // Initialize column widths array
    const colWidths: number[] = [];

    // Iterate over all cells to determine maximum width for each column
    XLSX.utils.sheet_to_json(ws, { header: 1 }).forEach((row: any = []) => {
      row.forEach((cell: any, index: number) => {
        const cellValue = cell ? String(cell) : '';
        colWidths[index] = Math.max(colWidths[index] || 0, cellValue.length);
      });
    });

    // Set column widths in the worksheet
    ws['!cols'] = colWidths.map((width: number) => ({ wch: width + 2 }));

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, 'opening/closing_stock_(AMT).xlsx');
  }


  getCountInventoryReport() {
    if (this.FilterTypes === 'Date') {
      this.sp.show()
      this.todaydate = moment(new Date()).format('YYYY-MM-DD');
      let Parem = '';

      if (this.QtyStock.FromDate !== '' && this.QtyStock.FromDate !== null) {
        let FromDate = moment(this.QtyStock.FromDate).format('YYYY-MM-DD')
        Parem = Parem + ' and Date between ' + `'${FromDate}'`;
      }

      if (this.QtyStock.ToDate !== '' && this.QtyStock.ToDate !== null) {
        let ToDate = moment(this.QtyStock.ToDate).format('YYYY-MM-DD')
        Parem = Parem + ' and ' + `'${ToDate}'`;
      }

      if (this.QtyStock.ShopID != 0) {
        this.QtyStock.ShopID
      }

      const subs: Subscription = this.purchaseService.getCountInventoryReport(this.QtyStock.ShopID, Parem).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.QtyStockList = res.data
            this.OpeningStock = res.calculation.OpeningStock
            this.AddPurchase = res.calculation.AddPurchase
            this.DeletePurchase = res.calculation.DeletePurchase
            this.AddSale = res.calculation.AddSale
            this.DeleteSale = res.calculation.DeleteSale
            this.OtherDeleteStock = res.calculation.OtherDeleteStock
            this.InitiateTransfer = res.calculation.InitiateTransfer
            this.CancelTransfer = res.calculation.CancelTransfer
            this.AcceptTransfer = res.calculation.AcceptTransfer
            this.ClosingStock = res.calculation.ClosingStock

          } else {
            this.as.errorToast(res.message)
          }
          this.sp.hide()
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    } else {
      this.sp.show()

      let FromDate = '';
      let ToDate = '';

      if (this.QtyStock.FromDate !== '' && this.QtyStock.FromDate !== null) {
        FromDate = moment(this.QtyStock.FromDate).format('YYYY-MM-DD')
      }

      if (this.QtyStock.ToDate !== '' && this.QtyStock.ToDate !== null) {
        this.QtyStock.ToDate = this.lastDayOfMonth
        ToDate = moment(this.QtyStock.ToDate).format('YYYY-MM-DD')
      }

      if (this.QtyStock.ShopID != 0) {
        this.QtyStock.ShopID
      }

      const subs: Subscription = this.purchaseService.getCountInventoryReportMonthWise(this.QtyStock.ShopID, FromDate, ToDate).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.QtyStockList = res.data
            this.OpeningStock = res.calculation.OpeningStock
            this.AddPurchase = res.calculation.AddPurchase
            this.DeletePurchase = res.calculation.DeletePurchase
            this.AddSale = res.calculation.AddSale
            this.DeleteSale = res.calculation.DeleteSale
            this.OtherDeleteStock = res.calculation.OtherDeleteStock
            this.InitiateTransfer = res.calculation.InitiateTransfer
            this.CancelTransfer = res.calculation.CancelTransfer
            this.AcceptTransfer = res.calculation.AcceptTransfer
            this.ClosingStock = res.calculation.ClosingStock
            this.QtyStock.ToDate = moment(this.lastDayOfMonth).endOf('month').format('YYYY-MM')
          } else {
            this.as.errorToast(res.message)
          }
          this.sp.hide()
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    }
  }

  getAmountInventoryReport() {
    if (this.FilterTypes1 === 'Date') {

      this.sp.show()
      this.todaydate = moment(new Date()).format('YYYY-MM-DD');
      let Parem = '';

      if (this.AmtStock.FromDate !== '' && this.AmtStock.FromDate !== null) {
        let FromDate = moment(this.AmtStock.FromDate).format('YYYY-MM-DD')
        Parem = Parem + 'and Date between ' + `'${FromDate}'`;
      }

      if (this.AmtStock.ToDate !== '' && this.AmtStock.ToDate !== null) {
        let ToDate = moment(this.AmtStock.ToDate).format('YYYY-MM-DD')
        Parem = Parem + ' and ' + `'${ToDate}'`;
      }

      if (this.AmtStock.ShopID != 0) {
        this.AmtStock.ShopID
      }

      const subs: Subscription = this.purchaseService.getAmountInventoryReport(this.AmtStock.ShopID, Parem).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.AmtStockList = res.data
            this.AmtOpeningStock = res.calculation.AmtOpeningStock
            this.AmtAddPurchase = res.calculation.AmtAddPurchase
            this.AmtDeletePurchase = res.calculation.AmtDeletePurchase
            this.AmtAddSale = res.calculation.AmtAddSale
            this.AmtDeleteSale = res.calculation.AmtDeleteSale
            this.AmtOtherDeleteStock = res.calculation.AmtOtherDeleteStock
            this.AmtInitiateTransfer = res.calculation.AmtInitiateTransfer
            this.AmtCancelTransfer = res.calculation.AmtCancelTransfer
            this.AmtAcceptTransfer = res.calculation.AmtAcceptTransfer
            this.AmtClosingStock = res.calculation.AmtClosingStock

          } else {
            this.as.errorToast(res.message)
          }
          this.sp.hide()
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    } else {
      this.sp.show()

      let FromDate = '';
      let ToDate = '';

      if (this.AmtStock.FromDate !== '' && this.AmtStock.FromDate !== null) {
        FromDate = moment(this.AmtStock.FromDate).format('YYYY-MM-DD')
      }

      if (this.AmtStock.ToDate !== '' && this.AmtStock.ToDate !== null) {
        this.AmtStock.ToDate = this.lastDayOfMonth1
        ToDate = moment(this.AmtStock.ToDate).format('YYYY-MM-DD')
      }

      if (this.AmtStock.ShopID != 0) {
        this.AmtStock.ShopID
      }

      const subs: Subscription = this.purchaseService.getAmountInventoryReportMonthWise(this.AmtStock.ShopID, FromDate, ToDate).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.AmtStockList = res.data
            this.AmtOpeningStock = res.calculation.AmtOpeningStock
            this.AmtAddPurchase = res.calculation.AmtAddPurchase
            this.AmtDeletePurchase = res.calculation.AmtDeletePurchase
            this.AmtAddSale = res.calculation.AmtAddSale
            this.AmtDeleteSale = res.calculation.AmtDeleteSale
            this.AmtOtherDeleteStock = res.calculation.AmtOtherDeleteStock
            this.AmtInitiateTransfer = res.calculation.AmtInitiateTransfer
            this.AmtCancelTransfer = res.calculation.AmtCancelTransfer
            this.AmtAcceptTransfer = res.calculation.AmtAcceptTransfer
            this.AmtClosingStock = res.calculation.AmtClosingStock
            this.AmtStock.ToDate = moment(this.lastDayOfMonth1).endOf('month').format('YYYY-MM')
          } else {
            this.as.errorToast(res.message)
          }
          this.sp.hide()
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    }
  }

  ChangeDate(mode: any) {
    if (mode == 'Qty') {
        if (this.FilterTypes === 'Date') {
          this.QtyStock = {
           FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0,
        }
      } else {
          this.QtyStock = {
            FromDate: moment().startOf('month').format('YYYY-MM-DD'), ToDate: moment(this.QtyStock.FromDate).endOf('month').format('YYYY-MM-DD'), ShopID: 0,
        }
      }
      this.QtyStockList = []
      this.OpeningStock = 0
      this.AddPurchase = 0
      this.DeletePurchase = 0
      this.AddSale = 0
      this.DeleteSale = 0
      this.OtherDeleteStock = 0
      this.InitiateTransfer = 0
      this.CancelTransfer = 0
      this.AcceptTransfer = 0
      this.ClosingStock = 0
    } else {
      if (this.FilterTypes1 === 'Date') {
        this.AmtStock = {
          FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0,
        }
      } else {
        this.AmtStock = {
          FromDate: moment().startOf('month').format('YYYY-MM-DD'), ToDate: moment(this.AmtStock.FromDate).endOf('month').format('YYYY-MM-DD'), ShopID: 0,
        }
      }
      this.AmtStockList = []
      this.AmtOpeningStock = 0
      this.AmtAddPurchase = 0
      this.AmtDeletePurchase = 0
      this.AmtAddSale = 0
      this.AmtDeleteSale = 0
      this.AmtOtherDeleteStock = 0
      this.AmtInitiateTransfer = 0
      this.AmtCancelTransfer = 0
      this.AmtAcceptTransfer = 0
      this.AmtClosingStock = 0
    }
  }

  ChangeDateTo(mode: any) {
    if (mode === 'Qty') {
      if (this.QtyStock.ToDate) {
        // Get the last day of the selected month
        this.lastDayOfMonth = moment(this.QtyStock.ToDate).endOf('month').format('YYYY-MM-DD');
      } else {
        // Handle case when no date is selected
        this.QtyStock.ToDate = null; // or any other default value
      }
    } else {
      if (this.AmtStock.ToDate) {
        // Get the last day of the selected month
        this.lastDayOfMonth1 = moment(this.AmtStock.ToDate).endOf('month').format('YYYY-MM-DD');
      } else {
        // Handle case when no date is selected
        this.AmtStock.ToDate = null; // or any other default value
      }
    }
  }

  updatePurchasePriceModel(content: any) {
    if(this.inventoryList != undefined){
      this.modalService.open(content, { centered: true, backdrop: 'static', keyboard: false, size: 'md' });
    }else{
      Swal.fire({
        position: 'center',
        icon: 'warning',
        title: 'Without Product You Can`t Change the Price',
        showConfirmButton: true,
      })
    }
   
  }

  EditPrice(){
    this.UpdatePriceEdit = !this.UpdatePriceEdit
  }

  updateTemp(data:any){
    this.temp.push(data)
  }

  UpdatePrice(){
    if(this.temp.length != 0){
    this.sp.show()
     let ProductData = this.temp;
    const subs: Subscription = this.purchaseService.updateProductPrice(ProductData).subscribe({
      next: (res: any) => {
        if (res.success) {
          // this.modalService.dismissAll()
          // this.temp = [];
          this.UpdatePriceEdit = false;
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Your file has been Update.',
            showConfirmButton: false,
            timer: 1200
          })
        } else {
          this.as.errorToast(res.message)
          Swal.fire({
            position: 'center',
            icon: 'warning',
            title: res.message,
            showConfirmButton: true,
          })
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
   }else{
    Swal.fire({
      title: 'No Price Changed.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Close'
    }).then((result) => {
      if (result.isConfirmed) {
        this.UpdatePriceEdit = false
        this.modalService.dismissAll()
      }
    })
   }
  }

  selectBarcode(type: any, toggleCheckbox: any = true) {
    if (type === 'all') {
      if (toggleCheckbox) {
        this.checked = !this.checked; // Toggle the checked property if needed
        this.sp.show();
        this.barcodeListt = [];
        this.inventoryList.forEach((ele: any, i: any) => {
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
        this.inventoryList.forEach((ele: any) => {
          ele.Checked = 0;
          ele.Checked = false
        });
      }
    }
  }
  
  

  singleSelectBarcode(i: any) {
    const currentItem = this.inventoryList[i];
    currentItem.Checked = this.checked
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
        if (ele.Status !== 0 && ele.ID != null && ele.Barcode != null) {
          Qty += ele.Count;
          // Create a copy of 'ele' for each quantity and push it to 'tempItem'
          for (let i = 0; i < ele.Count; i++) {
            tempItem.push({ ...ele }); // Copy 'ele' using the spread operator
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
            this.inventoryList.forEach((e: any) =>{
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
