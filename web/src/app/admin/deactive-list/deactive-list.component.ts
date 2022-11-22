import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subscription } from 'rxjs';
import { CompanyService } from '../../service/company.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AlertService } from '../../service/alert.service';
import Swal from 'sweetalert2'; 
import { AuthServiceService } from '../../service/auth-service.service';
import { ActivatedRoute, Router } from '@angular/router';
import { TokenService } from '../../service/token.service';
import { map, filter, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { fromEvent   } from 'rxjs';

@Component({
  selector: 'app-deactive-list',
  templateUrl: './deactive-list.component.html',
  styleUrls: ['./deactive-list.component.css']
})
export class DeactiveListComponent implements OnInit {

  @ViewChild('searching') searching: ElementRef | any;
  term = "";
  dataList: any;
  currentPage = 1;
  itemsPerPage = 10;
  pageSize!: number;
  collectionSize = 0
  page = 4;
  deactives =0
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
    this.Deactivelist();    
  }

  onPageChange(pageNum: number): void {
    this.pageSize = this.itemsPerPage * (pageNum - 1);
  }

  changePagesize(num: number): void {
    this.itemsPerPage = this.pageSize + num;
  }

  Deactivelist() {
    this.sp.show()
    const dtm = {
      currentPage: this.currentPage,
      itemsPerPage: this.itemsPerPage
    }
    const subs: Subscription = this.cs.Deactivelist(dtm).subscribe({
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
            this.dataList.splice(i, 1);
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

}
