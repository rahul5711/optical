import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { CompanyService } from '../service/company.service';

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
  loader = true;
  constructor(
    private cs: CompanyService,
  ) { }

  ngOnInit(): void {
    this.loader = true
    this.getList()
    this.loader = false
  }
  onPageChange(pageNum: number): void {
    this.pageSize = this.itemsPerPage*(pageNum - 1);
    }
  
    changePagesize(num: number): void {
      this.itemsPerPage = this.pageSize + num;
      }
      
  getList() {
    this.loader = true
    console.log('hhhii');
    const dtm = {
      currentPage: this.currentPage,
      itemsPerPage: this.itemsPerPage 
    }
    const subs: Subscription = this.cs.getList(dtm).subscribe({
      next: (res: any) => {
        this.collectionSize = res.count;
        this.dataList = res.data
       console.log(res.data); 
       this.loader = false
      },
      error: (err: any) => console.log(err.message),
      
      complete: () => subs.unsubscribe(),
    });
    
  }

}
