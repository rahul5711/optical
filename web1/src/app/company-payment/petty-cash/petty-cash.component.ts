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
import { EmployeeService } from 'src/app/service/employee.service';
import { SupportService } from 'src/app/service/support.service';
import { PettycashModel} from 'src/app/interface/pettycash';
import { PettycashService } from 'src/app/service/pettycash.service';
import { ExcelService } from 'src/app/service/helpers/excel.service';

@Component({
  selector: 'app-petty-cash',
  templateUrl: './petty-cash.component.html',
  styleUrls: ['./petty-cash.component.css']
})
export class PettyCashComponent implements OnInit {

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
  PettyCashBalance :any;
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    public as: AlertService,
    private petty: PettycashService,
    private sp: NgxSpinnerService,
    private modalService: NgbModal,
    private excelService: ExcelService,
    private supps: SupportService,
    private es: EmployeeService,
  ) {this.id = this.route.snapshot.params['id']; }

  data: PettycashModel = {  ID: '', CompanyID: '', ShopID: '', EmployeeID: '', InvoiceNo: '', CashType:'', CreditType: '', Amount: 0.00,
  Comments: '', Status: 1, CreatedBy: '', UpdatedBy: '', CreatedOn: '', UpdatedOn: '', };

  editPettyCashReport = false
  addPettyCashReport = false
  deletePettyCashReport = false

  ngOnInit(): void {
    this.permission.forEach((element: any) => {
      if (element.ModuleName === 'PettyCashReport') {
        this.editPettyCashReport = element.Edit;
        this.addPettyCashReport = element.Add;
        this.deletePettyCashReport = element.Delete;
      }
    });
    this.dropdownUserlist();
    this.getPettyCashBalance();
    this.getList();
  }

  dropdownUserlist(){
    const subs: Subscription = this.es.dropdownUserlist('').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.dropUserlist = res.data
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
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

  getList() {
    this.sp.show()
    const dtm = {
      currentPage: this.currentPage,
      itemsPerPage: this.itemsPerPage
    }
    const subs: Subscription = this.petty.getList(dtm).subscribe({
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
    this.sp.show();
    const subs: Subscription =  this.petty.savePetty(this.data).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.formReset();
          this.modalService.dismissAll();
          this.getPettyCashBalance();
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
          Swal.fire({
            position: 'center',
            icon: 'warning',
            title: 'you can not withdrawal greater than.',
            showConfirmButton: true,
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
        const subs: Subscription = this.petty.deleteData(this.dataList[i].ID).subscribe({
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

  updatePetty(){
    this.sp.show();
    const subs: Subscription =  this.petty.updatePetty(this.data).subscribe({
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
    if (this.companySetting.DataFormat === '1') {
      event = event.toUpperCase()
    } else if (this.companySetting.DataFormat == '2') {
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
    let data = this.dataList.map((e: any) => {
      return{
        InvoiceNo : e.InvoiceNo,
        EmployeeName: e.EmployeeName,
        CashType : e.CashType,
        CreditType : e.CreditType,
        Amount : e.Amount,
        Comments : e.Comments,
        CreatedOn : e.CreatedOn,
        CreatedPerson : e.CreatedPerson,
        UpdatedPerson : e.UpdatedPerson,
      }
    })
    this.excelService.exportAsExcelFile(data, 'pettycash_list');
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
      this.sp.show();
      const subs: Subscription = this.petty.searchByFeild(dtm).subscribe({
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
    this.data = { ID: '', CompanyID: '', ShopID: '', EmployeeID: '', InvoiceNo: '', CashType:'', CreditType: '', Amount: 0.00,
    Comments: '', Status: 1, CreatedBy: '', UpdatedBy: '', CreatedOn: '', UpdatedOn: '',  }
  }

}
