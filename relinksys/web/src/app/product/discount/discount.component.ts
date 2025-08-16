import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { map, filter, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { fromEvent } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CalculationService } from 'src/app/service/helpers/calculation.service';
import { ProductService } from 'src/app/service/product.service';
import * as moment from 'moment';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BillService } from 'src/app/service/bill.service';

@Component({
  selector: 'app-discount',
  templateUrl: './discount.component.html',
  styleUrls: ['./discount.component.css']
})
export class DiscountComponent implements OnInit {
  companySetting = JSON.parse(localStorage.getItem('companysetting') || '');
  @ViewChild('searching') searching: ElementRef | any;

  constructor(
    private formBuilder: FormBuilder,
    public as: AlertService,
    private sp: NgxSpinnerService,
    public calculation: CalculationService,
    private ps: ProductService,
    private ng: NgbModal,
    private bill: BillService,

  ) { }

  selectedProduct: any;
  prodList: any;
  specList: any;
  searchValue: any
  term:any

  dataList: any = []
  currentPage = 1;
  itemsPerPage = 10;
  pageSize!: number;
  collectionSize = 0
  page = 4;

  data1: any = { ProductTypeID: 0, ProductName: '', DiscountValue: 0, Quantity: 0, DiscountType: '', };
  update1: any = { ProductTypeID: 0, ProductName: '', DiscountValue: 0, Quantity: 0, DiscountType: '', };

  wlcmArray1: any = [{ Quantity: '', DiscountValue: '', Type: '' }];

  ngOnInit(): void {
    // this.getProductList();
    this.bill.productList$.subscribe((list:any) => {
      this.prodList = list.sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
    });
    this.getList();
  }

  getProductList() {
    this.sp.show()
    const subs: Subscription = this.ps.getList().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.prodList = res.data.sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
          this.as.successToast(res.message)
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getFieldList() {
    if (this.data1.ProductTypeID !== 0) {
      this.prodList.forEach((element: any) => {
        if (element.ID === this.data1.ProductTypeID) {
          this.selectedProduct = element.Name;
        }
      })
      const subs: Subscription = this.ps.getFieldList(this.selectedProduct).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.specList = res.data;
            this.getSptTableData();
            this.as.successToast(res.message)
          } else {
            this.as.errorToast(res.message)
          }
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    }
    else {
      this.specList = [];
      this.data1.ProductName = '';
      this.data1.ProductTypeID = 0;
    }
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
  }

  onChange(event: any) {
    if (this.companySetting.DataFormat === '1') {
      event = event.toUpperCase()
    } else if (this.companySetting.DataFormat == '2') {
      event = event.toTitleCase()
    }
    return event;
  }

  openModal(content3: any) {
    this.ng.open(content3, { centered: true, backdrop: 'static', keyboard: false, size: 'lg' });
  }

  addRow() {
    this.wlcmArray1.push({ Quantity: '', DiscountValue: '', Type: '' });
  }

  deleteRow(i: any) {
    this.wlcmArray1.splice(i, 1);
  }

  AddRange() {
    const rangeValue = this.wlcmArray1
      .map((item: any) => `${item.Quantity}_${item.Type}_${item.DiscountValue}`)
      .join('/');

    this.data1.DiscountValue = rangeValue;
    this.ng.dismissAll()
    this.wlcmArray1 = [{ Quantity: '', DiscountValue: '', Type: '' }]
  }

  save() {
    this.specList.forEach((element: any) => {
      this.prodList.forEach((elements: any) => {
        if (elements.Name === element.ProductName) {
          this.data1.ProductTypeID = elements.ID
          this.data1.ProductTypeName = elements.Name
        }
      });

      if (element.SelectedValue !== "") {
          let valueToAdd = element.SelectedValue;
          valueToAdd = valueToAdd.replace(/^\d+_/, "");
          this.data1.ProductName = this.data1.ProductName + valueToAdd + "/";
        }


      // if (element.SelectedValue !== "") {
      //   this.data1.ProductName = this.data1.ProductName + element.SelectedValue + "/";
      // }
    });

    let dtm = {
      ProductTypeID: this.data1.ProductTypeID,
      ProductName: this.data1.ProductName.substring(0, this.data1.ProductName.length - 1),
      DiscountType: this.data1.DiscountType,
      DiscountValue: this.data1.DiscountValue,
    }

    const subs: Subscription = this.bill.saveDiscountSetting(dtm).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.getList();
          this.data1 = { ProductTypeID: 0, ProductName: '', DiscountValue: 0, Quantity: 0, DiscountType: '', };
          this.specList = []
          this.as.successToast(res.message)
        } else {
          this.as.errorToast(res.message)
          this.data1 = { ProductTypeID: 0, ProductName: '', DiscountValue: 0, Quantity: 0, DiscountType: '', };
          this.specList = []
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  openModalEdit(content: any, datas: any) {
    this.ng.open(content, { centered: true, backdrop: 'static', keyboard: false });
    this.update1 = datas;
    this.update1.ID = datas.ID
  }

  update() {

    let dtm = {
      ID: this.update1.ID,
      ProductTypeID: this.update1.ProductTypeID,
      ProductName: this.update1.ProductName,
      DiscountType: this.update1.DiscountType,
      DiscountValue: this.update1.DiscountValue,
    }

    const subs: Subscription = this.bill.updateDiscountSetting(dtm).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.ng.dismissAll()
          this.getList();
          this.update1 = { ProductTypeID: 0, ProductName: '', DiscountValue: 0, Quantity: 0, DiscountType: '', };
          this.specList = []
          this.as.successToast(res.message)
        } else {
          this.update1 = { ProductTypeID: 0, ProductName: '', DiscountValue: 0, Quantity: 0, DiscountType: '', };
          this.specList = []
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getList() {
    this.sp.show()
    const dtm = {
      currentPage: this.currentPage,
      itemsPerPage: this.itemsPerPage
    }
    const subs: Subscription = this.bill.getDiscountList(dtm).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.collectionSize = res.count;
          this.dataList = res.data
          this.as.successToast(res.message)
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
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
      if (data.searchQuery !== "") {
        const dtm = {
          currentPage: 1,
          itemsPerPage: 50000,
          searchQuery: data.searchQuery
        }
        this.sp.show()
        const subs: Subscription = this.bill.searchByFeild(dtm).subscribe({
          next: (res: any) => {
            if (res.success) {
              this.collectionSize = 1;
              this.page = 1;
              this.dataList = res.data
              this.as.successToast(res.message)
            } else {
              this.as.errorToast(res.message)
            }
            this.sp.hide()
          },
          error: (err: any) => console.log(err.message),
          complete: () => subs.unsubscribe(),
        });
      } else {
        this.getList();
      }
      this.sp.hide()
    });
  }

  deleteItem(i: any) {
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
        const subs: Subscription = this.bill.deleteDiscountSetting(this.dataList[i].ID).subscribe({
          next: (res: any) => {
            if (res.success) {
              this.getList()
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
            this.sp.hide();
          },
          error: (err: any) => console.log(err.message),
          complete: () => subs.unsubscribe(),
        });
      }
    })
  }

    

}
