import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators,ReactiveFormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2'; 
import { AlertService } from 'src/app/service/helpers/alert.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { map, filter, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { fromEvent   } from 'rxjs'
import { SupportService } from 'src/app/service/support.service';
import { PayrollService } from 'src/app/service/payroll.service';
import { EmployeeService } from 'src/app/service/employee.service';
import { PayrollModel} from 'src/app/interface/Payroll';
import { ExcelService } from 'src/app/service/helpers/excel.service';
import { PettycashService } from 'src/app/service/pettycash.service';
import { BillService } from 'src/app/service/bill.service';

@Component({
  selector: 'app-payroll',
  templateUrl: './payroll.component.html',
  styleUrls: ['./payroll.component.css']
})
export class PayrollComponent implements OnInit {

  user = JSON.parse(localStorage.getItem('user') || '');
  companySetting = JSON.parse(localStorage.getItem('companysetting') || '');
  permission = JSON.parse(localStorage.getItem('permission') || '[]');

  @ViewChild('searching') searching: ElementRef | any;
  term:any;
  dataList:any;
  dropUserlist:any;
  PaymentModesList:any;
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
    private pay: PayrollService,
    private sp: NgxSpinnerService,
    private modalService: NgbModal,
    private excelService: ExcelService,
    private supps: SupportService,
    private es: EmployeeService,
    private petty: PettycashService,
            public bill: BillService,
    
  ) {this.id = this.route.snapshot.params['id']; }


  data: PayrollModel = { ID : '', CompanyID : '' , EmployeeID : '', Month : '', Year : '', LeaveDays : '', Salary : '',
  Comments : '',  PaymentMode: '', Status : 1, CreatedBy: '', UpdatedBy:'' , CreatedOn: '', UpdatedOn: '',
  InvoiceNo:'', CashType:'' , CreditType: ''};

  editpayrollList = false
  addpayrollList = false
  deletepayrollList = false

  PettyCashBalance = 0;
  CashCounterBalance=0;

  ngOnInit(): void {
    this.permission.forEach((element: any) => {
      if (element.ModuleName === 'payrollList') {
        this.editpayrollList = element.Edit;
        this.addpayrollList = element.Add;
        this.deletepayrollList = element.Delete;
      }
    });
    this.getList();
    // this.dropdownUserlist();
    // this.getPaymentModesList();

    this.bill.employeeList$.subscribe((list:any) => {
     this.dropUserlist = list.sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
    });
    this.bill.paymentModes$.subscribe((list:any) => {
      this.PaymentModesList = list.filter((p: { Name: string }) => p.Name !== 'AMOUNT RETURN').sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
    });
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

  dropdownUserlist(){
    const subs: Subscription = this.es.dropdownUserlist('').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.dropUserlist = res.data.sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getPaymentModesList(){
    const subs: Subscription = this.supps.getList('PaymentModeType').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.PaymentModesList =  res.data.filter((p: { Name: string }) => p.Name !== 'AMOUNT RETURN').sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
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
    const subs: Subscription = this.pay.getList(dtm).subscribe({
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
    const subs: Subscription =  this.pay.savePayroll(this.data).subscribe({
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
        }
        this.sp.hide();
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
        this.sp.show();
        const subs: Subscription = this.pay.deleteData(this.dataList[i].ID).subscribe({
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

  updatePayroll(){
    this.sp.show();
    const subs: Subscription =  this.pay.updatePayroll(this.data).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.formReset();
          this.getPettyCashBalance();
          this.getCashCounterCashBalance();
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
    if (this.companySetting.DataFormat === '1') {
      event = event.toUpperCase()
    } else if (this.companySetting.DataFormat == '2') {
      event = event.toTitleCase()
    }
    return event;
  }

  openEditModal(content: any,datas:any) {
    this.suBtn = true;
    this.data = datas;
    if( this.data.CashType == 'PettyCash'){
      this.getPettyCashBalance();
    }else{
      this.getCashCounterCashBalance();
    }
    this.modalService.open(content, { centered: true , backdrop : 'static', keyboard: false, size:'xl'});
  }

  openModal(content: any) {
    this. formReset();
    this.suBtn = false;
    this.modalService.open(content, { centered: true , backdrop : 'static', keyboard: false, size:'xl'});
  }

  exportAsXLSX(): void {
    let data = this.dataList.map((e: any) => {
      return{
        InvoiceNo : e.InvoiceNo,
        EmployeeName: e.EmployeeName,
        Month : e.Month,
        Year : e.Year,
        LeaveDays : e.LeaveDays,
        Salary : e.Salary,
        PaymentMode : e.PaymentMode,
        Comments : e.Comments,
        CreatedPerson : e.CreatedPerson,
        UpdatedPerson : e.UpdatedPerson,
      }
    })
    this.excelService.exportAsExcelFile(data, 'payroll_list');
  }

  ngAfterViewInit() {
    this.searching.nativeElement.focus();
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
      this.sp.show();
      const subs: Subscription = this.pay.searchByFeild(dtm).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.collectionSize = 1;
            this.page = 1;
            this.dataList = res.data
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
    this.data = { ID : '', CompanyID : '' , EmployeeID : '', Month : '', Year : '', LeaveDays : '', Salary : '',
    Comments : '',  PaymentMode: '', Status : 1, CreatedBy: '', UpdatedBy:'' , CreatedOn: '', UpdatedOn: '',
    InvoiceNo:'', CashType:'',CreditType:'' }
  }

}
