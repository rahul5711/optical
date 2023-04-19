import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { FileUploadService } from 'src/app/service/helpers/file-upload.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { take } from 'rxjs/operators';
import { CompressImageService } from 'src/app/service/helpers/compress-image.service';
import * as moment from 'moment';
import { CustomerService } from 'src/app/service/customer.service';
import { CustomerPowerCalculationService } from 'src/app/service/helpers/customer-power-calculation.service';
import { BillService } from 'src/app/service/bill.service';
import { ProductService } from 'src/app/service/product.service';
import { BillCalculationService } from 'src/app/service/helpers/bill-calculation.service';
import { SupportService } from 'src/app/service/support.service';

@Component({
  selector: 'app-bill',
  templateUrl: './bill.component.html',
  styleUrls: ['./bill.component.css']
})
export class BillComponent implements OnInit {
  user = JSON.parse(localStorage.getItem('user') || '');
  companysetting = JSON.parse(localStorage.getItem('companysetting') || '');
  selectedShop = JSON.parse(localStorage.getItem('selectedShop') || '');
  env = environment;
  id: any

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    public as: AlertService,
    private sp: NgxSpinnerService,
    public calculation: CustomerPowerCalculationService,
    public bill: BillService,
    private ps: ProductService,
    private billCalculation: BillCalculationService,
    private supps: SupportService,
  ) {
    this.id = this.route.snapshot.params['id'];
  }

  BillMaster: any = {
    ID: null, CompanyID: null, InvoiceNo: null, BillDate: null, DeliveryDate: null, Doctor: null, Employee: null, TrayNo:
      null, Sno: "", ProductStatus: 'Pending', Balance: 0, PaymentStatus: null, Quantity: 0, SubTotal: 0, DiscountAmount: 0, GSTAmount: 0, AddlDiscount: 0, AddlDiscountPercentage: 0.00, TotalAmount: 0.00, RoundOff: 0.00, DueAmount: 0.00, Invoice: null, Receipt: null, Status: 1, CreatedBy: null,
  }

  BillItem: any = {
    ID: null, ProductName: null, ProductTypeID: null, ProductTypeName: null, HSNCode: null, UnitPrice: 0.00, Quantity: 0, SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: 0, GSTAmount: 0.00, GSTType: 'None', TotalAmount: 0.00, WholeSale: false, Manual: false, PreOrder: false, BarCodeCount: null, Barcode: null, Status: 1, MeasurementID: null, Family: 'Self', Option: null, SupplierID: null, ProductExpDate: null
  };

  Service: any = {
    ID: null, CompanyID: null, ServiceType: null, Name: '', Description: null, cost: 0.00, Price: 0.00, GSTPercentage: 0, GSTAmount: 0.00, GSTType: 'None', TotalAmount: 0.00, Status: 1
  };

  data = { billMaster: null, billDetail: null, service: null };

  category = 'Product';
  employeeList: any;
  searchProductName: any;
  selectedProduct: any;
  cgst = 0;
  sgst = 0;
  familyList: any;
  doctorList: any
  trayNoList: any
  prodList: any
  specList: any;
  searchList: any = [];
  Req: any = { SearchBarCode: '', searchString: '', }
  PreOrder = "false";
  ShopMode = false;
  showProductExpDate = false;
  billItemList: any = [];
  serviceLists: any = [];
  serviceType: any;
  gstList: any;
  BarcodeList: any;
  loginShopID: any
  ngOnInit(): void {
    this.loginShopID = Number(this.selectedShop[0])
    this.BillMaster.BillDate = moment().format('YYYY-MM-DD');
    this.BillMaster.DeliveryDate = moment(new Date()).add(this.companysetting.DeliveryDay, 'days').format('YYYY-MM-DD');
    this.getTrayNo();
    this.getEmployee();
    this.getDoctor();
    this.getProductList();
    this.getService();

  }

  getDoctor() {
    this.sp.show();
    const subs: Subscription = this.bill.getDoctor().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.doctorList = res.data
          this.sp.hide();
        } else {
          this.as.errorToast(res.message)
        }
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getEmployee() {
    this.sp.show();
    const subs: Subscription = this.bill.getEmployee().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.employeeList = res.data
          this.sp.hide();
        } else {
          this.as.errorToast(res.message)
        }
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getTrayNo() {
    this.sp.show();
    const subs: Subscription = this.bill.getTrayNo().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.trayNoList = res.data
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getGSTList() {
    const subs: Subscription = this.supps.getList('TaxType').subscribe({
      next: (res: any) => {
        if (res.success) {
          if (this.BillItem.GSTPercentage === 0) {
            this.BillItem.GSTType = 'None'
          } else {
            this.gstList = res.data
          }
        } else {
          this.as.errorToast(res.message)
        }
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getService() {
    const subs: Subscription = this.supps.servicelist(this.Service).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.serviceType = res.data
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  setValues() {
    this.serviceType.forEach((element: any) => {
      if (element.ID === this.Service.ServiceType) {
        this.Service.Name = element.Name
        this.Service.Price = element.Price;
        this.Service.Cost = element.Cost;
        this.Service.Description = element.Description;
        this.Service.GSTAmount = element.GSTAmount;
        this.Service.GSTPercentage = element.GSTPercentage;
        this.Service.GSTType = element.GSTType;
        this.Service.TotalAmount = element.TotalAmount;
      }
    });
  }

  getProductList() {
    this.sp.show();
    const subs: Subscription = this.ps.getList().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.prodList = res.data;
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getFieldList() {
    this.sp.show();
    const subs: Subscription = this.ps.getFieldList(this.selectedProduct).subscribe({
      next: (res: any) => {
        this.sp.hide();
        if (res.success) {
          this.specList = res.data;
          if (res.data.length) {
            this.getSptTableData();
          }
        } else {
          this.as.errorToast(res.message)
        }
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getSptTableData() {
    this.sp.show();
    this.specList.forEach((element: any) => {
      if (element.FieldType === 'DropDown' && element.Ref === '0') {
        const subs: Subscription = this.ps.getProductSupportData('0', element.SptTableName).subscribe({
          next: (res: any) => {
            if (res.success) {
              element.SptTableData = res.data;
              element.SptFilterData = res.data;
            } else {
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

  getFieldSupportData(index: any) {
    this.sp.show();
    this.specList.forEach((element: any) => {
      if (element.Ref === this.specList[index].FieldName.toString()) {
        const subs: Subscription = this.ps.getProductSupportData(this.specList[index].SelectedValue, element.SptTableName).subscribe({
          next: (res: any) => {
            if (res.success) {
              element.SptTableData = res.data;
              element.SptFilterData = res.data;
            } else {
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

  onChange(event: { toUpperCase: () => any; toTitleCase: () => any; }) {
    if (this.companysetting.DataFormat === '1') {
      event = event.toUpperCase()
    } else if (this.companysetting.DataFormat == '2') {
      event = event.toTitleCase()
    }
    return event;
  }

  getSearchByBarcodeNo() {
    this.sp.show();
    if (this.BillItem.Manual == false) {
      if (this.BillItem.PreOrder) {
        this.PreOrder = "true"
      } else {
        this.PreOrder = "false"
      }
      const subs: Subscription = this.bill.searchByBarcodeNo(this.Req, this.PreOrder, this.ShopMode).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.searchList = res.data[0];
          } else {
            this.as.errorToast(res.message)
          }
          this.sp.hide();
          if (this.searchList.length === 0 || this.searchList.Barcode === null) {
            Swal.fire({
              icon: 'warning',
              title: 'Please Enter Correct Barcode ',
              text: 'Incorrect Barcode OR Product not available in this Shop.',
              footer: '',
              backdrop: false,
            });
          }
          this.selectedProduct = this.searchList.ProductTypeName;
          this.BillItem.ProductName = this.searchList.ProductName.toUpperCase();
          this.prodList.forEach((e: any) => {
            if (e.ID === this.searchList.ProductTypeID) {
              this.BillItem.ProductTypeID = e.ID;
              this.BillItem.ProductTypeName = e.Name;
              this.BillItem.HSNCode = e.HSNCode;
              this.BillItem.GSTPercentage = e.GSTPercentage;
              this.BillItem.GSTType = e.GSTType;
            }
          })
          if (this.searchList.Barcode !== null && this.searchList.BarCodeCount !== 0) {
            if (this.billItemList.length !== 0 && this.BillItem.ProductName !== "") {
              let itemCount = 0;
              this.billItemList.forEach((element: any) => {
                if (element.ProductName === this.BillItem.ProductName && element.ID === null) {
                  itemCount = itemCount + element.Quantity;
                }
              })
              this.searchList.BarCodeCount = this.searchList.BarCodeCount - itemCount;
            }
          }
          this.BillItem.Barcode = this.searchList.Barcode;
          this.BillItem.BarCodeCount = this.searchList.BarCodeCount;
          if (this.BillItem.WholeSale === true) {
            this.BillItem.UnitPrice = this.searchList.WholeSalePrice;
            this.BillItem.Quantity = 1
          }
          else if (this.BillItem.PreOrder === true) {
            this.BillItem.UnitPrice = this.searchList.RetailPrice;
            this.BillItem.Quantity = 1
          }
          else {
            this.BillItem.UnitPrice = this.searchList.RetailPrice;
            this.BillItem.Quantity = 1
          }
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    } else {
      this.sp.hide();
      Swal.fire({
        icon: 'warning',
        title: 'Not Available',
        text: 'Product Not available in this Shop.',
        footer: '',
        backdrop: false,
      });
    }
  }

  getSearchByString() {
    this.sp.show();
    if (this.BillItem.Manual === false) {
      if (this.BillItem.PreOrder) {
        // PreOrder product name
        this.PreOrder = "true"
        const subs: Subscription = this.bill.searchByString(this.Req, this.PreOrder, this.ShopMode).subscribe({
          next: (res: any) => {
            if (res.success) {
              this.BarcodeList = res.data;
            } else {
              this.as.errorToast(res.message)
            }
            this.sp.hide();
          },
          error: (err: any) => console.log(err.message),
          complete: () => subs.unsubscribe(),
        });
      } else {
        // stock product name
        this.PreOrder = "false"
        const subs: Subscription = this.bill.searchByString(this.Req, this.PreOrder, this.ShopMode).subscribe({
          next: (res: any) => {
            if (res.success) {
              this.BarcodeList = res.data;
            } else {
              this.as.errorToast(res.message)
            }
            this.sp.hide();
          },
          error: (err: any) => console.log(err.message),
          complete: () => subs.unsubscribe(),
        });
      }
    } else {
      this.sp.hide();
      this.BarcodeList = []
    }
    this.sp.hide();
  }

  getBarCodeList(index: any) {
    this.sp.show();
    let searchString = "";

    this.specList.forEach((element: any, i: any) => {
      if (element.SelectedValue !== '') {
        searchString = searchString.concat("/", element.SelectedValue);
      }
    });
    this.Req.searchString = this.selectedProduct + searchString
    // PreOrder select barcodelist
    if (this.BillItem.Manual === false) {
      if (this.BillItem.PreOrder) {
        this.PreOrder = "true"
        const subs: Subscription = this.bill.searchByString(this.Req, this.PreOrder, this.ShopMode).subscribe({
          next: (res: any) => {
            if (res.success) {
              this.BarcodeList = res.data;
            } else {
              this.as.errorToast(res.message)
            }
            this.sp.hide();
          },
          error: (err: any) => console.log(err.message),
          complete: () => subs.unsubscribe(),
        });
      }
      else {
        // stock select barcodelist
        this.PreOrder = "false"
        const subs: Subscription = this.bill.searchByString(this.Req, this.PreOrder, this.ShopMode).subscribe({
          next: (res: any) => {
            if (res.success) {
              this.BarcodeList = res.data;
            } else {
              this.as.errorToast(res.message)
            }
            this.sp.hide();
          },
          error: (err: any) => console.log(err.message),
          complete: () => subs.unsubscribe(),
        });
      }
    } else {
      this.sp.hide();
      this.BarcodeList = []
    }
    this.sp.hide();
  }

  calculations(fieldName: any, mode: any,) {
    if (!this.BillItem.PreOrder && !this.BillItem.Manual && this.BillItem.Quantity > this.searchList.BarCodeCount) {
      Swal.fire({
        icon: 'warning',
        title: 'Entered Qty is Greater then Available Qty',
        text: '',
        footer: '',
        backdrop: false,
      });
    }
    else {
      // Lens option
      this.BillItem.Quantity = 1;
      if (this.BillItem.Option === 'Full Glass' || this.BillItem.Quantity !== 1) {
        this.BillItem.Quantity = this.BillItem.Quantity * 2;
      } else {
        this.BillItem.Quantity = 1;
      }
      // Lens option
      this.billCalculation.calculations(fieldName, mode, this.BillItem, this.Service)
      this.getGSTList();
    }
  }

  calculateGrandTotal() {
    this.billCalculation.calculateGrandTotal(this.BillMaster, this.billItemList, this.serviceLists)
  }

  AddDiscalculate(fieldName: any, mode: any) {
    this.billCalculation.AddDiscalculate(fieldName, mode, this.BillMaster)
  }

  addProductItem() {
    if (this.BillMaster.ID !== null) {
      this.BillItem.Status = 2;
    }
    if (!this.BillItem.PreOrder && !this.BillItem.Manual && this.BillItem.Quantity > this.searchList.BarCodeCount) {
      Swal.fire({
        icon: 'warning',
        title: 'Entered Qty is Greater then Available Qty',
        text: '',
        footer: '',
        backdrop: false,
      });
      this.BillItem.Quantity = 0;
      this.BillItem.SubTotal = 0;
      this.BillItem.DiscountAmount = 0;
      this.BillItem.GSTAmount = 0;
      this.BillItem.TotalAmount = 0;
      this.billCalculation.calculations('', '', this.BillItem, this.Service)
    } else {
      this.billItemList.unshift(this.BillItem);
      console.log(this.billItemList);

      this.BillItem = {
        ID: null, ProductName: null, ProductTypeID: null, ProductTypeName: null, HSNCode: null, UnitPrice: 0.00, Quantity: 0, SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: 0, GSTAmount: 0.00, GSTType: 'None', TotalAmount: 0.00, WholeSale: false, Manual: false, PreOrder: false, Barcode: null, Status: 1, MeasurementID: null, Family: 'Self', Option: null, SupplierID: null, ProductExpDate: null
      };

      this.selectedProduct = "";
      this.specList = [];
      this.BillItem.BarCodeCount = 0;
      this.BarcodeList = [];
      this.Req = {};
    }
  }

  addItem() {
    // additem Services
    if (this.category === 'Services') {
      if (this.BillMaster.ID !== null) { this.Service.Status = 2; }
      this.serviceLists.push(this.Service);

      this.Service = {
        ID: null, CompanyID: null, ServiceType: null, Name: '', Description: null, cost: 0.00, Price: 0.00, GSTPercentage: 0, GSTAmount: 0.00, GSTType: 'None', TotalAmount: 0.00, Status: 1
      };
    }

    // additem Product
    if (this.category === 'Product') {
      // additem Manual
      if (this.BillItem.Manual) {
        let searchString = "";
        this.prodList.forEach((e: any) => {
          if (e.Name === this.selectedProduct) {
            this.BillItem.ProductTypeID = e.ID;
            this.BillItem.HSNCode = e.HSNCode;
          }
        })
        this.specList.forEach((element: any, i: any) => {
          if (element.SelectedValue !== '') {
            searchString = searchString.concat(element.SelectedValue, "/");
          }
        });
        this.BillItem.ProductTypeName = this.selectedProduct
        this.BillItem.ProductName = searchString
        this.BillItem.Barcode = 'ManualProduct'
      }
      this.addProductItem();
    }
    this.BillMaster.Quantity = 0;
    this.BillMaster.SubTotal = 0;
    this.BillMaster.DiscountAmount = 0;
    this.BillMaster.GSTAmount = 0;
    this.BillMaster.TotalAmount = 0;
    this.cgst = 0;
    this.sgst = 0;
    this.calculateGrandTotal()
  }

  onSubmit() {
    this.data.billMaster = this.BillMaster;
    this.data.billDetail = this.billItemList;
    this.data.service = this.serviceLists;
    console.log(this.data);
    // const subs: Subscription = this.bill.saveBill(this.data).subscribe({
    //   next: (res: any) => {

    //   },
    //   error: (err: any) => console.log(err.message),
    //   complete: () => subs.unsubscribe(),
    // });
  }

  deleteItem(category: any, i: any) {
    if (category === "Product") {
      if (this.billItemList[i].ID === null) {
        this.billItemList.splice(i, 1);
      } else {
        this.billItemList[i].Status = 0;
      }
    } else if (category === "Service") {
      if (this.serviceLists[i].ID === null) {
        this.serviceLists.splice(i, 1);
      } else {
        this.serviceLists[i].Status = 0;
      }
    }
    this.calculateGrandTotal();
  }



}
