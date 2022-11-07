import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators,ReactiveFormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router';
import { ThemePalette } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CompanyService } from '../../service/company.service';
import { Subscription } from 'rxjs';
import { AlertService } from '../../service/alert.service';
import { environment } from 'src/environments/environment';
import { NgxSpinnerService } from 'ngx-spinner';
import { EmployeeService } from 'src/app/service/employee.service';

@Component({
  selector: 'app-company-login-history',
  templateUrl: './company-login-history.component.html',
  styleUrls: ['./company-login-history.component.css']
})
export class CompanyLoginHistoryComponent implements OnInit {

  loggedInUser:any = localStorage.getItem('LoggedINUser');
  evn = environment;
  stringUrl: string | undefined;
  dataList: any;
  currentPage = 1;
  itemsPerPage = 10;
  pageSize!: number;
  collectionSize = 0
  page = 4;

  constructor(
    private es: EmployeeService,
    private sp: NgxSpinnerService,
    private snackBar: MatSnackBar,
    public as: AlertService,
    private route: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    this.getList()
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
    const subs: Subscription = this.es.getLoginList(dtm).subscribe({
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
}
