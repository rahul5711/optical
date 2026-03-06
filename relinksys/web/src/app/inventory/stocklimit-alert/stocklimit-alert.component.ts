import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { ProductService } from 'src/app/service/product.service';
import { debounceTime, distinctUntilChanged, fromEvent, map, Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { NgxSpinnerService } from 'ngx-spinner';
import { PurchaseService } from 'src/app/service/purchase.service';
import { BillService } from 'src/app/service/bill.service';

@Component({
  selector: 'app-stocklimit-alert',
  templateUrl: './stocklimit-alert.component.html',
  styleUrls: ['./stocklimit-alert.component.css']
})
export class StocklimitAlertComponent implements OnInit {
  evn = environment;
  user = JSON.parse(localStorage.getItem('user') || '');
  company = JSON.parse(localStorage.getItem('company') || '');
  shop = JSON.parse(localStorage.getItem('shop') || '');
  companySetting = JSON.parse(localStorage.getItem('companysetting') || '');
  selectedShop: any = JSON.parse(localStorage.getItem('selectedShop') || '');
  @ViewChild('searching') searching: ElementRef | any;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private ps: ProductService,
    private purchaseService: PurchaseService,
    public as: AlertService,
    public sp: NgxSpinnerService,
    public bill: BillService,
  ) {

  }
  prodList: any
  selectedProduct: any
  searchValue: any
  specList: any = []
  item: any = []
  barCodeList: any = []
  disabledBtn = false
  dataList: any = []
  currentPage = 1;
  itemsPerPage = 10;
  pageSize!: number;
  collectionSize = 0
  page = 4;
  term: any
  UpdateBarcode = false;
  limitItem: any = {
    ID: null, CompanyID: null, ShopID: null, ProductTypeID: null, ProductTypeName: null, ProductName: null, LimitCount: 0,  Status: 1
  };

  ngOnInit(): void {
    this.bill.productLists$.subscribe((list: any) => {
      this.prodList = list
    });
    this.getList()
  }


  getProductList() {
    const subs: Subscription = this.ps.getList().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.prodList = res.data.sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
        } else {
          this.as.errorToast(res.message)
        }
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getFieldList() {
    const subs: Subscription = this.ps.getFieldList(this.selectedProduct).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.specList = res.data;
          this.getSptTableData();
        } else {
          this.as.errorToast(res.message)
        }
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getSptTableData() {
    this.specList.forEach((element: any) => {
      if (element.FieldType === 'DropDown' && element.Ref === '0') {
        const subs: Subscription = this.ps.getProductSupportData('0', element.SptTableName).subscribe({
          next: (res: any) => {
            if (res.success) {
              element.SptTableData = res.data.sort((a: { TableValue: string; }, b: { TableValue: any; }) => (a.TableValue.trim()).localeCompare(b.TableValue));
              element.SptFilterData = res.data.sort((a: { TableValue: string; }, b: { TableValue: any; }) => (a.TableValue.trim()).localeCompare(b.TableValue));
            } else {
              this.as.errorToast(res.message)
            }
          },
          error: (err: any) => console.log(err.message),
          complete: () => subs.unsubscribe(),
        });
      }
    });
  }

  getFieldSupportData(index: any) {
    this.specList.forEach((element: any) => {
      if (element.Ref === this.specList[index].FieldName.toString()) {
        const subs: Subscription = this.ps.getProductSupportData(this.specList[index].SelectedValue, element.SptTableName).subscribe({
          next: (res: any) => {
            if (res.success) {
              element.SptTableData = res.data.sort((a: { TableValue: string; }, b: { TableValue: any; }) => (a.TableValue.trim()).localeCompare(b.TableValue));
              element.SptFilterData = res.data.sort((a: { TableValue: string; }, b: { TableValue: any; }) => (a.TableValue.trim()).localeCompare(b.TableValue));
            } else {
              this.as.errorToast(res.message)
            }
          },
          error: (err: any) => console.log(err.message),
          complete: () => subs.unsubscribe(),
        });
      }
    });
    this.limitItem.ProductName = ''
  }

  onChange(event: any) {
    if (this.companySetting.DataFormat === '1') {
      event = event.toUpperCase()
    } else if (this.companySetting.DataFormat == '2') {
      event = event.toTitleCase()
    }
    return event;
  }

  editData(data: any) {
    this.disabledBtn = true;
    this.limitItem = { ...data };
  }

  saveItem(f: any) {
    this.sp.show()
    this.specList.forEach((element: any) => {
      this.prodList.forEach((elements: any) => {
        if (elements.Name === element.ProductName) {
          this.limitItem.ProductTypeID = elements.ID
          this.limitItem.ProductTypeName = elements.Name
        }
      });

      if (element.SelectedValue !== "") {
        let valueToAdd = element.SelectedValue;
        valueToAdd = valueToAdd.replace(/^\d+_/, "");
        this.limitItem.ProductName = this.limitItem.ProductName + valueToAdd + "/";
      }

      if (element.FieldType === "Date") {
        this.limitItem.ProductExpDate = element.SelectedValue;
      }
    });

    this.limitItem.ProductExpDate = this.limitItem.ProductExpDate === '' ? "0000-00-00" : this.limitItem.ProductExpDate;
    this.limitItem.ProductTypeID = this.limitItem.ProductTypeID
    this.limitItem.ProductTypeName = this.limitItem.ProductTypeName
    this.limitItem.ProductName = this.limitItem.ProductName.substring(0, this.limitItem.ProductName.length - 1)

    const subs: Subscription = this.purchaseService.setStockLimitAlert(this.limitItem).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.getList();
          f.resetForm();
          this.disabledBtn = false;
          this.limitItem = { LimitCount: 0 };
          this.router.navigate(['/inventory/Stocklimit']);
          this.as.successToast('Saved Successfully');
        } else {
          this.as.errorToast(res.message);
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });

  }
  updateItem(data:any) {
    this.sp.show()
    const subs: Subscription = this.purchaseService.setStockLimitAlert(data).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.getList();
          this.disabledBtn = false;
          this.as.successToast('Updated Successfully');
        } else {
          this.as.errorToast(res.message);
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });

  }

  changePagesize(num: number): void {
    this.itemsPerPage = this.pageSize + num;
  }

  ngAfterViewInit() {
    fromEvent(this.searching.nativeElement, 'keyup').pipe(
      map((event: any) => event.target.value),
      debounceTime(1000),
      distinctUntilChanged()
    ).subscribe((text: string) => {
      this.term = text.trim();
      this.currentPage = 1;
      this.itemsPerPage = 50000;
      this.getList();
    });
  }
  showInput(data:any){
 data.UpdateProduct = !data.UpdateProduct
  }

  getList() {
    this.sp.show()
    const dtm = {
      currentPage: this.currentPage,
      itemsPerPage: this.itemsPerPage,
      search: this.term
    }
    const subs: Subscription = this.purchaseService.listStockLimitAlert(dtm).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.collectionSize = res.count;
          this.dataList = res.data;
          // this.as.successToast(res.message)
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  deleteItem(data: any) {
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
        data.Status = 0
        const subs: Subscription = this.purchaseService.setStockLimitAlert(data).subscribe({
          next: (res: any) => {
            if (res.success) {
              // this.dataList.splice(data.i, 1);
              this.dataList = this.dataList.filter((x:any) => x.ID !== data.ID);
              // this.getList()
              this.as.successToast(res.message)
              Swal.fire({
                position: 'center',
                icon: 'success',
                title: 'Your file has been deleted.',
                showConfirmButton: false,
                timer: 1000
              })
            } else {
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


}
