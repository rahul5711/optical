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
import { EmployeeService } from 'src/app/service/employee.service';
import { BillService } from 'src/app/service/bill.service';
import { CustomerService } from 'src/app/service/customer.service';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-old-sale',
  templateUrl: './old-sale.component.html',
  styleUrls: ['./old-sale.component.css']
})
export class OldSaleComponent implements OnInit {
  env = environment;
  shop:any =JSON.parse(localStorage.getItem('shop') || '') ;
  user:any =JSON.parse(localStorage.getItem('user') || '') ;
  selectedShop:any =JSON.parse(localStorage.getItem('selectedShop') || '') ;
  permission = JSON.parse(localStorage.getItem('permission') || '[]');
  companySetting:any = JSON.parse(localStorage.getItem('companysetting') || '[]');
  searchValue :any = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private ss: ShopService,
    private bill: BillService,
    private emp: EmployeeService,
    private supps: SupportService,
    private ps: ProductService,
    public as: AlertService,
    private modalService: NgbModal,
    private sp: NgxSpinnerService,
    private customer: CustomerService 
  ) { }

  
  myControl = new FormControl('All');
  filteredOptions: any ;

  shopList :any = [];
  shopLists :any = [];
  employeeList :any = [];
  customerList :any = [];
  customerListGST :any = [];
  BillMasterList:any = [];
  totalQty: any;
  totalGrandTotal: any;
  totalBalance :any 
  totalPaid :any 


  selectedProduct: any;
  prodList:any;
  specList: any = [];
  gstList: any;
  BillDetailList:any = [];
  DetailtotalQty: any;
  DetailtotalAmount: any;
  DetailtotalBalance: any;
  DetailtotalPaid: any;


  BillMaster: any =  { 
    FilterTypes:'BillDate', FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0,  EmployeeID:0,  CustomerID: 0,  CustomerGSTNo:0, PaymentStatus: 0, ProductStatus:'All',BillType:'All'
  };

  Billdetail: any =  { 
    FilterTypes:'BillDate', FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, CustomerID: 0,  CustomerGSTNo:0, PaymentStatus: 0, ProductStatus:'All', ProductCategory:0, ProductName: '', GSTType:0, GSTPercentage:0, Status:0, Option:0, 
  };

  viewOldSaleReport= false
  editOldSaleReport= false
  addOldSaleReport= false
  deleteOldSaleReport= false

  viewOldSaleProductReport = false
  editOldSaleProductReport = false
  addOldSaleProductReport = false
  deleteOldSaleProductReport = false

 ngOnInit(): void {
  this.permission.forEach((element: any) => {
    if (element.ModuleName === 'OldSaleReport') {
      this.viewOldSaleReport = element.View;
      this.editOldSaleReport = element.Edit;
      this.addOldSaleReport = element.Add;
      this.deleteOldSaleReport = element.Delete;
    }else if (element.ModuleName === 'OldSaleProductReport') {
      this.viewOldSaleProductReport = element.View;
      this.editOldSaleProductReport = element.Edit;
      this.addOldSaleProductReport = element.Add;
      this.deleteOldSaleProductReport = element.Delete;
    }else{
      this.viewOldSaleReport= true
      this.editOldSaleReport= true
      this.addOldSaleReport= true
      this.deleteOldSaleReport= true
      this.viewOldSaleProductReport = true
      this.editOldSaleProductReport = true
      this.addOldSaleProductReport = true
      this.deleteOldSaleProductReport = true
    }
  });
    // billmaster
   
    this.dropdownUserlist()
    this.getProductList();
    this.getGSTList();
    // this.dropdownCustomerlist();
    this.dropdownCustomerGSTNo();

    if(this.user.UserGroup === 'Employee'){
      this.shopList  = this.shop;
      this.BillMaster.ShopID = this.shopList[0].ShopID
      this.Billdetail.ShopID = this.shopList[0].ShopID
    }else{
      this.dropdownShoplist()
    }

  }

   // billmaster
   dropdownShoplist(){
    this.sp.show()
    const subs: Subscription = this.ss.dropdownShoplist('').subscribe({
      next: (res: any) => {
        if(res.success){
            this.shopList  = res.data
            let shop = res.data
            this.shopLists = shop.filter((s:any) => s.ID === Number(this.selectedShop[0]));
            this.shopLists =  '/ ' + this.shopLists[0].Name + ' (' + this.shopLists[0].AreaName + ')'  
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  dropdownCustomerlist(){
    this.sp.show()
    const subs: Subscription = this.customer.dropdownlist().subscribe({
      next: (res: any) => {
        if(res.success){
          this.customerList  = res.data
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  dropdownCustomerGSTNo(){
    this.sp.show()
    const subs: Subscription = this.customer.customerGSTNumber(this.customerList).subscribe({
      next: (res: any) => {
        if(res.success){
          this.customerListGST  = res.data
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  dropdownUserlist(){
    this.sp.show()
    const subs: Subscription = this.emp.dropdownUserlist('').subscribe({
      next: (res: any) => {
        if(res.success){
          this.employeeList  = res.data
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getBillMaster(){
    this.sp.show()
    let Parem = '';

    if (this.BillMaster.FromDate !== '' && this.BillMaster.FromDate !== null && this.BillMaster.FilterTypes === 'BillDate'){
   
        let FromDate =  moment(this.BillMaster.FromDate).format('YYYY-MM-DD')
        Parem = Parem + ' and oldbillmaster.BillDate between ' +  `'${FromDate}'` ;
    }

    if (this.BillMaster.ToDate !== '' && this.BillMaster.ToDate !== null  && this.BillMaster.FilterTypes === 'BillDate'){
        let ToDate =  moment(this.BillMaster.ToDate).format('YYYY-MM-DD')
        Parem = Parem + ' and ' + `'${ToDate}'`; 
    }

    if (this.BillMaster.FromDate !== '' && this.BillMaster.FromDate !== null && this.BillMaster.FilterTypes === 'DeliveryDate'){
      let FromDate =  moment(this.BillMaster.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and oldbillmaster.DeliveryDate between ' +  `'${FromDate}'`; 
    }

    if (this.BillMaster.ToDate !== '' && this.BillMaster.ToDate !== null  && this.BillMaster.FilterTypes === 'DeliveryDate'){
      let ToDate =  moment(this.BillMaster.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'`; 
    }
      
    if (this.BillMaster.ShopID != 0 ){
      Parem = Parem + ' and oldbillmaster.ShopID IN ' +  `(${this.BillMaster.ShopID})`;}

    if (this.BillMaster.CustomerID !== 0){
      Parem = Parem + ' and oldbillmaster.CustomerID = ' +  this.BillMaster.CustomerID ; }

    const subs: Subscription =  this.bill.getOldSalereport(Parem).subscribe({
      next: (res: any) => {
        if(res.success){
          this.as.successToast(res.message)
          this.BillMasterList = res.data;

          this.totalQty = res.calculation[0].totalQty;
          this.totalBalance = (parseFloat(res.calculation[0].totalBalance)).toFixed(2);
          this.totalGrandTotal = (parseFloat(res.calculation[0].totalGrandTotal)).toFixed(2);
          this.totalPaid = (parseFloat(res.calculation[0].totalPaid)).toFixed(2);
 
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  openModalSale(content3: any) {
    this.modalService.open(content3, { centered: true , backdrop : 'static', keyboard: false,size: 'sm'});
  }

  exportAsXLSXMaster(): void {
    let element = document.getElementById('SaleExcel');
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
    XLSX.writeFile(wb, 'Old Sale Report.xlsx');
}

  billMasterFromReset(){
    this.BillMaster =  { 
      FilterTypes:'BillDate', FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0,  EmployeeID:0,  CustomerID: 0,  CustomerGSTNo:0, PaymentStatus: 0, ProductStatus:'All'
    };
    this.BillMasterList = []
    this.totalQty = 0;
    this.totalGrandTotal = 0;
    this.totalBalance = 0;
    this.totalPaid = 0;

  }

    // billdetails product

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
      if(this.Billdetail.ProductCategory !== 0){
        this.prodList.forEach((element: any) => {
          if (element.ID === this.Billdetail.ProductCategory) {
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
        this.Billdetail.ProductName = '';
        this.Billdetail.ProductCategory = 0;
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
      this.Billdetail.ProductName = productName;
    }
  
    getBillDetails(){
      this.sp.show()
      let Parem = '';
  
      if (this.Billdetail.FromDate !== '' && this.Billdetail.FromDate !== null && this.Billdetail.FilterTypes === 'BillDate'){
          let FromDate =  moment(this.Billdetail.FromDate).format('YYYY-MM-DD')
          Parem = Parem + ' and oldbillmaster.BillDate between ' +  `'${FromDate}'`;
      }
  
      if (this.Billdetail.ToDate !== '' && this.Billdetail.ToDate !== null  && this.Billdetail.FilterTypes === 'BillDate'){
          let ToDate =  moment(this.Billdetail.ToDate).format('YYYY-MM-DD')
          Parem = Parem + ' and ' + `'${ToDate}'`; 
      }
  
      if (this.Billdetail.FromDate !== '' && this.Billdetail.FromDate !== null && this.Billdetail.FilterTypes === 'DeliveryDate'){
        let FromDate =  moment(this.Billdetail.FromDate).format('YYYY-MM-DD')
        Parem = Parem + ' and oldbillmaster.DeliveryDate between ' +  `'${FromDate}'`; 
      }
  
      if (this.Billdetail.ToDate !== '' && this.Billdetail.ToDate !== null  && this.Billdetail.FilterTypes === 'DeliveryDate'){
        let ToDate =  moment(this.Billdetail.ToDate).format('YYYY-MM-DD')
        Parem = Parem + ' and ' + `'${ToDate}'`; 
      }
        
      if (this.Billdetail.ShopID != 0 ){
        Parem = Parem + ' and oldbillmaster.ShopID IN ' +  `(${this.Billdetail.ShopID})`;}
  
      if (this.Billdetail.CustomerID !== 0){
        Parem = Parem + ' and oldbillmaster.CustomerID = ' +  this.Billdetail.CustomerID ; }
  
      if (this.Billdetail.CustomerGSTNo !== 0){
        Parem = Parem + ' and oldbillmaster.GSTNo = ' +  this.Billdetail.CustomerGSTNo ; }
  
      if (this.Billdetail.ProductCategory  !== 0){
        Parem = Parem + ' and oldbilldetail.ProductTypeID = ' +  this.Billdetail.ProductCategory;
        this.filter();}
    
      if (this.Billdetail.ProductName !== '' ) {
        Parem = Parem + ' and oldbilldetail.ProductName Like ' + "'" + this.Billdetail.ProductName.trim() + "%'"; }
  
      if (this.Billdetail.GSTPercentage !== 0){
        Parem = Parem + ' and oldbilldetail.GSTPercentage = '  + `${this.Billdetail.GSTPercentage}`; }
  
      if (this.Billdetail.GSTType !== 0){
        Parem = Parem + ' and oldbilldetail.GSTType = '  + `'${this.Billdetail.GSTType}'`; }
  
      if (this.Billdetail.Status !== '' && this.Billdetail.Status !== null && this.Billdetail.Status !== 0) {
          if (this.Billdetail.Status === 'Manual' && this.Billdetail.Status !== 'All') {
            Parem = Parem + ' and oldbilldetail.Manual = ' + '1';
          } else if (this.Billdetail.Status === 'PreOrder' && this.Billdetail.Status !== 'All') {
            Parem = Parem + ' and oldbilldetail.PreOrder = ' + '1';
          } else if (this.Billdetail.Status === 'Barcode' && this.Billdetail.Status !== 'All') {
            Parem = Parem + ' and oldbilldetail.PreOrder = ' + '0';
            Parem = Parem + ' and oldbilldetail.Manual = ' + '0';
          }
      }
      const subs: Subscription =  this.bill.getOldSaleDetailreport(Parem).subscribe({
        next: (res: any) => {
          if(res.success){
            this.as.successToast(res.message)
            this.BillDetailList = res.data
            this.DetailtotalQty = res.calculation[0].totalQty;
            this.DetailtotalAmount = res.calculation[0].totalGrandTotal;
            this.DetailtotalBalance = res.calculation[0].totalBalance;
            this.DetailtotalPaid = res.calculation[0].totalPaid;

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
      let element = document.getElementById('saleDetailExcel');
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
      XLSX.writeFile(wb, 'Old Sale ProductType Report.xlsx');
    }
  
    openModalDetail(content: any) {
      this.modalService.open(content, { centered: true , backdrop : 'static', keyboard: false,size: 'sm'});
    }
  
    BillDetailsFromReset(){
      this.Billdetail =  { 
        FilterTypes:'BillDate', FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, CustomerID: 0,  CustomerGSTNo:0, PaymentStatus: 0, ProductStatus:'All', ProductCategory:0, ProductName: '', GSTType:0, GSTPercentage:0, Status:0, Option:0, 
      };
      this.BillDetailList = [];
      this.DetailtotalQty = 0;
      this.DetailtotalAmount= 0;
      this.DetailtotalBalance= 0;
      this.DetailtotalPaid= 0;
      this.specList = [];
    }

    dateFormat(date: any): string {
      if (date == null || date == "") {
        return '0000-00-00'; // Default Value
      }
      return moment(date).format(this.companySetting?.DateFormat || 'YYYY-MM-DD');
    }

    customerSearch(searchKey: any, mode: any, type:any) {
      this.filteredOptions = [];
  
      let customerID = 0;
  
      if (type === 'Customer') {
          switch(mode) {
              case 'BillMaster':
                  customerID = this.BillMaster.CustomerID;
                  break;
              case 'Billdetail':
                  customerID = this.Billdetail.CustomerID;
                  break;
              default:
                  break;
          }
      }
  
      let dtm = {
          Type: 'Customer',
          Name: customerID.toString()
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
          case 'BillMaster':
              this.BillMaster.CustomerID = ID;
              break;
          case 'Billdetail':
              this.Billdetail.CustomerID = ID;
              break;
          case 'All':
              this.filteredOptions = [];
              this.BillMaster.CustomerID = 0;
              this.Billdetail.CustomerID = 0;
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
    this.shopLists = shop.filter((s: any) => s.ID === Number(this.selectedShop[0]));
    let printContent: any = '';
    let printTitle: any = '';
  
    if (mode === 'oldsale-content') {
      printContent = document.getElementById('oldsale-content');
      printTitle = 'Old Sale Report'
    }
    if (mode === 'oldsaletProduct-content') {
      printContent = document.getElementById('oldsaleProduct-content');
      printTitle = 'Old Sale (Product Type) Report'
    }
  
    let printWindow: any = window.open('pp', '_blank');
    printWindow.document.write(`
    <html>
      <head>
      <title> ${printTitle}</title>
        <style>
          @media print {
  
            body { margin:0; padding:0; zoom:100%;width:100%;font-family: 'Your Font Family', sans-serif;}
            .header-body{ width:100%; height:220px;}
            .main-body{ width:100%;}
            .header-body .print-title { width:55%; text-align: left; margin-bottom: 20px; float:right; }
            .header-body .print-logo { width:40%; text-align: center; margin-bottom: 0px; float:left;}
            .print-logo img{
              width: 100%;
              height: 200px;
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
          }
        </style>
      </head>
      <body>
      <div class="header-body">
        <div class="print-logo ">
          <img src="${this.env.apiUrl + this.shopLists[0].LogoURL}" alt="Logo" >
        </div>
        <div class="print-title">
        <h3>${this.shopLists[0].Name + ' (' + this.shopLists[0].AreaName + ')'}</h3>
        <h4 style="font-weight: 300; letter-spacing: 1px;">${this.shopLists[0].Address}</h4>
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
}
