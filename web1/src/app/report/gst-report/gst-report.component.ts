import { Component, OnInit } from '@angular/core';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { ProductService } from 'src/app/service/product.service';
import { Subscription, fromEvent } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import { PurchaseService } from 'src/app/service/purchase.service';
import { ShopService } from 'src/app/service/shop.service';
import * as moment from 'moment';
import * as XLSX from 'xlsx';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { SupplierService } from 'src/app/service/supplier.service';
import { SupportService } from 'src/app/service/support.service';
import { environment } from 'src/environments/environment';
import { BillService } from 'src/app/service/bill.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CustomerService } from 'src/app/service/customer.service';
import Swal from 'sweetalert2';
import * as saveAs from 'file-saver';

@Component({
  selector: 'app-gst-report',
  templateUrl: './gst-report.component.html',
  styleUrls: ['./gst-report.component.css']
})
export class GstReportComponent implements OnInit {
  shop: any = JSON.parse(localStorage.getItem('shop') || '');
  user: any = JSON.parse(localStorage.getItem('user') || '');
  selectedShop: any = JSON.parse(localStorage.getItem('selectedShop') || '');
  permission = JSON.parse(localStorage.getItem('permission') || '[]');
  companySetting = JSON.parse(localStorage.getItem('companysetting') || '');
  form: any | FormGroup;
  env = environment;
  myControl = new FormControl('All');
  filteredOptions: any;
  FilterTypes: any = 'Date'
  constructor(
    private purchaseService: PurchaseService,
    private ss: ShopService,
    private ps: ProductService,
    public as: AlertService,
    public sp: NgxSpinnerService,
    private fb: FormBuilder,
    private sup: SupplierService,
    private supps: SupportService,
    private bill: BillService,
    private modalService: NgbModal,
    private customer: CustomerService,

  ) { }

  data: any = {
    FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), GSTStatus: '', ShopID:0,
    CustomerID: 0, CustomerGSTNo: 0, ProductCategory: 0, ProductName: '', GSTType: 0, GSTPercentage: 0, Status: 0,B2BTOB2C:0,Discount:0
  };

  GstData:any ={
    Sel: 1, ID: null, IsGstFiled: 0
  }
  searchValue:any
  Productsearch:any='';
  dataList:any = []
  totalQty:any = 0;
  totalGstAmount:any = 0;
  totalAmount:any = 0;
  totalDiscount:any = 0;
  totalUnitPrice:any = 0;
  totalPurchasePrice:any = 0;
  totalProfit:any = 0;
  gst_details:any = [];

  multiCheck: any 
  PendingCheck = false;
  AllPendingCheck = false;
  shopList:any=[];
  shopLists: any = []
  customerListGST: any = []
  customerList: any = []
  gstList: any = []
  prodList: any = []
  specList: any = []
  selectedProduct:any
  lastDayOfMonth: any
  pdfLink:any;
  FiledExl = false;
  ngOnInit(): void {
    this.getGSTList();
    this.getProductList();
    if (this.user.UserGroup === 'Employee') {
      this.shopList = this.shop;
      this.data.ShopID = this.shopList[0].ShopID
    } else {
      this.dropdownShoplist()
    }
  }

  PendingChecks(){
   if(this.data.GSTStatus === 'GST-Pending'){
     this.PendingCheck = true;
   }else{
    this.PendingCheck = false;
   }
  }

  getProductList() {
    const subs: Subscription = this.ps.getList().subscribe({
      next: (res: any) => {
        this.prodList = res.data.sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
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
          this.specList = res.data;
          this.getSptTableData();
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    }
    else {
      this.specList = [];
      this.data.ProductName = '';
      this.data.ProductCategory = 0;
    }
  }

  getSptTableData() {
    this.specList.forEach((element: any) => {
      if (element.FieldType === 'DropDown' && element.Ref === '0') {
        const subs: Subscription = this.ps.getProductSupportData('0', element.SptTableName).subscribe({
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

  getFieldSupportData(index: any) {
    this.specList.forEach((element: any) => {
      if (element.Ref === this.specList[index].FieldName.toString()) {
        const subs: Subscription = this.ps.getProductSupportData(this.specList[index].SelectedValue, element.SptTableName).subscribe({
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


  filter() {
    let productName = '';
    this.specList.forEach((element: any) => {
      if (productName === '') {
        productName = element.SelectedValue;
      } else if (element.SelectedValue !== '') {
        productName += '/' + element.SelectedValue;
      }
    });
    this.data.ProductName = productName;
  }


  dropdownShoplist() {
    this.sp.show()
    const subs: Subscription = this.ss.dropdownShoplist('').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.shopList = res.data
          let shop = res.data
          this.shopLists = shop.filter((s: any) => s.ID === Number(this.selectedShop[0]));
          this.shopLists = '/ ' + this.shopLists[0].Name + ' (' + this.shopLists[0].AreaName + ')'
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getGSTList() {
    const subs: Subscription = this.supps.getList('TaxType').subscribe({
      next: (res: any) => {
        this.gstList = res.data
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  dropdownCustomerlist() {
    this.sp.show()
    const subs: Subscription = this.customer.dropdownlist().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.customerList = res.data
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }


  customerSearch(searchKey: any, mode: any, type: any) {
    this.filteredOptions = []

    let dtm = { Type: '', Name: '' }

    if (type === 'Customer') {
      dtm = {
        Type: 'Customer',
        Name: this.data.CustomerID
      };
    }

    if (searchKey.length >= 2) {
      if (mode === 'Name') {
        dtm.Name = searchKey;
      }

      const subs: Subscription = this.supps.dropdownlistBySearch(dtm).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.filteredOptions = res.data
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

  CustomerSelection(mode: any, ID: any) {

    if (mode === 'customer') {
      this.data.CustomerID = ID
    }

    if (mode === 'All') {
      this.filteredOptions = []
      this.data.CustomerID = 0
    }
  }

  getGstReport() {
    this.sp.show()
    let Parem = '';

    this.PendingCheck = false;

      //  if(this.data.GSTStatus === 0){
      //    Parem = Parem + ' and (billdetail.Status = 1 || billdetail.IsGstFiled = 1 || billdetail.IsGstFiled = 0 and billdetail.Status = 0)' ;
      //  }
       if(this.data.GSTStatus === 'GST-Pending'){
         Parem = Parem + ' and billdetail.IsGstFiled = 0 and billdetail.Status = 1' ;
         this.PendingCheck = true;
       }
       if(this.data.GSTStatus === 'GST-Filed'){
         Parem = Parem + ' and billdetail.IsGstFiled = 1 and billdetail.Status = 1' ;
       }
       if(this.data.GSTStatus === 'Cancel Product'){
         Parem = Parem + ' and billdetail.IsGstFiled = 1 and billdetail.Status = 0' ;
       }
    

    if (this.data.FromDate !== '' && this.data.FromDate !== null) {
      let FromDate = moment(this.data.FromDate).format('YYYY-MM-DD')
      Parem = Parem + ' and DATE_FORMAT(billmaster.BillDate, "%Y-%m-%d") between ' + `'${FromDate}'`;
    }


    if (this.FilterTypes == 'Month') {
      let ToDate = moment(this.lastDayOfMonth).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'`;
    }

    if (this.FilterTypes != 'Month' && this.data.ToDate !== null) {
      let ToDate = moment(this.data.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'`;
    }

  

    if (this.data.ShopID != 0) {
      Parem = Parem + ' and billmaster.ShopID IN ' + `(${this.data.ShopID})`;
    }

    if (this.data.CustomerID !== 0) {
      Parem = Parem + ' and billmaster.CustomerID = ' + this.data.CustomerID;
    }

    if (this.data.CustomerGSTNo !== 0) {
      Parem = Parem + ' and billmaster.GSTNo = ' + this.data.CustomerGSTNo;
    }

    if (this.data.ProductCategory !== 0) {
      Parem = Parem + ' and billdetail.ProductTypeID = ' + this.data.ProductCategory;
      this.filter();
    }

    if (this.data.ProductName !== '') {
      Parem = Parem + ' and billdetail.ProductName Like ' + "'" + this.data.ProductName.trim() + "%'";
    }

    if (this.data.GSTPercentage !== 0) {
      Parem = Parem + ' and billdetail.GSTPercentage = ' + `'${this.data.GSTPercentage}'`;
    }

    if (this.data.GSTType !== 0) {
      Parem = Parem + ' and billdetail.GSTType = ' + `'${this.data.GSTType}'`;
    }

    if (this.data.Status !== '' && this.data.Status !== null && this.data.Status !== 0) {
      if (this.data.Status === 'Manual' && this.data.Status !== 'All') {
        Parem = Parem + ' and billdetail.Manual = ' + '1';
      } else if (this.data.Status === 'PreOrder' && this.data.Status !== 'All') {
        Parem = Parem + ' and billdetail.PreOrder = ' + '1';
      } else if (this.data.Status === 'Barcode' && this.data.Status !== 'All') {
        Parem = Parem + ' and billdetail.PreOrder = ' + '0';
        Parem = Parem + ' and billdetail.Manual = ' + '0';
      }
    }

    if (this.data.B2BTOB2C !== 0) {
      Parem = Parem + this.data.B2BTOB2C;
    }

    if (this.data.Discount !== 0) {
      Parem = Parem + this.data.Discount;
    }

    const subs: Subscription = this.bill.getGstReport(Parem,this.Productsearch).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.as.successToast(res.message)
          this.dataList = res.data
          this.totalQty = res.calculation[0].totalQty;
          this.totalGstAmount = res.calculation[0].totalGstAmount;
          this.totalAmount = res.calculation[0].totalAmount;
          this.totalDiscount = res.calculation[0].totalDiscount;
          this.totalUnitPrice = res.calculation[0].totalUnitPrice;
          this.totalPurchasePrice = res.calculation[0].totalPurchasePrice;
          this.totalProfit = res.calculation[0].totalProfit;
          this.gst_details = res.calculation[0].gst_details;
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  openModal(content1: any) {
    this.modalService.open(content1, { centered: true, backdrop: 'static', keyboard: false, size: 'sm' });
  }

  multicheck($event:any) {
    for (var i = 0; i < this.dataList.length; i++) {
      const index = this.dataList.findIndex(((x: any) => x === this.dataList[i]));
      if (this.dataList[index].Sel === 0 || this.dataList[index].Sel === null || this.dataList[index].Sel === undefined) {
        this.dataList[index].Sel = 1;
        this.PendingCheck = true;
      } else {
        this.dataList[index].Sel = 0;
      this.PendingCheck = false;

      }
    }
    console.log($event);
  }

  validate(v:any,event:any) {
    if (v.Sel === 0 || v.Sel === null || v.Sel === undefined) {
      v.Sel = 1;
      this.PendingCheck = true;
    } else {
      v.Sel = 0;
      this.PendingCheck = false;
    }
  }

  // submitGstFile(){
  //   this.GstData = this.dataList
  //   .map((e: any) => {
  //     return {
  //       Sel: `${e.Sel}`,
  //       ID: e.ID,
  //       IsGstFiled: e.IsGstFiled,
  //     };
  //   })
  //   .filter((d: { Sel: any; }) => d.Sel === 1);
    
  //   const subs: Subscription = this.bill.submitGstFile(this.GstData).subscribe({
  //     next: (res: any) => {
  //       if (res.success) {
  //         this.as.successToast(res.message)
  //         this.dataList = res.data
  //       } else {
  //         this.as.errorToast(res.message)
  //       }
  //       this.sp.hide()
  //     },
  //     error: (err: any) => console.log(err.message),
  //     complete: () => subs.unsubscribe(),
  //   });
  // }

  submitGstFile() {
    this.sp.show();
    this.GstData = this.dataList
      .map((e: any) => {
        return {
          Sel: e.Sel,
          ID: e.ID,
          IsGstFiled: e.IsGstFiled,
        };
      })
      .filter((d: { Sel: Number }) => Number(d.Sel) === 1);  // Ensure comparison as a number
      
    const subs: Subscription = this.bill.submitGstFile(this.GstData).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.as.successToast(res.message);
          this.data = {
            FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), GSTStatus: '', 
          };
        
          this.GstData = {
            Sel: 1, ID: null, IsGstFiled: 0
          }
          this.dataList = [];
          this.PendingCheck = false;
          this.totalQty = 0;
          this.totalGstAmount = 0;
          this.totalAmount = 0;
          this.totalDiscount = 0;
          this.totalUnitPrice = 0;
          this.totalPurchasePrice = 0;
          this.totalProfit = 0;
          this.gst_details = [];
        } else {
          this.as.errorToast(res.message);
        }
        this.sp.hide();
      },
      error: (err: any) => {
        console.log(err.message);
        this.sp.hide();  // Ensure spinner is hidden on error as well
      },
      complete: () => subs.unsubscribe(),
    });
  }

  FromReset() {
    this.data = {
      FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), GSTStatus: 0, ShopID:0,
      CustomerID: 0, CustomerGSTNo: 0, ProductCategory: 0, ProductName: '', GSTType: '', GSTPercentage: 0, Status: 0,B2BTOB2C:0,Discount:0
    };
  
    this.GstData = {
      Sel: 1, ID: null, IsGstFiled: 0
    }
    this.dataList = []
    this.PendingCheck = false;
    this.totalQty = 0;
    this.totalGstAmount = 0;
    this.totalAmount = 0;
    this.totalDiscount = 0;
    this.totalUnitPrice = 0;
    this.totalPurchasePrice = 0;
    this.totalProfit = 0;
    this.gst_details = [];
  }

  exportAsXLSX(): void {
    let element = document.getElementById('GSTExcel');
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
    XLSX.writeFile(wb, 'GST_Report.xlsx');
  }

  dateFormat(date: any) {
    return moment(date).format(`${this.companySetting.DateFormat}`);
  }

  ChangeDate(mode: any) {
    if (mode == 'Qty') {
        if (this.FilterTypes === 'Date') {
          this.data = {
           FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), GSTStatus: 0, ShopID:0,
           CustomerID: 0, CustomerGSTNo: 0, ProductCategory: 0, ProductName: '', GSTType: 0, GSTPercentage: 0, Status: 0,B2BTOB2C:0,Discount:0
        }
      } else {
          this.data = {
            FromDate: moment().startOf('month').format('YYYY-MM-DD'), ToDate: moment(this.data.FromDate).endOf('month').format('YYYY-MM-DD'), GSTStatus: 0, ShopID: Number(this.selectedShop[0]) ,
            CustomerID: 0, CustomerGSTNo: 0, ProductCategory: 0, ProductName: '', GSTType: 0, GSTPercentage: 0, Status: 0,B2BTOB2C:0,Discount:0
        }
      }
    } 
  }


  ChangeDateTo(mode: any) {
    if (mode === 'Qty') {
      if (this.data.ToDate) {
        // Get the last day of the selected month
        this.lastDayOfMonth = moment(this.data.ToDate).endOf('month').format('YYYY-MM-DD');
      } else {
        // Handle case when no date is selected
        this.data.ToDate = null; // or any other default value
      }
    }
  }

  generateInvoiceNo() {
    this.sp.show()
    let Parem = '';
    let FromDate = '';
    let ToDate = '';

    if (this.data.FromDate !== '' && this.data.FromDate !== null) {
      FromDate = moment(this.data.FromDate).format('YYYY-MM-DD')
    }

    if (this.data.ToDate !== '' && this.data.ToDate !== null) {
      this.data.ToDate = this.lastDayOfMonth
      ToDate = moment(this.data.ToDate).format('YYYY-MM-DD')
    }

      //  if(this.data.GSTStatus === 0){
      //    Parem = Parem + ' and (billdetail.Status = 1 || billdetail.IsGstFiled = 1 || billdetail.IsGstFiled = 0 and billdetail.Status = 0)' ;
      //  }
       if(this.data.GSTStatus === 'GST-Pending'){
         Parem = Parem + ' and billdetail.IsGstFiled = 0 and billdetail.Status = 1' ;
       }
       if(this.data.GSTStatus === 'GST-Filed'){
         Parem = Parem + ' and billdetail.IsGstFiled = 1 and billdetail.Status = 1' ;
       }
       if(this.data.GSTStatus === 'Cancel Product'){
         Parem = Parem + ' and (billdetail.IsGstFiled = 1 and billdetail.Status = 0 || billdetail.IsGstFiled = 0 and billdetail.Status = 0)' ;
       }
    
    if (this.data.CustomerID !== 0) {
      Parem = Parem + ' and billmaster.CustomerID = ' + this.data.CustomerID;
    }

    if (this.data.CustomerGSTNo !== 0) {
      Parem = Parem + ' and billmaster.GSTNo = ' + this.data.CustomerGSTNo;
    }

    if (this.data.ProductCategory !== 0) {
      Parem = Parem + ' and billdetail.ProductTypeID = ' + this.data.ProductCategory;
      this.filter();
    }

    if (this.data.ProductName !== '') {
      Parem = Parem + ' and billdetail.ProductName Like ' + "'" + this.data.ProductName.trim() + "%'";
    }

    if (this.data.GSTPercentage !== 0) {
      Parem = Parem + ' and billdetail.GSTPercentage = ' + `'${this.data.GSTPercentage}'`;
    }

    if (this.data.GSTType !== 0) {
      Parem = Parem + ' and billdetail.GSTType = ' + `'${this.data.GSTType}'`;
    }

    if (this.data.Status !== '' && this.data.Status !== null && this.data.Status !== 0) {
      if (this.data.Status === 'Manual' && this.data.Status !== 'All') {
        Parem = Parem + ' and billdetail.Manual = ' + '1';
      } else if (this.data.Status === 'PreOrder' && this.data.Status !== 'All') {
        Parem = Parem + ' and billdetail.PreOrder = ' + '1';
      } else if (this.data.Status === 'Barcode' && this.data.Status !== 'All') {
        Parem = Parem + ' and billdetail.PreOrder = ' + '0';
        Parem = Parem + ' and billdetail.Manual = ' + '0';
      }
    }

    if (this.data.B2BTOB2C !== 0) {
      Parem = Parem + this.data.B2BTOB2C;
    }

    if (this.data.Discount !== 0) {
      Parem = Parem + this.data.Discount;
    }

    const subs: Subscription = this.bill.generateInvoiceNo(Parem,this.Productsearch,this.data.ShopID,FromDate,ToDate).subscribe({
      next: (res: any) => {
        if (res === "GST_Invoice.pdf") {
          const url = this.env.apiUrl + "/uploads/" + res;
          this.pdfLink = url;
          window.open(url, "_blank");

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
  }

  generateInvoiceNoExcel() {
    this.sp.show()
    let Parem = '';
    let FromDate = '';
    let ToDate = '';

    if (this.data.FromDate !== '' && this.data.FromDate !== null) {
      FromDate = moment(this.data.FromDate).format('YYYY-MM-DD')
    }

    if (this.data.ToDate !== '' && this.data.ToDate !== null) {
      this.data.ToDate = this.lastDayOfMonth
      ToDate = moment(this.data.ToDate).format('YYYY-MM-DD')
    }

      //  if(this.data.GSTStatus === 0){
      //    Parem = Parem + ' and (billdetail.Status = 1 || billdetail.IsGstFiled = 1 || billdetail.IsGstFiled = 0 and billdetail.Status = 0)' ;
      //  }
       if(this.data.GSTStatus === 'GST-Pending'){
         Parem = Parem + ' and billdetail.IsGstFiled = 0 and billdetail.Status = 1' ;
       }
       if(this.data.GSTStatus === 'GST-Filed'){
         Parem = Parem + ' and billdetail.IsGstFiled = 1 and billdetail.Status = 1' ;
       }
       if(this.data.GSTStatus === 'Cancel Product'){
         Parem = Parem + ' and (billdetail.IsGstFiled = 1 and billdetail.Status = 0 || billdetail.IsGstFiled = 0 and billdetail.Status = 0)' ;
       }
    
    if (this.data.CustomerID !== 0) {
      Parem = Parem + ' and billmaster.CustomerID = ' + this.data.CustomerID;
    }

    if (this.data.CustomerGSTNo !== 0) {
      Parem = Parem + ' and billmaster.GSTNo = ' + this.data.CustomerGSTNo;
    }

    if (this.data.ProductCategory !== 0) {
      Parem = Parem + ' and billdetail.ProductTypeID = ' + this.data.ProductCategory;
      this.filter();
    }

    if (this.data.ProductName !== '') {
      Parem = Parem + ' and billdetail.ProductName Like ' + "'" + this.data.ProductName.trim() + "%'";
    }

    if (this.data.GSTPercentage !== 0) {
      Parem = Parem + ' and billdetail.GSTPercentage = ' + `'${this.data.GSTPercentage}'`;
    }

    if (this.data.GSTType !== 0) {
      Parem = Parem + ' and billdetail.GSTType = ' + `'${this.data.GSTType}'`;
    }

    if (this.data.Status !== '' && this.data.Status !== null && this.data.Status !== 0) {
      if (this.data.Status === 'Manual' && this.data.Status !== 'All') {
        Parem = Parem + ' and billdetail.Manual = ' + '1';
      } else if (this.data.Status === 'PreOrder' && this.data.Status !== 'All') {
        Parem = Parem + ' and billdetail.PreOrder = ' + '1';
      } else if (this.data.Status === 'Barcode' && this.data.Status !== 'All') {
        Parem = Parem + ' and billdetail.PreOrder = ' + '0';
        Parem = Parem + ' and billdetail.Manual = ' + '0';
      }
    }

    if (this.data.B2BTOB2C !== 0) {
      Parem = Parem + this.data.B2BTOB2C;
    }

    if (this.data.Discount !== 0) {
      Parem = Parem + this.data.Discount;
    }

    

    const subs: Subscription = this.bill.generateInvoiceNoExcel(Parem,this.Productsearch,this.data.ShopID,FromDate,ToDate).subscribe({
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

  
  onChange(event: { toUpperCase: () => any; toTitleCase: () => any; }) {
    if (this.companySetting.DataFormat === '1') {
      event = event.toUpperCase()
    } else if (this.companySetting.DataFormat == '2') {
      event = event.toTitleCase()
    }
    return event;
  }
}
