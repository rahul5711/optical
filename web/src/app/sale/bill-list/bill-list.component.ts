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


@Component({
  selector: 'app-bill-list',
  templateUrl: './bill-list.component.html',
  styleUrls: ['./bill-list.component.css']
})
export class BillListComponent implements OnInit {

  @ViewChild('searching') searching: ElementRef | any;
  env = environment;
  gridview = true
  term = "";
  dataList: any;
  currentPage = 1;
  itemsPerPage = 10;
  pageSize!: number;
  collectionSize = 0
  page = 4;
  suBtn = false;
  paymentHistoryList :any = []

  constructor(
    private formBuilder: FormBuilder,
    public as: AlertService,
    private sp: NgxSpinnerService,
    private excelService: ExcelService,
    public bill: BillService,
    private modalService: NgbModal,
  ) { }

  ngOnInit(): void {
    this.getList()
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
    this.sp.hide();
  }


  openModal(content: any,data:any) {
    this.sp.show();
    this.modalService.open(content, { centered: true , backdrop : 'static', keyboard: false,size: 'md'});
    const subs: Subscription = this.bill.paymentHistory( data.ID, data.InvoiceNo).subscribe({
      next: (res: any) => {
        if(res.success){
          this.paymentHistoryList = res.data;
          console.log(this.paymentHistoryList );
          this.as.successToast(res.message)
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
    this.sp.hide();
  }

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
    this.sp.hide();
  }


  exportAsXLSX(): void {
    this.excelService.exportAsExcelFile(this.dataList, 'customer_list');
  }

}
