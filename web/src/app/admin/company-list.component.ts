import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { CompanyService } from '../service/company.service';

@Component({
  selector: 'app-company-list',
  templateUrl: './company-list.component.html',
  styleUrls: ['./company-list.component.css']
})
export class CompanyListComponent implements OnInit {

  constructor(
    private cs: CompanyService,
  ) { }

  ngOnInit(): void {
    this.getList()
  }

  getList() {
    console.log('hhhii');
    
    const dtm = {
      currentPage: 1,
      itemsPerPage: 10
    }
    const subs: Subscription = this.cs.getList(dtm).subscribe({
      next: (res: any) => {
       console.log(res.data);
       
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

}
