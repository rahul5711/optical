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

@Component({
  selector: 'app-discount',
  templateUrl: './discount.component.html',
  styleUrls: ['./discount.component.css']
})
export class DiscountComponent implements OnInit {
  companySetting = JSON.parse(localStorage.getItem('companysetting') || '');

  constructor(
    private formBuilder: FormBuilder,
    public as: AlertService,
    private sp: NgxSpinnerService,
    public calculation: CalculationService,
    private ps: ProductService,
    private ng: NgbModal,

  ) { }

  selectedProduct: any;
  prodList: any;
  specList: any;
  searchValue:any

  data1: any = {  ProductTypeID: 0, ProductName: '', DiscountValue: '', Quantity:0, DiscountType: '', };

  wlcmArray1: any = [{ Quantity: '', DiscountValue: '', Type: '' }];

  ngOnInit(): void {
    this.getProductList();
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

  addRow() {
    this.wlcmArray1.push({ Quantity: '', DiscountValue: '', Type: '' });
  }

  deleteRow(i: any) {
    this.wlcmArray1.splice(i, 1);
}

  openModal(content3: any) {
    this.ng.open(content3, { centered: true, backdrop: 'static', keyboard: false, size: 'lg' });
  }

  AddRange(){
  const rangeValue = this.wlcmArray1
  .map((item: any) => `${item.Quantity}_${item.Type}_${item.DiscountValue}`)
  .join('/');

  this.data1.DiscountValue = rangeValue;
  this.ng.dismissAll()
  this.wlcmArray1 = [{ Quantity: '', DiscountValue: '', Type: ''}]
  }

save(){
  this.specList.forEach((element: any) => {
    this.prodList.forEach((elements: any) => {
      if (elements.Name === element.ProductName) {
        this.data1.ProductTypeID = elements.ID
        this.data1.ProductTypeName = elements.Name
      }
    });
    if (element.SelectedValue !== "") {
      this.data1.ProductName = this.data1.ProductName + element.SelectedValue + "/";
    }
  });

  let dtm = {
    ProductTypeID: this.data1.ProductTypeID,
    ProductName :this.data1.ProductName.substring(0, this.data1.ProductName.length - 1),
    DiscountType : this.data1.DiscountType,
    DiscountValue: this.data1.DiscountValue,
  }

  console.log(dtm);
}

}
