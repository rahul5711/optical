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

@Component({
  selector: 'app-product-return',
  templateUrl: './product-return.component.html',
  styleUrls: ['./product-return.component.css']
})

export class ProductReturnComponent implements OnInit {
  selectedShop:any =JSON.parse(localStorage.getItem('selectedShop') || '') ;

  supplierList :any;
  shopList :any;
  selectsShop :any;
  ReturnMasterList:any
  totalQty: any;
  totalDiscount: any;
  totalUnitPrice: any;
  totalAmount: any;
  totalGstAmount: any;
  gstMaster: any;

  RetureDetailList:any
  selectedProduct: any;
  prodList:any;
  specList: any;
  gstList: any;
  DetailtotalQty: any;
  DetailtotalDiscount: any;
  DetailtotalUnitPrice: any;
  DetailtotalAmount: any;
  DetailtotalGstAmount: any;
  gstdetails:any


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
  ) { }

  ReturnMaster: any =  { 
    FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, SupplierID: 0,  
    SupplierGSTNo:'All'
  };

  ReturnDetail: any =  {
    FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, SupplierID: 0,  
    PaymentStatus: 0,  ProductCategory : 0, ProductName:'', GSTType: 0, GSTPercentage: 0
  };


  ngOnInit(): void {
    this.sp.show()
    this.dropdownShoplist();
    this.dropdownSupplierlist();
    this.getProductList();
    this.getGSTList();
    // ReturnMaster Today Data
    this.ReturnMaster.FromDate = moment().format('YYYY-MM-DD');
    this.ReturnMaster.ToDate = moment().format('YYYY-MM-DD');
    this.getPurchaseReturnMaster();
    // ReturnDetail Today Data
    this.ReturnDetail.FromDate = moment().format('YYYY-MM-DD');
    this.ReturnDetail.ToDate = moment().format('YYYY-MM-DD');
    this.getReturnDetails();
    this.sp.hide()
  }

  dropdownShoplist(){
    const subs: Subscription = this.ss.dropdownShoplist('').subscribe({
      next: (res: any) => {
        if(res.success){
          this.shopList  = res.data
          let shop = res.data
          this.selectsShop = shop.filter((s:any) => s.ID === Number(this.selectedShop[0]));
          this.selectsShop =  '/ ' + this.selectsShop[0].Name + ' (' + this.selectsShop[0].AreaName + ')'
        }else{
          this.as.errorToast(res.message)
        }
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  dropdownSupplierlist(){
    const subs: Subscription = this.sup.dropdownSupplierlist('').subscribe({
      next: (res: any) => {
        if(res.success){
          this.supplierList  = res.data
        }else{
          this.as.errorToast(res.message)
        }
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getPurchaseReturnMaster(){
    this.sp.show()
    let Parem = '';

    if (this.ReturnMaster.FromDate !== '' && this.ReturnMaster.FromDate !== null){
      let FromDate =  moment(this.ReturnMaster.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and DATE_FORMAT(purchasereturn.CreatedOn, "%Y-%m-%d")  between' +  `'${FromDate}'`; }

    if (this.ReturnMaster.ToDate !== '' && this.ReturnMaster.ToDate !== null){
      let ToDate =  moment(this.ReturnMaster.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' +  `'${ToDate}'`; }
      
    if (this.ReturnMaster.ShopID != 0  ){
      Parem = Parem + ' and purchasereturn.ShopID IN ' +  `(${this.ReturnMaster.ShopID})`;}

    if (this.ReturnMaster.SupplierID !== 0){
      Parem = Parem + ' and purchasereturn.SupplierID = ' +  this.ReturnMaster.SupplierID ; }

    const subs: Subscription =  this.purchaseService.getPurchasereturnreports(Parem).subscribe({
      next: (res: any) => {
        if(res.success){
          this.ReturnMasterList = res.data;
          this.as.successToast(res.message)
          this.ReturnMasterList.forEach((e: any) => {
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

  ReturnMasterFromReset(){
    this.ReturnMaster =  { 
        FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, SupplierID: 0,  
        SupplierGSTNo:'All'
    };
    this.ReturnMasterList = [];
    this.totalQty = ''
    this.totalDiscount = ''
    this.totalUnitPrice = ''
    this.totalGstAmount =''
    this.totalAmount = ''
  }

  exportAsXLSXMaster(): void {
      let element = document.getElementById('purchaseExcel');
      const ws: XLSX.WorkSheet =XLSX.utils.table_to_sheet(element);
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      XLSX.writeFile(wb, 'Product_Return_Report.xlsx');
  }

  openModal3(content3: any) {
    this.modalService.open(content3, { centered: true , backdrop : 'static', keyboard: false,size: 'sm'});
  }

  // Reture details code start
  getProductList(){
    const subs: Subscription =  this.ps.getList().subscribe({
      next: (res: any) => {
        if(res.success){
          this.prodList = res.data;
        }else{
          this.as.errorToast(res.message)
        }
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }
  
  getFieldList(){
    if(this.ReturnDetail.ProductCategory !== 0){
      this.prodList.forEach((element: any) => {
        if (element.ID === this.ReturnDetail.ProductCategory) {
          this.selectedProduct = element.Name;
        }
      })
      const subs: Subscription =  this.ps.getFieldList(this.selectedProduct).subscribe({
        next: (res: any) => {
          if(res.success){
            this.specList = res.data;
            this.getSptTableData();
          }else{
            this.as.errorToast(res.message)
          }
       },
       error: (err: any) => console.log(err.message),
       complete: () => subs.unsubscribe(),
     });
    }
    else {
      this.specList = [];
      this.ReturnDetail.ProductName = '';
      this.ReturnDetail.ProductCategory = 0;
    }
  }
  
  getSptTableData() { 
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
          if(res.success){
            element.SptTableData = res.data; 
            element.SptFilterData = res.data;   
          }else{
            this.as.errorToast(res.message)
          }
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
        if(res.success){
          this.gstList = res.data
        }else{
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
    this.ReturnDetail.ProductName = productName;
  }
  
  getReturnDetails(){
    this.sp.show()
    let Parem = '';

    if (this.ReturnDetail.FromDate !== '' && this.ReturnDetail.FromDate !== null){
      let FromDate =  moment(this.ReturnDetail.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and DATE_FORMAT(purchasereturn.CreatedOn, "%Y-%m-%d")  between' +  `'${FromDate}'`; }

    if (this.ReturnDetail.ToDate !== '' && this.ReturnDetail.ToDate !== null){
      let ToDate =  moment(this.ReturnDetail.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' +  `'${ToDate}'`; }

    if (this.ReturnDetail.ProductCategory  !== 0){
      Parem = Parem + ' and purchasereturndetail.ProductTypeID = ' +  this.ReturnDetail.ProductCategory;
      this.filter();}

    if (this.ReturnDetail.ProductName !== '' ) {
      Parem = Parem + ' and purchasereturndetail.ProductName Like ' + "'" + this.ReturnDetail.ProductName + "%'"; }

    if (this.ReturnDetail.ShopID != 0){
      Parem = Parem + ' and purchasereturn.ShopID IN ' +  `(${this.ReturnDetail.ShopID})`;}

    if (this.ReturnDetail.SupplierID !== 0){
      Parem = Parem + ' and purchasereturn.SupplierID = ' +  this.ReturnDetail.SupplierID; }

    const subs: Subscription =  this.purchaseService.getPurchasereturndetailreports(Parem).subscribe({
      next: (res: any) => {
        if(res.success){
          this.RetureDetailList = res.data
          this.DetailtotalQty = res.calculation[0].totalQty;
          this.DetailtotalDiscount = res.calculation[0].totalDiscount.toFixed(2);
          this.DetailtotalUnitPrice = res.calculation[0].totalUnitPrice.toFixed(2);
          this.DetailtotalGstAmount = res.calculation[0].totalGstAmount.toFixed(2);
          this.DetailtotalAmount = res.calculation[0].totalAmount.toFixed(2);
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
  
  exportAsXLSXDetail(): void {
    let element = document.getElementById('purchaseDetailExcel');
    const ws: XLSX.WorkSheet =XLSX.utils.table_to_sheet(element);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, 'Product_Return_ProductType_Report.xlsx');
  }
  
  PDFdetail(){

  }
  
  RetureDetailsFromReset(){
    this.ReturnDetail =  { 
      FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, SupplierID: 0,  
      PaymentStatus: 0,  ProductCategory : 0, ProductName:'', GSTType: 0, GSTPercentage: 0
    };
    this.RetureDetailList = [];
    this.DetailtotalQty = ''
    this.DetailtotalDiscount = ''
    this.DetailtotalUnitPrice = ''
    this.DetailtotalGstAmount =''
    this.DetailtotalAmount = ''
  }
  
  openModal(content: any) {
    this.modalService.open(content, { centered: true , backdrop : 'static', keyboard: false,size: 'sm'});
  }

}
