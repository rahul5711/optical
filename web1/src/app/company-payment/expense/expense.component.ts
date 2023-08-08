import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
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

@Component({
  selector: 'app-expense',
  templateUrl: './expense.component.html',
  styleUrls: ['./expense.component.css']
})
export class ExpenseComponent implements OnInit {

  user = JSON.parse(localStorage.getItem('user') || '');
  companysetting = JSON.parse(localStorage.getItem('companysetting') || '');
  permission = JSON.parse(localStorage.getItem('permission') || '[]');

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

  ) { this.id = this.route.snapshot.params['id']; }


  data: ExpenseModel = { ID: 0, CompanyID: 0, ShopID: 0, Name: '', InvoiceNo: '', Category: '', SubCategory: '', Amount: '', PaymentMode: '', CashType: '', PaymentRefereceNo: '', Comments: '', Status: 1, CreatedBy: '', UpdatedBy: '', CreatedOn: '', UpdatedOn: '', };

  editExpenseList = false
  addExpenseList = false
  deleteExpenseList = false

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
    this.getPaymentModesList();
    this.getExpenseTypeList();
  }

  dropdownShoplist() {
    this.sp.show()
    const subs: Subscription = this.ss.dropdownShoplist(this.data).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.dropShoplist = res.data
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
          this.ExpenseTypeList = res.data
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
          this.PaymentModesList = res.data
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
    const subs: Subscription = this.expen.saveExpense(this.data).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.formReset();
          this.modalService.dismissAll();
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
    const subs: Subscription = this.expen.updateExpense(this.data).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.formReset();
          this.modalService.dismissAll();
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
        }
        this.sp.hide();
      },
      error: (err: any) => {
        console.log(err.msg);
      },
      complete: () => subs.unsubscribe(),
    });
  }

  onChange(event: { toUpperCase: () => any; toTitleCase: () => any; }) {
    if (this.companysetting?.DataFormat === '1') {
      event = event.toUpperCase()
    } else if (this.companysetting?.DataFormat == '2') {
      event = event.toTitleCase()
    }
    return event;
  }

  openEditModal(content: any, datas: any) {
    this.suBtn = true;
    this.data = datas
    this.data.ShopID = Number(datas.ShopID);
    this.modalService.open(content, { centered: true, backdrop: 'static', keyboard: false, size: 'xl' });
  }

  openModal(content: any) {
    this.formReset();
    this.suBtn = false;
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

}
