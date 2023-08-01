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
import { PurchaseService } from 'src/app/service/purchase.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-purchase-list',
  templateUrl: './purchase-list.component.html',
  styleUrls: ['./purchase-list.component.css']
})
export class PurchaseListComponent implements OnInit {

  @ViewChild('searching') searching: ElementRef | any;
  user = JSON.parse(localStorage.getItem('user') || '');
  env = environment;
  id :any

  gridview = true;
  term:any;
  dataList: any = [];
  currentPage = 1;
  itemsPerPage = 10;
  pageSize!: number;
  collectionSize = 0
  page = 4;
  paymentHistoryList:any;
  CustomerTotal:any = []
  TotalAmountInv:any
  DueAmountIvn:any

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    public as: AlertService,
    private sp: NgxSpinnerService,
    private excelService: ExcelService,
    private purchaseService: PurchaseService,
    private modalService: NgbModal,
  ) {
    this.id = this.route.snapshot.params['id'];
   }

  ngOnInit(): void {
    if(this.id != "0"){
     this.purchaseHsitory()
    }else{
      this.getList()
    }
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
    const subs: Subscription = this.purchaseService.getList(dtm).subscribe({
      next: (res: any) => {
        if(res.success){
          this.collectionSize = res.count;
          this.dataList = res.data;
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide();
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
        this.sp.show()
        const subs: Subscription = this.purchaseService.deleteData(this.dataList[i].ID).subscribe({
          next: (res: any) => {
            if(res.success){
              this.dataList.splice(i, 1);
              this.as.successToast(res.message)
              Swal.fire({
                position: 'center',
                icon: 'success',
                title: 'Your file has been deleted.',
                showConfirmButton: false,
                timer: 1000
              })
            }else{
              this.as.errorToast(res.message)
              Swal.fire({
                position: 'center',
                icon: 'warning',
                title: res.message,
                showCancelButton: true,
              })
            }
            this.sp.hide()
          },
          error: (err: any) => console.log(err.message),
          complete: () => subs.unsubscribe(),
        });
      }
    })
  }

  ngAfterViewInit() {
    fromEvent(this.searching.nativeElement, 'keyup').pipe(
      map((event: any) => {
        return event.target.value;
      }),
      debounceTime(1000),
      distinctUntilChanged(),
    ).subscribe((text: string) => {
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
      const subs: Subscription = this.purchaseService.searchByFeild(dtm).subscribe({
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

  exportAsXLSX(): void {
    let data = this.dataList.map((e: any) => {
      return{
        SupplierName: e.SupplierName,
        InvoiceNo : e.InvoiceNo,
        ShopName : e.ShopName,
        AreaName : e.AreaName,
        PurchaseDate : e.PurchaseDate,
        PaymentStatus : e.PaymentStatus,
        GSTNo : e.GSTNo,
        Quantity : e.Quantity,
        TotalAmount : e.TotalAmount,
        DiscountAmount : e.DiscountAmount,
        GSTAmount : e.GSTAmount,
        CreatedPerson : e.CreatedPerson,
        UpdatedPerson : e.UpdatedPerson,
      }
    })
    this.excelService.exportAsExcelFile(data, 'purchase_list');
  }

  openModal(content: any,data:any) {
    this.sp.show();
    this.modalService.open(content, { centered: true , backdrop : 'static', keyboard: false,size: 'md'});
    const subs: Subscription = this.purchaseService.paymentHistory(data.ID, data.InvoiceNo).subscribe({
      next: (res: any) => {
        if(res.success){
          this.paymentHistoryList = res.data;
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

  purchaseHsitory(){
    this.sp.show();
    let SupplierID = Number(this.id)
    const subs: Subscription = this.purchaseService.purchaseHistoryBySupplier(SupplierID).subscribe({
      next: (res: any) => {
        if(res.success){
          this.dataList = res.data;
          this.DueAmountIvn = res.sumData[0].DueAmount.toFixed(2);
          this.TotalAmountInv = res.sumData[0].TotalAmount.toFixed(2);
          this.CustomerTotal = (this.TotalAmountInv - this.DueAmountIvn).toFixed(2) ;
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

}
