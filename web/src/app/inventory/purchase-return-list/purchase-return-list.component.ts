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

@Component({
  selector: 'app-purchase-return-list',
  templateUrl: './purchase-return-list.component.html',
  styleUrls: ['./purchase-return-list.component.css']
})
export class PurchaseReturnListComponent implements OnInit {

  @ViewChild('searching') searching: ElementRef | any;
  env = environment;
  gridview = true;
  term:any;
  dataList: any;
  currentPage = 1;
  itemsPerPage = 10;
  pageSize!: number;
  collectionSize = 0
  page = 4;
  paymentHistoryList:any;

  SupplierCNNo:any
  supplierCnPRlist :any

  constructor(
    private formBuilder: FormBuilder,
    public as: AlertService,
    private sp: NgxSpinnerService,
    private excelService: ExcelService,
    private purchaseService: PurchaseService,
    private modalService: NgbModal,
  ) { }

  ngOnInit(): void {
    this.getList();
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
    const subs: Subscription = this.purchaseService.getPurchaseReturnList(dtm).subscribe({
      next: (res: any) => {
        this.collectionSize = res.count;
        this.dataList = res.data;
        this.sp.hide();
        this.as.successToast(res.message)
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
    this.sp.hide()

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
        const subs: Subscription = this.purchaseService.deletePR(this.dataList[i].ID).subscribe({
          next: (res: any) => {
            if(res.message === "First you'll have to delete product"){
              Swal.fire({
                position: 'center',
                icon: 'warning',
                title: `First you'll have to delete product`,
                showCancelButton: true,
              })
            }else{
              this.dataList.splice(i, 1);
              this.as.successToast(res.message)
            }
            
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
      const subs: Subscription = this.purchaseService.searchByFeildPR(dtm).subscribe({
        next: (res: any) => {
          this.collectionSize = 1;
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
    this.excelService.exportAsExcelFile(this.dataList, 'Purchase_return_list');
  }

  openModal(content: any,data:any) {
    if(data.SupplierCn === ''){
      this.modalService.open(content, { centered: true , backdrop : 'static', keyboard: false,size: 'sm'});
      this.supplierCnPRlist = data
    }else{
      Swal.fire({
        position: 'center',
        icon: 'warning',
        title: `SupplierCn NO All Ready Insent`,
        showCancelButton: true,
      })
    }

  }

  supplierCnPR(){
   const subs: Subscription =  this.purchaseService.supplierCnPR(this.SupplierCNNo,this.supplierCnPRlist.ID).subscribe({
    next: (res: any) => {
      this.modalService.dismissAll();
      this.SupplierCNNo = '';
      Swal.fire({
          position: 'center',
          icon: 'success',
          title: 'Your file has been Update.',
          showConfirmButton: false,
          timer: 1200
      })
    },
    error: (err: any) => console.log(err.message),
    complete: () => subs.unsubscribe(),
  });
  }

}
