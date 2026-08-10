import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { Subscription } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { map, filter, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { fromEvent } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ExcelService } from 'src/app/service/helpers/excel.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, Router } from '@angular/router';
import { MomentInput } from 'moment';
import * as moment from 'moment';
import { SupportService } from 'src/app/service/support.service';
import { ProductService } from 'src/app/service/product.service';
import { ShopService } from 'src/app/service/shop.service';

@Component({
  selector: 'app-bulk-sms',
  templateUrl: './bulk-sms.component.html',
  styleUrls: ['./bulk-sms.component.css']
})
export class BulkSmsComponent implements OnInit {
  user = JSON.parse(localStorage.getItem('user') || '');
  permission = JSON.parse(localStorage.getItem('permission') || '[]');
  companySetting: any = JSON.parse(localStorage.getItem('companysetting') || '[]');
  shop = JSON.parse(localStorage.getItem('shop') || '');
  selectedShop = JSON.parse(localStorage.getItem('selectedShop') || '');

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    public as: AlertService,
    private sp: NgxSpinnerService,
    private excelService: ExcelService,
    private modalService: NgbModal,
    private supps: SupportService,
    private ps: ProductService,
    private ss: ShopService,
  ) { }

  data: any = { TemplateName: null, Message: null, };
  filter: any = {
    CustomerCategory: 0, stringProductName: '', ProductCategory: 0, ProductName: '',
  }

  customerCategoryList: any
  env = environment;
  term: any;
  searchValue: any;
  selectedProduct: any;
  prodList: any;
  specList: any;
  dataList: any;
  Productsearch: any = '';
  dataListt: any = [];
  filterList: any = [];
  whatsappTemplateList: any[] = [];
  loginShop:any
  ngOnInit(): void {
    this.getCATEGORYList();
    this.getProductList();
    [this.loginShop] = this.shop.filter((s: any) => s.ID === Number(this.selectedShop[0]));
    this.whatsappTemplateList = JSON.parse(this.loginShop.WhatsappArray || '[]')
  }

  getCATEGORYList() {
    const subs: Subscription = this.supps.getList('CustomerCategory').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.customerCategoryList = res.data
        } else {
          this.as.errorToast(res.message)
        }
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
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
    if (this.filter.ProductCategory !== 0) {
      this.prodList.forEach((element: any) => {
        if (element.ID === this.filter.ProductCategory) {
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
      this.filter.ProductName = '';
      this.filter.ProductCategory = 0;
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

  filters() {
    let productName = '';
    this.specList.forEach((element: any) => {
      if (productName === '') {
        let valueToAdd = element.SelectedValue;
        valueToAdd = valueToAdd.replace(/^\d+_/, "");
        productName = valueToAdd;
      } else if (element.SelectedValue !== '') {
        let valueToAdd = element.SelectedValue;
        valueToAdd = valueToAdd.replace(/^\d+_/, "");
        productName += '/' + valueToAdd;
      }
    });
    this.filter.ProductName = productName;
  }


  searchData() {
    this.sp.show()
    let ProductDescription = ''
    if (this.filter.ProductCategory != 0) {
      this.filters()
      ProductDescription += ` and billdetail.ProductTypeID = ${this.filter.ProductCategory} and billdetail.ProductTypeName = '${this.selectedProduct}' and billdetail.ProductName LIKE '${this.filter.ProductName.trim()}%' `;
    }

    if (this.Productsearch != '') {
      ProductDescription += `and billdetail.ProductName like '%${this.Productsearch}%'`
    }

    let Parem = {
      CategoryID: this.filter.CustomerCategory,
      ProductDescription: ProductDescription
    };

    const subs: Subscription = this.ss.fetchCustomerForWhatsapp(Parem).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.as.successToast(res.message)
          this.dataList = res.data
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

    multicheck() {
    for (var i = 0; i < this.dataList.length; i++) {
      const index = this.dataList.findIndex(((x: any) => x === this.dataList[i]));
      if (this.dataList[index].Sel == null || this.dataList[index].Sel === 0 || this.dataList[index].Sel === undefined) {
        this.dataList[index].Sel = 1;
      } else {
        this.dataList[index].Sel = 0;
      }
    }
  }

    validate(v: any, event: any) {
    if (v.Sel === 0 || v.Sel === null || v.Sel === undefined) {
      v.Sel = 1;
    } else {
      v.Sel = 0;
    }
  }

  
    onSubmit() {
  this.sp.show();
    
  this.filterList = this.dataList.filter((d: any) => d.Sel === 1);

  if (this.filterList.length === 0) {
    this.sp.hide();
    this.as.errorToast('Please select at least one customer');
    return;
  }

//   const mobileNumbers = this.filterList
//     .map((customer: any) => {
//       const mobile = customer?.Mobile?.toString().trim();
    
//       if (/^\d{10}$/.test(mobile)) {
//         return '91' + mobile.toString();
//       }

//       return null;
//     })
//     .filter((mobile: any) => mobile !== null).join(',');

//  const customername = this.filterList
//   .map((customer: any) => customer?.CustomerName?.toString().trim() || '')
//   .filter((name: string) => name !== '')
//   .join(',');
  

  const dtm = {
      CustomerName: this.filterList.map(
    (customer: any) => customer?.CustomerName?.toString().trim() || ''
  ),

  MobileNo: this.filterList.map(
    (customer: any) => '91' + customer.Mobile.toString().trim()
  ),
    ShopName: `${this.loginShop.Name} (${this.loginShop.AreaName})`,
    ShopNumber: this.loginShop.MobileNo1,
    TemplateValue: this.getWhatsAppField(
      JSON.parse(this.loginShop.WhatsappArray),
      this.data.TemplateName,
      'TemplateValue'
    )
  };

  console.log(dtm);

  const subs: Subscription = this.ss.sendWhatsappTemplate(dtm).subscribe({
    next: (res: any) => {
      if (res.success) {
        this.as.successToast(res.message);
      } else {
        this.as.errorToast(res.message);
      }

      this.sp.hide();
    },
    error: (err: any) => {
      console.error('WhatsApp Send Error:', err.message);
      this.sp.hide();
    },
    complete: () => subs.unsubscribe()
  });
}


  getWhatsAppField(list: any[], templateName: string, field: 'TemplateValue' | 'MessageText' | 'Url') {
    const item = list?.find(x => x.TemplateName === templateName);
    return item ? item[field] : '';
  }

// sendWhatsapp(data: any) {
//   let shop = this.shop.filter(
//     (s: any) => s.ID === Number(this.selectedShop[0])
//   );

//   if (shop[0].isWhatsappPaidService == 'true') {
//     this.paidSendWhatsapp(data);
//   } else {
//     alert('Only paid version');
//   }
// }


}
