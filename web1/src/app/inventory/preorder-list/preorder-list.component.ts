import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators,ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2'; 
import { AlertService } from 'src/app/service/helpers/alert.service';
import { map, filter, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { fromEvent   } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ExcelService } from 'src/app/service/helpers/excel.service';
import { PurchaseService } from 'src/app/service/purchase.service';
import * as moment from 'moment';


@Component({
  selector: 'app-preorder-list',
  templateUrl: './preorder-list.component.html',
  styleUrls: ['./preorder-list.component.css']
})
export class PreorderListComponent implements OnInit {

  @ViewChild('searching') searching: ElementRef | any;
  permission = JSON.parse(localStorage.getItem('permission') || '[]');
  companySetting:any = JSON.parse(localStorage.getItem('companysetting') || '[]');


  env = environment;
  gridview = true;
  term:any;
  dataList: any;
  currentPage = 1;
  itemsPerPage = 10;
  pageSize!: number;
  collectionSize = 0
  page = 4;

  constructor(
    private formBuilder: FormBuilder,
    public as: AlertService,
    private sp: NgxSpinnerService,
    private excelService: ExcelService,
    private purchaseService: PurchaseService,
  ) { }

  editOrderPriceList = false
  addOrderPriceList = false
  deleteOrderPriceList = false

  ngOnInit(): void {
    this.permission.forEach((element: any) => {
      if (element.ModuleName === 'OrderPriceList') {
        this.editOrderPriceList = element.Edit;
        this.addOrderPriceList = element.Add;
        this.deleteOrderPriceList = element.Delete;
      }
    });
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
    const subs: Subscription = this.purchaseService.listPreOrder(dtm).subscribe({
      next: (res: any) => {
        if(res.success){
          this.collectionSize = res.count;
          res.data.forEach((el: any) => {
            el.PurchaseDate = moment(el.PurchaseDate).format(`${this.companySetting.DateFormat}`);
          })
          this.dataList = res.data;
          this.as.successToast(res.message)
        }else{
          this.as.successToast(res.message)
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
        const subs: Subscription = this.purchaseService.deletePreOrder(this.dataList[i].ID).subscribe({
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
              Swal.fire({
                position: 'center',
                icon: 'success',
                title: 'Your file has been deleted.',
                showConfirmButton: false,
                timer: 1000
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
    this.searching.nativeElement.focus();
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
      const subs: Subscription = this.purchaseService.searchByFeildPreOrder(dtm).subscribe({
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
        GSTNo : e.GSTNo,
        Quantity : e.Quantity,
        TotalAmount : e.TotalAmount,
        DiscountAmount : e.DiscountAmount,
        GSTAmount : e.GSTAmount,
        CreatedPerson : e.CreatedPerson,
        UpdatedPerson : e.UpdatedPerson,
      }
    })
    this.excelService.exportAsExcelFile(data, 'perOrder_list');
  }

}
