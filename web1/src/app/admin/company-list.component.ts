import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { map, filter, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { fromEvent } from 'rxjs';
import { environment } from 'src/environments/environment';
import { TokenService } from '../service/token.service';
import { CompanyService } from '../service/company.service';
import { AlertService } from '../service/helpers/alert.service';
import { AuthServiceService } from '../service/auth-service.service';
import { ExcelService } from '../service/helpers/excel.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';


@Component({
  selector: 'app-company-list',
  templateUrl: './company-list.component.html',
  styleUrls: ['./company-list.component.css']
})
export class CompanyListComponent implements OnInit {

  @ViewChild('searching') searching: ElementRef | any;
  env = environment;
  term = "";
  gridview = true;
  dataList: any;
  barcodeDetailsList: any;
  invoiceDetailsList: any;
  currentPage = 1;
  itemsPerPage = 100;
  pageSize!: number;
  collectionSize = 0
  page = 4;
  deactives = 0

  moduleList: any = [
    // Administration Permission
    {ModuleName: 'CompanyInfo', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'Employee', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'EmployeeList', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'Shop', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'ShopList', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'RolePermission', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'CompanySetting', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'SmsSetting', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'LoginHistory', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'RecycleBin', MView: true, Edit: true, Add: true, View: true, Delete: true},

    // Product Permission
    {ModuleName: 'ProductType', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'ProductMaster', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'AddManagement', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'ChargeManagement', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'ServiceManagement', MView: true, Edit: true, Add: true, View: true, Delete: true},

    // Purchasing Permission
    {ModuleName: 'Supplier', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'SupplierList', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'Purchase', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'PurchaseList', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'PurchaseReturn', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'PurchaseReturnList', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'ProductTransfer', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'OrderPrice', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'OrderPriceList', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'SearchOrderPriceList', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'StockAdjustment', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'Brand/NonBrand/Assign', MView: true, Edit: true, Add: true, View: true, Delete: true},

    // Billing Permissions
    {ModuleName: 'CustomerBill', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'BillingSearch', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'Customer', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'CustomerSearch', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'Doctor', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'DoctorList', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'Loyalty', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'LoyaltyInvoice', MView: true, Edit: true, Add: true, View: true, Delete: true},

    // Lens order Permissions
    {ModuleName: 'SupplierOrder', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'PurchaseConvert', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'SupplierOrderList', MView: true, Edit: true, Add: true, View: true, Delete: true},

    // Lens order Permissions
    {ModuleName: 'Fitter', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'FitterList', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'FitterOrder', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'FitterInvoice', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'FitterInvoiceList', MView: true, Edit: true, Add: true, View: true, Delete: true},

    // Payment Permissions
    {ModuleName: 'Payment', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'PaymentList', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'Payroll', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'payrollList', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'Expense', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'ExpenseList', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'PettyCashReport', MView: true, Edit: true, Add: true, View: true, Delete: true},

     // Report Permissions
    {ModuleName: 'SaleReport', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'SaleProductReport', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'SaleServiceReport', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'PurchaseReport', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'PurchaseProductReport', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'PurchaseChargeReport', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'PurchaseProductExpiryReport', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'InventoryReport', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'ProductSummaryReport', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'ProductTransferReport', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'ProductReturnReport', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'ProductReturnProductTypeReport', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'EyeTestReport', MView: true, Edit: true, Add: true, View: true, Delete: true},

    // Excel Import
    {ModuleName: 'InventoryExcelImport', MView: true, Edit: true, Add: true, View: true, Delete: true},
    {ModuleName: 'CustomerExcelImport', MView: true, Edit: true, Add: true, View: true, Delete: true},
  ];
  user: any = JSON.parse(localStorage.getItem('user') || '');

  constructor(
    private router: Router,
    private token: TokenService,
    private cs: CompanyService,
    public as: AlertService,
    private auth: AuthServiceService,
    private excelService: ExcelService,
    private sp: NgxSpinnerService,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('user') || '')
    if (this.user.UserGroup !== 'SuperAdmin') {
      localStorage.clear();
      this.router.navigate(['/']);
      this.as.successToast("LogOut !!")
    } else {
      this.getList();
    }
  }

  onPageChange(pageNum: number): void {
    this.pageSize = this.itemsPerPage * (pageNum - 1);
  }

  changePagesize(num: number): void {
    this.itemsPerPage = this.pageSize + num;
  }

  getList() {
    this.sp.show()
    const dtm = {
      currentPage: this.currentPage,
      itemsPerPage: this.itemsPerPage
    }
    const subs: Subscription = this.cs.getList(dtm).subscribe({
      next: (res: any) => {
        if(res.success){
          this.collectionSize = res.count;
          this.dataList = res.data;
          this.dataList.forEach((element: { PhotoURL: any; }) => {
            if (element.PhotoURL !== "null" && element.PhotoURL !== "") {
              element.PhotoURL = (this.env.apiUrl + element.PhotoURL);
            } else {
              element.PhotoURL = "/assets/images/userEmpty.png"
            }
          });
          this.as.successToast(res.message)
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide() 
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  deleteItem(i: any) {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      backdrop: 'static',
    }).then((result) => {
    this.sp.show();
      if (result.isConfirmed) {
        const subs: Subscription = this.cs.deleteData(this.dataList[i].ID).subscribe({
          next: (res: any) => {
            if(res.success){
              this.dataList.splice(i, 1);
              this.as.successToast(res.message)
              Swal.fire({
                position: 'center',
                icon: 'success',
                title: 'Your file has been deleted.',
                showConfirmButton: false,
                timer: 1000
              })
            }else{
              this.as.successToast(res.message)
              Swal.fire({
                position: 'center',
                icon: 'success',
                title: res.message,
                showConfirmButton: false,
                timer: 1000
              })
            }
            this.sp.hide();
          },
          error: (err: any) => console.log(err.message),
          complete: () => subs.unsubscribe(),
        });
      }
    })
  }

  companylogin(i: any) {
    Swal.fire({
      title: 'Are you sure Login To Company?',
      // text: "Do You Want To Login To The Company Or Not!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Login',
      backdrop: false

    }).then((result) => {
      if (result.isConfirmed) {
        this.sp.show();
        const subs: Subscription = this.auth.companylogin(this.dataList[i].LoginName).subscribe({
          next: (res: any) => {
            if (res.loginCode === 1) {

              localStorage.clear();
              this.as.successToast(res.message)
              this.token.setToken(res.accessToken);
              this.token.refreshToken(res.refreshToken);
              localStorage.setItem('user', JSON.stringify(res.data));
              localStorage.setItem('company', JSON.stringify(res.Company));
              localStorage.setItem('companysetting', JSON.stringify(res.CompanySetting));
              localStorage.setItem('shop', JSON.stringify(res.shop));
              localStorage.setItem('selectedShop', JSON.stringify([`${res.shop[0]?.ID}`]));
              localStorage.setItem('permission', JSON.stringify(this.moduleList));
              this.router.navigate(['/admin/CompanyDashborad'])
                .then(() => {
                  window.location.reload();
                });
                Swal.fire({
                  position: 'center',
                  icon: 'success',
                  title: 'Your has been Company Login.',
                  showConfirmButton: false,
                  timer: 1000
                })
            } else {
              console.log('not login compnay');
            }
            this.sp.hide();
          },
          error: (err: any) => console.log(err.message),
          complete: () => subs.unsubscribe(),
        });

      }
    })


  }

  ngAfterViewInit() {
    // server-side search
    fromEvent(this.searching.nativeElement, 'keyup').pipe(
      // get value
      map((event: any) => {
        return event.target.value;
      }),

      // if character length greater then 2
      // filter(res => res.length > 2),

      // Time in milliseconds between key events
      debounceTime(1000),

      // If previous query is different from current
      distinctUntilChanged(),
      // tap((event: KeyboardEvent) => {
      //     console.log(event)
      //     console.log(this.input.nativeElement.value)
      //   })
      // subscription for response
    ).subscribe((text: string) => {
      //  const name = e.target.value;
      let data = {
        searchQuery: text.trim(),
      }
      if (data.searchQuery !== "") {
        const dtm = {
          currentPage: 1,
          itemsPerPage: 50000,
          searchQuery: data.searchQuery
        }
        this.sp.show()
        const subs: Subscription = this.cs.searchByFeild(dtm).subscribe({
          next: (res: any) => {
            if(res.success){
              this.collectionSize = 1;
              this.page = 1;
              this.dataList = res.data
              this.as.successToast(res.message)
            }else{
              this.as.errorToast(res.message)
            }
            this.sp.hide();
          },
          error: (err: any) => console.log(err.message),
          complete: () => subs.unsubscribe(),
        });
      } else {
        this.sp.hide();
        this.getList();
      }
    });
  }

  deactive(i: any) {
    Swal.fire({
      title: 'Are you sure?',
      text: "Do You Want To Deactive This Company",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Deactive',
      backdrop: false

    }).then((result) => {
      if (result.isConfirmed) {
        this.sp.show()
        const subs: Subscription = this.cs.deactive(this.dataList[i].ID).subscribe({
          next: (res: any) => {
            if(res.success){
              Swal.fire({
                position: 'center',
                icon: 'success',
                title: 'Company has been Deactive.',
                showConfirmButton: false,
                timer: 1500
              })
              this.getList();
              this.as.successToast(res.message)
            }else{
              this.as.errorToast(res.message)
            }
            this.sp.hide()
          },
          error: (err: any) => console.log(err.message),
          complete: () => subs.unsubscribe(),
        });
      }
    })
  }

  activecompany(i:any) {
    Swal.fire({
      title: 'Are you sure?',
      text: "Do You Want To Active This Company",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Active',
      backdrop: false

    }).then((result) => {
      if (result.isConfirmed) {
        this.sp.show()
        const subs: Subscription = this.cs.activecompany(this.dataList[i].ID).subscribe({
          next: (res: any) => {
            if(res.success){
              Swal.fire({
                position: 'center',
                icon: 'success',
                title: 'Company has been Active.',
                showConfirmButton: false,
                timer: 1500
              })
              this.getList();
              this.as.successToast(res.message)
            }else{
              this.as.errorToast(res.message)
            }
            this.sp.hide()
          },
          error: (err: any) => console.log(err.message),
          complete: () => subs.unsubscribe(),
        });
       
      }
    })
  }

  exportAsXLSX(): void {
    this.excelService.exportAsExcelFile(this.dataList, 'company_list');
  }

  openModal(content: any,data:any) {
    console.log(data);
    this.modalService.open(content, { centered: true , backdrop : 'static', keyboard: false, size:'xl'});
    this.invoiceDetails(data)
    this.barcodeDetails(data)
  }

  barcodeDetails(CompanyID:any) {
    this.sp.show()
    const subs: Subscription = this.cs.barcodeDetails(CompanyID).subscribe({
      next: (res: any) => {
        if(res.success){
          this.barcodeDetailsList = res.data;
          this.as.successToast(res.message)
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide() 
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  invoiceDetails(CompanyID:any) {
    this.sp.show()
    const subs: Subscription = this.cs.invoiceDetails(CompanyID).subscribe({
      next: (res: any) => {
        if(res.success){
          this.invoiceDetailsList = res.data;
          this.as.successToast(res.message)
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide() 
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

}
