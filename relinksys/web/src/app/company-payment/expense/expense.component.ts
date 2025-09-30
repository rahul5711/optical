import { Component, ElementRef, OnInit, HostListener,ViewChild, ViewEncapsulation } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { environment } from 'src/environments/environment';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { map, filter, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { fromEvent } from 'rxjs'
import { ExpenseService } from 'src/app/service/expense.service';
import { ShopService } from 'src/app/service/shop.service';
import { SupportService } from 'src/app/service/support.service';
import { ExpenseModel } from 'src/app/interface/Expense';
import { ExcelService } from 'src/app/service/helpers/excel.service';
import * as moment from 'moment';
import { PettycashService } from 'src/app/service/pettycash.service';
import { BillService } from 'src/app/service/bill.service';

@Component({
  selector: 'app-expense',
  templateUrl: './expense.component.html',
  styleUrls: ['./expense.component.css']
})
export class ExpenseComponent implements OnInit {

  user = JSON.parse(localStorage.getItem('user') || '');
  companySetting = JSON.parse(localStorage.getItem('companysetting') || '');
  permission = JSON.parse(localStorage.getItem('permission') || '[]');
  selectedShop:any =JSON.parse(localStorage.getItem('selectedShop') || '') ;

    @HostListener('document:keydown', ['$event'])
      handleKeyboardEvent(event: KeyboardEvent) {
        if (event.altKey && event.key === 's' || event.altKey && event.key === 'S') {
          this.onsubmit();
          event.preventDefault();
        }
        if (event.altKey && event.key === 'u' || event.altKey && event.key === 'U') {
          this.updateExpense();
          event.preventDefault();
        }
   
        if (event.key === 'Escape') {
          this.modalService.dismissAll()
          event.preventDefault();
      }
      }

  @ViewChild('searching') searching: ElementRef | any;
  term: any;
  dataList: any;
  dropShoplist: any;
  PaymentModesList: any;
  ExpenseTypeList: any;
  currentPage = 1;
  itemsPerPage = 10;
  pageSize!: number;
  collectionSize = 0
  page = 4;
  id: any;
  suBtn = false;
  searchValue: any = '';
  
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    public as: AlertService,
    private expen: ExpenseService,
    private sp: NgxSpinnerService,
    private modalService: NgbModal,
    private excelService: ExcelService,
    private ss: ShopService,
    private supps: SupportService,
    private petty: PettycashService,
        public bill: BillService,

  ) { this.id = this.route.snapshot.params['id']; }


  data: any = { ID: 0, CompanyID: 0,ExpenseDate:'', ShopID: 0, Name: '', InvoiceNo: '', Category: '', SubCategory: '', Amount: '', PaymentMode: '', CashType: '', PaymentRefereceNo: '', Comments: '', Status: 1, CreatedBy: '', UpdatedBy: '', CreatedOn: '', UpdatedOn: '', };

  editExpenseList = false
  addExpenseList = false
  deleteExpenseList = false
  shopId:any =[]
  currentTime = '';
  PettyCashBalance = 0;
  CashCounterBalance=0;

  ngOnInit(): void {
    this.permission.forEach((element: any) => {
      if (element.ModuleName === 'ExpenseList') {
        this.editExpenseList = element.Edit;
        this.addExpenseList = element.Add;
        this.deleteExpenseList = element.Delete;
      }
    });
    this.getList();
    this.dropdownShoplist();
    // this.getPaymentModesList();
      this.bill.paymentModes$.subscribe((list:any) => {
      this.PaymentModesList = list.filter((p: { Name: string }) => p.Name !== 'AMOUNT RETURN').sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
    });
    this.getExpenseTypeList();
    this.getPettyCashBalance();
    this.getCashCounterCashBalance();
  }

  getPettyCashBalance(){
    this.data.CashType = 'PettyCash'
    this.data.CreditType = 'Deposit'
    const subs: Subscription = this.petty.getPettyCashBalance(this.data).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.PettyCashBalance = res.data
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getCashCounterCashBalance(){
    this.data.CashType = 'CashCounter'
    this.data.CreditType = 'Deposit'
    const subs: Subscription = this.petty.getCashCounterCashBalance(this.data).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.CashCounterBalance = res.data
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  dropdownShoplist() {
    this.sp.show()  
      const subs: Subscription = this.ss.dropdownShoplist('').subscribe({
        next: (res: any) => {
          if (res.success) {
            this.dropShoplist = res.data
            this.shopId = []
            this.shopId = res.data.filter((s:any) => s.ID === Number(this.selectedShop[0]));
            this.data.ShopID = this.shopId[0].ID
          } else {
            this.as.errorToast(res.message)
          }
          this.sp.hide();
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
  }

  getExpenseTypeList() {
    const subs: Subscription = this.supps.getList('ExpenseType').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.ExpenseTypeList = res.data.sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getPaymentModesList() {
    const subs: Subscription = this.supps.getList('PaymentModeType').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.PaymentModesList = res.data.filter((p: { Name: string }) => p.Name !== 'AMOUNT RETURN').sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getList() {
    this.sp.show()
    const dtm = {
      currentPage: this.currentPage,
      itemsPerPage: this.itemsPerPage
    }
    const subs: Subscription = this.expen.getList(dtm).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.collectionSize = res.count;
          this.dataList = res.data;
          this.as.successToast(res.message)
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  onsubmit() {
    this.sp.show()
    this.data.ExpenseDate = this.data.ExpenseDate + ' ' + this.currentTime;
    this.data.ExpenseDate = this.data.ExpenseDate.trim()
    const subs: Subscription = this.expen.saveExpense(this.data).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.formReset();
          this.modalService.dismissAll();
          this.getPettyCashBalance();
          this.getCashCounterCashBalance();
          this.getList();
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Your file has been Save.',
            showConfirmButton: false,
            timer: 1200
          })
        } else {
          this.as.errorToast(res.message)
          this.data.ExpenseDate = moment(this.data.ExpenseDate).format('YYYY-MM-DD')
          Swal.fire({
            position: 'center',
            icon: 'warning',
            title: res.message,
          })
         
        }
        this.sp.hide();
      },
      error: (err: any) => {
        console.log(err.msg);
      },
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
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.sp.show();
        const subs: Subscription = this.expen.deleteData(this.dataList[i].ID).subscribe({
          next: (res: any) => {
            if (res.success) {
              this.dataList.splice(i, 1);
              this.as.successToast(res.message)
              Swal.fire({
                position: 'center',
                icon: 'success',
                title: 'Your file has been deleted.',
                showConfirmButton: false,
                timer: 1000
              })
              this.getList();
            } else {
              this.as.errorToast(res.message)
            }
            this.sp.hide();
          },
          error: (err: any) => console.log(err.message),
          complete: () => subs.unsubscribe(),
        });
      }
    })
  }

  updateExpense() {
    this.sp.show();
    this.data.ExpenseDate = this.data.ExpenseDate + ' ' + this.currentTime;
    this.data.ExpenseDate = this.data.ExpenseDate.trim()
    const subs: Subscription = this.expen.updateExpense(this.data).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.formReset();
          this.modalService.dismissAll();
          this.getPettyCashBalance();
          this.getCashCounterCashBalance();
          this.getList();
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Your file has been Update.',
            showConfirmButton: false,
            timer: 1200
          })
        } else {
          this.as.errorToast(res.message)
          this.data.ExpenseDate = moment(this.data.ExpenseDate).format('YYYY-MM-DD')
          Swal.fire({
            position: 'center',
            icon: 'warning',
            title: res.message,
          })
        }
        this.sp.hide();
      },
      error: (err: any) => {
        console.log(err.msg);
      },
      complete: () => subs.unsubscribe(),
    });
  }
  
  onChange(event: string) {
    let modifiedEvent = event; // Create a new variable to store the modified result
    if (this.companySetting?.DataFormat === '1') {
      modifiedEvent = event.toUpperCase();
    } else if (this.companySetting?.DataFormat === '2') {
      modifiedEvent = this.toTitleCase(event);
    }
    return modifiedEvent;
  }
  
  toTitleCase(inputString: string) {
    // Implement a function to convert inputString to title case
    return inputString.toLowerCase().replace(/^(.)|\s(.)/g, function ($1) {
      return $1.toUpperCase();
    });
  }
  

  openEditModal(content: any, datas: any) {
    this.suBtn = true;
    this.data = datas;
    if( this.data.CashType == 'PettyCash'){
      this.getPettyCashBalance();
    }else if(this.data.CashType == 'CashCounter'){
      this.getCashCounterCashBalance();
    }
    this.data.ExpenseDate = moment(datas.ExpenseDate).format('YYYY-MM-DD')
    this.data.ShopID = Number(datas.ShopID);
    this.modalService.open(content, { centered: true, backdrop: 'static', keyboard: false, size: 'xl' });
  }

  openModal(content: any) {
    this.formReset();
    this.suBtn = false;
    this.data.ExpenseDate = moment().format('YYYY-MM-DD');
    this.currentTime = new Date().toLocaleTimeString('en-US', { hourCycle: 'h23' })
    this.dropdownShoplist();
    this.modalService.open(content, { centered: true, backdrop: 'static', keyboard: false, size: 'xl' });
  }

  exportAsXLSX(): void {
    let data = this.dataList.map((e: any) => {
      return{
        ExpenseDate: e.ExpenseDate,
        InvoiceNo : e.InvoiceNo,
        ShopName : e.ShopName,
        AreaName : e.AreaName,
        Name : e.Name,
        Category : e.Category,
        Amount : e.Amount,
        PaymentMode : e.PaymentMode,
        RefereceNo : e.PaymentRefereceNo,
        Comments : e.Comments,
        CreatedPerson : e.CreatedPerson,
        UpdatedPerson : e.UpdatedPerson,
      }
    })
    this.excelService.exportAsExcelFile(data, 'expense_list');
  }

  ngAfterViewInit() {
    // server-side search
    this.searching.nativeElement.focus();
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
        this.sp.show();
        const subs: Subscription = this.expen.searchByFeild(dtm).subscribe({
          next: (res: any) => {
            if (res.success) {
              this.collectionSize = 1;
              this.page = 1;
              this.dataList = res.data
              this.sp.hide();
              this.as.successToast(res.message)
            } else {
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

  formReset() {
    this.data = { ID: 0, CompanyID: 0, ShopID: '', Name: '', InvoiceNo: '', Category: '', SubCategory: '', Amount: '', PaymentMode: '', CashType: '', PaymentRefereceNo: '', Comments: '', Status: 1, CreatedBy: '', UpdatedBy: '', CreatedOn: '', UpdatedOn: '', };
  }

  dateFormat(date: any): string {
    if (date == null || date == "") {
      return '0000-00-00'; // Default Value
    }
    return moment(date).format(this.companySetting?.DateFormat || 'YYYY-MM-DD');
  }

}
