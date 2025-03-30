import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators,ReactiveFormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { CompanyService } from '../../service/company.service';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { NgxSpinnerService } from 'ngx-spinner';
import { map, filter, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { fromEvent   } from 'rxjs';
import { AlertService } from 'src/app/service/helpers/alert.service';
import * as moment from 'moment';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-login-history',
  templateUrl: './login-history.component.html',
  styleUrls: ['./login-history.component.css']
})
export class LoginHistoryComponent implements OnInit {
  @ViewChild('searching') searching: ElementRef | any;
  term = "";
  loggedInUser:any = localStorage.getItem('LoggedINUser');
  evn = environment;
  stringUrl: string | undefined;
  dataList: any;
  currentPage = 1;
  itemsPerPage = 10;
  pageSize!: number;
  collectionSize = 0
  page = 4;
  dropComlist:any 
  searchValue:any; 
  dataListcount:any; 
  NondataListcount:any; 
  NonActiveCount:any; 
  ActiveCount:any; 
  DetailsList:any; 

  constructor(
    private cs: CompanyService,
    private sp: NgxSpinnerService,
    public as: AlertService,
    private modalService: NgbModal,
  ) {
    // this.id = this.route.snapshot.params['id'];
  }

  filter:any={
    FromDate: moment().startOf('month').format('YYYY-MM-DD'), ToDate: moment().endOf('month').format('YYYY-MM-DD'), CompanyID: '',
  }

  ngOnInit(): void {
    this.getList()
    this.dropdownShoplist()
  }

FromReset(){
  this.filter = {
    FromDate: moment().startOf('month').format('YYYY-MM-DD'), ToDate: moment().endOf('month').format('YYYY-MM-DD'), CompanyID: '',
  }
}
  
  dropdownShoplist() {
    this.sp.show()
    const subs: Subscription = this.cs.dropdownlist('').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.dropComlist = res.data
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }


  onPageChange(pageNum: number): void {
    this.pageSize = this.itemsPerPage * (pageNum - 1);
  }

  changePagesize(num: number): void {
    this.itemsPerPage = this.pageSize + num;
  }

  getList() {
    this.sp.show();
    const dtm = {
      currentPage: this.currentPage,
      itemsPerPage: this.itemsPerPage
    }
    const subs: Subscription = this.cs.getLoginList(dtm).subscribe({
      next: (res: any) => {
        if(res.success){
          this.collectionSize = res.count;
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
      this.sp.show()
      const subs: Subscription = this.cs.searchByFeildAdmin(dtm).subscribe({
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
      this.getList();
    }
    });
  }


  searchData1(mode:any){
  this.sp.show()

    let DateParem = '';
    let CompanyParam = '';

    if (this.filter.FromDate !== '' && this.filter.FromDate !== null) {
      let FromDate = moment(this.filter.FromDate).format('YYYY-MM-DD')
      DateParem = DateParem + ' and DATE_FORMAT(loginhistory.LoginTime, "%Y-%m-%d") between ' + `'${FromDate}'`;
    }
    
    if (this.filter.ToDate !== '' && this.filter.ToDate !== null) {
      let ToDate = moment(this.filter.ToDate).format('YYYY-MM-DD')
      DateParem = DateParem + ' and ' + `'${ToDate}'`;
    }

    if (this.filter.CompanyID != '') {
      CompanyParam = CompanyParam + ' and company.ID = ' + `${this.filter.CompanyID}`;
    }


    const subs: Subscription = this.cs.LoginHistoryDetails(DateParem,CompanyParam).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.as.successToast(res.message)
          if(mode == 'Active'){
            this.dataListcount = res.data
          }
          if(mode == 'Non'){
            this.NondataListcount = res.nonActiveData
          }
          this.ActiveCount = res.count.ActiveCount
          this.NonActiveCount = res.count.NonActiveCount
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

    openModal(content: any,list:any) {
      this.DetailsList = list
      this.modalService.open(content, { centered: true, backdrop: 'static', keyboard: false, size: 'xl' });
    }
}
