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

@Component({
  selector: 'app-product-return',
  templateUrl: './product-return.component.html',
  styleUrls: ['./product-return.component.css']
})

export class ProductReturnComponent implements OnInit {
  shop:any =JSON.parse(localStorage.getItem('shop') || '') ;
  user:any =JSON.parse(localStorage.getItem('user') || '') ;
  selectedShop:any =JSON.parse(localStorage.getItem('selectedShop') || '') ;
  permission = JSON.parse(localStorage.getItem('permission') || '[]');
  companySetting:any = JSON.parse(localStorage.getItem('companysetting') || '[]');
  searchValue :any = '';
  env = environment;
  Productsearch:any = '';
  columnVisibility: any = {
    SNo: true,
    Supplier: true,
    CurrentShop: true,
    SystemDn: true,
    SupplierCn: true,
    Quantity: true,
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
    SystemCn: true,
    SupplierCn: true,
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
    CurrentShop: true,
  };

  myControl = new FormControl('All');
  filteredOptions: any ;
  
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
  DetailtotalQty = 0;
  DetailtotalDiscount= 0;
  DetailtotalUnitPrice= 0;
  DetailtotalAmount= 0;
  DetailtotalGstAmount = 0;
  gstdetails:any = []

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

  viewProductReturnReport= false
  editProductReturnReport= false
  addProductReturnReport= false
  deleteProductReturnReport= false

  viewProductReturnProductTypeReport = false
  editProductReturnProductTypeReport = false
  addProductReturnProductTypeReport = false
  deleteProductReturnProductTypeReport = false

  ngOnInit(): void {
    this.sp.show()
    this.permission.forEach((element: any) => {
      if (element.ModuleName === 'ProductReturnReport') {
        this.viewProductReturnReport = element.View;
        this.editProductReturnReport = element.Edit;
        this.addProductReturnReport = element.Add;
        this.deleteProductReturnReport = element.Delete;
      }else if (element.ModuleName === 'ProductReturnProductTypeReport') {
        this.viewProductReturnProductTypeReport = element.View;
        this.editProductReturnProductTypeReport = element.Edit;
        this.addProductReturnProductTypeReport = element.Add;
        this.deleteProductReturnProductTypeReport = element.Delete;
      }
    });

    if(this.user.UserGroup === 'Employee'){
      this.shopList  = this.shop;
      this.ReturnMaster.ShopID = this.shopList[0].ShopID;
      this.ReturnDetail.ShopID = this.shopList[0].ShopID;
    }else{
      this.dropdownShoplist()
    }

    // this.dropdownSupplierlist();
    this.getProductList();
    this.getGSTList();
    // ReturnMaster Today Data
    // this.ReturnMaster.FromDate = moment().format('YYYY-MM-DD');
    // this.ReturnMaster.ToDate = moment().format('YYYY-MM-DD');
    // this.getPurchaseReturnMaster();
    // ReturnDetail Today Data
    // this.ReturnDetail.FromDate = moment().format('YYYY-MM-DD');
    // this.ReturnDetail.ToDate = moment().format('YYYY-MM-DD');
    // this.getReturnDetails();
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
          this.prodList = res.data.sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
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
            element.SptTableData = res.data.sort((a: { TableValue: string; }, b: { TableValue: any; }) => (a.TableValue.trim()).localeCompare(b.TableValue));
            element.SptFilterData = res.data.sort((a: { TableValue: string; }, b: { TableValue: any; }) => (a.TableValue.trim()).localeCompare(b.TableValue));       
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
            element.SptTableData = res.data.sort((a: { TableValue: string; }, b: { TableValue: any; }) => (a.TableValue.trim()).localeCompare(b.TableValue));
            element.SptFilterData = res.data.sort((a: { TableValue: string; }, b: { TableValue: any; }) => (a.TableValue.trim()).localeCompare(b.TableValue));       
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
        let valueToAdd = element.SelectedValue;
        valueToAdd = valueToAdd.replace(/^\d+_/, "");
        productName = valueToAdd;
      } else if (element.SelectedValue !== '') {
        let valueToAdd = element.SelectedValue;
            valueToAdd = valueToAdd.replace(/^\d+_/, "");
        productName += '/' + valueToAdd;
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
      Parem = Parem + ' and purchasereturndetail.ProductName Like ' + "'" + this.ReturnDetail.ProductName.trim() + "%'"; }

    if (this.ReturnDetail.ShopID != 0){
      Parem = Parem + ' and purchasereturn.ShopID IN ' +  `(${this.ReturnDetail.ShopID})`;}

    if (this.ReturnDetail.SupplierID !== 0){
      Parem = Parem + ' and purchasereturn.SupplierID = ' +  this.ReturnDetail.SupplierID; }

    const subs: Subscription =  this.purchaseService.getPurchasereturndetailreports(Parem,this.Productsearch).subscribe({
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
    this.DetailtotalQty = 0;
    this.DetailtotalDiscount= 0;
    this.DetailtotalUnitPrice= 0;
    this.DetailtotalAmount= 0;
    this.DetailtotalGstAmount = 0;
    this.gstdetails = []
  }
  
  openModal(content: any) {
    this.modalService.open(content, { centered: true , backdrop : 'static', keyboard: false,size: 'sm'});
  }

  dateFormat(date: any): string {
    if (date == null || date == "") {
      return '0000-00-00'; // Default Value
    }
    return moment(date).format(this.companySetting?.DateFormat || 'YYYY-MM-DD');
  }

  customerSearch(searchKey: any, mode: any, type:any) {
    this.filteredOptions = [];

    let supplierID = 0;

    if (type === 'Supplier') {
        switch(mode) {
            case 'ReturnMaster':
                supplierID = this.ReturnMaster.SupplierID;
                break;
            case 'ReturnDetail':
                supplierID = this.ReturnDetail.SupplierID;
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
        case 'ReturnMaster':
            this.ReturnMaster.SupplierID = ID;
            break;
        case 'ReturnDetail':
            this.ReturnDetail.SupplierID = ID;
            break;
        case 'All':
            this.filteredOptions = [];
            this.ReturnMaster.SupplierID = 0;
            this.ReturnDetail.SupplierID = 0;
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

  if (mode === 'ProductReturn-content') {
    printContent = document.getElementById('ProductReturn-content');
    printTitle = 'Product Return Report'
  }
  if (mode === 'ProductReturnProduct') {
    printContent = document.getElementById('ProductReturnProduct-content');
    printTitle = 'Product Return (Product Type) Report'
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
}
