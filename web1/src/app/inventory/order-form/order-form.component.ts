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

interface LensData {
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
  selectedShop:any =JSON.parse(localStorage.getItem('selectedShop') || '') ;

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
  ) { }

  data:any={
    ShopID:'',ProductStatus:''
  }
  ShopID:any
  saleModalRef:any
  shopList:any=[];
  dataList:any=[];
  filterdata:any=[];
  productQtyList:any=[];
  addList:any=[];
  Req: any = { SearchBarCode: '', searchString: " ", SupplierID: 0 }

  ProductTypeFilter:any;

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

  lens: any = {
    productname: '', purchasePrice: 0, quantity: 0, GSTtype: 'None', GSTPercent: 0, retailPrice: 0, wholesalePrice: 0, axis: '', addtion: '', eye: ''
  }

  sale:any={
    ProductName:'',Barcode:'',SaleQty:'',AvailableQty:''
  }
  OrderList:any=[]
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
   axisFilter :any = 0
   addtionFilter :any = 0
   FilterDetailList :any = []
   SVType:any
   Base:any

  ngOnInit(): void {
    this.dropdownShoplist()
  }

  dropdownShoplist(){
    this.sp.show()
    const subs: Subscription = this.ss.dropdownShoplist('').subscribe({
      next: (res: any) => {
        if(res.success){
          this.shopList  = res.data
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  shopFilter(){
    this.filterdata = []
    this.dataList.forEach((e: any) =>{
      if(e.OrderInvoiceShopID == this.ShopID){
        this.filterdata.push(e)
      }
    })
    
     if(this.ShopID == 0){
      this.filterdata =  this.dataList
     }
  }

  getOrderData(data:any){
    this.dataList = []
    this.data.ShopID = this.selectedShop[0]
    this.data.ProductStatus = data
    const subs: Subscription = this.bill.orderformrequest(this.data).subscribe({
      next: (res: any) => {
        if(res.success){
          res.data.forEach((e: any) =>{
            e.MeasurementID = JSON.parse(e.MeasurementID)
          })
          this.dataList  = res.data
          this.filterdata  = res.data
          console.log( this.dataList );
          
          
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  ProductData(data:any) {
    this.Req.searchString = data
        const subs: Subscription = this.bill.searchByString(this.Req, 'false', 'false').subscribe({
          next: (res: any) => {
            if (res.success) {
             this.productQtyList = res.data
             console.log(this.productQtyList);
             
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
  
  openModalS(content1: any,data:any) {
    this.modalService.open(content1, { centered: true, backdrop: 'static', keyboard: false, size: 'xxl' });
    this.isActive1 = true;
    this.isActive2 = false;
    this.isActive3 = false;
    this.pp = 0
    this.mm = 0
    this.pm = 0
    this.lenQty = 0
    this.SVType = ''
    this.Base = ''
    this.productQtyList = []
    this.addList = []
    this.ProductData(data.ProductName)
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
      if ( base == 6 || base == 7 || base == 8 || base == 9 || base == 10 || base == 11 || base == 12) {
        this.plusToplus('+sph-cyl')
        this.generateGrid()
      }
      else {
        this.plusToplus('-sph-cyl')
        this.generateGrid()
      }
    }
  
    if (mode == '1.56 ProPlus') {
      if ( base == 1 || base == 3 || base == 5 ) {
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
    let baseConfigurations: any={}, defaultCylConfig: any={}
  
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
  
    if (this.SVType == '1.56 Progressive'){
      baseConfigurations = {
        3: { sphMinL: 0.25, sphMaxL: 2, sphStepL: 0.25 },
        1: { sphMinL: 0.25, sphMaxL: 7.50, sphStepL: 0.25 },
      };
  
      defaultCylConfig = {
        3: { cylMinL: 0, cylMaxL: 6, cylStepL: 0.25 },
        1: { cylMinL: 0, cylMaxL: 6, cylStepL: 0.25 },
      }
    }
  
    if (this.SVType == '1.56 ProPlus'){
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
  
    if(this.Base == ''){
      baseConfigurations = ''
    }
    if(this.Base == ''){
      defaultCylConfig = ''
    }

    if (baseConfigurations[this.Base] || baseConfigurations != '' || defaultCylConfig != '')  {
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
    }else{
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
            (parseFloat(sph) != 1.50 || parseFloat(cyl) >= -0.50)  &&
            (parseFloat(sph) != 1.75 || parseFloat(cyl) >= -0.25)  &&
            (parseFloat(sph) != 2.00 || parseFloat(cyl) >= -0.00)  
          }
        }
  
        let sphQ = 0;
        let BarcodeNumber = ''
        let ProductNameDetail = ''
        // Loop through PurchaseDetailList and get the correct quantity
        this.productQtyList.forEach((q: any) => {
          // Check if the ProductName matches the expected name
          if (
            q.ProductName.includes(`Sph ${sph}`) &&
            q.ProductName.includes(`Cyl ${cyl}`) &&
            q.ProductName.includes(`${this.SVType} (-)`) || q.ProductName.includes(`${this.SVType} (+)`) &&
            q.ProductName.includes(`Base ${this.Base}`)
          ){
            sphQ = q.BarCodeCount;
            BarcodeNumber = q.Barcode;
            ProductNameDetail = q.ProductName;
          }
          if (
            q.ProductName.includes(`Sph ${sph}`) &&
            q.ProductName.includes(`Cyl ${cyl}`) &&
            q.ProductName.includes(`${this.SVType} Index`) &&
            q.ProductName.includes(`Base ${this.Base}`)
          ){
            sphQ = q.BarCodeCount;
            BarcodeNumber = q.Barcode;
            ProductNameDetail = q.ProductName;
          }
        });
  
        row[cyl] = {
          value: sphQ,
          Barcode:BarcodeNumber,
          ProductName:ProductNameDetail,
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

    this.sale = {};
  
    if (this.saleModalRef) {
      this.saleModalRef.close(); 
      this.saleModalRef = null; 
    }
  }
  
SaveSale(){
  this.sp.show();
  this.OrderList.saleListData = this.addList
  this.OrderList.SaleQuantity = this.lenQty
  const subs: Subscription = this.bill.orderformsubmit(this.OrderList).subscribe({
    next: (res: any) => {
      if (res.success) {
        this.getOrderData('Order Request')
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


deleteItem(i:any,data:any){
  this.lenQty = this.lenQty - Number(data.SaleQty);
  this.addList.splice(i, 1);
}


OrderPrint(data: any) {
  this.sp.show()
  data.MeasurementID = JSON.stringify(data.MeasurementID)
  let Body: any = {
    data: data
  }

  let body :any = {}
  body = Body
  body.customer = {
    Name:data.CustomerName
  }
  body.billMaster = {
    InvoiceNo:data.InvoiceNo
  },

  [body.Shop] = this.shop.filter((s: any) => s.ID === Number(this.selectedShop[0]));;
  body.Company = this.company;
  body.CompanySetting = this.companySetting;
  const subs: Subscription = this.bill.orderFormPrint(body).subscribe({
    next: (res: any) => {
      if (res) {

        const url = this.evn.apiUrl + "/uploads/" + res ;
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



}
