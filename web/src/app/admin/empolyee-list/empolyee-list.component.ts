import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { EmployeeService } from 'src/app/service/employee.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { map, filter, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { fromEvent   } from 'rxjs';
import { ExcelService } from 'src/app/service/helpers/excel.service';
import { environment } from 'src/environments/environment';


@Component({
  selector: 'app-empolyee-list',
  templateUrl: './empolyee-list.component.html',
  styleUrls: ['./empolyee-list.component.css']
})
export class EmpolyeeListComponent implements OnInit {
  @ViewChild('searching') searching: ElementRef | any;
  env = environment;
  gridview = true;
  term = "";
  dataList: any;
  currentPage = 1;
  itemsPerPage = 10;
  pageSize!: number;
  collectionSize = 0
  page = 4;
  id:any;
  data = {ID: null, Password :''}
  ConfirmPassword :any;

  constructor(
    public as: AlertService,
    private es: EmployeeService,
    private sp: NgxSpinnerService,
    private route: ActivatedRoute,
    private modalService: NgbModal,
    private excelService: ExcelService,
  ) {
    this.id = this.route.snapshot.params['id'];
   }

  ngOnInit(): void {
    this.getList();
    console.log(this.env.apiUrl);



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
    const subs: Subscription = this.es.getList(dtm).subscribe({
      next: (res: any) => {
        this.collectionSize = res.count;
        this.dataList = res.data
        this.dataList.forEach((element: { PhotoURL: any; }) => {
          if(element.PhotoURL !== "null" && element.PhotoURL !== ''){
            element.PhotoURL = (this.env.apiUrl + element.PhotoURL);
          }else{
            element.PhotoURL = "/assets/images/userEmpty.png"
          }
        });
        this.sp.hide();
        this.as.successToast(res.message)
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });

  }

  openModal(content: any,ID:any) {
    this.data.ID = ID
    this.modalService.open(content, { centered: true , backdrop : 'static', keyboard: false,size: 'sm'});
  }

  UpdatePassword(){
    if(this.data.Password === this.ConfirmPassword){
      const subs: Subscription = this.es.updatePassword(this.data).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.as.successToast(res.message)
          } else {
            this.as.errorToast(res.message)
          }
        },
        error: (err: any) => {
          console.log(err.message);
        },
        complete: () => subs.unsubscribe(),
      })

      Swal.fire({
        position: 'center',
        icon: 'success',
        title: 'User Password has been Updated',
        showConfirmButton: false,
        timer: 1000
      })
      this.data = {ID: null, Password :''}
      this.ConfirmPassword = '';
      this.modalService.dismissAll()
    }else{
      Swal.fire({
        position: 'center',
        icon: 'error',
        title: 'Oops!! Incorrect Password',
        // text: 'Password don`t match',
        showConfirmButton: true,
        // background: '#fff url(../../../assets/images/relinksyslogo.png)',
        width: 400,
        backdrop: false

      })
    }

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

        const subs: Subscription = this.es.deleteData(this.dataList[i].ID).subscribe({
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
    if(data.searchQuery !== "") {
      const dtm = {
        currentPage: 1,
        itemsPerPage: 50000,
        searchQuery: data.searchQuery
      }
      const subs: Subscription = this.es.searchByFeild(dtm).subscribe({
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

  exportAsXLSX(): void {
    this.excelService.exportAsExcelFile(this.dataList, 'empolyee_list');

  }
}
