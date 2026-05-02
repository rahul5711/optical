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
import { BillService } from 'src/app/service/bill.service';
import { EcomService } from 'src/app/service/ecom.service';

@Component({
  selector: 'app-order-report',
  templateUrl: './order-report.component.html',
  styleUrls: ['./order-report.component.css']
})
export class OrderReportComponent implements OnInit {

  shop: any = JSON.parse(localStorage.getItem('shop') || '');
  user: any = JSON.parse(localStorage.getItem('user') || '');
  selectedShop: any = JSON.parse(localStorage.getItem('selectedShop') || '');
  permission = JSON.parse(localStorage.getItem('permission') || '[]');
  companySetting: any = JSON.parse(localStorage.getItem('companysetting') || '[]');
  searchValue: any = '';
  env = environment;
  Productsearch: any = '';

  myControl = new FormControl('All');
  filteredOptions: any;

  supplierList: any;
  shopList: any;
  selectsShop: any;
  OrderMasterList: any
  totalQty: any;
  totalDiscount: any;
  totalUnitPrice: any;
  totalAmount: any;
  totalShipmentRate: any;
  totalSubTotal: any;
  totalGstAmount: any;
  gstMaster: any;

  OrderDetailList: any
  selectedProduct: any;
  prodList: any;
  specList: any;
  gstList: any;
  DetailtotalQty = 0;
  DetailtotalDiscount = 0;
  DetailtotalUnitPrice = 0;
  DetailtotalAmount = 0;
  DetailtotalGstAmount = 0;
  gstdetails: any = []
DetailShipmentRate = 0;
          DetailtotalSubTotal = 0;
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private purchaseService: PurchaseService,
    private ss: ShopService,
    private sup: SupplierService,
    private supps: SupportService,
    private ps: ProductService,
    public as: AlertService,
    public sp: NgxSpinnerService,
    private modalService: NgbModal,
    private bill: BillService,
    private ecs: EcomService,
  ) { }

  OrderMaster: any = {
    FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ProductStatus: 0,

  };

  OrderDetail: any = {
    FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ProductStatus: 0,

  };


  ngOnInit(): void {
    this.sp.show()
    if (this.user.UserGroup === 'Employee') {
      this.shopList = this.shop;
      this.OrderMaster.ShopID = this.shopList[0].ShopID;
      this.OrderMaster.ShopID = this.shopList[0].ShopID;
    } else {
      // this.dropdownShoplist()
      this.bill.shopList$.subscribe((list: any) => {
        this.shopList = list
      });
    }
    this.bill.productList$.subscribe((list: any) => {
      this.prodList = list.sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
    });

    this.bill.taxList$.subscribe((list: any) => {
      this.gstList = list
    });

    this.sp.hide()
  }

  dropdownShoplist() {
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
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getOrderMaster() {
    this.sp.show()

    let dtm = {
      fromDate: this.OrderMaster.FromDate,
      toDate: this.OrderMaster.ToDate,
      orderStatus: this.OrderMaster.ProductStatus,
    }

 
    const subs: Subscription = this.ecs.orderReport(dtm).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.OrderMasterList = res.data;
          this.as.successToast(res.message)


          this.totalQty = res.calculation[0].totalQuantity;
          this.totalAmount = res.calculation[0].totalAmount.toFixed(2);
          this.totalShipmentRate = res.calculation[0].totalShipmentRate.toFixed(2);
          this.totalSubTotal = res.calculation[0].totalSubTotal.toFixed(2);

        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  OrderMasterFromReset() {
    this.OrderMaster = {
      FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ProductStatus: 0,
    };
    this.OrderMasterList = [];
    this.totalQty = ''
    this.totalDiscount = ''
    this.totalUnitPrice = ''
    this.totalGstAmount = ''
    this.totalAmount = ''
  }

  exportAsXLSXMaster(): void {
    let element = document.getElementById('purchaseExcel');
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
    XLSX.writeFile(wb, 'Product_Return_Report.xlsx');
  }


  // Reture details code start
  getProductList() {
    const subs: Subscription = this.ps.getList().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.prodList = res.data.sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
        } else {
          this.as.errorToast(res.message)
        }
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getFieldList() {
    if (this.OrderDetail.ProductCategory !== 0) {
      this.prodList.forEach((element: any) => {
        if (element.ID === this.OrderDetail.ProductCategory) {
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
      this.OrderDetail.ProductName = '';
      this.OrderDetail.ProductCategory = 0;
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
        let valueToAdd = element.SelectedValue;
        valueToAdd = valueToAdd.replace(/^\d+_/, "");
        productName = valueToAdd;
      } else if (element.SelectedValue !== '') {
        let valueToAdd = element.SelectedValue;
        valueToAdd = valueToAdd.replace(/^\d+_/, "");
        productName += '/' + valueToAdd;
      }
    });
    this.OrderDetail.ProductName = productName;
  }

  getOrderDetails() {
    this.sp.show()

    let dtm = {
      fromDate: this.OrderDetail.FromDate,
      toDate: this.OrderDetail.ToDate,
      orderStatus: this.OrderDetail.ProductStatus,
    }

    const subs: Subscription = this.ecs.orderDetailReport(dtm).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.OrderDetailList = res.data
          this.DetailtotalQty = res.calculation[0].totalQuantity;
          this.DetailShipmentRate = res.calculation[0].totalShipmentRate.toFixed(2);
          this.DetailtotalSubTotal = res.calculation[0].totalSubTotal.toFixed(2);
          this.DetailtotalAmount = res.calculation[0].totalAmount.toFixed(2);

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
    let element = document.getElementById('purchaseDetailExcel');
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
    XLSX.writeFile(wb, 'Product_Return_ProductType_Report.xlsx');
  }

  PDFdetail() {

  }

  OrderDetailsFromReset() {
    this.OrderDetail = {
      FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ProductStatus: 0,
    };
    this.OrderDetailList = [];
    this.DetailtotalQty = 0;
    this.DetailtotalDiscount = 0;
    this.DetailtotalUnitPrice = 0;
    this.DetailtotalAmount = 0;
    this.DetailtotalGstAmount = 0;
    this.gstdetails = []
  }

  openModal(content: any) {
    this.modalService.open(content, { centered: true, backdrop: 'static', keyboard: false, size: 'sm' });
  }

  dateFormat(date: any): string {
    if (date == null || date == "") {
      return '0000-00-00'; // Default Value
    }
    return moment(date).format(this.companySetting?.DateFormat || 'YYYY-MM-DD');
  }
}
