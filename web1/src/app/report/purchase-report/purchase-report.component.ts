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
import { jsPDF } from "jspdf";
import { SupportService } from 'src/app/service/support.service';
import html2canvas from 'html2canvas';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormControl } from '@angular/forms';
import * as saveAs from 'file-saver';
interface LensData {
  sph: string;
  [key: string]: any;
}

@Component({
  selector: 'app-purchase-report',
  templateUrl: './purchase-report.component.html',
  styleUrls: ['./purchase-report.component.css']
})

export class PurchaseReportComponent implements OnInit {
  env = environment;
  user:any =JSON.parse(localStorage.getItem('user') || '') ;
  shop:any =JSON.parse(localStorage.getItem('shop') || '') ;
  selectedShop:any =JSON.parse(localStorage.getItem('selectedShop') || '') ;
  permission = JSON.parse(localStorage.getItem('permission') || '[]');
  companySetting:any = JSON.parse(localStorage.getItem('companysetting') || '[]');

  myControl = new FormControl('All');
  filteredOptions: any ;
  searchValue:any= ''
  supplierList :any;
  shopList :any;
  selectsShop :any;
  PurchaseMasterList:any = [];
  totalQty: any;
  totalDiscount: any;
  totalUnitPrice: any;
  totalAmount: any;
  roundOffAmount: any;
  totalGstAmount: any;
  gstMaster: any;
  Productsearch :any = '';
  PurchaseDetailList:any = [];
  selectedProduct: any;
  prodList:any;
  specList: any;
  gstList: any;
  DetailtotalQty: any = 0;
  DetailtotalDiscount: any = 0;
  DetailtotalUnitPrice: any = 0;
  DetailtotalSubTotal: any = 0;
  DetailtotalAmount: any = 0;
  DetailtotalGstAmount: any = 0;
  DetailtotalWholeSalePrice: any = 0;
  DetailtotalRetailPrice: any = 0;
  gstdetails:any=[]
  TtlR:any = 0
  TtlW:any = 0

  v :any = []
  PurchaseChargeList :any = [];
  ChargeAmount:any
  ChargetotalAmount: any;
  ChargetotalGstAmount: any;
  gstCharge:any


  ProductExpiryList:any = [];
  specList1:any
  ExpirytotalQty :any
  ExpirytotalDiscount :any
  ExpirytotalUnitPrice :any
  ExpirytotalGstAmount :any
  ExpirytotalAmount :any
  gstExpirys :any
  todaydate: any;


  totalAmountD : any;
  totalDiscountD : any;
  totalDueAmountD : any;
  totalGstAmountD : any;
  totalPaidAmountD : any;
  totalQtyD : any;
  totalSubTotalD : any;
  dataList1: any = []

  columnVisibility: any = {
    SNo: true,
    Supplier: true,
    CurrentShop: true,
    InvoiceNo: true,
    InvoiceDate: true,
    PaymentStatus: true,
    Quantity: true,
    Discount: true,
    SubTotal: true,
    TAXAmount: true,
    IGST: true,
    SGST: true,
    CGST: true,
    GrandTotal: true,
    SupplierTAXNo: true,
  };

  columnVisibility1: any = {
    SNo: true,
    InvoiceNo: true,
    InvoiceDate: true,
    Supplier: true,
    TAXNo: true,
    ProductType: true,
    HSNCode: true,
    Product: true,
    Qty: true,
    UnitPrice: true,
    Dis: true,
    SubTotal: true,
    TAXType: true,
    TAX: true,
    TAXAmt: true,
    GrandTotal: true,
    BarCode: true,
    PaymentStatus: true,
    RetailPer_PcPrice: true,
    RetailTotalPrice: true,
    WholeSalePer_PcPrice: true,
    WholeSaleTotalPrice: true,
    CurrentShop: true,
  }

  columnVisibility2: any = {
    SNo: true,
    ShopName: true,
    InvoiceNo: true,
    Description: true,
    Amount: true,
    TAXType: true,
    TAX: true,
    TAXAmount: true,
    GrandTotal: true,
  };

  columnVisibility3: any = {
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
    TAXAmt: true,
    TAXType: true,
    GrandTotal: true,
    PaymentStatus: true,
    RetailPrice: true,
    WholeSalePrice: true,
    ProductExpiryDate: true,
  }

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

  PurchaseMaster: any =  {
    FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, SupplierID: 0,
    SupplierGSTNo:'All', PaymentStatus: 0,
  };

  PurchaseDetail: any =  {
    FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, SupplierID: 0,
    PaymentStatus: 0,  ProductCategory : 0, ProductName:'', GSTType: 0, GSTPercentage: 0
  };

  charge: any =  {
    FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0
  };

  ProductExpiry: any =  {
    FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, SupplierID: 0,
    PaymentStatus: 0,  ProductCategory : 0, ProductName:'', GSTType: 0, GSTPercentage: 0
  };

  data1: any = {
    FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, SupplierID: 0, VendorStatus: 0,
  };

  viewPurchaseReport = false
  addPurchaseReport = false
  editPurchaseReport = false
  deletePurchaseReport = false

  viewPurchaseProductReport = false
  addPurchaseProductReport = false
  editPurchaseProductReport = false
  deletePurchaseProductReport = false

  viewPurchaseChargeReport = false
  addPurchaseChargeReport = false
  editPurchaseChargeReport = false
  deletePurchaseChargeReport = false

  viewPurchaseProductExpiryReport = false
  addPurchaseProductExpiryReport = false
  editPurchaseProductExpiryReport = false
  deletePurchaseProductExpiryReport = false

  viewSupplierDueAmonutReport = false
  addSupplierDueAmonutReport = false
  editSupplierDueAmonutReport = false
  deleteSupplierDueAmonutReport = false


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
   FilterDetailList :any = []
  ngOnInit(): void {
    this.permission.forEach((element: any) => {
      if (element.ModuleName === 'PurchaseReport') {
        this.viewPurchaseReport = element.View;
        this.addPurchaseReport = element.Add;
        this.editPurchaseReport = element.Edit;
        this.deletePurchaseReport = element.Delete;
      }else if (element.ModuleName === 'PurchaseProductReport') {
        this.viewPurchaseProductReport = element.View;
        this.addPurchaseProductReport = element.Add;
        this.editPurchaseProductReport = element.Edit;
        this.deletePurchaseProductReport = element.Delete;
      }else if (element.ModuleName === 'PurchaseChargeReport') {
        this.viewPurchaseChargeReport = element.View;
        this.addPurchaseChargeReport = element.Add;
        this.editPurchaseChargeReport = element.Edit;
        this.deletePurchaseChargeReport = element.Delete;
      }else if (element.ModuleName === 'PurchaseProductExpiryReport') {
        this.viewPurchaseProductExpiryReport = element.View;
        this.addPurchaseProductExpiryReport = element.Add;
        this.editPurchaseProductExpiryReport = element.Edit;
        this.deletePurchaseProductExpiryReport = element.Delete;
      }
      else if (element.ModuleName === 'SupplierDueAmonutReport') {
        this.viewSupplierDueAmonutReport = element.View;
        this.addSupplierDueAmonutReport = element.Add;
        this.editSupplierDueAmonutReport = element.Edit;
        this.deleteSupplierDueAmonutReport = element.Delete;
      }
    });

    if(this.user.UserGroup === 'Employee'){
      this.shopList  = this.shop;
      this.PurchaseMaster.ShopID = this.shopList[0].ShopID
      this.PurchaseDetail.ShopID = this.shopList[0].ShopID
      this.charge.ShopID = this.shopList[0].ShopID
      this.ProductExpiry.ShopID = this.shopList[0].ShopID
    }else{
      this.dropdownShoplist()
    }
    this.dropdownSupplierlist();
    this.getProductList();
    this.getGSTList();

  }

  dropdownShoplist(){
    const subs: Subscription = this.ss.dropdownShoplist('').subscribe({
      next: (res: any) => {
        this.shopList  = res.data
        let shop = res.data
        this.selectsShop = shop.filter((s:any) => s.ID === Number(this.selectedShop[0]));
        this.selectsShop =  '/ ' + this.selectsShop[0].Name + ' (' + this.selectsShop[0].AreaName + ')'
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  dropdownSupplierlist(){
    const subs: Subscription = this.sup.dropdownSupplierlist('').subscribe({
      next: (res: any) => {
        this.supplierList  = res.data
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getPurchaseMaster(){
    this.sp.show()
    let Parem = '';
    this.PurchaseMasterList = []
    if (this.PurchaseMaster.FromDate !== '' && this.PurchaseMaster.FromDate !== null){
      let FromDate =  moment(this.PurchaseMaster.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and DATE_FORMAT(purchasemasternew.PurchaseDate, "%Y-%m-%d")  between ' +  `'${FromDate}'`; }

    if (this.PurchaseMaster.ToDate !== '' && this.PurchaseMaster.ToDate !== null){
      let ToDate =  moment(this.PurchaseMaster.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' +  `'${ToDate}'`; }

    if (this.PurchaseMaster.ShopID != 0  ){
      Parem = Parem + ' and purchasemasternew.ShopID IN ' +  `(${this.PurchaseMaster.ShopID})`;}

    if (this.PurchaseMaster.SupplierID !== 0){
      Parem = Parem + ' and purchasemasternew.SupplierID = ' +  this.PurchaseMaster.SupplierID ; }

    if (this.PurchaseMaster.PaymentStatus !== 0 && this.PurchaseMaster.PaymentStatus !== null &&  this.PurchaseMaster.PaymentStatus !== 'All'){
      Parem = Parem + ' and purchasemasternew.PaymentStatus = '  + `'${this.PurchaseMaster.PaymentStatus}'`; }

    const subs: Subscription =  this.purchaseService.getPurchasereports(Parem).subscribe({
      next: (res: any) => {
        if(res.success){
          this.as.successToast(res.message)
          // res.data.forEach((el: any) =>{

          // })
          this.PurchaseMasterList = res.data;

          this.PurchaseMasterList.forEach((e: any) => {
            let g :any = {type: 'iGST' , amt : 0}
            let gs : any = {type: 'cGST-sGST' , amt : 0}
            let c: any[] = []

            e.gst_details.forEach((el: any) => {
              if(el.InvoiceNo === e.InvoiceNo){
                if(el.GSTType === 'IGST'){
                  g.amt =  g.amt + el.GSTAmount;
                }else if(el.GSTType === 'CGST-SGST'){
                  gs.amt =  gs.amt + el.GSTAmount;
                }
              }
            })
            c.push(g)
            c.push(gs)
            e.gst_detailssss.push(c)
          })

          this.totalQty = res.calculation[0].totalQty;
          this.totalDiscount = res.calculation[0].totalDiscount.toFixed(2);
          this.totalUnitPrice = res.calculation[0].totalUnitPrice.toFixed(2);
          this.roundOffAmount = Math.round( res.calculation[0].totalUnitPrice);
          this.totalGstAmount = res.calculation[0].totalGstAmount.toFixed(2);
          this.totalAmount = res.calculation[0].totalAmount.toFixed(2);
          this.gstMaster = res.calculation[0].gst_details
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }
  getPurchaseMasterExport(){
    this.sp.show()
    let Parem = '';
    this.PurchaseMasterList = []
    if (this.PurchaseMaster.FromDate !== '' && this.PurchaseMaster.FromDate !== null){
      let FromDate =  moment(this.PurchaseMaster.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and DATE_FORMAT(purchasemasternew.PurchaseDate, "%Y-%m-%d")  between ' +  `'${FromDate}'`; }

    if (this.PurchaseMaster.ToDate !== '' && this.PurchaseMaster.ToDate !== null){
      let ToDate =  moment(this.PurchaseMaster.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' +  `'${ToDate}'`; }

    if (this.PurchaseMaster.ShopID != 0  ){
      Parem = Parem + ' and purchasemasternew.ShopID IN ' +  `(${this.PurchaseMaster.ShopID})`;}

    if (this.PurchaseMaster.SupplierID !== 0){
      Parem = Parem + ' and purchasemasternew.SupplierID = ' +  this.PurchaseMaster.SupplierID ; }

    if (this.PurchaseMaster.PaymentStatus !== 0 && this.PurchaseMaster.PaymentStatus !== null &&  this.PurchaseMaster.PaymentStatus !== 'All'){
      Parem = Parem + ' and purchasemasternew.PaymentStatus = '  + `'${this.PurchaseMaster.PaymentStatus}'`; }

    const subs: Subscription =  this.purchaseService.getPurchaseMasterExport(Parem).subscribe({
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

  purchaseFromReset(){
    this.PurchaseMaster =  {
        FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, SupplierID: 0,
        SupplierGSTNo:'All', PaymentStatus: 0,
    };
    this.PurchaseMasterList = [];
    this.totalQty = ''
    this.totalDiscount = ''
    this.totalUnitPrice = ''
    this.totalGstAmount =''
    this.totalAmount = ''
  }

  exportAsXLSXMaster(): void {
      let element = document.getElementById('purchaseExcel');
      const ws: XLSX.WorkSheet =XLSX.utils.table_to_sheet(element);
      delete ws['A2'];
            // Initialize column widths array
    const colWidths: number[] = [];

    // Iterate over all cells to determine maximum width for each column
    XLSX.utils.sheet_to_json(ws, { header: 1 }).forEach((row: any=[]) => {
        row.forEach((cell: any, index: number) => {
            const cellValue = cell ? String(cell) : '';
            colWidths[index] = Math.max(colWidths[index] || 0, cellValue.length);
        });
    });

    // Set column widths in the worksheet
    ws['!cols'] = colWidths.map((width: number) => ({ wch: width + 2 }));

      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      XLSX.writeFile(wb, 'Purchase Report.xlsx');
  }

  openModal3(content3: any) {
    this.modalService.open(content3, { centered: true , backdrop : 'static', keyboard: false,size: 'sm'});
  }

  // purchase details code start
  getProductList(){
    const subs: Subscription =  this.ps.getList().subscribe({
      next: (res: any) => {
        this.prodList = res.data.sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getFieldList(){
    if(this.PurchaseDetail.ProductCategory !== 0){
      this.prodList.forEach((element: any) => {
        if (element.ID === this.PurchaseDetail.ProductCategory) {
          this.selectedProduct = element.Name;
        }
      })
      const subs: Subscription =  this.ps.getFieldList(this.selectedProduct).subscribe({
        next: (res: any) => {
        this.specList = res.data;
        this.getSptTableData();
       },
       error: (err: any) => console.log(err.message),
       complete: () => subs.unsubscribe(),
     });
    }
    else {
      this.specList = [];
      this.PurchaseDetail.ProductName = '';
      this.PurchaseDetail.ProductCategory = 0;
    }
  }

  getSptTableData() {
    this.specList.forEach((element: any) => {
     if (element.FieldType === 'DropDown' && element.Ref === '0') {
       const subs: Subscription =  this.ps.getProductSupportData('0', element.SptTableName).subscribe({
         next: (res: any) => {
          element.SptTableData = res.data.sort((a: { TableValue: string; }, b: { TableValue: any; }) => (a.TableValue.trim()).localeCompare(b.TableValue));
          element.SptFilterData = res.data.sort((a: { TableValue: string; }, b: { TableValue: any; }) => (a.TableValue.trim()).localeCompare(b.TableValue));
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
          element.SptTableData = res.data.sort((a: { TableValue: string; }, b: { TableValue: any; }) => (a.TableValue.trim()).localeCompare(b.TableValue));
          element.SptFilterData = res.data.sort((a: { TableValue: string; }, b: { TableValue: any; }) => (a.TableValue.trim()).localeCompare(b.TableValue));
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
        this.gstList = res.data
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
    this.PurchaseDetail.ProductName = productName;
  }

  getPurchaseDetails(){
    this.sp.show()
    let Parem = '';
    this.TtlR = 0
    this.TtlW = 0
    this.PurchaseDetailList = []

    if (this.PurchaseDetail.FromDate !== '' && this.PurchaseDetail.FromDate !== null){
      let FromDate =  moment(this.PurchaseDetail.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and DATE_FORMAT(purchasemasternew.PurchaseDate, "%Y-%m-%d")  between ' +  `'${FromDate}'`; }

    if (this.PurchaseDetail.ToDate !== '' && this.PurchaseDetail.ToDate !== null){
      let ToDate =  moment(this.PurchaseDetail.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' +  `'${ToDate}'`; }

    if (this.PurchaseDetail.ProductCategory  !== 0){
      Parem = Parem + ' and purchasedetailnew.ProductTypeID = ' +  this.PurchaseDetail.ProductCategory;
      this.filter();}

    if (this.PurchaseDetail.ProductName !== '' ) {
      Parem = Parem + ' and purchasedetailnew.ProductName Like ' + "'" + this.PurchaseDetail.ProductName.trim() + "%'"; }

    if (this.PurchaseDetail.ShopID != 0){
      Parem = Parem + ' and purchasemasternew.ShopID IN ' +  `(${this.PurchaseDetail.ShopID})`;}

    if (this.PurchaseDetail.SupplierID !== 0){
      Parem = Parem + ' and purchasemasternew.SupplierID = ' +  this.PurchaseDetail.SupplierID; }

    if (this.PurchaseDetail.GSTPercentage !== 0){
      Parem = Parem + ' and purchasedetailnew.GSTPercentage = '  + `'${this.PurchaseDetail.GSTPercentage}'`; }

    if (this.PurchaseDetail.GSTType !== 0){
      Parem = Parem + ' and purchasedetailnew.GSTType = '  + `'${this.PurchaseDetail.GSTType}'`; }

    const subs: Subscription =  this.purchaseService.getPurchasereportsDetail(Parem,this.Productsearch.trim()).subscribe({
      next: (res: any) => {
        if(res.success){
          this.PurchaseDetailList = res.data
          this.DetailtotalQty = res.calculation[0].totalQty;
          this.DetailtotalDiscount = res.calculation[0].totalDiscount.toFixed(2);
          this.DetailtotalUnitPrice = res.calculation[0].totalUnitPrice.toFixed(2);
          this.DetailtotalSubTotal = res.calculation[0].totalSubTotalPrice.toFixed(2);
          this.DetailtotalGstAmount = res.calculation[0].totalGstAmount.toFixed(2);
          this.DetailtotalAmount = res.calculation[0].totalAmount.toFixed(2);
          this.DetailtotalRetailPrice = res.calculation[0].totalRetailPrice.toFixed(2);
          this.TtlR  = res.calculation[0].totalRetailPrice.toFixed(2);
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
  getPurchaseDetailsExport(){
    this.sp.show()
    let Parem = '';
    this.TtlR = 0
    this.TtlW = 0
    this.PurchaseDetailList = []

    if (this.PurchaseDetail.FromDate !== '' && this.PurchaseDetail.FromDate !== null){
      let FromDate =  moment(this.PurchaseDetail.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and DATE_FORMAT(purchasemasternew.PurchaseDate, "%Y-%m-%d")  between ' +  `'${FromDate}'`; }

    if (this.PurchaseDetail.ToDate !== '' && this.PurchaseDetail.ToDate !== null){
      let ToDate =  moment(this.PurchaseDetail.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' +  `'${ToDate}'`; }

    if (this.PurchaseDetail.ProductCategory  !== 0){
      Parem = Parem + ' and purchasedetailnew.ProductTypeID = ' +  this.PurchaseDetail.ProductCategory;
      this.filter();}

    if (this.PurchaseDetail.ProductName !== '' ) {
      Parem = Parem + ' and purchasedetailnew.ProductName Like ' + "'" + this.PurchaseDetail.ProductName.trim() + "%'"; }

    if (this.PurchaseDetail.ShopID != 0){
      Parem = Parem + ' and purchasemasternew.ShopID IN ' +  `(${this.PurchaseDetail.ShopID})`;}

    if (this.PurchaseDetail.SupplierID !== 0){
      Parem = Parem + ' and purchasemasternew.SupplierID = ' +  this.PurchaseDetail.SupplierID; }

    if (this.PurchaseDetail.GSTPercentage !== 0){
      Parem = Parem + ' and purchasedetailnew.GSTPercentage = '  + `'${this.PurchaseDetail.GSTPercentage}'`; }

    if (this.PurchaseDetail.GSTType !== 0){
      Parem = Parem + ' and purchasedetailnew.GSTType = '  + `'${this.PurchaseDetail.GSTType}'`; }

    const subs: Subscription =  this.purchaseService.getPurchasereportsDetailExport(Parem,this.Productsearch.trim()).subscribe({
      next: (res: any) => {
        this.downloadFile(res)
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  exportAsXLSXDetail(): void {
    let element = document.getElementById('purchaseDetailExcel');
    const ws: XLSX.WorkSheet =XLSX.utils.table_to_sheet(element);
    delete ws['A2'];
          // Initialize column widths array
          const colWidths: number[] = [];

          // Iterate over all cells to determine maximum width for each column
          XLSX.utils.sheet_to_json(ws, { header: 1 }).forEach((row: any=[]) => {
              row.forEach((cell: any, index: number) => {
                  const cellValue = cell ? String(cell) : '';
                  colWidths[index] = Math.max(colWidths[index] || 0, cellValue.length);
              });
          });

          // Set column widths in the worksheet
          ws['!cols'] = colWidths.map((width: number) => ({ wch: width + 2 }));

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, 'Purchase ProductType Report.xlsx');
  }

  PDFdetail(){
    let DATA: any = document.getElementById('purchaseDetailExcel');
    html2canvas(DATA).then((canvas) => {
      let fileWidth = 208;
      let fileHeight = (canvas.height * fileWidth) / canvas.width;
      const FILEURI = canvas.toDataURL('image/png');
      let PDF = new jsPDF('p', 'mm', 'a4');
      let position = 0;
      PDF.addImage(FILEURI, 'PNG', 0, position, fileWidth, fileHeight);
      PDF.save('purchaseDetail.pdf');
    });
  }

  purchaseDetailsFromReset(){
    this.PurchaseDetail =  {
      FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, SupplierID: 0,
      PaymentStatus: 0,  ProductCategory : 0, ProductName:'', GSTType: 0, GSTPercentage: 0
    };
    this.PurchaseDetailList = [];
    this.DetailtotalQty = ''
    this.DetailtotalDiscount = ''
    this.DetailtotalUnitPrice = ''
    this.DetailtotalGstAmount =''
    this.DetailtotalAmount = ''
    this.TtlR = 0
    this.TtlW = 0
  }

  openModal(content: any) {
    this.modalService.open(content, { centered: true , backdrop : 'static', keyboard: false,size: 'sm'});
  }

   // purchaseCharge
  purchaseCharge(){
    this.sp.show()
    let Parem = '';
    this.PurchaseChargeList = []
    if (this.charge.FromDate !== '' && this.charge.FromDate !== null){
      let FromDate =  moment(this.charge.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and DATE_FORMAT(purchasemasternew.PurchaseDate, "%Y-%m-%d")  between ' +  `'${FromDate}'`; }

    if (this.charge.ToDate !== '' && this.charge.ToDate !== null){
      let ToDate =  moment(this.charge.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' +  `'${ToDate}'`; }

    if (this.charge.ShopID != 0){
      Parem = Parem + ' and purchasemasternew.ShopID IN ' +  `(${this.charge.ShopID})`;}

    const subs: Subscription =  this.purchaseService.getPurchaseChargeReport(Parem).subscribe({
      next: (res: any) => {
        if(res.success){
          this.PurchaseChargeList = res.data
          this.ChargeAmount = res.calculation[0].totalAmount.toFixed(2);
          this.ChargetotalGstAmount = res.calculation[0].totalGstAmount.toFixed(2);
          this.gstCharge = res.calculation[0].gst_details
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    })
  }

  exportAsXLSXcharge(): void {
    let element = document.getElementById('purchaseChargeExcel');
    const ws: XLSX.WorkSheet =XLSX.utils.table_to_sheet(element);
    delete ws['A2'];
          // Initialize column widths array
          const colWidths: number[] = [];

          // Iterate over all cells to determine maximum width for each column
          XLSX.utils.sheet_to_json(ws, { header: 1 }).forEach((row: any=[]) => {
              row.forEach((cell: any, index: number) => {
                  const cellValue = cell ? String(cell) : '';
                  colWidths[index] = Math.max(colWidths[index] || 0, cellValue.length);
              });
          });

          // Set column widths in the worksheet
          ws['!cols'] = colWidths.map((width: number) => ({ wch: width + 2 }));

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, 'PurchaseCharge_Report.xlsx');
  }

  purchaseChargeFromReset(){
    this.charge =  {
      FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0
    };
    this.PurchaseChargeList = [];
    this.ChargeAmount = ''
    this.ChargetotalGstAmount = ''
    this.gstCharge = ''
  }

  openModal1(content1: any) {
    this.modalService.open(content1, { centered: true , backdrop : 'static', keyboard: false,size: 'sm'});
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
        this.specList1 = res.data;
        this.getSptTableData1();
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
           element.SptTableData = res.data.sort((a: { TableValue: string; }, b: { TableValue: any; }) => (a.TableValue.trim()).localeCompare(b.TableValue));
           element.SptFilterData = res.data.sort((a: { TableValue: string; }, b: { TableValue: any; }) => (a.TableValue.trim()).localeCompare(b.TableValue));
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
          element.SptTableData = res.data.sort((a: { TableValue: string; }, b: { TableValue: any; }) => (a.TableValue.trim()).localeCompare(b.TableValue));
          element.SptFilterData = res.data.sort((a: { TableValue: string; }, b: { TableValue: any; }) => (a.TableValue.trim()).localeCompare(b.TableValue));
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
    this.ProductExpiryList = []
    if (this.ProductExpiry.FromDate !== '' && this.ProductExpiry.FromDate !== null){
      let FromDate =  moment(this.ProductExpiry.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and purchasedetailnew.ProductExpDate between ' +  `'${FromDate}'`; }

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

    const subs: Subscription =  this.purchaseService.getPurchasereportsDetail(Parem,this.Productsearch).subscribe({
      next: (res: any) => {
        if(res.success){
          this.ProductExpiryList = res.data
          this.ProductExpiryList.forEach((element: any) => {
            if(element.ProductExpDate < this.todaydate) {
              element.Color = true;
              console.log( element.Color);
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
    delete ws['A2'];
          // Initialize column widths array
          const colWidths: number[] = [];

          // Iterate over all cells to determine maximum width for each column
          XLSX.utils.sheet_to_json(ws, { header: 1 }).forEach((row: any=[]) => {
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
            case 'PurchaseMaster':
                supplierID = this.PurchaseMaster.SupplierID;
                break;
            case 'PurchaseDetail':
                supplierID = this.PurchaseDetail.SupplierID;
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
        case 'PurchaseMaster':
            this.PurchaseMaster.SupplierID = ID;
            break;
        case 'PurchaseDetail':
            this.PurchaseDetail.SupplierID = ID;
            break;
        case 'ProductExpiry':
            this.ProductExpiry.SupplierID = ID;
            break;
        case 'All':
            this.filteredOptions = [];
            this.PurchaseMaster.SupplierID = 0;
            this.PurchaseDetail.SupplierID = 0;
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

  let printContent: any = '';
  let printTitle: any = '';
  let shopID = '';

  if (mode === 'Purchase-content') {
    printContent = document.getElementById('Purchase-content');
    printTitle = 'Purchase Report'
    shopID = this.PurchaseMaster.ShopID
  }
  if (mode === 'PurchaseDetail-content') {
    printContent = document.getElementById('PurchaseDetail-content');
    printTitle = 'Purchase Detail Report'
    shopID = this.PurchaseDetail.ShopID
  }
  if (mode === 'PurchaseService-content') {
    printContent = document.getElementById('PurchaseService-content');
    printTitle = 'Purchase Charge Report'
    shopID = this.charge.ShopID
  }
  if (mode === 'ProductExpiry-content') {
    printContent = document.getElementById('ProductExpiry-content');
    printTitle = 'Purchase (Product Expiry) Report'
    shopID = this.ProductExpiry.ShopID
  
  }

  let shop = this.shopList
  this.selectsShop = shop.filter((s: any) => s.ID === Number(shopID));
  if (this.selectsShop == '' || this.selectsShop == undefined) {
    this.selectsShop = shop.filter((s: any) => s.ID === Number(this.selectedShop[0]));
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
           object-fit: contain;
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
        .button-container
        {
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
toggleColumnVisibility2(column: string): void {
  this.columnVisibility2[column] = !this.columnVisibility2[column];
}
toggleColumnVisibility3(column: string): void {
  this.columnVisibility3[column] = !this.columnVisibility3[column];
}


getVendorDuePayment() {
  this.sp.show()
  let Parem = '';

  if (this.data1.FromDate !== '' && this.data1.FromDate !== null) {
    let FromDate = moment(this.data1.FromDate).format('YYYY-MM-DD')
    Parem = Parem + ' and DATE_FORMAT(purchasemasternew.PurchaseDate, "%Y-%m-%d") between ' + `'${FromDate}'`;
  }

  if (this.data1.ToDate !== '' && this.data1.ToDate !== null) {
    let ToDate = moment(this.data1.ToDate).format('YYYY-MM-DD')
    Parem = Parem + ' and ' + `'${ToDate}'`;
  }

  if (this.data1.ShopID != 0) {
    Parem = Parem + ' and purchasemasternew.ShopID IN ' + `(${this.data1.ShopID})`;
  }

  if (this.data1.SupplierID != 0) {
    Parem = Parem + ' and purchasemasternew.SupplierID IN ' + `(${this.data1.SupplierID})`;
  }

  const subs: Subscription = this.purchaseService.getVendorDuePayment(Parem).subscribe({
    next: (res: any) => {
      if (res.success) {
        this.as.successToast(res.message)
        this.dataList1 = res.data
        this.totalAmountD = res.calculation[0]?.totalAmount?.toFixed(2);
        this.totalDiscountD = res.calculation[0]?.totalDiscount?.toFixed(2);
        this.totalDueAmountD = res.calculation[0]?.totalDueAmount?.toFixed(2);
        this.totalGstAmountD = res.calculation[0]?.totalGstAmount?.toFixed(2);
        this.totalPaidAmountD = res.calculation[0]?.totalPaidAmount?.toFixed(2);
        this.totalQtyD = res.calculation[0]?.totalQty;
        this.totalSubTotalD = res.calculation[0].totalSubTotal?.toFixed(2);
      } else {
        this.as.errorToast(res.message)
      }
      this.sp.hide()
    },
    error: (err: any) => console.log(err.message),
    complete: () => subs.unsubscribe(),
  });
}

FromReset1() {
  this.data1 = {
    FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'),ShopID: 0, SupplierID: 0
  };
  this.dataList1 = [];
}

exportAsXLSX1(): void {
  let element = document.getElementById('SupplierDuaExcel');
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
  ws['!cols'] = colWidths.map((width: number) => ({
    wch: width + 2, 
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF00' } }
  }));

  const wb: XLSX.WorkBook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, 'Supplier_DuaAmonut_Report.xlsx');
}

print1() {
  let shop = this.shopList
  this.selectsShop = shop.filter((s: any) => s.ID === Number(this.selectedShop[0]));

  let printContent: any = document.getElementById('print-content1');
  let printWindow: any = window.open('pp', '_blank');
  printWindow.document.write(`
  <html>
    <head>
    <title>Vendor Credit Report</title>
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
           object-fit: contain;
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

openModalS(content1: any) {
  this.modalService.open(content1, { centered: true, backdrop: 'static', keyboard: false, size: 'xxl' });
  this.isActive1 = true;
  this.isActive2 = false;
  this.isActive3 = false;
  this.pp = 0
  this.mm = 0
  this.pm = 0
  this.lenQty = 0
  this.plusToplus('+sph+cyl')
  this.getAsix()
  this.getAddition()
  this.generateGrid()
  this.Axis1212() 
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

toggleActive(buttonNumber: number): void {
  // Reset active states
  this.isActive1 = false;
  this.isActive2 = false;
  this.isActive3 = false;

  // Toggle the selected state
  if (buttonNumber === 1) {
    this.isActive1 = !this.isActive1;
  } else if (buttonNumber === 2) {
    this.isActive2 = !this.isActive2;
  } else if (buttonNumber === 3) {
    this.isActive3 = !this.isActive3;
  }

  // Recalculate quantities
  this.totalQty111();
}

Axis1212() {
  const AxisRegex = /Axis\s*([+-]?\d+(\.\d+)?)/; // Regular expression to find 'Axis' followed by a number
  const selectedAxis = this.axisFilter; // Value selected in the dropdown
  
  // Filter the PurchaseDetailList to include only rows matching the selected Axis
  if(this.axisFilter != 0){
    this.FilterDetailList = this.PurchaseDetailList.filter((item: any) => {
      const match = AxisRegex.exec(item.ProductName); // Extract Axis value
      return match && match[1] === selectedAxis; // Check if extracted value matches the selected axis
    });
  }else{
    this.FilterDetailList = this.PurchaseDetailList
  }

  this.generateGrid()

}

generateGrid() {
  this.sphMax = -Infinity; // Initialize sphMax with the lowest possible value
  this.cylMax = -Infinity; // Initialize cylMax with the lowest possible value

  // Regex to extract Sph and Cyl values
  const sphCylRegex = /Sph\s*([+-]?\d+(\.\d+)?).*?Cyl\s*([+-]?\d+(\.\d+)?)/;


  this.FilterDetailList.forEach((q: any) => {
    const match = sphCylRegex.exec(q.ProductName);
    if (match) {
      const sph = parseFloat(match[1]); // Extract and parse Sph value
      const cyl = parseFloat(match[3]); // Extract and parse Cyl value
      const Axis = parseFloat(match[5]); // Extract and parse Cyl value

      // Update sphMax and cylMax if the current values are larger
      if (sph > this.sphMax) {
        this.sphMax = sph;
      }
      if (cyl > this.cylMax) {
        this.cylMax = cyl;
      }
    }
  });
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
      let sphQ = 0;

      // Loop through PurchaseDetailList and get the correct quantity
      this.FilterDetailList.forEach((q: any) => {
        // Check if the ProductName matches the expected name
        if (q.ProductName.includes(`Sph ${sph}`) && q.ProductName.includes(`Cyl ${cyl}`)) {
          sphQ = q.Quantity;
        }
      });

      // Add the quantity for this specific sph and cyl to the row
      row[cyl] = sphQ;
    });
    grid.push(row);
  });
  return grid;
}

// get totalQty111(): number {
//   return this.dataSource.reduce((sum, row) => {
//     return sum + this.sphValues.reduce((sphSum, sph) => {
//       return sphSum + parseInt(row[sph], 10);
//     }, 0);
//   }, 0);
// }

totalQty111(): void {
  // Temporary variables for per-row calculation
  let tempPP = 0;
  let tempMM = 0;
  let tempPM = 0;

  this.dataSource.forEach(row => {
    this.cylValues.forEach(cyl => {
      const value = parseInt(row[cyl], 10);

      if (!isNaN(value)) {
        // Temporary additions
        if (this.isActive1) {
          tempPP += value;
        }
        if (this.isActive2) {
          tempMM += value;
        }
        if (this.isActive3) {
          tempPM += value;
        }
      }
    });
  });

  // Add temporary totals to main variables
  if(this.pp == 0){
    this.pp += tempPP;
  }
  if(this.mm == 0){
    this.mm += tempMM;
  }
  if(this.pm == 0){
    this.pm += tempPM;
  }
 this.lenQty =  this.pp + this.mm +  this.pm 
}

exportAsXLSXlens(): void {
  let element = document.getElementById('lensExcel');
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
  ws['!cols'] = colWidths.map((width: number) => ({
    wch: width + 2, 
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF00' } }
  }));

  const wb: XLSX.WorkBook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, 'Lens-Grid.xlsx');
}




// purchase(mode: any) {
//   this.lenslist.forEach((p: any) => {
//     if (mode === 'save') {

//       let ASIX = '', ADD = '', EYE = '';

//       if (this.lens.axis != '') {
//         ASIX = '/' + 'Axis' + ' ' + this.lens.axis
//       }
//       if (this.lens.addtion != '') {
//         ADD = '/' + 'Add' + ' ' + this.lens.addtion
//       }
//       if (this.lens.eye != '') {
//         EYE = '/' + this.lens.eye
//       }
//       p.productname = p.productname + ASIX + ADD + EYE
//       p.purchasePrice = this.lens.purchasePrice
//       p.GSTtype = this.lens.GSTtype
//       p.GSTPercent = this.lens.GSTPercent
//       p.retailPrice = this.lens.retailPrice
//       p.wholesalePrice = this.lens.wholesalePrice
//     }
//   })



//   this.generateGrid()
//   this.lens = { productname: '', purchasePrice: 0, quantity: 0, GSTtype: 'None', GSTPercent: 0, retailPrice: 0, wholesalePrice: 0, axis: '', addtion: '', eye: '' }
//   this.lenslist = []
// }

// qtyAdd(shp: any, cyl: any, qty: number, lens: any) {

//   let SphPower = ''
//   let CylPower = ''


//   if(shp !== "+0.00" && shp !== "-0.00"){
//     SphPower =  '/' + 'Sph' + ' ' + shp
//   }

//   if(cyl !== "+0.00" && cyl !== "-0.00"){
//     CylPower = '/' + 'Cyl' + ' ' + cyl
//   }

//   this.lens.productname =  SphPower + CylPower
//   this.lens.quantity = qty;

  
//   // this.lenslist.unshift(this.lens);
//   let existingProduct = this.lenslist.find((c: any) => c.productname === this.lens.productname);
//   if (existingProduct) {
//     // Update the quantity if the product already exists
//     existingProduct.quantity = this.lens.quantity;
//   } else {
//     // Add the new product to the beginning of the array
//     this.lenslist.unshift(this.lens);
//   }

//   this.lens = { productname: '', purchasePrice: 0, quantity: 0, GSTtype: 'None', GSTPercent: 0, retailPrice: 0, wholesalePrice: 0, axis: '', addtion: '', eye: '' }

// }

}
