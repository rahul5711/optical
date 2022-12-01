import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators,ReactiveFormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2'; 
import { AlertService } from 'src/app/service/alert.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { map, filter, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { fromEvent   } from 'rxjs'
import { ExcelService } from '../../service/excel.service';
import { ExpenseService } from 'src/app/service/expense.service';
import { ShopService } from 'src/app/service/shop.service';
import { SupportService } from 'src/app/service/support.service';


@Component({
  selector: 'app-expense',
  templateUrl: './expense.component.html',
  styleUrls: ['./expense.component.css']
})
export class ExpenseComponent implements OnInit {

  user = JSON.parse(localStorage.getItem('user') || '');
  @ViewChild('searching') searching: ElementRef | any;
  term:any;
  dataList:any;
  dropShoplist:any;
  PaymentModesList:any;
  ExpenseTypeList:any;
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

  ) {this.id = this.route.snapshot.params['id']; }


  data: any = { ID : null,EmployeeID: null, CompanyID : null, ShopID : null, Name:'', Category : null, SubCategory : null, Amount : null, PaymentMode : null, InvoiceNo: null,PaymentRefereceNo : null, Comments : null, Status : 1, CreatedBy: null, UpdatedBy: null, CreatedOn: null, UpdatedOn: null
  };

  ngOnInit(): void {
    this.getList();
    this.dropdownShoplist();
    this.getPaymentModesList();
    this.getExpenseTypeList();
  }

  dropdownShoplist(){
    const subs: Subscription = this.ss.dropdownShoplist(this.data).subscribe({
      next: (res: any) => {
        this.dropShoplist = res.data
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getExpenseTypeList(){
    const subs: Subscription = this.supps.getList('ExpenseType').subscribe({
      next: (res: any) => {
        this.ExpenseTypeList = res.data
      },
    error: (err: any) => console.log(err.message),
    complete: () => subs.unsubscribe(),
    });
  }
  
  getPaymentModesList(){
    const subs: Subscription = this.supps.getList('PaymentModeType').subscribe({
      next: (res: any) => {
        this.PaymentModesList = res.data
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
        this.collectionSize = res.count;
        this.dataList = res.data;
        
        this.sp.hide();
        this.as.successToast(res.message)
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });

  }

  // getExpenseById(ID:any){
  //   this.id = ID
  //   const subs: Subscription = this.expen.getExpenseById(this.id).subscribe({
  //     next: (res: any) => {
       
  //       if (res.success) {
  //         this.as.successToast(res.message)
  //       } else {
  //         this.as.errorToast(res.message)
  //       }
  //     },
  //     error: (err: any) => {
  //       console.log(err.message);
  //     },
  //     complete: () => subs.unsubscribe(),
  //   })
  // }

  onsubmit() {
    const subs: Subscription =  this.expen.saveExpense(this.data).subscribe({
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
      },
      error: (err: any) => {
        console.log(err.msg);
      },
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

        const subs: Subscription = this.expen.deleteData(this.dataList[i].ID).subscribe({
          next: (res: any) => {
            this.dataList.splice(i, 1);
            this.as.successToast(res.message)
          },
          error: (err: any) => console.log(err.message),
          complete: () => subs.unsubscribe(),
        });
        Swal.fire({
          position: 'center',
          icon: 'success',
          title: 'Your file has been deleted.',
          showConfirmButton: false,
          timer: 1000
        })
        this.getList();
      }
    })
  }

  updateExpense(){
    const subs: Subscription =  this.expen.updateExpense( this.data).subscribe({
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
      },
      error: (err: any) => {
        console.log(err.msg);
      },
      complete: () => subs.unsubscribe(),
    });
  }

  onChange(event: { toUpperCase: () => any; toTitleCase: () => any; }) {
    if (this.user.CompanySetting.DataFormat === '1') {
      event = event.toUpperCase()
    } else if (this.user.CompanySetting.DataFormat == '2') {
      event = event.toTitleCase()
    }
    return event;
  }

  openEditModal(content: any,datas:any) {
    this.suBtn = true;
    this.data = datas
     this.modalService.open(content, { centered: true , backdrop : 'static', keyboard: false, size:'xl'});
   }

  openModal(content: any) {
    this. formReset();
    this.suBtn = false;
     this.modalService.open(content, { centered: true , backdrop : 'static', keyboard: false, size:'xl'});
   }

  exportAsXLSX(): void {
    this.excelService.exportAsExcelFile(this.dataList, 'expense_list');
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
    if(data.searchQuery !== "") {
      const dtm = {
        currentPage: 1,
        itemsPerPage: 50000,
        searchQuery: data.searchQuery 
      }
      const subs: Subscription = this.expen.searchByFeild(dtm).subscribe({
        next: (res: any) => {
          this.collectionSize = res.count;
          this.page = 1;
          this.dataList = res.data
          this.sp.hide();
          this.as.successToast(res.message)
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    } else {
      this.getList();
    } 
    });
  }

  formReset() {
    this.data = { ID : null,EmployeeID: null, CompanyID : null, ShopID : null, Name:'', Category : null, SubCategory : null, Amount : null, PaymentMode : null, InvoiceNo: null,PaymentRefereceNo : null, Comments : null, Status : 1, CreatedBy: null, UpdatedBy: null, CreatedOn: null, UpdatedOn: null
    };
  }

}
