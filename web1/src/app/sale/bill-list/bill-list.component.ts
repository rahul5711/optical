import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators,ReactiveFormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { Subscription } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2'; 
import { AlertService } from 'src/app/service/helpers/alert.service';
import { map, filter, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { fromEvent   } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ExcelService } from 'src/app/service/helpers/excel.service';
import { CustomerService } from 'src/app/service/customer.service';
import { BillService } from 'src/app/service/bill.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, Router } from '@angular/router';
import { SupportService } from 'src/app/service/support.service';
import { PaymentService } from 'src/app/service/payment.service';
import * as moment from 'moment';



@Component({
  selector: 'app-bill-list',
  templateUrl: './bill-list.component.html',
  styleUrls: ['./bill-list.component.css']
})
export class BillListComponent implements OnInit {
  
  @ViewChild('searching') searching: ElementRef | any;
  company = JSON.parse(localStorage.getItem('company') || '');
  user = JSON.parse(localStorage.getItem('user') || '');
  companysetting = JSON.parse(localStorage.getItem('companysetting') || '');
  selectedShop = JSON.parse(localStorage.getItem('selectedShop') || '');
  permission = JSON.parse(localStorage.getItem('permission') || '[]');

  id :any
  env = environment;

  gridview = true
  term = "";
  dataList: any =[];
  currentPage = 1;
  itemsPerPage = 10;
  pageSize!: number;
  collectionSize = 0
  page = 4;
  suBtn = false;
  paymentHistoryList :any = []
  PaymentModesList :any = []
  UpdateMode = false;
  CustomerTotal:any 
  TotalAmountInv:any 
  DueAmountInv:any 

  applyDebitPayment:any = {
    ID: null, CustomerID: null, CompanyID: null, ShopID: null, CreditType: 'Debit',  PayableAmount: 0, PaidAmount: 0, 
  };

  applyCreditPayment:any = {
    ID: null, CustomerID: null,  PayableAmount: 0, PaidAmount: 0, PaymentMode:null
  };

  applyPayment:any = {
    ID: null, CustomerID: null, CompanyID: null, ShopID: null, CreditType: 'Credit', PaymentDate: null, PayableAmount: 0, PaidAmount: 0, 
    CustomerCredit: 0, PaymentMode: null, CardNo: '', PaymentReferenceNo: '', Comments: 0, Status: 1, 
    pendingPaymentList: {}, RewardPayment: 0, ApplyReward: false, ApplyReturn: false
  };

  paidList :any=[]
  invoiceList :any=[]

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    public as: AlertService,
    private sp: NgxSpinnerService,
    private excelService: ExcelService,
    public bill: BillService,
    private modalService: NgbModal,
    private supps: SupportService,
    private pay: PaymentService,

  ) { 
    this.id = this.route.snapshot.params['customerid'];
  }

  editBillingSearch = false
  addBillingSearch = false
  deleteBillingSearch = false

  ngOnInit(): void {
    this.permission.forEach((element: any) => {
      if (element.ModuleName === 'BillingSearch') {
        this.editBillingSearch = element.Edit;
        this.addBillingSearch = element.Add;
        this.deleteBillingSearch = element.Delete;
      }
    });
    if(this.id != "0"){
      this.paymentHistory()
    }else{
      this.getList()
    }
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
    const subs: Subscription = this.bill.getList(dtm).subscribe({
      next: (res: any) => {
        if(res.success){
          this.collectionSize = res.count;
          this.dataList = res.data;
          this.dataList.forEach((element: { PhotoURL: any; }) => {
            if(element.PhotoURL !== "null" && element.PhotoURL !== ''){
              element.PhotoURL = (this.env.apiUrl + element.PhotoURL);
            }else{
              element.PhotoURL = "/assets/images/userEmpty.png"
            }
          });
          this.as.successToast(res.message)
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  showInput(){
    this.UpdateMode = !this.UpdateMode;
    this.paymentHistoryList.forEach((ep: any) =>{
      ep.PaymentDate = moment(ep.PaymentDate).format('YYYY-MM-DD')
    })
  }

  // payment history 
  openModal(content: any,data:any) {
    this.sp.show();
    this.applyCreditPayment.CustomerID = data.CustomerID
    this.applyCreditPayment.ID = data.ID
    this.modalService.open(content, { centered: true , backdrop : 'static', keyboard: false,size: 'md'});
    const subs: Subscription = this.bill.paymentHistory( data.ID, data.InvoiceNo).subscribe({
      next: (res: any) => {
        if(res.success){
          // res.data.forEach((ele: any) => {
          //   ele.Amount = ele.Credit === 'Debit' ? '-' + ele.Amount : '+' + ele.Amount;
          // });
          this.paymentHistoryList = res.data;
          this.applyDebitPayment.PayableAmount = res.totalPaidAmount
          this.applyDebitPayment.CustomerID = res.data[0].CustomerID
          this.applyDebitPayment.ID = res.data[0].BillMasterID
          ;
          this.getPaymentModesList()
          this.as.successToast(res.message)
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

// payment mode 
  getPaymentModesList() {
    const subs: Subscription = this.supps.getList('PaymentModeType').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.PaymentModesList = res.data
        } else {
          this.as.errorToast(res.message)
        }
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  updateCustomerPaymentMode(data:any) {
      const subs: Subscription = this.pay.updateCustomerPaymentMode(data).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.UpdateMode = false
            this.as.successToast(res.message)
          } else {
            this.as.errorToast(res.message)
          }
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
  }

  // payment date update 
  updateCustomerPaymentDate(data:any) {
      const subs: Subscription = this.pay.updateCustomerPaymentDate(data).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.UpdateMode = false
            this.as.successToast(res.message)
          } else {
            this.as.errorToast(res.message)
          }
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
  }

   // customer payment debit and credit
  openModal12(content: any) {
    this.sp.show();
    this.modalService.open(content, { centered: true , backdrop : 'static', keyboard: false,size: 'sm'});
    this.sp.hide();
  }

  customerPaymentDebit(){
    if(this.applyDebitPayment.PayableAmount < this.applyDebitPayment.PaidAmount){
      Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        backdrop: false,
      })
    }else{
      const subs: Subscription = this.pay.customerPaymentDebit(this.applyDebitPayment).subscribe({
        next: (res: any) => {
          if (res.success) {
            const subs: Subscription = this.bill.paymentHistory( res.data.ID, res.data.InvoiceNo).subscribe({
              next: (res: any) => {
                if(res.success){
                  this.paymentHistoryList = res.data;
                  this.applyDebitPayment.PayableAmount = res.totalPaidAmount;
                  this.as.successToast(res.message)
                }else{
                  this.as.errorToast(res.message)
                  Swal.fire({
                    icon: 'warning',
                    title: res.message,
                    showCancelButton: true,
                    backdrop: false,
                  })
                }
              },
              error: (err: any) => console.log(err.message),
              complete: () => subs.unsubscribe(),
            });
            this.modalService.dismissAll()
            this.applyDebitPayment = []
            this.as.successToast(res.message)
          } else {
            this.as.errorToast(res.message)
          }
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    }
    
  }

  openModal14(content: any,){
    this.sp.show();
    this.modalService.open(content, { centered: true , backdrop : 'static', keyboard: false,size: 'sm'});
    this.getCustomerCreditAmount(this.applyCreditPayment.ID ,this.applyCreditPayment.CustomerID)
    this.sp.hide();
  }

  getCustomerCreditAmount(ID:any ,CustomerID:any){
    this.sp.show();
    const subs: Subscription = this.pay.getCustomerCreditAmount(ID,CustomerID).subscribe({
      next: (res: any) => {
        if(res.success){
          this.getPaymentModesList()
          this.applyCreditPayment.PayableAmount = res.totalCreditAmount
          this.as.successToast(res.message)
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  customerCreditDebit(){
    if(this.applyCreditPayment.PayableAmount < this.applyCreditPayment.PaidAmount){
      Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        backdrop: false,
      })
    }else{
      const subs: Subscription = this.pay.customerCreditDebit(this.applyCreditPayment).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.getCustomerCreditAmount(res.data.ID ,res.data.CustomerID)
            this.applyCreditPayment.PaidAmount = 0; this.applyCreditPayment.PaymentMode = '';
            this.as.successToast(res.message)
          } else {
            this.as.errorToast(res.message)
          }
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    }
    
  }
   // customer payment debit and credit


  // customer payment individual invoice wise
  openModal13(content: any,data:any) {
    this.sp.show();
    this.modalService.open(content, { centered: true , backdrop : 'static', keyboard: false,size: 'md'});
    this.getPaymentModesList()
    this.paymentHistoryByMasterID(data.CustomerID,data.ID)
    this.billByCustomer(data.CustomerID,data.ID)
    this.applyPayment.CustomerID = data.CustomerID
    this.applyPayment.BillMasterID = data.ID
    this.sp.hide();
  }

  billByCustomer(CustomerID:any,BillMasterID:any){
    this.sp.show()
    const subs: Subscription = this.bill.billByCustomerInvoice(CustomerID,BillMasterID).subscribe({
      next: (res: any) => {
          if(res.success ){
             this.invoiceList = res.data
              if (this.invoiceList.length === 0) {
                 this.invoiceList = [{ InvoiceNo: 'No Pending Invoice', TotalAmount: 0.00, DueAmount: 0.00 }];
              }
             this.applyPayment.PayableAmount =  res.totalDueAmount ? res.totalDueAmount: 0;
             this.applyPayment.CustomerCredit = res.creditAmount ? res.creditAmount : 0
          }else{
            this.as.errorToast(res.message)
            Swal.fire({
              position: 'center',
              icon: 'warning',
              title: 'Opps !!',
              text: res.message,
              showConfirmButton: true,
              backdrop : false,
            })
          }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  paymentHistoryByMasterID(CustomerID:any,BillMasterID:any){
    this.sp.show()
    const subs: Subscription = this.bill.paymentHistoryByMasterID(CustomerID,BillMasterID).subscribe({
      next: (res: any) => {
          if(res.success ){
            res.data.forEach((ele: any) => {
              ele.Amount = ele.Type === 'Debit' ? '-' + ele.Amount : '+' + ele.Amount;
            });
             this.paidList = res.data
          }else{
            this.as.errorToast(res.message)
            Swal.fire({
              position: 'center',
              icon: 'warning',
              title: 'Opps !!',
              text: res.message,
              showConfirmButton: true,
              backdrop : false,
            })
          }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  onPaymentSubmit(){
    if(this.applyPayment.PayableAmount < this.applyPayment.PaidAmount ){
      Swal.fire({
        position: 'center',
        icon: 'warning',
        title: 'Opps !!',
        showConfirmButton: true,
        backdrop : false,
      })
      this.applyPayment.PaidAmount = 0
    }
    if(this.applyPayment.ApplyReturn === true){
      if (this.applyPayment.CustomerCredit < this.applyPayment.PaidAmount){
        Swal.fire({
          position: 'center',
          icon: 'warning',
          title: 'Opps !!',
          showConfirmButton: true,
          backdrop : false,
        })
        this.applyPayment.PaidAmount = 0
      }
    }

    if(this.applyPayment.PaidAmount !== 0){
      this.applyPayment.CompanyID = this.company.ID;
      this.applyPayment.ShopID = Number(this.selectedShop);
      this.applyPayment.PaymentDate =  moment().format('YYYY-MM-DD');
      this.applyPayment.pendingPaymentList = this.invoiceList;
      console.log(this.applyPayment);
      const subs: Subscription = this.pay.customerPayment(this.applyPayment).subscribe({
        next: (res: any) => {
            if(res.success ){
              this.paymentHistoryByMasterID(this.applyPayment.CustomerID,this.applyPayment.BillMasterID)
              this.billByCustomer(this.applyPayment.CustomerID,this.applyPayment.BillMasterID)
              this.applyPayment.PaidAmount = 0; this.applyPayment.PaymentMode = ''; this.applyPayment.ApplyReturn = false;
            }else{
              this.as.errorToast(res.message)
              Swal.fire({
                position: 'center',
                icon: 'warning',
                title: 'Opps !!',
                text: res.message,
                showConfirmButton: true,
                backdrop : false,
              })
            }
          this.sp.hide()
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    }
  }
  // customer payment individual invoice wise
  // deleteItem(i:any){
  //   Swal.fire({
  //     title: 'Are you sure?',
  //     text: "You won't be able to revert this!",
  //     icon: 'warning',
  //     showCancelButton: true,
  //     confirmButtonColor: '#3085d6',
  //     cancelButtonColor: '#d33',
  //     confirmButtonText: 'Yes, delete it!'
  //   }).then((result) => {
  //     if (result.isConfirmed) {
  //       this.sp.show()
  //       const subs: Subscription = this.bill.deleteData(this.dataList[i].ID).subscribe({
  //         next: (res: any) => {
  //           if(res.success){
  //             this.dataList.splice(i, 1);
  //             this.as.successToast(res.message)
  //             Swal.fire({
  //               position: 'center',
  //               icon: 'success',
  //               title: 'Your file has been deleted.',
  //               showConfirmButton: false,
  //               timer: 1000
  //             })
  //           }else{
  //             this.as.errorToast(res.message)
  //           }
  //           this.sp.hide()
  //         },
  //         error: (err: any) => console.log(err.message),
  //         complete: () => subs.unsubscribe(),
  //       });
  //     }
  //   })
  //   this.sp.hide()
  // }

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
       
    if(data.searchQuery !== "") {
      const dtm = {
        currentPage: 1,
        itemsPerPage: 50000,
        searchQuery: data.searchQuery 
      }
      this.sp.show()
      const subs: Subscription = this.bill.searchByFeild(dtm).subscribe({
        next: (res: any) => {
          if(res.success){
            this.collectionSize = 1;
            this.page = 1;
            this.dataList = res.data;
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
        this.getList()
      }
    });
  }

  exportAsXLSX(): void {
    this.excelService.exportAsExcelFile(this.dataList, 'customer_list');
  }

  paymentHistory() {
    this.sp.show();
    let CustomerID = Number(this.id)
    const subs: Subscription = this.bill.billHistoryByCustomer(CustomerID).subscribe({
      next: (res: any) => {
        if(res.success){
          console.log(res);
          this.dataList = res.data;
          this.TotalAmountInv = res.sumData.TotalAmount.toFixed(2);
          this.DueAmountInv = res.sumData.DueAmount.toFixed(2);
          this.CustomerTotal = (this.TotalAmountInv-this.DueAmountInv).toFixed(2);
          this.as.successToast(res.message)
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  deleteItem(i:any){
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.sp.show()
        if(this.dataList[i].Quantity == 0) {
        }else {
          Swal.fire({
            title: 'Alert',
            text: "you can not delete this invoice, please delete product first!",
            icon: 'warning',
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'OK!'
          })
        }
        this.sp.hide()
        const subs: Subscription = this.bill.deleteData(this.dataList[i].ID).subscribe({
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
              this.as.errorToast(res.message)
              Swal.fire({
                position: 'center',
                icon: 'warning',
                title: res.message,
                showCancelButton: true,
              })
            }
            this.sp.hide()
          },
          error: (err: any) => console.log(err.message),
          complete: () => subs.unsubscribe(),
        });
      }
    })
  }
 
}
