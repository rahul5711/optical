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
import * as moment from 'moment';
import { BillService } from 'src/app/service/bill.service';

@Component({
  selector: 'app-customer-retrun-list',
  templateUrl: './customer-retrun-list.component.html',
  styleUrls: ['./customer-retrun-list.component.css']
})
export class CustomerRetrunListComponent implements OnInit {

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
  paymentHistoryList:any;
  CustomerCNNo:any
  BillDate:any
  supplierCnPRlist :any

  constructor(
    private formBuilder: FormBuilder,
    public  as: AlertService,
    private sp: NgxSpinnerService,
    private excelService: ExcelService,
    private purchaseService: PurchaseService,
    private billService: BillService,
    private modalService: NgbModal,
  ) { }

  editPurchaseReturnList = false
  addPurchaseReturnList = false
  deletePurchaseReturnList = false
  currentTime = '';

  ngOnInit(): void {
    this.permission.forEach((element: any) => {
      if (element.ModuleName === 'PurchaseReturnList') {
        this.editPurchaseReturnList = element.Edit;
        this.addPurchaseReturnList = element.Add;
        this.deletePurchaseReturnList = element.Delete;
      }
    });
     this.getList();
     this.currentTime = new Date().toLocaleTimeString('en-US', { hourCycle: 'h23'})
  }
  
  changePagesize(num: number): void {
    this.itemsPerPage = this.pageSize + num;
  }

  getList() {
    this.sp.show()
    const dtm = {
      currentPage: this.currentPage,
      itemsPerPage: this.itemsPerPage,
    }
    const subs: Subscription = this.billService.salereturnlist(dtm).subscribe({
      next: (res: any) => {
        if(res.success){
          this.collectionSize = res.count;
          this.dataList = res.data;
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
        const subs: Subscription = this.billService.deleteSR(this.dataList[i].ID).subscribe({
          next: (res: any) => {
            if(res.success) {
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
            else{
              Swal.fire({
                position: 'center',
                icon: 'warning',
                title: `First you'll have to delete product OR You have already added SupplierCn NO.`,
                showCancelButton: true,
              })
              this.as.errorToast(res.message)
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
      const subs: Subscription = this.billService.searchByFeildSR(dtm).subscribe({
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
        SystemCn : e.SystemCn,
        SupplierCn : e.SupplierCn,
        PurchaseDate : e.PurchaseDate,
        Quantity : e.Quantity,
        DiscountAmount : e.DiscountAmount,
        SubTotal : e.SubTotal,
        GSTAmount : e.GSTAmount,
        InvoiceAmount : e.TotalAmount,
        GSTNo : e.GSTNo,
        ShopName : e.ShopName,
        AreaName : e.AreaName,
        CreatedPerson : e.CreatedPerson,
        UpdatedPerson : e.UpdatedPerson,
      }
    })
    this.excelService.exportAsExcelFile(data, 'Customer_return_list');
  }

  openModal(content: any,data:any) {
    if(data.CustomerCn === '' && data.Quantity !== 0){
      this.modalService.open(content, { centered: true , backdrop : 'static', keyboard: false,size: 'sm'});
      this.supplierCnPRlist = data
    }else if(data.Quantity === 0){
      Swal.fire({
        position: 'center',
        icon: 'warning',
        title: `You have invoice quantity has been zero`,
        showCancelButton: true,
      })
    }else{
      Swal.fire({
        position: 'center',
        icon: 'warning',
        title: `You have already added CustomerCNNo. `,
        showCancelButton: true,
      })
    }
  }

  supplierCnPR(){
    Swal.fire({
      title: 'Are you sure?  CustomerCNNo -' + ` <b style ="font-size:20px;color:red;font-weight:bold;"> ${this.CustomerCNNo}</b> `,
      text: 'After you save a CustomerCNNo, You will be unable to update it again.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, Save it!'
    }).then((result) => {
      if (result.isConfirmed) {
        // this.sp.show();
      this.BillDate = this.BillDate + ' ' + this.currentTime; 
      console.log(this.BillDate,this.CustomerCNNo,this.supplierCnPRlist.ID)
        const subs: Subscription =  this.billService.customerCnSR(this.BillDate,this.CustomerCNNo,this.supplierCnPRlist.ID).subscribe({
          next: (res: any) => {
            if(res.success){
              this.modalService.dismissAll();
              this.getList();
              this.CustomerCNNo = '';
              this.BillDate = '';
              Swal.fire({
                  position: 'center',
                  icon: 'success',
                  title: 'Your file has been Update.',
                  showConfirmButton: false,
                  timer: 1200
              })
            }else{
              this.as.errorToast(res.message)
              Swal.fire({
                position: 'center',
                icon: 'error',
                title: res.message,
                showConfirmButton: true,
            })
            }
            this.sp.hide();
          },
          error: (err: any) => console.log(err.message), 
          complete: () => subs.unsubscribe(),
         });
      }
    })
  }

  dateFormat(date: any): string {
    if (date == null || date == "") {
      return '0000-00-00'; // Default Value
    }
    return moment(date).format(this.companySetting?.DateFormat || 'YYYY-MM-DD');
  }

}
