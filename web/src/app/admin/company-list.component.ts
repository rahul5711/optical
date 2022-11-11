import { Component, OnInit } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subscription } from 'rxjs';
import { CompanyService } from '../service/company.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AlertService } from '../service/alert.service';
import Swal from 'sweetalert2'; 
import { AuthServiceService } from '../service/auth-service.service';
import { ActivatedRoute, Router } from '@angular/router';
import { TokenService } from '../service/token.service';
@Component({
  selector: 'app-company-list',
  templateUrl: './company-list.component.html',
  styleUrls: ['./company-list.component.css']
})
export class CompanyListComponent implements OnInit {
  dataList: any;
  currentPage = 1;
  itemsPerPage = 10;
  pageSize!: number;
  collectionSize = 0
  page = 4;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private token: TokenService,
    private cs: CompanyService,
    private sp: NgxSpinnerService,
    private snackBar: MatSnackBar,
    public as: AlertService,
    private auth: AuthServiceService,

  ) { }

  ngOnInit(): void {
    this.getList();    
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
        this.dataList = res.data
        console.log(res.data);
        this.sp.hide();
        this.as.successToast(res.message)
      },
      error: (err: any) => console.log(err.message),
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
        const subs: Subscription = this.cs.deleteData(this.dataList[i].ID).subscribe({
          next: (res: any) => {
            this.dataList.splice(i, 1);
            this.sp.hide();
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

  companylogin(i:any){
    const subs: Subscription = this.auth.companylogin(this.dataList[i].LoginName).subscribe({
      next: (res: any) => {
        if(res.loginCode === 1){
         
          localStorage.clear();
          this.as.successToast(res.message)
          this.token.setToken(res.accessToken);
          this.token.refreshToken(res.refreshToken);
          localStorage.setItem('user', JSON.stringify(res));


          this.router.navigate(
            ['/admin/CompanyDashborad']
          );
          
        }else{
          console.log('not login compnay');
        }
       console.log(res);        
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

}
