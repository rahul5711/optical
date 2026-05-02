import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { ProductService } from 'src/app/service/product.service';
import { Observable, Subscription, debounceTime, elementAt, map, startWith } from 'rxjs';
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
import Swal from 'sweetalert2';
import * as saveAs from 'file-saver';
import { ExcelService } from 'src/app/service/helpers/excel.service';
import { NgxEchartsModule } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import autoTable from 'jspdf-autotable';
import { EcomService } from 'src/app/service/ecom.service';

@Component({
  selector: 'app-sale-report',
  templateUrl: './sale-report.component.html',
  styleUrls: ['./sale-report.component.css']
})
export class SaleReportComponent implements OnInit {

   env = environment;
    company = JSON.parse(localStorage.getItem('company') || '');
    shop: any = JSON.parse(localStorage.getItem('shop') || '');
    user: any = JSON.parse(localStorage.getItem('user') || '');
    selectedShop: any = JSON.parse(localStorage.getItem('selectedShop') || '');
    permission = JSON.parse(localStorage.getItem('permission') || '[]');
    companySetting: any = JSON.parse(localStorage.getItem('companysetting') || '[]');
  
    myControl = new FormControl('All');
    myControl1 = new FormControl('All');
    
   constructor(
     private router: Router,
     private route: ActivatedRoute,
     private ss: ShopService,
     private bill: BillService,
     private ecs: EcomService,
     private emp: EmployeeService,
     private supps: SupportService,
     private ps: ProductService,
     public as: AlertService,
     private modalService: NgbModal,
     private sp: NgxSpinnerService,
     private customer: CustomerService,
     private excelService: ExcelService,
   ) { }

    BillMaster: any = {
      FilterTypes: 'BillDate', FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, EmployeeID: 0, CustomerID: 0, CustomerGSTNo: 0, PaymentStatus: 0, ProductStatus: 'All', BillType: 'All'
    };
  
    Billdetail: any = {
      FilterTypes: 'BillDate', FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, CustomerID: 0, CustomerGSTNo: 0, PaymentStatus: 0, ProductStatus: 'All', ProductCategory: 0, ProductName: '', GSTType: 0, GSTPercentage: 0, Status: 0, Option: 0,Barcode:''
    };
  
    service: any = {
      FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, BillType: 'All'
    };

     filteredOptions: any = [];
     gstList: any = [];
     shopList: any = [];
     shopLists: any = [];
     prodList: any = [];
  employeeList: any = [];
  customerList: any = [];
  customerListGST: any = [];
  BillMasterList: any = [];
  maxPaymentDetails = 8;
  totalQty: any = 0;
  totalDiscount: any = 0;
  totalUnitPrice: any = 0;
  totalAmount: any = 0;
  totalAddlDiscount: any;
  totalGstAmount: any;
  totalBalance = 0
  totalPaid = 0
  gstMaster: any;
  multiCheck: any;


  
  selectedProduct: any;
  specList: any = [];
  BillDetailList: any = [];
  DetailtotalQty: any;
  DetailtotalDiscount: any;
  DetailtotalUnitPrice: any;
  DetailtotalAmount: any;
  DetailtotalGstAmount: any;
  gstdetails: any
  DetailtotalPorfit: any = 0
  DetailtotalPrice: any = 0
  DetailtotalAddlDiscount: any = 0
  dataProductWise:any
  Productsearch: any = '';
  searchValue: any = '';

    v: any = []
  BillServiceList: any;
  ServiceAmount: any
  ServicetotalAmount: any;
  ServicetotalDiscountAmount: any;
  ServicetotalGstAmount: any;
  ServicetotalSUBTOTAL: any;
  ServiceGtotalAmount: any;
  ServicetotalAddlDiscount: any = 0;
  gstService: any
  ngOnInit(): void {
     this.bill.employeeList$.subscribe((list:any) => {
      this.employeeList = list
    });

    this.bill.gstCustomerList$.subscribe((list:any) => {
      this.customerListGST = list
    });

    this.bill.taxList$.subscribe((list:any) => {
     this.gstList = list
    });

    this.bill.productList$.subscribe((list:any) => {
      this.prodList = list
    });

     if (this.user.UserGroup === 'Employee') {
      this.shopList = this.shop;
      this.BillMaster.ShopID = this.shopList[0].ShopID
      this.Billdetail.ShopID = this.shopList[0].ShopID
      this.service.ShopID = this.shopList[0].ShopID
    } else {
      // this.dropdownShoplist()
       this.bill.shopList$.subscribe((list:any) => {
       this.shopList = list
       let shop = list
       this.shopLists = shop.filter((s: any) => s.ID === Number(this.selectedShop[0]));
       this.shopLists = '/ ' + this.shopLists[0].Name + ' (' + this.shopLists[0].AreaName + ')'
    });
    }
  }

    convertToDecimal(num: any, x: any) {
    return Number(Math.round(parseFloat(num + 'e' + x)) + 'e-' + x);
  }

    dateFormat(date: any): string {
      if (date == null || date == "") {
        return '0000-00-00'; // Default Value
      }
      return moment(date).format(this.companySetting?.DateFormat || 'YYYY-MM-DD');
    }
 
   customerSearch(searchKey: any, mode: any, type: any) {
     this.filteredOptions = []
 
     let dtm = { Type: '', Name: '' }
     if (type === 'Employee') {
       dtm = {
         Type: 'Employee',
         Name: this.BillMaster.EmployeeID
       };
     }
     if (type === 'Customer') {
       dtm = {
         Type: 'Customer',
         Name: this.BillMaster.CustomerID
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
     if (mode === 'Value') {
       this.BillMaster.CustomerID = ID
     }
     if (mode === 'Billdetail') {
       this.Billdetail.CustomerID = ID
     }
     if (mode === 'emp') {
       this.Billdetail.EmployeeID = ID
     }
     if (mode === 'All') {
       this.filteredOptions = []
       this.BillMaster.CustomerID = 0
       this.Billdetail.CustomerID = 0
       this.Billdetail.EmployeeID = 0
     }
   }


   getBillMaster() {
      this.sp.show()
      let Parem = '';
  
      if (this.BillMaster.FromDate !== '' && this.BillMaster.FromDate !== null && this.BillMaster.FilterTypes === 'All') {
  
        let FromDate = moment(this.BillMaster.FromDate).format('YYYY-MM-DD')
        Parem = Parem + ' and ( DATE_FORMAT(billmaster.BillDate, "%Y-%m-%d")  between ' + `'${FromDate}'`;
      }
  
      if (this.BillMaster.ToDate !== '' && this.BillMaster.ToDate !== null && this.BillMaster.FilterTypes === 'All') {
        let ToDate = moment(this.BillMaster.ToDate).format('YYYY-MM-DD')
        Parem = Parem + ' and ' + `'${ToDate}'`;
      }
  
      if (this.BillMaster.FromDate !== '' && this.BillMaster.FromDate !== null && this.BillMaster.FilterTypes === 'BillDate') {
  
        let FromDate = moment(this.BillMaster.FromDate).format('YYYY-MM-DD')
        Parem = Parem + ' and DATE_FORMAT(billmaster.BillDate, "%Y-%m-%d")  between ' + `'${FromDate}'`;
      }
  
      if (this.BillMaster.ToDate !== '' && this.BillMaster.ToDate !== null && this.BillMaster.FilterTypes === 'BillDate') {
        let ToDate = moment(this.BillMaster.ToDate).format('YYYY-MM-DD')
        Parem = Parem + ' and ' + `'${ToDate}'`;
      }
  
      if (this.BillMaster.FromDate !== '' && this.BillMaster.FromDate !== null && this.BillMaster.FilterTypes === 'DeliveryDate') {
        let FromDate = moment(this.BillMaster.FromDate).format('YYYY-MM-DD')
        Parem = Parem + ' and DATE_FORMAT(billmaster.DeliveryDate, "%Y-%m-%d") between ' + `'${FromDate}'`;
      }
  
      if (this.BillMaster.ToDate !== '' && this.BillMaster.ToDate !== null && this.BillMaster.FilterTypes === 'DeliveryDate') {
        let ToDate = moment(this.BillMaster.ToDate).format('YYYY-MM-DD')
        Parem = Parem + ' and ' + `'${ToDate}'`;
      }
  
      if (this.BillMaster.FromDate !== '' && this.BillMaster.FromDate !== null && this.BillMaster.FilterTypes === 'All') {
        let FromDate = moment(this.BillMaster.FromDate).format('YYYY-MM-DD')
        Parem = Parem + ' OR DATE_FORMAT(billmaster.OrderDate, "%Y-%m-%d") between ' + `'${FromDate}'`;
      }
  
      if (this.BillMaster.ToDate !== '' && this.BillMaster.ToDate !== null && this.BillMaster.FilterTypes === 'All') {
        let ToDate = moment(this.BillMaster.ToDate).format('YYYY-MM-DD')
        Parem = Parem + ' and ' + `'${ToDate}'` + ') ';
      }
  
      if (this.BillMaster.FromDate !== '' && this.BillMaster.FromDate !== null && this.BillMaster.FilterTypes === 'OrderDate') {
        let FromDate = moment(this.BillMaster.FromDate).format('YYYY-MM-DD')
        Parem = Parem + ' and DATE_FORMAT(billmaster.OrderDate, "%Y-%m-%d") between ' + `'${FromDate}'`;
      }
  
      if (this.BillMaster.ToDate !== '' && this.BillMaster.ToDate !== null && this.BillMaster.FilterTypes === 'OrderDate') {
        let ToDate = moment(this.BillMaster.ToDate).format('YYYY-MM-DD')
        Parem = Parem + ' and ' + `'${ToDate}'` + ' and billmaster.IsConvertInvoice = 0';
      }
  
      if (this.BillMaster.ShopID != 0) {
        Parem = Parem + ' and billmaster.ShopID IN ' + `(${this.BillMaster.ShopID})`;
      }
  
      if (this.BillMaster.EmployeeID !== 0) {
        Parem = Parem + ' and billmaster.Employee = ' + this.BillMaster.EmployeeID;
      }
  
      if (this.BillMaster.CustomerID != 0) {
        Parem = Parem + ' and billmaster.CustomerID = ' + this.BillMaster.CustomerID;
      }
  
      if (this.BillMaster.CustomerGSTNo !== 0) {
        Parem = Parem + ' and customer.GSTNo = ' + this.BillMaster.CustomerGSTNo;
      }
  
      if (this.BillMaster.PaymentStatus !== 0 && this.BillMaster.PaymentStatus !== null && this.BillMaster.PaymentStatus !== 'All') {
        Parem = Parem + ' and billmaster.PaymentStatus = ' + `'${this.BillMaster.PaymentStatus}'`;
      }
  
      if (this.BillMaster.ProductStatus !== '' && this.BillMaster.ProductStatus !== null && this.BillMaster.ProductStatus !== 'All') {
        Parem = Parem + ' and billmaster.ProductStatus = ' + `'${this.BillMaster.ProductStatus}'`;
      }
  
      if (this.BillMaster.BillType !== '' && this.BillMaster.BillType !== null && this.BillMaster.BillType !== 'All') {
        Parem = Parem + ' and billmaster.BillType = ' + `'${this.BillMaster.BillType}'`;
      }
  
      const subs: Subscription = this.ecs.getSalereport(Parem).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.as.successToast(res.message)
            this.BillMasterList = res.data;
            this.totalBalance = 0
            this.totalPaid = 0
  
            for (const billMaster of this.BillMasterList) {
              let totalDueAmountPlus = 0;
              this.BillMasterList.forEach((e: any) => {
  
                if (e.CustomerID === billMaster.CustomerID) {
                  totalDueAmountPlus += e.DueAmount;
                }
              });
              billMaster.TotalDueAmount = totalDueAmountPlus;
              this.totalBalance = this.totalBalance + billMaster.DueAmount;
            }
  
            this.totalQty = res.calculation[0].totalQty;
            this.totalDiscount = (parseFloat(res.calculation[0].totalDiscount)).toFixed(2);
            this.totalUnitPrice = (parseFloat(res.calculation[0].totalSubTotalPrice)).toFixed(2);
            this.totalGstAmount = (parseFloat(res.calculation[0].totalGstAmount)).toFixed(2);
            this.totalAmount = (parseFloat(res.calculation[0].totalAmount)).toFixed(2);
            this.totalAddlDiscount = (parseFloat(res.calculation[0].totalAddlDiscount)).toFixed(2);
            let p = + this.totalAmount - this.totalBalance;
            this.totalPaid = this.convertToDecimal(p, 2);
            this.gstMaster = res.calculation[0].gst_details
          } else {
            this.as.errorToast(res.message)
          }
          this.sp.hide()
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    }

      billMasterFromReset() {
        if(this.user.UserGroup == 'CompanyAdmin'){
            this.BillMaster = {
          FilterTypes: 'BillDate', FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, EmployeeID: 0, CustomerID: 0, CustomerGSTNo: 0, PaymentStatus: 0, ProductStatus: 'All', BillType: 'All'
        };
        }else{
        this.BillMaster = {
          FilterTypes: 'BillDate', FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: this.shopList[0].ShopID, EmployeeID: 0, CustomerID: 0, CustomerGSTNo: 0, PaymentStatus: 0, ProductStatus: 'All', BillType: 'All'
        };
        }
    
        this.BillMasterList = []
        this.totalQty = 0;
        this.totalDiscount = 0;
        this.totalUnitPrice = 0;
        this.totalAmount = 0;
        this.totalGstAmount = 0;
        this.gstMaster = [];
        this.totalBalance = 0
        this.totalPaid = 0;
        this.totalAddlDiscount = 0;
        this.maxPaymentDetails = 8;
      }


        getBillMasterExport() {
          this.sp.show()
          let Parem = '';
      
          if (this.BillMaster.FromDate !== '' && this.BillMaster.FromDate !== null && this.BillMaster.FilterTypes === 'All') {
            let FromDate = moment(this.BillMaster.FromDate).format('YYYY-MM-DD')
            Parem = Parem + ' and ( DATE_FORMAT(billmaster.BillDate, "%Y-%m-%d")  between ' + `'${FromDate}'`;
          }
      
          if (this.BillMaster.ToDate !== '' && this.BillMaster.ToDate !== null && this.BillMaster.FilterTypes === 'All') {
            let ToDate = moment(this.BillMaster.ToDate).format('YYYY-MM-DD')
            Parem = Parem + ' and ' + `'${ToDate}'`;
          }
      
          if (this.BillMaster.FromDate !== '' && this.BillMaster.FromDate !== null && this.BillMaster.FilterTypes === 'All') {
            let FromDate = moment(this.BillMaster.FromDate).format('YYYY-MM-DD')
            Parem = Parem + ' OR DATE_FORMAT(billmaster.OrderDate, "%Y-%m-%d") between ' + `'${FromDate}'`;
          }
      
          if (this.BillMaster.ToDate !== '' && this.BillMaster.ToDate !== null && this.BillMaster.FilterTypes === 'All') {
            let ToDate = moment(this.BillMaster.ToDate).format('YYYY-MM-DD')
            Parem = Parem + ' and ' + `'${ToDate}'` + ') ';
          }
          if (this.BillMaster.FromDate !== '' && this.BillMaster.FromDate !== null && this.BillMaster.FilterTypes === 'BillDate') {
            let FromDate = moment(this.BillMaster.FromDate).format('YYYY-MM-DD')
            Parem = Parem + ' and DATE_FORMAT(billmaster.BillDate, "%Y-%m-%d")  between ' + `'${FromDate}'`;
          }
      
          if (this.BillMaster.ToDate !== '' && this.BillMaster.ToDate !== null && this.BillMaster.FilterTypes === 'BillDate') {
            let ToDate = moment(this.BillMaster.ToDate).format('YYYY-MM-DD')
            Parem = Parem + ' and ' + `'${ToDate}'`;
          }
      
          if (this.BillMaster.FromDate !== '' && this.BillMaster.FromDate !== null && this.BillMaster.FilterTypes === 'DeliveryDate') {
            let FromDate = moment(this.BillMaster.FromDate).format('YYYY-MM-DD')
            Parem = Parem + ' and DATE_FORMAT(billmaster.DeliveryDate, "%Y-%m-%d") between ' + `'${FromDate}'`;
          }
      
          if (this.BillMaster.ToDate !== '' && this.BillMaster.ToDate !== null && this.BillMaster.FilterTypes === 'DeliveryDate') {
            let ToDate = moment(this.BillMaster.ToDate).format('YYYY-MM-DD')
            Parem = Parem + ' and ' + `'${ToDate}'`;
          }
      
          if (this.BillMaster.FromDate !== '' && this.BillMaster.FromDate !== null && this.BillMaster.FilterTypes === 'OrderDate') {
            let FromDate = moment(this.BillMaster.FromDate).format('YYYY-MM-DD')
            Parem = Parem + ' and DATE_FORMAT(billmaster.OrderDate, "%Y-%m-%d") between ' + `'${FromDate}'`;
          }
      
          if (this.BillMaster.ToDate !== '' && this.BillMaster.ToDate !== null && this.BillMaster.FilterTypes === 'OrderDate') {
            let ToDate = moment(this.BillMaster.ToDate).format('YYYY-MM-DD')
            Parem = Parem + ' and ' + `'${ToDate}'` + ' and billmaster.IsConvertInvoice = 0';
          }
      
          if (this.BillMaster.ShopID != 0) {
            Parem = Parem + ' and billmaster.ShopID IN ' + `(${this.BillMaster.ShopID})`;
          }
      
          if (this.BillMaster.EmployeeID !== 0) {
            Parem = Parem + ' and billmaster.Employee = ' + this.BillMaster.EmployeeID;
          }
      
          if (this.BillMaster.CustomerID != 0) {
            Parem = Parem + ' and billmaster.CustomerID = ' + this.BillMaster.CustomerID;
          }
      
          if (this.BillMaster.CustomerGSTNo !== 0) {
            Parem = Parem + ' and billmaster.GSTNo = ' + this.BillMaster.CustomerGSTNo;
          }
      
          if (this.BillMaster.PaymentStatus !== 0 && this.BillMaster.PaymentStatus !== null && this.BillMaster.PaymentStatus !== 'All') {
            Parem = Parem + ' and billmaster.PaymentStatus = ' + `'${this.BillMaster.PaymentStatus}'`;
          }
      
          if (this.BillMaster.ProductStatus !== '' && this.BillMaster.ProductStatus !== null && this.BillMaster.ProductStatus !== 'All') {
            Parem = Parem + ' and billmaster.ProductStatus = ' + `'${this.BillMaster.ProductStatus}'`;
          }
      
          if (this.BillMaster.BillType !== '' && this.BillMaster.BillType !== null && this.BillMaster.BillType !== 'All') {
            Parem = Parem + ' and billmaster.BillType = ' + `'${this.BillMaster.BillType}'`;
          }
      
          const subs: Subscription = this.ecs.getSalereportExport(Parem).subscribe({
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
            if (this.Billdetail.ProductCategory !== 0) {
              this.prodList.forEach((element: any) => {
                if (element.ID === this.Billdetail.ProductCategory) {
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
              this.Billdetail.ProductName = '';
              this.Billdetail.ProductCategory = 0;
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
        
          getGSTList() {
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
                let valueToAdd = element.SelectedValue;
                valueToAdd = valueToAdd.replace(/^\d+_/, "");
                productName = valueToAdd;
              } else if (element.SelectedValue !== '') {
                let valueToAdd = element.SelectedValue;
                    valueToAdd = valueToAdd.replace(/^\d+_/, "");
                productName += '/' + valueToAdd;
              }
            });
             this.Billdetail.ProductName = productName;
          }
        
          getBillDetails() {
            this.sp.show()
            let Parem = '';
        
            if (this.Billdetail.FromDate !== '' && this.Billdetail.FromDate !== null && this.Billdetail.FilterTypes === 'All') {
              let FromDate = moment(this.Billdetail.FromDate).format('YYYY-MM-DD')
              Parem = Parem + ' and ( DATE_FORMAT(billmaster.BillDate, "%Y-%m-%d") between ' + `'${FromDate}'`;
            }
        
            if (this.Billdetail.ToDate !== '' && this.Billdetail.ToDate !== null && this.Billdetail.FilterTypes === 'All') {
              let ToDate = moment(this.Billdetail.ToDate).format('YYYY-MM-DD')
              Parem = Parem + ' and ' + `'${ToDate}'`;
            }
        
            if (this.Billdetail.FromDate !== '' && this.Billdetail.FromDate !== null && this.Billdetail.FilterTypes === 'BillDate') {
              let FromDate = moment(this.Billdetail.FromDate).format('YYYY-MM-DD')
              Parem = Parem + ' and DATE_FORMAT(billmaster.BillDate, "%Y-%m-%d") between ' + `'${FromDate}'`;
            }
        
            if (this.Billdetail.ToDate !== '' && this.Billdetail.ToDate !== null && this.Billdetail.FilterTypes === 'BillDate') {
              let ToDate = moment(this.Billdetail.ToDate).format('YYYY-MM-DD')
              Parem = Parem + ' and ' + `'${ToDate}'`;
            }
        
            if (this.Billdetail.FromDate !== '' && this.Billdetail.FromDate !== null && this.Billdetail.FilterTypes === 'DeliveryDate') {
              let FromDate = moment(this.Billdetail.FromDate).format('YYYY-MM-DD')
              Parem = Parem + ' and DATE_FORMAT(billmaster.DeliveryDate, "%Y-%m-%d") between ' + `'${FromDate}'`;
            }
        
            if (this.Billdetail.ToDate !== '' && this.Billdetail.ToDate !== null && this.Billdetail.FilterTypes === 'DeliveryDate') {
              let ToDate = moment(this.Billdetail.ToDate).format('YYYY-MM-DD')
              Parem = Parem + ' and ' + `'${ToDate}'`;
            }
        
            if (this.Billdetail.FromDate !== '' && this.Billdetail.FromDate !== null && this.Billdetail.FilterTypes === 'OrderDate') {
              let FromDate = moment(this.Billdetail.FromDate).format('YYYY-MM-DD')
              Parem = Parem + ' and DATE_FORMAT(billmaster.OrderDate, "%Y-%m-%d") between ' + `'${FromDate}'`;
            }
        
            if (this.Billdetail.ToDate !== '' && this.Billdetail.ToDate !== null && this.Billdetail.FilterTypes === 'OrderDate') {
              let ToDate = moment(this.Billdetail.ToDate).format('YYYY-MM-DD')
              Parem = Parem + ' and ' + `'${ToDate}'` + ' and billmaster.IsConvertInvoice = 0';
            }
            if (this.Billdetail.FromDate !== '' && this.Billdetail.FromDate !== null && this.Billdetail.FilterTypes === 'All') {
              let FromDate = moment(this.Billdetail.FromDate).format('YYYY-MM-DD')
              Parem = Parem + ' OR DATE_FORMAT(billmaster.OrderDate, "%Y-%m-%d") between ' + `'${FromDate}'`;
            }
        
            if (this.Billdetail.ToDate !== '' && this.Billdetail.ToDate !== null && this.Billdetail.FilterTypes === 'All') {
              let ToDate = moment(this.Billdetail.ToDate).format('YYYY-MM-DD')
              Parem = Parem + ' and ' + `'${ToDate}'` + ' )';
            }
        
        
        
            if (this.Billdetail.ShopID != 0) {
              Parem = Parem + ' and billmaster.ShopID IN ' + `(${this.Billdetail.ShopID})`;
            }
        
            if (this.Billdetail.CustomerID !== 0) {
              Parem = Parem + ' and billmaster.CustomerID = ' + this.Billdetail.CustomerID;
            }
        
            if (this.Billdetail.CustomerGSTNo !== 0) {
              Parem = Parem + ' and billmaster.GSTNo = ' + this.Billdetail.CustomerGSTNo;
            }
        
            if (this.Billdetail.PaymentStatus !== 0 && this.Billdetail.PaymentStatus !== null && this.Billdetail.PaymentStatus !== 'All') {
              Parem = Parem + ' and billmaster.PaymentStatus = ' + `'${this.Billdetail.PaymentStatus}'`;
            }
        
            if (this.Billdetail.ProductStatus !== '' && this.Billdetail.ProductStatus !== null && this.Billdetail.ProductStatus !== 'All') {
              Parem = Parem + ' and billdetail.ProductStatus = ' + `'${this.Billdetail.ProductStatus}'`;
            }
        
            if (this.Billdetail.ProductCategory !== 0) {
              Parem = Parem + ' and billdetail.ProductTypeID = ' + this.Billdetail.ProductCategory;
              this.filter();
            }
        
            if (this.Billdetail.ProductName !== '') {
              Parem = Parem + ' and billdetail.ProductName Like ' + "'" + this.Billdetail.ProductName.trim() + "%'";
            }
        
            if (this.Billdetail.Option !== '' && this.Billdetail.Option !== null && this.Billdetail.Option !== 0) {
              Parem = Parem + ' and barcodemasternew.Option = ' + `'${this.Billdetail.Option}'`;
            }
        
            if (this.Billdetail.GSTPercentage !== 0) {
              Parem = Parem + ' and billdetail.GSTPercentage = ' + `'${this.Billdetail.GSTPercentage}'`;
            }
        
            if (this.Billdetail.GSTType !== 0) {
              Parem = Parem + ' and billdetail.GSTType = ' + `'${this.Billdetail.GSTType}'`;
            }
        
            if (this.Billdetail.Status !== '' && this.Billdetail.Status !== null && this.Billdetail.Status !== 0) {
              if (this.Billdetail.Status === 'Manual' && this.Billdetail.Status !== 'All') {
                Parem = Parem + ' and billdetail.Manual = ' + '1';
              } else if (this.Billdetail.Status === 'PreOrder' && this.Billdetail.Status !== 'All') {
                Parem = Parem + ' and billdetail.PreOrder = ' + '1';
              } else if (this.Billdetail.Status === 'Barcode' && this.Billdetail.Status !== 'All') {
                Parem = Parem + ' and billdetail.PreOrder = ' + '0';
                Parem = Parem + ' and billdetail.Manual = ' + '0';
              }
            }
        
            if (this.Billdetail.Barcode !== '') {
              Parem = Parem + ' and billdetail.Barcode = ' + `'${this.Billdetail.Barcode}'`;
            }
        
            const subs: Subscription = this.ecs.getSalereportsDetail(Parem, this.Productsearch).subscribe({
              next: (res: any) => {
                if (res.success) {
                  this.as.successToast(res.message)
                  this.BillDetailList = res.data
        
                  this.DetailtotalQty = res.calculation[0].totalQty;
                  this.DetailtotalDiscount = res.calculation[0].totalDiscount;
                  this.DetailtotalUnitPrice = res.calculation[0].totalUnitPrice;
                  this.DetailtotalGstAmount = res.calculation[0].totalGstAmount;
                  this.DetailtotalAmount = res.calculation[0].totalAmount;
                  this.gstdetails = res.calculation[0].gst_details
                  this.DetailtotalPrice = res.calculation[0].totalPurchasePrice;
                  this.DetailtotalPorfit = res.calculation[0].totalProfit;
                  this.DetailtotalAddlDiscount = res.calculation[0].totalAddlDiscount;
                  this.dataProductWise = res.dataProductWise;
                } else {
                  this.as.errorToast(res.message)
                }
                this.sp.hide()
              },
              error: (err: any) => console.log(err.message),
              complete: () => subs.unsubscribe(),
            });
          }
        
          getBillDetailsExport() {
            this.sp.show()
            let Parem = '';
        
               if (this.Billdetail.FromDate !== '' && this.Billdetail.FromDate !== null && this.Billdetail.FilterTypes === 'All') {
              let FromDate = moment(this.Billdetail.FromDate).format('YYYY-MM-DD')
              Parem = Parem + ' and ( DATE_FORMAT(billmaster.BillDate, "%Y-%m-%d") between ' + `'${FromDate}'`;
            }
        
            if (this.Billdetail.ToDate !== '' && this.Billdetail.ToDate !== null && this.Billdetail.FilterTypes === 'All') {
              let ToDate = moment(this.Billdetail.ToDate).format('YYYY-MM-DD')
              Parem = Parem + ' and ' + `'${ToDate}'`;
            }
        
              if (this.Billdetail.FromDate !== '' && this.Billdetail.FromDate !== null && this.Billdetail.FilterTypes === 'All') {
              let FromDate = moment(this.Billdetail.FromDate).format('YYYY-MM-DD')
              Parem = Parem + ' OR DATE_FORMAT(billmaster.OrderDate, "%Y-%m-%d") between ' + `'${FromDate}'`;
            }
        
            if (this.Billdetail.ToDate !== '' && this.Billdetail.ToDate !== null && this.Billdetail.FilterTypes === 'All') {
              let ToDate = moment(this.Billdetail.ToDate).format('YYYY-MM-DD')
              Parem = Parem + ' and ' + `'${ToDate}'` + ' )';
            }
            if (this.Billdetail.FromDate !== '' && this.Billdetail.FromDate !== null && this.Billdetail.FilterTypes === 'BillDate') {
              let FromDate = moment(this.Billdetail.FromDate).format('YYYY-MM-DD')
              Parem = Parem + ' and DATE_FORMAT(billmaster.BillDate, "%Y-%m-%d") between ' + `'${FromDate}'`;
            }
        
            if (this.Billdetail.ToDate !== '' && this.Billdetail.ToDate !== null && this.Billdetail.FilterTypes === 'BillDate') {
              let ToDate = moment(this.Billdetail.ToDate).format('YYYY-MM-DD')
              Parem = Parem + ' and ' + `'${ToDate}'`;
            }
        
            if (this.Billdetail.FromDate !== '' && this.Billdetail.FromDate !== null && this.Billdetail.FilterTypes === 'DeliveryDate') {
              let FromDate = moment(this.Billdetail.FromDate).format('YYYY-MM-DD')
              Parem = Parem + ' and DATE_FORMAT(billmaster.DeliveryDate, "%Y-%m-%d") between ' + `'${FromDate}'`;
            }
        
            if (this.Billdetail.ToDate !== '' && this.Billdetail.ToDate !== null && this.Billdetail.FilterTypes === 'DeliveryDate') {
              let ToDate = moment(this.Billdetail.ToDate).format('YYYY-MM-DD')
              Parem = Parem + ' and ' + `'${ToDate}'`;
            }
        
            if (this.Billdetail.FromDate !== '' && this.Billdetail.FromDate !== null && this.Billdetail.FilterTypes === 'OrderDate') {
              let FromDate = moment(this.Billdetail.FromDate).format('YYYY-MM-DD')
              Parem = Parem + ' and DATE_FORMAT(billmaster.OrderDate, "%Y-%m-%d") between ' + `'${FromDate}'`;
            }
        
            if (this.Billdetail.ToDate !== '' && this.Billdetail.ToDate !== null && this.Billdetail.FilterTypes === 'OrderDate') {
              let ToDate = moment(this.Billdetail.ToDate).format('YYYY-MM-DD')
              Parem = Parem + ' and ' + `'${ToDate}'` + ' and billmaster.IsConvertInvoice = 0';
            }
        
            if (this.Billdetail.ShopID != 0) {
              Parem = Parem + ' and billmaster.ShopID IN ' + `(${this.Billdetail.ShopID})`;
            }
        
            if (this.Billdetail.CustomerID !== 0) {
              Parem = Parem + ' and billmaster.CustomerID = ' + this.Billdetail.CustomerID;
            }
        
            if (this.Billdetail.CustomerGSTNo !== 0) {
              Parem = Parem + ' and billmaster.GSTNo = ' + this.Billdetail.CustomerGSTNo;
            }
        
            if (this.Billdetail.PaymentStatus !== 0 && this.Billdetail.PaymentStatus !== null && this.Billdetail.PaymentStatus !== 'All') {
              Parem = Parem + ' and billmaster.PaymentStatus = ' + `'${this.Billdetail.PaymentStatus}'`;
            }
        
            if (this.Billdetail.ProductStatus !== '' && this.Billdetail.ProductStatus !== null && this.Billdetail.ProductStatus !== 'All') {
              Parem = Parem + ' and billdetail.ProductStatus = ' + `'${this.Billdetail.ProductStatus}'`;
            }
        
            if (this.Billdetail.ProductCategory !== 0) {
              Parem = Parem + ' and billdetail.ProductTypeID = ' + this.Billdetail.ProductCategory;
              this.filter();
            }
        
            if (this.Billdetail.ProductName !== '') {
              Parem = Parem + ' and billdetail.ProductName Like ' + "'" + this.Billdetail.ProductName.trim() + "%'";
            }
        
            if (this.Billdetail.Option !== '' && this.Billdetail.Option !== null && this.Billdetail.Option !== 0) {
              Parem = Parem + ' and barcodemasternew.Option = ' + `'${this.Billdetail.Option}'`;
            }
        
            if (this.Billdetail.GSTPercentage !== 0) {
              Parem = Parem + ' and billdetail.GSTPercentage = ' + `'${this.Billdetail.GSTPercentage}'`;
            }
        
            if (this.Billdetail.GSTType !== 0) {
              Parem = Parem + ' and billdetail.GSTType = ' + `'${this.Billdetail.GSTType}'`;
            }
        
            if (this.Billdetail.Status !== '' && this.Billdetail.Status !== null && this.Billdetail.Status !== 0) {
              if (this.Billdetail.Status === 'Manual' && this.Billdetail.Status !== 'All') {
                Parem = Parem + ' and billdetail.Manual = ' + '1';
              } else if (this.Billdetail.Status === 'PreOrder' && this.Billdetail.Status !== 'All') {
                Parem = Parem + ' and billdetail.PreOrder = ' + '1';
              } else if (this.Billdetail.Status === 'Barcode' && this.Billdetail.Status !== 'All') {
                Parem = Parem + ' and billdetail.PreOrder = ' + '0';
                Parem = Parem + ' and billdetail.Manual = ' + '0';
              }
            }
            const subs: Subscription = this.ecs.getSalereportsDetailExport(Parem, this.Productsearch).subscribe({
              next: (res: any) => {
                this.downloadFile(res);
                this.sp.hide()
              },
              error: (err: any) => console.log(err.message),
              complete: () => subs.unsubscribe(),
            });
          }
        
        
          exportAsXLSXDetail(): void {
            let element = document.getElementById('saleDetailExcel');
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
            XLSX.writeFile(wb, 'Sale ProductType Report.xlsx');
          }
        
          openModalDetail(content: any) {
            this.modalService.open(content, { centered: true, backdrop: 'static', keyboard: false, size: 'sm' });
          }
        
          BillDetailsFromReset() {
        
            if(this.user.UserGroup == 'CompanyAdmin'){
              this.Billdetail = {
              FilterTypes: 'BillDate', FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, CustomerID: 0, CustomerGSTNo: 0, PaymentStatus: 0, ProductStatus: 'All', ProductCategory: 0, ProductName: '', GSTType: 0, GSTPercentage: 0, Status: 0, Option: 0,
            };
            }else{
              this.Billdetail = {
              FilterTypes: 'BillDate', FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: this.shopList[0].ShopID, CustomerID: 0, CustomerGSTNo: 0, PaymentStatus: 0, ProductStatus: 'All', ProductCategory: 0, ProductName: '', GSTType: 0, GSTPercentage: 0, Status: 0, Option: 0,
              };
            }
        
            this.BillDetailList = [];
            this.DetailtotalQty = 0;
            this.DetailtotalDiscount = 0;
            this.DetailtotalUnitPrice = 0;
            this.DetailtotalGstAmount = 0;
            this.DetailtotalAmount = 0;
            this.specList = [];
            this.DetailtotalPorfit = 0
            this.DetailtotalPrice = 0
            this.dataProductWise = '';
          }



            BillService() {
              this.sp.show()
              let Parem = '';
          
              if (this.service.FromDate !== '' && this.service.FromDate !== null) {
                let FromDate = moment(this.service.FromDate).format('YYYY-MM-DD')
                Parem = Parem + ' and DATE_FORMAT(billmaster.BillDate, "%Y-%m-%d") between ' + `'${FromDate}'`;
              }
          
              if (this.service.ToDate !== '' && this.service.ToDate !== null) {
                let ToDate = moment(this.service.ToDate).format('YYYY-MM-DD')
                Parem = Parem + ' and ' + `'${ToDate}'`;
              }
          
              if (this.service.ShopID != 0) {
                Parem = Parem + ' and billmaster.ShopID IN ' + `(${this.service.ShopID})`;
              }
          
              if (this.service.BillType !== 'All') {
                Parem = Parem + ' and billmaster.BillType = ' + `'${this.service.BillType}'`;
              }
          
          
              const subs: Subscription = this.bill.saleServiceReport(Parem).subscribe({
                next: (res: any) => {
                  if (res.success) {
                    this.as.successToast(res.message)
                    this.BillServiceList = res.data
                    this.ServiceAmount = (res.calculation[0].totalAmount).toFixed(2);
                    this.ServicetotalGstAmount = (res.calculation[0].totalGstAmount).toFixed(2);
                    this.ServicetotalDiscountAmount = (res.calculation[0].totalDiscountAmount).toFixed(2);
                    this.ServicetotalSUBTOTAL = (res.calculation[0].totalSubTotal).toFixed(2);
                    this.ServicetotalAddlDiscount = res.calculation[0].totalAddlDiscount;
                    this.gstService = res.calculation[0].gst_details
                  } else {
                    this.as.errorToast(res.message)
                  }
                  this.sp.hide()
                },
                error: (err: any) => console.log(err.message),
                complete: () => subs.unsubscribe(),
              })
            }
          
              openModalAdds(content98: any) {
              this.modalService.open(content98, { centered: true, backdrop: 'static', keyboard: false, size: 'sm' });
            }
          
            openModalService(content1: any) {
              this.modalService.open(content1, { centered: true, backdrop: 'static', keyboard: false, size: 'sm' });
            }
          
            exportAsXLSXcharge(): void {
              let element = document.getElementById('billServiceExcel');
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
              XLSX.writeFile(wb, 'BillService_Report.xlsx');
            }
          
            BillServiceFromReset() {
              this.service = {
                FromDate: moment().startOf('day').format('YYYY-MM-DD'), ToDate: moment().format('YYYY-MM-DD'), ShopID: 0, BillType: 'All'
              };
              this.BillServiceList = [];
              this.ServiceAmount = '';
              this.ServicetotalGstAmount = '';
              this.gstService = '';
              this.ServicetotalAmount = 0;
              this.ServicetotalSUBTOTAL = 0;
              this.ServiceGtotalAmount = 0;
          
            }
}
