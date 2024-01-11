import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators,ReactiveFormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { NgxSpinnerService } from 'ngx-spinner';
import { EmployeeService } from 'src/app/service/employee.service';
import { map, filter, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { fromEvent   } from 'rxjs';
import { AlertService } from 'src/app/service/helpers/alert.service';
import * as moment from 'moment';


@Component({
  selector: 'app-company-login-history',
  templateUrl: './company-login-history.component.html',
  styleUrls: ['./company-login-history.component.css']
})
export class CompanyLoginHistoryComponent implements OnInit {

  @ViewChild('searching') searching: ElementRef | any;
  term = "";
  loggedInUser:any = localStorage.getItem('LoggedINUser');
  companySetting = JSON.parse(localStorage.getItem('companysetting') || '');

  evn = environment;
  stringUrl: string | undefined;
  dataList: any;
  dataListaa: any;
  userList: any;
  currentPage = 1;
  itemsPerPage = 10;
  pageSize!: number;
  collectionSize = 0
  page = 4;
  filterList:any;
  filter: any =  { date1: moment().startOf('month').format('YYYY-MM-DD'), date2: moment().add( 2 , 'days').format('YYYY-MM-DD'), UserID: 0,  };

  constructor(
    private es: EmployeeService,
    private sp: NgxSpinnerService,
    public as: AlertService,
    private emp: EmployeeService,
 
  ) { }

  red:any = false

  ngOnInit(): void {
    this.getList()
    this.dropdownUserlist()
    this.companySetting.LoginTimeEnd = moment(this.companySetting.LoginTimeEnd, 'HH:mm').format('hh:mm A');
    this.companySetting.LoginTimeStart = moment(this.companySetting.LoginTimeStart, 'HH:mm').format('hh:mm A');
  }

  onPageChange(pageNum: number): void {
    this.pageSize = this.itemsPerPage * (pageNum - 1);
  }

  changePagesize(num: number): void {
    this.itemsPerPage = this.pageSize + num;
  }

  dropdownUserlist(){
    this.sp.show()
    const subs: Subscription = this.emp.dropdownUserlist('').subscribe({
      next: (res: any) => {
        if(res.success){
          this.userList  = res.data
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide()
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
    const subs: Subscription = this.es.getLoginList(dtm).subscribe({
      next: (res: any) => {
        if(res.success){
          this.collectionSize = res.count;
          this.dataList = res.data
          this.dataListaa = this.dataList
          this.dataListaa.forEach((e: any) =>{
            e.time = moment(e.time).format('hh:mm A');
            console.log( e.time);
             if(this.companySetting.LoginTimeEnd > e.time || this.companySetting.LoginTimeStart < e.time){
               this.red = true
             }else{
              this.red = false
             }
             e.rowColorStyle = { 'background-color': this.red ? '' : 'red', 'color': this.red ? '' : '#fff' };
             this.dataList.push(e);
          })
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
      this.sp.show();
      const subs: Subscription = this.es.getLoginList(dtm).subscribe({
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

  dateFormat(date:any){
    return moment(date).format(`${this.companySetting.DateFormat}`);
  }

  searchData(){
    this.sp.show()

    let dtm = {
      From:this.filter.date1,
      To :this.filter.date2 ,
      UserID:this.filter.UserID,
    }

    const subs: Subscription = this.es.LoginHistoryFilter(dtm).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.as.successToast(res.message)
          this.dataList = res.data
          this.collectionSize = 1;
          this.page = 1;
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  FromReset() {
    this.filter =  { date1: moment().startOf('month').format('YYYY-MM-DD'), date2: moment().add( 2 , 'days').format('YYYY-MM-DD'), UserID: 0,  };
    this.dataList = [];
  }
}
