import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { ActivatedRoute, Router } from '@angular/router';
import { map, filter, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { fromEvent } from 'rxjs';
import { environment } from 'src/environments/environment';
import { TokenService } from '../service/token.service';
import { CompanyService } from '../service/company.service';
import { AlertService } from '../service/alert.service';
import { AuthServiceService } from '../service/auth-service.service';
import { ExcelService } from '../service/helpers/excel.service';


@Component({
  selector: 'app-company-list',
  templateUrl: './company-list.component.html',
  styleUrls: ['./company-list.component.css']
})
export class CompanyListComponent implements OnInit {

  @ViewChild('searching') searching: ElementRef | any;
  env = environment;
  term = "";
  gridview = true;
  dataList: any;
  currentPage = 1;
  itemsPerPage = 10;
  pageSize!: number;
  collectionSize = 0
  page = 4;
  deactives = 0
  moduleList: any = [
    { ModuleName: 'CompanyInfo', MView: true, Edit: true, Add: true, View: true, Delete: true },
  ];
  user: any = JSON.parse(localStorage.getItem('user') || '');

  constructor(
    private router: Router,
    private token: TokenService,
    private cs: CompanyService,
    private sp: NgxSpinnerService,
    public as: AlertService,
    private auth: AuthServiceService,
    private excelService: ExcelService,
  ) { }

  ngOnInit(): void {
   
    this.user = JSON.parse(localStorage.getItem('user') || '')
    if (this.user.UserGroup !== 'SuperAdmin') {
      localStorage.clear();
      this.router.navigate(['/']);
      this.as.successToast("LogOut !!")
    } else {
      this.getList();
    }
   
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
    const subs: Subscription = this.cs.getList(dtm).subscribe({
      next: (res: any) => {
        this.collectionSize = res.count;
        this.dataList = res.data;
        this.dataList.forEach((element: { LogoURL: any; }) => {
          if (element.LogoURL !== "null" && element.LogoURL !== "") {
            element.LogoURL = (this.env.apiUrl + element.LogoURL);
          } else {
            element.LogoURL = "/assets/images/userEmpty.png"
          }
        });
        this.sp.hide();
        this.as.successToast(res.message)
      },
      error: (err: any) => console.log(err.message),
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
      confirmButtonText: 'Yes, delete it!',
      backdrop: 'static',
    }).then((result) => {
    this.sp.show();
      if (result.isConfirmed) {
        const subs: Subscription = this.cs.deleteData(this.dataList[i].ID).subscribe({
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
      this.sp.hide();
    })

  

  }

  companylogin(i: any) {
    Swal.fire({
      title: 'Are you sure Login To Company?',
      // text: "Do You Want To Login To The Company Or Not!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Login',
      backdrop: false

    }).then((result) => {
      if (result.isConfirmed) {
        this.sp.show();
        const subs: Subscription = this.auth.companylogin(this.dataList[i].LoginName).subscribe({
          next: (res: any) => {
            if (res.loginCode === 1) {

              localStorage.clear();
              this.as.successToast(res.message)
              this.token.setToken(res.accessToken);
              this.token.refreshToken(res.refreshToken);
              localStorage.setItem('user', JSON.stringify(res.data));
              localStorage.setItem('company', JSON.stringify(res.Company));
              localStorage.setItem('companysetting', JSON.stringify(res.CompanySetting));
              localStorage.setItem('shop', JSON.stringify(res.shop));
              localStorage.setItem('selectedShop', JSON.stringify([`${res.shop[0]?.ID}`]));
              localStorage.setItem('permission', JSON.stringify(this.moduleList));
              this.router.navigate(['/admin/CompanyDashborad'])
                .then(() => {
                  window.location.reload();
                });

            } else {
              console.log('not login compnay');
            }
          },
          error: (err: any) => console.log(err.message),
          complete: () => subs.unsubscribe(),
        });
        this.sp.hide();
        Swal.fire({
          position: 'center',
          icon: 'success',
          title: 'Your has been Company Login.',
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
      if (data.searchQuery !== "") {
        const dtm = {
          currentPage: 1,
          itemsPerPage: 50000,
          searchQuery: data.searchQuery
        }
        const subs: Subscription = this.cs.searchByFeild(dtm).subscribe({
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

  deactive(i: any) {
    Swal.fire({
      title: 'Are you sure?',
      text: "Do You Want To Deactive This Company",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Deactive',
      backdrop: false

    }).then((result) => {
      if (result.isConfirmed) {
        const subs: Subscription = this.cs.deactive(this.dataList[i].ID).subscribe({
          next: (res: any) => {
            this.getList();
            this.as.successToast(res.message)
          },
          error: (err: any) => console.log(err.message),
          complete: () => subs.unsubscribe(),
        });
        Swal.fire({
          position: 'center',
          icon: 'success',
          title: 'Company has been Deactive.',
          showConfirmButton: false,
          timer: 1500
        })
      }
    })


  }

  activecompany(i:any) {
    Swal.fire({
      title: 'Are you sure?',
      text: "Do You Want To Active This Company",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Active',
      backdrop: false

    }).then((result) => {
      if (result.isConfirmed) {
        const subs: Subscription = this.cs.activecompany(this.dataList[i].ID).subscribe({
          next: (res: any) => {
            this.getList();
            this.as.successToast(res.message)
          },
          error: (err: any) => console.log(err.message),
          complete: () => subs.unsubscribe(),
        });
        Swal.fire({
          position: 'center',
          icon: 'success',
          title: 'Company has been Active.',
          showConfirmButton: false,
          timer: 1500
        })
      }
    })
  

  }

  exportAsXLSX(): void {
    this.excelService.exportAsExcelFile(this.dataList, 'company_list');
  }

}
