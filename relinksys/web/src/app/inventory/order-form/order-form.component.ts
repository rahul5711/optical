import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { ProductService } from 'src/app/service/product.service';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { NgxSpinnerService } from 'ngx-spinner';
import { PurchaseService } from 'src/app/service/purchase.service';
import { ShopService } from 'src/app/service/shop.service';
import { SupplierService } from 'src/app/service/supplier.service';
import { ExcelService } from 'src/app/service/helpers/excel.service';
import * as moment from 'moment';
import { BillService } from 'src/app/service/bill.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SupportService } from 'src/app/service/support.service';

interface LensData {
  sph: string;
  [key: string]: any;
}
interface LensDataS {
  sph: string;
  [key: string]: any;
}
interface LensDatafg {
  sph: string;
  [key: string]: any;
}
interface LensDataGrid {
  sph: string;
  [key: string]: any;
}

@Component({
  selector: 'app-order-form',
  templateUrl: './order-form.component.html',
  styleUrls: ['./order-form.component.css']
})
export class OrderFormComponent implements OnInit {

  evn = environment;
  user = JSON.parse(localStorage.getItem('user') || '');
  company = JSON.parse(localStorage.getItem('company') || '');
  shop = JSON.parse(localStorage.getItem('shop') || '');
  companySetting = JSON.parse(localStorage.getItem('companysetting') || '');
  selectedShop: any = JSON.parse(localStorage.getItem('selectedShop') || '');
  searchValue: any = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private ps: ProductService,
    private purchaseService: PurchaseService,
    private ss: ShopService,
    private sup: SupplierService,
    private excelService: ExcelService,
    private as: AlertService,
    private sp: NgxSpinnerService,
    private bill: BillService,
    private modalService: NgbModal,
    private supps: SupportService,

  ) { }

  data: any = {
    ProductCategory: '', ProductName: ''
  }
  ShopID: any
  saleModalRef: any
  shopList: any = [];
  dataList: any = [];
  filterdata: any = [];
  productQtyList: any = [];
  addList: any = [];
  Req: any = { SearchBarCode: '', searchString: " ", SupplierID: 0 }

  ProductTypeFilter: any;

  sphMin: number = 0.00;
  sphMax: number = 4.00;
  sphStep: number = 0.25;
  cylMin: any = 0.00;
  cylMax: any = 4.00;
  cylStep: any = 0.25;

  sphValues: string[] = [];
  cylValues: string[] = [];

  displayedColumns: string[] = ['cyl'];
  dataSource: LensData[] = [];
  plustoplus: any = '+sph-cyl';
  fishedBase: any
  lens: any = {
    productname: '', purchasePrice: 0, quantity: 0, GSTtype: 'None', GSTPercent: 0, retailPrice: 0, wholesalePrice: 0, axis: '', addtion: '', eye: ''
  }

  sale: any = {
    ProductName: '', Barcode: '', SaleQty: '', AvailableQty: ''
  }
  OrderList: any = []
  requestQty = 0

  lenslist: any = []
  quantities: { [key: string]: { [key: string]: number } } = {};
  additionList: any = []
  axisList: any = []
  clickedColumnIndex: any | number | null = null;
  hoveredRow: any = null;
  axisAddEyeShow = false
  isActive1 = false;
  isActive2 = false;
  isActive3 = false;
  pp = 0;
  mm = 0;
  pm = 0;
  lenQty = 0;
  axisFilter: any = 0
  addtionFilter: any = 0
  FilterDetailList: any = []
  SVType: any
  Base: any
  disabledBtn = false
  indexProdcutName: any = ''

  sphMinS: number = 0.00;
  sphMaxS: number = 4.00;
  sphStepS: number = 0.25;
  cylMinS: number = 0.00;
  cylMaxS: number = 4.00;
  cylStepS: number = 0.25;
  BaseS: any = 0
  SVTypeS: any = ''
  sphValuesS: string[] = [];
  cylValuesS: string[] = [];

  displayedColumnsS: string[] = ['cyl'];
  dataSourceS: LensDataS[] = [];
  plustoplusS: any = '-sph+cyl';
  lensS: any = {
    productname: '', purchasePrice: 0, quantity: 0, GSTtype: 'None', GSTPercent: 0, retailPrice: 0, wholesalePrice: 0, axis: '', addtion: '', eye: ''
  }

  lenslistS: any = []
  productQtyLists: any = []
  quantitiesS: { [key: string]: { [key: string]: number } } = {};

  sphMinfg: number = 0.00;
  sphMaxfg: number = 4.00;
  sphStepfg: number = 0.25;
  cylMinfg: number = 0.00;
  cylMaxfg: number = 4.00;
  cylStepfg: number = 0.25;
  Basefg: any = 0
  SVTypefg: any = ''
  sphValuesfg: string[] = [];
  cylValuesfg: string[] = [];

  displayedColumnsfg: string[] = ['cyl'];
  dataSourcefg: LensDataS[] = [];
  plustoplusfg: any = '-sph+cyl';
  svChange: any = false

  lensfg: any = {
    productname: '', purchasePrice: 0, quantity: 0, GSTtype: 'None', GSTPercent: 0, retailPrice: 0, wholesalePrice: 0, axis: '', addtion: '', eye: ''
  }

  lenslistfg: any = []
  productQtyListfg: any = []
  quantitiesfg: { [key: string]: { [key: string]: number } } = {};

  selectedProduct: any;
  prodList: any;
  specList: any;

  sphMinGrid: number = 0.00;
  sphMaxGrid: number = 4.00;
  sphStepGrid: number = 0.25;
  cylMinGrid: number = 0.00;
  cylMaxGrid: number = 4.00;
  cylStepGrid: number = 0.25;
  sphValuesGrid: string[] = [];
  cylValuesGrid: string[] = [];

  displayedColumnsGrid: string[] = ['cyl'];
  dataSourceGrid: LensDataGrid[] = [];
  plustoplusGrid: any = '-sph+cyl';

  isActive1Grid = false;
  isActive2Grid = false;
  isActive3Grid = false;
  lenslistGrid = []
  productQtyListGrid: any = []
  addListGrid: any = []
  indexProdcutNameGrid = ''
  requestQtyGrid: any = 0
  OrderListGrid: any = []
additionListGrid:any = []
axisListGrid:any = []
axisGrid:any
additionGrid:any
AxisAddHide= false

  supplierDropList :any = []

  orderSupplier:any = {
    SupplierID:null, ProductName:'', Quantity:0
  }
  ngOnInit(): void {
    this.dropdownShoplist()
    // this.getProductList()
    this.bill.productLists$.subscribe((list: any) => {
      this.prodList = list.filter((el: any) => {
        return el.Name.toUpperCase() === 'LENS SEMI-FINISHED';
      });
    });
  }



  dropdownShoplist() {
    this.sp.show()
    const subs: Subscription = this.ss.dropdownShoplist('').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.shopList = res.data
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  shopFilter() {
    this.filterdata = []
    this.dataList.forEach((e: any) => {
      if (e.OrderInvoiceShopID == this.ShopID) {
        this.filterdata.push(e)
      }
    })

    if (this.ShopID == 0) {
      this.filterdata = this.dataList
    }
  }

  getOrderData(data: any, mode: any) {
    this.sp.show()
    this.dataList = []
    this.data.ShopID = this.selectedShop[0]

    if (mode == 'Request') {
      this.data.ProductStatus = data
      const subs: Subscription = this.bill.orderformrequest(this.data).subscribe({
        next: (res: any) => {
          if (res.success) {
            let list: any = []
            res.data.forEach((e: any) => {
              if (e.Skip != true) {
                e.MeasurementID = JSON.parse(e.MeasurementID)
                list.push(e)
              }
            })
            this.dataList = list
            this.filterdata = list
          } else {
            this.as.errorToast(res.message)
          }
          this.sp.hide()
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    }
    if (mode == 'Hold') {
      this.data.ProductStatus = 'Order Request'
      const subs: Subscription = this.bill.orderformrequest(this.data).subscribe({
        next: (res: any) => {
          if (res.success) {
            let lists: any = []
            res.data.forEach((e: any) => {
              if (e.Skip == true) {
                e.MeasurementID = JSON.parse(e.MeasurementID)
                e.ProductStatus = 'Order Hold'
                lists.push(e)
              }
            })
            this.data.ProductStatus = 'Order Hold'
            this.dataList = lists
            this.filterdata = lists
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

  iNDEXVALUE(data: any) {

    let index = ''
    let pro = ''

    this.indexProdcutName = this.indexProdcutName.replace(/\b\d+(\.\d+)?\s*INDEX\b/gi, '');

    // 2️⃣ POWER remove (jaise: "SPH +4.25 TO +6.00")
    this.indexProdcutName = this.indexProdcutName.replace(/SPH\s*[+-]?\d+(\.\d+)?\s*TO\s*[+-]?\d+(\.\d+)?/gi, '');

    // 3️⃣ Extra / clean
    this.indexProdcutName = this.indexProdcutName.replace(/\/{2,}/g, '/').replace(/\/$/g, '').trim();

    if (data == "1.56") {
      index = '/1.56 Index'
      pro = this.indexProdcutName + index
    }
    if (data == "1.61") {
      index = '/1.61 Index'
      pro = this.indexProdcutName + index
    }
    if (data == "1.499") {
      index = '/1.499 Index'
      pro = this.indexProdcutName + index
    }
    if (data == "1.56 Progressive") {
      index = '/1.56 Progressive (-)'
      pro = this.indexProdcutName + index
    }
    if (data == "1.56 ProPlus") {
      index = '/1.56 Progressive (+)'
      pro = this.indexProdcutName + index
    }
    this.ProductData(pro)
    this.Base = ''
    this.baseChange1(this.Base, data)
  }


  // fishedBasetype(base: any) {
  //   let productNameBase = ''
  //   productNameBase = this.indexProdcutName + `/Base ${base}`
  //   productNameBase = productNameBase.replace(/\/\s*(\d+\.\d+)\s+index/i, '/$1 Index');
  //   this.ProductData(productNameBase)

  // }

  ProductData(data: any) {
    this.Req.searchString = data
    const subs: Subscription = this.bill.ordersearchByString(this.Req, 'false', 'false').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.productQtyList = res.data
          if (this.indexProdcutName.includes('SINGLE VISION')) {
            this.plusToplusfg('+sph+cyl')
            this.svChange = true
          } else {
            this.plusToplusfg('-sph+cyl')
            this.svChange = false
          }
        } else {
          this.as.errorToast(res.message);
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

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

  openModalS(content1: any, data: any) {
    this.modalService.open(content1, { centered: true, backdrop: 'static', keyboard: false, size: 'xxl' });
    this.isActive1 = true;
    this.isActive2 = false;
    this.isActive3 = false;
    this.pp = 0
    this.mm = 0
    this.pm = 0
    this.lenQty = 0
    this.SVType = ''
    this.indexProdcutName = ''
    this.Base = ''
    this.productQtyList = []
    this.addList = []
    // this.ProductData(data.ProductName)
    this.indexProdcutName = data.ProductName
    this.requestQty = data.Quantity
    this.OrderList = data
    this.generateGrid()
    this.lenslist = []
  }

  plusToplus(mode: any) {
    this.plustoplus = mode;
    this.generateGrid()
  }

  baseChange1(base: any, mode: any) {
    if (mode == '1.56') {
      if (base == 4 || base == 5 || base == 6 || base == 7 || base == 8 || base == 10 || base == 12) {
        this.plusToplus('+sph-cyl')
        this.generateGrid()
      }
      else {
        this.plusToplus('-sph-cyl')
        this.generateGrid()
      }
    }
    if (mode == '1.61') {
      if (base == 4 || base == 5 || base == 6 || base == 7 || base == 8 || base == 9 || base == 10 || base == 11 || base == 12) {
        this.plusToplus('+sph-cyl')
        this.generateGrid()
      }
      else {
        this.plusToplus('-sph-cyl')
        this.generateGrid()
      }
    }
    if (mode == '1.499') {
      if (base == 4 || base == 5 || base == 6 || base == 7 || base == 8 || base == 9 || base == 10 || base == 11 || base == 12) {
        this.plusToplus('+sph-cyl')
        this.generateGrid()
      }
      else {
        this.plusToplus('-sph-cyl')
        this.generateGrid()
      }
    }
    if (mode == '1.56 Progressive') {
      if (base == 6 || base == 7 || base == 8 || base == 9 || base == 10 || base == 11 || base == 12) {
        this.plusToplus('+sph-cyl')
        this.generateGrid()
      }
      else {
        this.plusToplus('-sph-cyl')
        this.generateGrid()
      }
    }

    if (mode == '1.56 ProPlus') {
      if (base == 1 || base == 3 || base == 5) {
        this.plusToplus('+sph-cyl')
        this.generateGrid()
      }
      else {
        this.plusToplus('-sph-cyl')
        this.generateGrid()
      }
    }

    // this.Axis1212()
    // this.AddFilter()
  }

  generateGrid() {
    let baseConfigurations: any = {}, defaultCylConfig: any = {}

    if (this.SVType == '1.56') {
      baseConfigurations = {
        12: { sphMinL: 10.25, sphMaxL: 11.50, sphStepL: 0.25 },
        10: { sphMinL: 8.25, sphMaxL: 10, sphStepL: 0.25 },
        8: { sphMinL: 7.25, sphMaxL: 8, sphStepL: 0.25 },
        7: { sphMinL: 5.75, sphMaxL: 7, sphStepL: 0.25 },
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
        9: { sphMinL: 7.75, sphMaxL: 8.50, sphStepL: 0.25 },
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
        9: { cylMinL: 0, cylMaxL: 6, cylStepL: 0.25 },
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

    if (this.SVType == '1.499') {
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
        9: { cylMinL: 0, cylMaxL: 6, cylStepL: 0.25 },
        8: { cylMinL: 0, cylMaxL: 6, cylStepL: 0.25 },
        7: { cylMinL: 0, cylMaxL: 6, cylStepL: 0.25 },
        6: { cylMinL: 0, cylMaxL: 6, cylStepL: 0.25 },
        5: { cylMinL: 0, cylMaxL: 6, cylStepL: 0.25 },
        4: { cylMinL: 0, cylMaxL: 6, cylStepL: 0.25 },
        2: { cylMinL: 0, cylMaxL: 6, cylStepL: 0.25 },
        0: { cylMinL: 0, cylMaxL: 6, cylStepL: 0.25 },

      }
    }

    if (this.SVType == '1.56 Progressive') {
      baseConfigurations = {
        3: { sphMinL: 0.25, sphMaxL: 2, sphStepL: 0.25 },
        1: { sphMinL: 0.25, sphMaxL: 7.50, sphStepL: 0.25 },
      };

      defaultCylConfig = {
        3: { cylMinL: 0, cylMaxL: 6, cylStepL: 0.25 },
        1: { cylMinL: 0, cylMaxL: 6, cylStepL: 0.25 },
      }
    }

    if (this.SVType == '1.56 ProPlus') {
      baseConfigurations = {

        5: { sphMinL: 0.00, sphMaxL: 3.50, sphStepL: 0.25 },
        3: { sphMinL: 0.00, sphMaxL: 2.00, sphStepL: 0.25 },
        1: { sphMinL: 0.00, sphMaxL: 1.00, sphStepL: 0.25 },
      };

      defaultCylConfig = {
        5: { cylMinL: 0, cylMaxL: 3.50, cylStepL: 0.25 },
        3: { cylMinL: 0, cylMaxL: 2.00, cylStepL: 0.25 },
        1: { cylMinL: 0, cylMaxL: 1.00, cylStepL: 0.25 },
      }
    }

    if (this.Base == '') {
      baseConfigurations = ''
    }
    if (this.Base == '') {
      defaultCylConfig = ''
    }

    if (baseConfigurations[this.Base] || baseConfigurations != '' || defaultCylConfig != '') {
      const { sphMinL, sphMaxL, sphStepL } = baseConfigurations[this.Base];
      const { cylMinL, cylMaxL, cylStepL } = defaultCylConfig[this.Base];

      this.sphMin = sphMinL;
      this.sphMax = sphMaxL;
      this.sphStep = sphStepL;
      this.cylMin = cylMinL;
      this.cylMax = cylMaxL;
      this.cylStep = cylStepL;

      this.sphValues = this.generateRange(this.sphMin, this.sphMax, this.sphStep, 'sph');
      this.cylValues = this.generateRange(this.cylMin, this.cylMax, this.cylStep, 'cyl');
      this.displayedColumns = ['cyl', ...this.cylValues]; // Include 'cyl' as the first column
      this.dataSource = this.initializeGrid(); // Initialize grid data
    } else {
      this.sphMin = 0;
      this.sphMax = 0;
      this.sphStep = 0;
      this.cylMin = 0;
      this.cylMax = 0;
      this.cylStep = 0;
      this.sphValues = [];
      this.cylValues = [];
      this.displayedColumns = ['cyl', ...this.cylValues]; // Include 'cyl' as the first column
      this.dataSource = this.initializeGrid();
    }
  }

  generateRange(min: number, max: number, step: number, type: 'sph' | 'cyl'): string[] {
    const range = [];
    for (let i = min; i <= max; i += step) {
      let value = i.toFixed(2);
      switch (this.plustoplus) {
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

  initializeGrid(): LensData[] {

    const grid: any = [];
    this.sphValues.forEach(sph => {
      const row: LensData = { sph };
      this.cylValues.forEach(cyl => {
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
              (parseFloat(sph) != -0.50 || parseFloat(cyl) >= -5.50) &&
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
              (parseFloat(sph) != 0.00 || parseFloat(cyl) >= -3.50) &&
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
          if (this.Base == 0) {
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

        if (this.SVType == '1.56 Progressive') {
          if (this.Base == 3) {
            isBlue =
              (parseFloat(sph) != -0.25 || parseFloat(cyl) >= -1.75) &&
              (parseFloat(sph) != -0.50 || parseFloat(cyl) >= -1.50) &&
              (parseFloat(sph) != -0.75 || parseFloat(cyl) >= -1.25) &&
              (parseFloat(sph) != -1.00 || parseFloat(cyl) >= -1.00) &&
              (parseFloat(sph) != -1.25 || parseFloat(cyl) >= -0.75) &&
              (parseFloat(sph) != -1.50 || parseFloat(cyl) >= -0.50) &&
              (parseFloat(sph) != -1.75 || parseFloat(cyl) >= -0.25) &&
              (parseFloat(sph) != -2.00 || parseFloat(cyl) >= -0.00)
          }
          if (this.Base == 1) {
            isBlue =
              (parseFloat(sph) != -0.25 || parseFloat(cyl) <= -2.00) &&
              (parseFloat(sph) != -0.50 || parseFloat(cyl) <= -1.75) &&
              (parseFloat(sph) != -0.75 || parseFloat(cyl) <= -1.50) &&
              (parseFloat(sph) != -1.00 || parseFloat(cyl) <= -1.25) &&
              (parseFloat(sph) != -1.25 || parseFloat(cyl) <= -1.00) &&
              (parseFloat(sph) != -1.50 || parseFloat(cyl) <= -0.75) &&
              (parseFloat(sph) != -1.75 || parseFloat(cyl) <= -0.50) &&
              (parseFloat(sph) != -1.75 || parseFloat(cyl) >= -5.75) &&
              (parseFloat(sph) != -2.00 || parseFloat(cyl) <= -0.25) &&
              (parseFloat(sph) != -2.00 || parseFloat(cyl) >= -5.50) &&
              (parseFloat(sph) != -2.25 || parseFloat(cyl) >= -5.25) &&
              (parseFloat(sph) != -2.50 || parseFloat(cyl) >= -5.00) &&
              (parseFloat(sph) != -2.75 || parseFloat(cyl) >= -4.75) &&
              (parseFloat(sph) != -3.00 || parseFloat(cyl) >= -4.50) &&
              (parseFloat(sph) != -3.25 || parseFloat(cyl) >= -4.25) &&
              (parseFloat(sph) != -3.50 || parseFloat(cyl) >= -4.00) &&
              (parseFloat(sph) != -3.75 || parseFloat(cyl) >= -3.75) &&
              (parseFloat(sph) != -4.00 || parseFloat(cyl) >= -3.50) &&
              (parseFloat(sph) != -4.25 || parseFloat(cyl) >= -3.25) &&
              (parseFloat(sph) != -4.50 || parseFloat(cyl) >= -3.00) &&
              (parseFloat(sph) != -4.75 || parseFloat(cyl) >= -2.75) &&
              (parseFloat(sph) != -5.00 || parseFloat(cyl) >= -2.50) &&
              (parseFloat(sph) != -5.25 || parseFloat(cyl) >= -2.25) &&
              (parseFloat(sph) != -5.50 || parseFloat(cyl) >= -2.00) &&
              (parseFloat(sph) != -5.75 || parseFloat(cyl) >= -1.75) &&
              (parseFloat(sph) != -6.00 || parseFloat(cyl) >= -1.50) &&
              (parseFloat(sph) != -6.25 || parseFloat(cyl) >= -1.25) &&
              (parseFloat(sph) != -6.50 || parseFloat(cyl) >= -1.00) &&
              (parseFloat(sph) != -6.75 || parseFloat(cyl) >= -0.75) &&
              (parseFloat(sph) != -7.00 || parseFloat(cyl) >= -0.50) &&
              (parseFloat(sph) != -7.25 || parseFloat(cyl) >= -0.25) &&
              (parseFloat(sph) != -7.50 || parseFloat(cyl) >= -0.00)
          }
        }

        if (this.SVType == '1.56 ProPlus') {
          if (this.Base == 5) {
            isBlue =
              (parseFloat(sph) != 0.00 || parseFloat(cyl) <= -2.25) &&
              (parseFloat(sph) != 0.25 || parseFloat(cyl) <= -2.00) &&
              (parseFloat(sph) != 0.25 || parseFloat(cyl) >= -3.25) &&
              (parseFloat(sph) != 0.50 || parseFloat(cyl) <= -1.75) &&
              (parseFloat(sph) != 0.50 || parseFloat(cyl) >= -3.00) &&
              (parseFloat(sph) != 0.75 || parseFloat(cyl) <= -1.50) &&
              (parseFloat(sph) != 0.75 || parseFloat(cyl) >= -2.75) &&
              (parseFloat(sph) != 1.00 || parseFloat(cyl) <= -1.25) &&
              (parseFloat(sph) != 1.00 || parseFloat(cyl) >= -2.50) &&
              (parseFloat(sph) != 1.25 || parseFloat(cyl) <= -1.00) &&
              (parseFloat(sph) != 1.25 || parseFloat(cyl) >= -2.25) &&
              (parseFloat(sph) != 1.50 || parseFloat(cyl) <= -0.75) &&
              (parseFloat(sph) != 1.50 || parseFloat(cyl) >= -2.00) &&
              (parseFloat(sph) != 1.75 || parseFloat(cyl) <= -0.50) &&
              (parseFloat(sph) != 1.75 || parseFloat(cyl) >= -1.75) &&
              (parseFloat(sph) != 2.00 || parseFloat(cyl) <= -0.25) &&
              (parseFloat(sph) != 2.00 || parseFloat(cyl) >= -1.50) &&
              (parseFloat(sph) != 2.25 || parseFloat(cyl) >= -1.25) &&
              (parseFloat(sph) != 2.50 || parseFloat(cyl) >= -1.00) &&
              (parseFloat(sph) != 2.75 || parseFloat(cyl) >= -0.75) &&
              (parseFloat(sph) != 3.00 || parseFloat(cyl) >= -0.50) &&
              (parseFloat(sph) != 3.25 || parseFloat(cyl) >= -0.25) &&
              (parseFloat(sph) != 3.50 || parseFloat(cyl) >= -0.00)
          }
          if (this.Base == 1) {
            isBlue =
              (parseFloat(sph) != 0.25 || parseFloat(cyl) >= -0.75) &&
              (parseFloat(sph) != 0.50 || parseFloat(cyl) >= -0.50) &&
              (parseFloat(sph) != 0.75 || parseFloat(cyl) >= -0.25) &&
              (parseFloat(sph) != 1.00 || parseFloat(cyl) >= -0.00)
          }
          if (this.Base == 3) {
            isBlue =
              (parseFloat(sph) != 0.00 || parseFloat(cyl) <= -1.25) &&
              (parseFloat(sph) != 0.25 || parseFloat(cyl) <= -1.00) &&
              (parseFloat(sph) != 0.25 || parseFloat(cyl) >= -1.75) &&
              (parseFloat(sph) != 0.50 || parseFloat(cyl) <= -0.75) &&
              (parseFloat(sph) != 0.50 || parseFloat(cyl) >= -1.50) &&
              (parseFloat(sph) != 0.75 || parseFloat(cyl) <= -0.50) &&
              (parseFloat(sph) != 0.75 || parseFloat(cyl) >= -1.25) &&
              (parseFloat(sph) != 1.00 || parseFloat(cyl) <= -0.25) &&
              (parseFloat(sph) != 1.00 || parseFloat(cyl) >= -1.00) &&
              (parseFloat(sph) != 1.25 || parseFloat(cyl) >= -0.75) &&
              (parseFloat(sph) != 1.50 || parseFloat(cyl) >= -0.50) &&
              (parseFloat(sph) != 1.75 || parseFloat(cyl) >= -0.25) &&
              (parseFloat(sph) != 2.00 || parseFloat(cyl) >= -0.00)
          }
        }

        let sphQ = 0;
        let BarcodeNumber = ''
        let ProductNameDetail = ''

        // Loop through PurchaseDetailList and get the correct quantity
        this.productQtyList.forEach((q: any) => {
          // Check if the ProductName matches the expected name
          if (this.SVType == '1.56 ProPlus') {
            this.SVType = '1.56 Progressive (+)'
          }
          if (
            q.ProductName.includes(`Sph ${sph}`) &&
            q.ProductName.includes(`Cyl ${cyl}`) &&
            q.ProductName.includes(`${this.SVType}`) &&
            q.ProductName.includes(`Base ${this.Base}`)
          ) {
            sphQ = q.BarCodeCount;
            BarcodeNumber = q.Barcode;
            ProductNameDetail = q.ProductName;
          }
          if (
            q.ProductName.includes(`Sph ${sph}`) &&
            q.ProductName.includes(`Cyl ${cyl}`) &&
            q.ProductName.includes(`${this.SVType} Index`) &&
            q.ProductName.includes(`Base ${this.Base}`)
          ) {
            sphQ = q.BarCodeCount;
            BarcodeNumber = q.Barcode;
            ProductNameDetail = q.ProductName;
          }
          if (
            q.ProductName.includes(`Sph ${sph}`) &&
            q.ProductName.includes(`Cyl ${cyl}`) &&
            q.ProductName.includes(`${this.SVType} (-)`) &&
            q.ProductName.includes(`Base ${this.Base}`)
          ) {
            sphQ = q.BarCodeCount;
            BarcodeNumber = q.Barcode;
            ProductNameDetail = q.ProductName;
          }

        });
        if (this.SVType == '1.56 Progressive (+)') {
          this.SVType = '1.56 ProPlus'
        }
        row[cyl] = {
          value: sphQ,
          Barcode: BarcodeNumber,
          ProductName: ProductNameDetail,
          isBlue: isBlue, // Mark cell as blue or not
        };
      });
      grid.push(row);
    });

    return grid;

  }

  openModalSale(contentSale: any, data: any) {
    if (this.requestQty > this.lenQty) {
      // Store the reference to the modal
      const modalRef = this.modalService.open(contentSale, { centered: true, backdrop: 'static', keyboard: false, size: 'md' });

      // Assign sale properties
      this.sale.ProductName = data.ProductName;
      this.sale.Barcode = data.Barcode;
      this.sale.AvailableQty = data.value;
      this.sale.SaleQty = '';

      // Store the reference to use later
      this.saleModalRef = modalRef; // Store the modal reference for dismissal
    } else {
      Swal.fire({
        position: 'center',
        icon: 'warning',
        title: 'SaleQty Limit Cross',
      });
    }
  }

  addSaleRow() {
    this.lenQty = 0
    this.addList.push(this.sale);
    this.addList.forEach((r: any) => {
      this.lenQty += Number(r.SaleQty);
    });

    if (this.lenQty == this.requestQty) {
      this.disabledBtn = true
    } else {
      this.disabledBtn = false
    }

    this.sale = {};

    if (this.saleModalRef) {
      this.saleModalRef.close();
      this.saleModalRef = null;
    }
  }

  SaveSale() {
    this.sp.show();
    this.OrderList.saleListData = this.addList
    this.OrderList.SaleQuantity = this.lenQty
    const subs: Subscription = this.bill.orderformsubmit(this.OrderList).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.getOrderData('Order Request', 'Request')
          this.modalService.dismissAll()
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Order has been Transfer.',
            showConfirmButton: false,
            timer: 1000
          })
        } else {
          this.as.errorToast(res.message);
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  ReadyForDelivery(data: any) {
    this.sp.show();
    const subs: Subscription = this.bill.orderformAccept(data.ID).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.getOrderData('Order Transfer', 'Request')
          this.modalService.dismissAll()
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Order has been Ready For Delivery.',
            showConfirmButton: false,
            timer: 1000
          })
        } else {
          this.as.errorToast(res.message);
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  deleteItem(i: any, data: any) {
    this.lenQty = this.lenQty - Number(data.SaleQty);
    this.addList.splice(i, 1);
    if (this.lenQty == this.requestQty) {
      this.disabledBtn = true
    } else {
      this.disabledBtn = false
    }
  }

  OrderPrint(data: any) {
    this.sp.show()
    data.MeasurementID = JSON.stringify(data.MeasurementID)
    let Body: any = {
      data: data
    }

    let body: any = {}
    body = Body
    body.customer = {
      Name: data.CustomerName
    }
    body.billMaster = {
      InvoiceNo: data.InvoiceNo
    },

      body.billItemList = data.BillDetails
    let shopse = this.shopList.filter((s: any) => s.ID == Number(this.selectedShop[0]));
    body.Shop = shopse[0]
    body.Company = this.company;
    body.CompanySetting = this.companySetting;
    const subs: Subscription = this.bill.orderFormPrint(body).subscribe({
      next: (res: any) => {
        if (res) {

          const url = this.evn.apiUrl + "/uploads/" + res;
          window.open(url, "_blank")
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }


  onChange(event: { toUpperCase: () => any; toTitleCase: () => any; }) {
    if (this.companySetting.DataFormat === '1') {
      event = event.toUpperCase()
    } else if (this.companySetting.DataFormat == '2') {
      event = event.toTitleCase()
    }
    return event;
  }

  getProductList() {
    this.sp.show();
    const subs: Subscription = this.ps.getList().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.prodList = res.data.filter((el: any) => el.Name.toUpperCase() === 'LENS SEMI-FINISHED');

          if (this.prodList.length) {
            this.data.ProductCategory = this.prodList[0].ID;
            this.getFieldList()
          }
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
    if (this.data.ProductCategory !== 0) {
      this.prodList.forEach((element: any) => {
        if (element.ID === this.data.ProductCategory) {
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
    } else {
      this.specList = [];
      this.data.ProductName = '';
      this.data.ProductCategory = 0;
    }
  }

  // getSptTableData() {
  //   this.specList.forEach((element: any) => {
  //     if (element.FieldType === 'DropDown' && element.Ref === '0') {
  //       const subs: Subscription = this.ps.getProductSupportData('0', element.SptTableName).subscribe({
  //         next: (res: any) => {
  //           if (res.success) {
  //             element.SptTableData = res.data.sort((a: { TableValue: string; }, b: { TableValue: any; }) => (a.TableValue.trim()).localeCompare(b.TableValue));
  //             element.SptFilterData = res.data.sort((a: { TableValue: string; }, b: { TableValue: any; }) => (a.TableValue.trim()).localeCompare(b.TableValue));
  //             if (element.SptFilterData.FieldName === 'TYPE') {
  //               element.SptFilterData =  element.SptFilterData.filter(
  //                 (item: any) => item.TableValue === 'PROGRESSIVE'
  //               );
  //             }
  //           } else {
  //             this.as.errorToast(res.message)
  //           }
  //         },
  //         error: (err: any) => console.log(err.message),
  //         complete: () => subs.unsubscribe(),
  //       });
  //     }
  //   });
  // }

  getSptTableData() {
    this.specList.forEach((element: any) => {
      if (element.FieldType === 'DropDown' && element.Ref === '0') {
        const subs: Subscription = this.ps.getProductSupportData('0', element.SptTableName).subscribe({
          next: (res: any) => {
            if (res.success) {
              // Sort the data
              element.SptTableData = res.data.sort((a: { TableValue: string }, b: { TableValue: any }) =>
                a.TableValue.trim().localeCompare(b.TableValue.trim())
              );

              // Copy sorted data to SptFilterData
              element.SptFilterData = [...res.data];

              // Apply filter if FieldName is 'TYPE'
              if (element.FieldName === 'TYPE') {
                element.SptFilterData = element.SptFilterData.filter(
                  (item: any) => item.TableValue === this.BaseS.toUpperCase()
                );
              }
            } else {
              this.as.errorToast(res.message);
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

  getProductLists() {
    this.sp.show();
    this.filter()
    let dpt = this.data.ProductName
      .replace(/^LENS\s*SEMI-FINISHED\//i, '') // remove LENS SEMI-FINISHED/
      .replace(/\/\d+_/g, '/')                // remove ANY number_
      .replace(/\/+/g, '/')                   // fix double slashes
      .trim();

    this.Req.searchString = dpt;
    const subs: Subscription = this.bill.ordersearchByString(this.Req, 'false', 'false').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.productQtyLists = res.data
          this.plusToplusS('-sph+cyl')
        } else {
          this.as.errorToast(res.message);
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }
  // openModalS1(content01: any,data:any) {
  //   this.getFieldList()
  //   this.productQtyLists = []
  //   this.sphMinS = 0
  //   this.sphMaxS = 0
  //   this.sphStepS = 0
  //   this.cylMinS = 0
  //   this.cylMaxS = 0
  //   this.cylStepS = 0
  //   this.BaseS = ''
  //   let ProductNameFind = '';
  //   const productName = data.ProductName.toUpperCase();

  //   if (productName.includes("BIFOCAL")) {
  //     ProductNameFind = 'Bifocal';
  //   } else if (productName.includes("PROGRESSIVE")) {
  //     ProductNameFind = 'Progressive';
  //   } else if (productName.includes("SINGLE VISION")) {
  //     ProductNameFind = 'Single Vision';
  //   }

  //   this.BaseS = ProductNameFind;

  //   this.modalService.open(content01, { centered: true, backdrop: 'static', keyboard: false, size: 'xxl' });
  //   this.lenQty = 0
  //   this.SVTypeS = ''
  //   this.addList = []
  //   this.requestQty = data.Quantity 
  //   this.OrderList = data
  //   this.lenslistS = []
  // }

  openModalS1(content01: any, data: any) {
    this.getProductList();
    this.productQtyLists = [];

    let ProductNameFind = '';
    const productName = data.ProductName.toUpperCase();

    if (productName.includes("BIFOCAL")) {
      ProductNameFind = 'Bifocal';
    } else if (productName.includes("PROGRESSIVE")) {
      ProductNameFind = 'Progressive';
    } else if (productName.includes("SINGLE VISION")) {
      ProductNameFind = 'Single Vision';
    }

    this.BaseS = ProductNameFind;

    const modalRef = this.modalService.open(content01, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      size: 'xxl'
    });

    // Reset variables when the modal is closed or dismissed
    modalRef.result
      .then(() => {
        this.resetModalData(data);
      })
      .catch(() => {
        this.resetModalData(data);
      });

    this.lenQty = 0;
    this.SVTypeS = '';
    this.addList = [];
    this.requestQty = data.Quantity;
    this.OrderList = data;
    this.lenslistS = [];
  }

  // Helper function to reset modal-related variables
  private resetModalData(data: any): void {
    this.BaseS = '';
    data = ''; // Reset the ProductName to blank
    this.sphMinS = 0;
    this.sphMaxS = 0;
    this.sphStepS = 0;
    this.cylMinS = 0;
    this.cylMaxS = 0;
    this.cylStepS = 0;
    this.productQtyLists = []
    this.cylValuesS = []
    this.sphValuesS = []
    this.displayedColumnsS = []
    this.dataSourceS = []
  }


  baseChangeS(base: any) {
    if (base == this.BaseS && base == this.BaseS) {
      this.plusToplusS('-sph+cyl')
      this.generateGridS()
    }
    else {
      this.plusToplusS('-sph-cyl')
      this.generateGridS()
    }
  }

  plusToplusS(mode: any) {
    this.plustoplusS = mode;
    this.generateGridS()
  }

  generateGridS() {
    if (this.BaseS == 'Progressive' || this.BaseS == 'Bifocal' || this.BaseS != 'Single Vision') {
      this.sphMinS = 0
      this.sphMaxS = 12
      this.sphStepS = 1
      this.cylMinS = 1
      this.cylMaxS = 3.50
      this.cylStepS = 0.25
      this.sphValuesS = this.generateRangeS(this.sphMinS, this.sphMaxS, this.sphStepS, 'sph');
      this.cylValuesS = this.generateRangeS(this.cylMinS, this.cylMaxS, this.cylStepS, 'cyl');
      this.displayedColumnsS = ['cyl', ...this.cylValuesS]; // Include 'cyl' as the first column
      this.dataSourceS = this.initializeGridS(); // Initialize grid data
    } else {
      this.sphMinS = 0
      this.sphMaxS = 12
      this.sphStepS = 1
      this.cylMinS = 0
      this.cylMaxS = 0
      this.cylStepS = 0.25
      this.sphValuesS = this.generateRangeS(this.sphMinS, this.sphMaxS, this.sphStepS, 'sph');
      this.cylValuesS = this.generateRangeS(this.cylMinS, this.cylMaxS, this.cylStepS, 'cyl');
      this.displayedColumnsS = ['cyl', ...this.cylValuesS]; // Include 'cyl' as the first column
      this.dataSourceS = this.initializeGridS(); // Initialize grid data
    }
  }

  generateRangeS(min: number, max: number, step: number, type: 'sph' | 'cyl'): string[] {
    const range = [];
    for (let i = min; i <= max; i += step) {
      let value = ''
      if (type !== 'sph') {
        value = i.toFixed(2);
      } else {
        value = i.toFixed(0);
      }
      switch (this.plustoplusS) {
        case '+sph+cyl':
          value = `-${value}`;
          break;
        case '-sph+cyl':
          value = type === 'sph' ? `${value}` : `+${value}`;
          break;
      }
      range.push(value);
    }
    return range;
  }

  initializeGridS(): LensDataS[] {
    const grid: any = [];
    this.sphValuesS.forEach(sph => {
      const row: LensDataS = { sph };
      this.cylValuesS.forEach(cyl => {
        let isBlue = {}
        let sphQ = 0
        let BarcodeNumber = ''
        let ProductNameDetail = ''
        this.productQtyLists.forEach((q: any) => {
          if (this.BaseS.toUpperCase() != 'SINGLE VISION') {
            if (q.ProductName.includes(`1.56 Index`) && q.ProductName.includes(`Base ${sph}/Add ${cyl}`)
            ) {
              sphQ = q.BarCodeCount;
              BarcodeNumber = q.Barcode;
              ProductNameDetail = q.ProductName;
            }
          } else {
            if (
              q.ProductName.includes(`1.56 Index`) &&
              q.ProductName.includes(`Base ${sph}`)
            ) {
              sphQ = q.BarCodeCount;
              BarcodeNumber = q.Barcode;
              ProductNameDetail = q.ProductName;
            }
          }
        });
        row[cyl] = {
          value: sphQ,
          Barcode: BarcodeNumber,
          ProductName: ProductNameDetail,
          isBlue: isBlue, // Mark cell as blue or not
        };
      });
      grid.push(row);
    });
    return grid;
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

  openModalfg(content4: any, data: any) {
    this.modalService.open(content4, { centered: true, backdrop: 'static', keyboard: false, size: 'xxl' });
    this.axisAddEyeShow = true
    this.lenslistS = []
    this.addList = []
    this.productQtyList = []
    this.fishedBase = '';
    this.isActive1 = false;
    this.isActive2 = false;
    this.isActive3 = false;
    // this.indexProdcutName =  data.ProductName.replace(/\b\d+(\.\d+)?\s*INDEX\b/gi, '');
    // 2️⃣ POWER remove (jaise: "SPH +4.25 TO +6.00")
    this.indexProdcutName = data.ProductName.replace(/SPH\s*[+-]?\d+(\.\d+)?\s*TO\s*[+-]?\d+(\.\d+)?/gi, '');
    // 3️⃣ Extra / clean
    this.indexProdcutName = data.ProductName.replace(/\/{2,}/g, '/').replace(/\/$/g, '').trim();
    this.toggleActive(1)
    this.ProductData(data.ProductName)
    if (this.indexProdcutName.includes('SINGLE VISION')) {
      this.plusToplusfg('+sph+cyl')
      this.svChange = true
    } else {
      this.plusToplusfg('-sph+cyl')
      this.svChange = false
    }
    this.indexProdcutName = data.ProductName
    this.requestQty = data.Quantity
    this.OrderList = data
    // this.generateGridfg()
    // this.specList.forEach((element: any) => {
    //   if (element.CheckBoxValue === false || element.CheckBoxValue === undefined) {
    //     element.SelectedValue = '';
    //   } else {
    //      element.SelectedValue = element.SelectedValue;
    //     if(element?.FieldName === 'TYPE' || element?.FieldName === 'type'){
    //  if (element?.SelectedValue?.toUpperCase().includes('SINGLE VISION')) {
    //       this.axisAddEyeShow =  false
    //     } else {
    //       this.axisAddEyeShow = true
    //     }
    //     }
    //   }
    // });
  }

  plusToplusfg(mode: any) {
    this.plustoplusfg = mode;
    this.generateGridfg()
  }

  generateGridfg() {
    if (this.indexProdcutName.includes('SINGLE VISION')) {
      this.sphMinfg = 0.00
      this.sphMaxfg = 4.00
      this.sphStepfg = 0.25
      this.cylMinfg = 0.00
      this.cylMaxfg = 4.00
      this.cylStepfg = 0.25
      this.sphValuesfg = this.generateRangefg(this.sphMinfg, this.sphMaxfg, this.sphStepfg, 'sph');
      this.cylValuesfg = this.generateRangefg(this.cylMinfg, this.cylMaxfg, this.cylStepfg, 'cyl');
      this.displayedColumnsfg = ['cyl', ...this.cylValuesfg]; // Include 'cyl' as the first column
      this.dataSourcefg = this.initializeGridfg(); // Initialize grid data
    } else {
      this.sphMinfg = 0.00
      this.sphMaxfg = 4.00
      this.sphStepfg = 0.25
      this.cylMinfg = 0.75
      this.cylMaxfg = 4
      this.cylStepfg = 0.25
      this.sphValuesfg = this.generateRangefg(this.sphMinfg, this.sphMaxfg, this.sphStepfg, 'sph');
      this.cylValuesfg = this.generateRangefg(this.cylMinfg, this.cylMaxfg, this.cylStepfg, 'cyl');
      this.displayedColumnsfg = ['cyl', ...this.cylValuesfg]; // Include 'cyl' as the first column
      this.dataSourcefg = this.initializeGridfg(); // Initialize grid data
    }
  }

  generateRangefg(min: number, max: number, step: number, type: 'sph' | 'cyl'): string[] {
    const range = [];
    for (let i = min; i <= max; i += step) {
      let value = i.toFixed(2);
      if (value === '0.00') {
        value = 'PLANO';
      } else {
        switch (this.plustoplusfg) {
          case '-sph-cyl':
            value = `-${value}`;
            break;
          case '+sph+cyl':
            value = `+${value}`;
            break;
          case '-sph+cyl':
            value = type === 'sph' ? `+${value}` : `${value}`;
            break;
          case '+sph-cyl':
            value = type === 'sph' ? `+${value}` : `-${value}`;
            break;
        }
      }
      range.push(value);
    }
    return range;
  }

  initializeGridfg(): LensDatafg[] {
    const grid: any = [];
    this.sphValuesfg.forEach(sph => {
      const row: LensDatafg = { sph };
      this.cylValuesfg.forEach(cyl => {
        // Define active blue cells based on conditions

        let isBlue = {}
        let sphQ = 0;
        let BarcodeNumber = ''
        let ProductNameDetail = ''

        // Loop through PurchaseDetailList and get the correct quantity
        this.productQtyList.forEach((q: any) => {

          if (!q?.ProductName) return;

          const pname = q.ProductName.toLowerCase();

          const matchSph =
            !pname.includes('sph') || pname.includes(`sph ${sph}`.toLowerCase());

          const matchAdd =
            !pname.includes('add') || pname.includes(`add ${cyl}`.toLowerCase());

          // 🔥 CYL FIX (PLANO LOGIC)
          let matchCyl = false;
          if (this.svChange == true) {
            const hasCyl = pname.includes('cyl');
            const isPlanoCyl = cyl === '0' || cyl === '0.00' || cyl === 'PLANO';
            if (hasCyl) {
              matchCyl = pname.includes(`cyl ${cyl}`.toLowerCase());
            } else {
              matchCyl = isPlanoCyl;
            }
          } else {
            matchCyl = true
          }

          if (matchSph && matchAdd && matchCyl) {
            sphQ = q.BarCodeCount;
            BarcodeNumber = q.Barcode;
            ProductNameDetail = q.ProductName;
          }
        });

        row[cyl] = {
          value: sphQ,
          Barcode: BarcodeNumber,
          ProductName: ProductNameDetail,
          isBlue: isBlue, // Mark cell as blue or not
        };
      });
      grid.push(row);
    });
    return grid;
  }


  // regular lens grid

  getProductListGrid() {
    this.sp.show();
    let dpt = this.indexProdcutNameGrid
    this.Req.searchString = dpt;
    const subs: Subscription = this.bill.ordersearchByString(this.Req, 'false', 'false').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.productQtyListGrid = res.data
          this.plusToplusGrid('+sph+cyl')
        } else {
          this.as.errorToast(res.message);
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  openModalGrid(content5: any, data: any) {
    this.modalService.open(content5, { centered: true, backdrop: 'static', keyboard: false, size: 'xxl' });
    this.isActive1Grid = false;
    this.isActive2Grid = false;
    this.isActive3Grid = false;
    this.AxisAddHide = data.ProductName.includes(`SINGLE VISION`) ? false : true;

    this.indexProdcutNameGrid = data.ProductName
    this.additionGrid = '' 
    this.axisGrid = ''
    this.getAsixGrid()
    this.getAdditionGrid()
    this.toggleActiveGrid(1)
    this.getProductListGrid()
    // this.plusToplusGrid('+sph+cyl')
    // this.generateGridGrid()
    this.lenslistGrid = []
    this.addList = []
    this.requestQty = data.Quantity
    this.OrderList = data
  }

   getAsixGrid() {
      this.sp.show();
      const subs: Subscription = this.supps.getList('Axis').subscribe({
        next: (res: any) => {
          if (res.success) {
            this.axisListGrid = res.data.sort((a: any, b: any) => parseFloat(a.Name) - parseFloat(b.Name));
          } else {
            this.as.errorToast(res.message)
          }
          this.sp.hide();
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    }
  
    getAdditionGrid() {
      this.sp.show();
      const subs: Subscription = this.supps.getList('Addition').subscribe({
        next: (res: any) => {
          if (res.success) {
            this.additionListGrid = res.data.sort((a: any, b: any) => parseFloat(a.Name) - parseFloat(b.Name))
          } else {
            this.as.errorToast(res.message)
          }
          this.sp.hide();
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    }

  plusToplusGrid(mode: any) {
    this.plustoplusGrid = mode;
    this.generateGridGrid()
  }

  toggleActiveGrid(buttonNumber: number) {
    if (buttonNumber === 1) {
      this.isActive1Grid = !this.isActive1Grid;
      this.isActive2Grid = false; // Optional: deactivate other buttons
      this.isActive3Grid = false;
    } else if (buttonNumber === 2) {
      this.isActive1Grid = false;
      this.isActive2Grid = !this.isActive2Grid;
      this.isActive3Grid = false;
    } else if (buttonNumber === 3) {
      this.isActive1Grid = false;
      this.isActive2Grid = false;
      this.isActive3Grid = !this.isActive3Grid;
    }
  }

  generateGridGrid() {
    this.sphStepGrid = this.sphStepGrid < 0.25 ? 0.25 : this.sphStepGrid;
    this.cylStepGrid = this.cylStepGrid < 0.25 ? 0.25 : this.cylStepGrid;

    this.sphValuesGrid = this.generateRangeGrid(this.sphMinGrid, this.sphMaxGrid, this.sphStepGrid, 'sph');
    this.cylValuesGrid = this.generateRangeGrid(this.cylMinGrid, this.cylMaxGrid, this.cylStepGrid, 'cyl');
    this.displayedColumnsGrid = ['cyl', ...this.cylValuesGrid]; // Include 'cyl' as the first column
    this.dataSourceGrid = this.initializeGridGrid(); // Initialize grid data

  }

  generateRangeGrid(min: number, max: number, step: number, type: 'sph' | 'cyl'): string[] {
    const range = [];
    for (let i = min; i <= max; i += step) {
      let value = i.toFixed(2);
      if (value === '0.00') {
        value = 'PLANO';
      } else {
        switch (this.plustoplusGrid) {
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
      }
      range.push(value);
    }
    return range;
  }

  initializeGridGrid(): LensDataGrid[] {
    const grid: any = [];
    this.sphValuesGrid.forEach(sph => {
      const row: LensDataGrid = { sph };
      this.cylValuesGrid.forEach(cyl => {
        let isBlue = {}
        let sphQ = 0
        let BarcodeNumber = ''
        let ProductNameDetail = ''
        this.productQtyListGrid.forEach((q: any) => {
          // if (q.ProductName.includes(`INDEX`) && q.ProductName.includes(`Sph ${sph}/Cyl ${cyl}`)) {
          //   sphQ = q.BarCodeCount;
          //   BarcodeNumber = q.Barcode;
          //   ProductNameDetail = q.ProductName;
          // }
         const condIndex = q.ProductName.includes(`INDEX`) ? true : true;
          const condSphCyl = q.ProductName.includes(`Sph ${sph}/Cyl ${cyl}`);
          const condAdd = this.additionGrid ? q.ProductName.includes(`Add ${this.additionGrid}`) : true;
          const condAxis = this.axisGrid ? q.ProductName.includes(`Axis ${this.axisGrid}`) : true;

if (condIndex && condSphCyl && condAdd && condAxis) {
  sphQ = q.BarCodeCount;
  BarcodeNumber = q.Barcode;
  ProductNameDetail = q.ProductName;
}

         
        });

        row[cyl] = {
          value: sphQ,
          Barcode: BarcodeNumber,
          ProductName: ProductNameDetail,
          isBlue: isBlue,
        };
      });
      grid.push(row);
    });
    return grid;
  }

// Rx order

openModalRx(contentRx: any, data: any) {
    this.modalService.open(contentRx, { centered: true, backdrop: 'static', keyboard: false, size: 'xxl' });
    this.addList = []
    this.orderSupplier.ProductName  = data.ProductName
    this.orderSupplier.Quantity = data.Quantity
    this.orderSupplier = data
    this.getdropdownSupplierlist()
  }

  
    getdropdownSupplierlist() {
      this.sp.show();
      const subs: Subscription = this.sup.dropdownSupplierlist('').subscribe({
        next: (res: any) => {
          if (res.success) {
            this.supplierDropList = res.data;
          } else {
            this.as.errorToast(res.message)
          }
          this.sp.hide();
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    }

    SaveRx(){
     console.log(this.orderSupplier)
    }
}
