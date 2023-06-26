import { Component, Input, OnInit } from '@angular/core';
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
import { trigger, style, animate, transition } from '@angular/animations';
import { SupplierService } from 'src/app/service/supplier.service';
import { FitterService } from 'src/app/service/fitter.service';


@Component({
  selector: 'app-bill',
  templateUrl: './bill.component.html',
  styleUrls: ['./bill.component.css'],
  animations: [
    trigger('fade', [
      transition('void => *', [
        style({ opacity: 0 }),
        animate(2000, style({ opacity: 1 }))
      ])
    ])
  ]
})
export class BillComponent implements OnInit {

  @Input() customerID2: any
  user = JSON.parse(localStorage.getItem('user') || '');
  companysetting = JSON.parse(localStorage.getItem('companysetting') || '');
  selectedShop = JSON.parse(localStorage.getItem('selectedShop') || '');
  env = environment;
  id: any = 0
  id2: any = 0
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    public as: AlertService,
    private sp: NgxSpinnerService,
    public calculation: CustomerPowerCalculationService,
    public bill: BillService,
    private ps: ProductService,
    private billCalculation: BillCalculationService,
    private supps: SupportService,
    private cs: CustomerService,
    private modalService: NgbModal,
    private sup: SupplierService,
    private fitters: FitterService,
  ) {
    this.id = this.route.snapshot.params['customerid'];
    this.id2 = this.route.snapshot.params['billid'];
  }



  BillMaster: any = {
    ID: null, CustomerID: null, CompanyID: null, ShopID: null, Sno: "", BillDate: null, DeliveryDate: null, PaymentStatus: null, InvoiceNo: null, GSTNo: '', Doctor: null, Employee: null, TrayNo: null, ProductStatus: 'Pending', Balance: 0, Quantity: 0, SubTotal: 0, DiscountAmount: 0, GSTAmount: 0, AddlDiscount: 0, AddlDiscountPercentage: 0.00, TotalAmount: 0.00, RoundOff: 0.00, DueAmount: 0.00, Invoice: null, Receipt: null, Status: 1, CreatedBy: null,
  }

  BillItem: any = {
    ID: null, CompanyID: null, ProductName: null, ProductTypeID: null, ProductTypeName: null, HSNCode: null, UnitPrice: 0.00, Quantity: 0, SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: 0, GSTAmount: 0.00, GSTType: 'None', TotalAmount: 0.00, WholeSale: false, Manual: false, PreOrder: false, BarCodeCount: null, Barcode: null, BaseBarCode: null, Status: 1, MeasurementID: null, Family: 'Self', Option: null, SupplierID: null, ProductExpDate: null, Remark: '', Warranty: '', RetailPrice: 0.00, WholeSalePrice: 0.00, DuaCal : '', PurchasePrice:0
  };

  Service: any = {
    ID: null, CompanyID: null, ServiceType: null, Name: '', Description: null, cost: 0.00, Price: 0.00, GSTPercentage: 0, GSTAmount: 0.00, GSTType: 'None', TotalAmount: 0.00, Status: 1
  };

  customer: any = {
    ID: null, CompanyID: '', Idd: 0, Name: '', Sno: '', TotalCustomer: '', VisitDate: '', MobileNo1: '', MobileNo2: '', PhoneNo: '', Address: '', GSTNo: '', Email: '', PhotoURL: '', DOB: '', Age: 0, Anniversary: '', RefferedByDoc: '', ReferenceType: '', Gender: '', Category: '', Other: '', Remarks: '', Status: 1, CreatedBy: 0, UpdatedBy: 0, CreatedOn: '', UpdatedOn: '', tablename: '', spectacle_rx: [], contact_lens_rx: [], other_rx: [],
  };

  customerPower: any = []
  data:any = { billMaseterData: null, billDetailData: null, service: null };

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
  disableAddButtons = false;
  loginShopID: any;
  gst_detail: any = [];
  GstTypeDis = false
  
  PowerSelect :any
  PowerByRow:any = []
  ProductDetails:any
  UpdatePowerID:any
  customerVisiList:any = []
  customerPowerLists:any = []

  invoiceList:any = []
  paidList:any = []

  orderList:any = []
  filtersList:any = []
  supplierList:any = []

  fitterList:any = []
  lensList:any = []
  rateCardList:any = []

  ngOnInit(): void {
    this.BillMaster.Employee = this.user.ID
    this.BillMaster.BillDate = moment().format('YYYY-MM-DD');
    this.BillMaster.DeliveryDate = moment(new Date()).add(this.companysetting.DeliveryDay, 'days').format('YYYY-MM-DD');
    this.loginShopID = Number(this.selectedShop[0])
    this.getTrayNo();
    this.getEmployee();
    this.getDoctor();
    this.getProductList();
    this.getGSTList();
    this.getService();
    this.getCustomerById1()
    if (this.id2 != 0) {
      this.getBillById(this.id2)
    }
  }

  getCustomerById1() {
    if (this.id != 0) {
      const subs: Subscription = this.cs.getCustomerById(this.id).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.customer = res.data[0]
            this.customerPower = res
            this.BillMaster.CustomerID = this.customer.ID
            this.BillMaster.GSTNo = this.customer.GSTNo
            this.BillMaster.PaymentStatus = 'unpaid';
            this.as.successToast(res.message)
          } else {
            this.as.errorToast(res.message)
          }
        },
        error: (err: any) => {
          console.log(err.message);
        },
        complete: () => subs.unsubscribe(),
      })
    }

    if (this.id2 != 0) {
      this.getBillById(this.id2)
    }
  }

  getBillById(id: any) {
    const subs: Subscription = this.bill.getBillById(id).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.BillMaster = res.result.billMaster[0]
          this.gst_detail = this.BillMaster.gst_detail
          this.billItemList = res.result.billDetail
          this.serviceLists = res.result.service
        } else {
          this.as.errorToast(res.message)
        }
      },
      error: (err: any) => {
        console.log(err.message);
      },
      complete: () => subs.unsubscribe(),
    })
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
    this.sp.show();
    const subs: Subscription = this.supps.getList('TaxType').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.gstList = res.data
          this.gst_detail = [];
          res.data.forEach((ele: any) => {
            if (ele.Name !== ' ') {
              let obj = { GSTType: '', Amount: 0 };
              obj.GSTType = ele.Name;
              this.gst_detail.push(obj);
            }
          })
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
    this.sp.hide();
  }

  getGSTListss() {
    const subs: Subscription = this.supps.getList('TaxType').subscribe({
      next: (res: any) => {
        if (res.success) {
          if (this.BillItem.GSTPercentage === 0) {
            this.BillItem.GSTType = 'None'
          } else if (this.BillItem.GSTPercentage !== 0) {
            if (this.BillItem.GSTType !== 'None') {
              this.gstList = res.data
            }
            else {
              Swal.fire({
                icon: 'warning',
                title: 'Please Select GST Type',
                footer: '',
                backdrop: false,
              });
              this.BillItem.Quantity = 0
            }
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
        this.Service.ID = null
        this.Service.CompanyID = element.CompanyID
        this.Service.Name = element.Name
        this.Service.Price = element.Price;
        this.Service.Cost = element.Cost;
        this.Service.Description = element.Description;
        this.Service.GSTPercentage = element.GSTPercentage;
        this.Service.GSTAmount = element.GSTAmount;
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
          this.BillItem.Quantity = 1
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
      } else {
        this.sp.hide();
      }
    });
    this.sp.hide();
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

  displayAddField(i: any) {
    this.specList[i].DisplayAdd = 1;
    this.specList[i].SelectedValue = '';
  }

  saveFieldData(i: any) {
    this.specList[i].DisplayAdd = 0;
    const Ref = this.specList[i].Ref;
    let RefValue = 0;
    if (Ref !== 0) {
      this.specList.forEach((element: any, j: any) => {
        if (element.FieldName === Ref) { RefValue = element.SelectedValue; }
      });
    }
    const subs: Subscription = this.ps.saveProductSupportData(this.specList[i].SptTableName, RefValue, this.specList[i].SelectedValue).subscribe({
      next: (res: any) => {
        const subss: Subscription = this.ps.getProductSupportData(RefValue, this.specList[i].SptTableName).subscribe({
          next: (res: any) => {
            if (res.success) {
              this.specList[i].SptTableData = res.data;
              this.specList[i].SptFilterData = res.data;
            } else {
              this.as.errorToast(res.message)
            }
          },
          error: (err: any) => console.log(err.message),
          complete: () => subss.unsubscribe(),
        });
        if (res.success) {
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Your file has been Save.',
            showConfirmButton: false,
            timer: 1200
          })
        } else {
          this.as.errorToast(res.message)
        }
      },
      error: (err: any) => {
        console.log(err.msg);
      },
      complete: () => subs.unsubscribe(),
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
            console.log(this.searchList);

            if (this.searchList === undefined || this.searchList.Barcode === null || this.searchList.length === 0) {
              Swal.fire({
                icon: 'warning',
                title: 'Please Enter Correct Barcode ',
                text: 'Incorrect Barcode OR Product not available in this Shop.',
                footer: '',
                backdrop: false,
              });
              this.Req = {}
            }

            this.selectedProduct = this.searchList.ProductTypeName;
            this.BillItem.ProductName = this.searchList.ProductName.toUpperCase();
            this.BillItem.Barcode = this.searchList.Barcode;
            this.BillItem.BarCodeCount = this.searchList.BarCodeCount;
            this.BillItem.BaseBarCode = this.searchList.BaseBarCode;
            this.BillItem.Quantity = 0;

            if (this.searchList !== undefined || this.searchList.Barcode !== null && this.searchList.BarCodeCount !== 0) {
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

            this.prodList.forEach((e: any) => {
              if (e.ID === this.searchList.ProductTypeID) {
                this.BillItem.ProductTypeID = e.ID;
                this.BillItem.ProductTypeName = e.Name;
                this.BillItem.HSNCode = e.HSNCode;
                this.BillItem.GSTPercentage = e.GSTPercentage;
                this.BillItem.GSTType = e.GSTType;
              }
            })

            if (this.BillItem.WholeSale === true) {
              this.BillItem.UnitPrice = this.searchList.WholeSalePrice;
            }
            else if (this.BillItem.PreOrder === true) {
              this.BillItem.UnitPrice = this.searchList.RetailPrice;
            }
            else {
              this.BillItem.UnitPrice = this.searchList.RetailPrice;
            }
            this.BillItem.Quantity = 1;
          } else {
            this.as.errorToast(res.message)
          }
          this.sp.hide();
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
    this.sp.hide();

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
    else if (this.BillItem.Option != null) {
      // Lens option
      this.BillItem.Quantity = 1;
      if (this.BillItem.Option === 'Full Glass' || this.BillItem.Quantity !== 1) {
        this.BillItem.Quantity = this.BillItem.Quantity * 2;
      } else {
        this.BillItem.Quantity = 1;
      }
      this.billCalculation.calculations(fieldName, mode, this.BillItem, this.Service)
      this.getGSTList();
      // Lens option
    } else {
      this.billCalculation.calculations(fieldName, mode, this.BillItem, this.Service)
      this.getGSTList();
    }
    this.GstTypeDis = false
  }

  calculateGrandTotal() {
    this.billCalculation.calculateGrandTotal(this.BillMaster, this.billItemList, this.serviceLists)
  }

  notifyGst() {
    if (this.BillItem.GSTPercentage !== 0 && this.BillItem.GSTPercentage !== "0") {
      if (this.BillItem.GSTType === 'None') {
        Swal.fire({
          position: 'center',
          icon: 'warning',
          title: 'Please Select GSTType',
          showConfirmButton: true,
          backdrop: false,
        })
        this.GstTypeDis = true
      }
    }

    if (this.Service.GSTPercentage !== 0 && this.Service.GSTPercentage !== "0") {
      if (this.Service.GSTType === 'None') {
        Swal.fire({
          position: 'center',
          icon: 'warning',
          title: 'Please Select GSTType',
          showConfirmButton: true,
          backdrop: false,
        })
        this.GstTypeDis = true
      }
    }
  }

  AddDiscalculate(fieldName: any, mode: any) {
    this.billCalculation.AddDiscalculate(fieldName, mode, this.BillMaster)
  }

  addProductItem() {
    if (this.BillMaster.ID !== null) {
      this.BillItem.Status = 2;
      this.BillItem.DuaCal = 'yes';

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
      this.calculateGrandTotal()
      this.BillItem = {
        ID: null, ProductName: null, ProductTypeID: null, ProductTypeName: null, HSNCode: null, UnitPrice: 0.00, Quantity: 0, SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: 0, GSTAmount: 0.00, GSTType: 'None', TotalAmount: 0.00, WholeSale: false, Manual: false, PreOrder: false, BarCodeCount: null, Barcode: null, BaseBarCode: null, Status: 1, MeasurementID: null, Family: 'Self', Option: null, SupplierID: null, ProductExpDate: null, Remark: '', Warranty: '',
      };

      this.searchList.BarCodeCount = 0;
      this.selectedProduct = "";
      this.specList = [];
      this.BarcodeList = [];
      this.Req = {};
    }
  }

  addItem() {
    // additem Services
    if (this.category === 'Services') {
      if (this.BillMaster.ID !== null) { this.Service.Status = 2; }

      if (this.Service.GSTPercentage === 0 || this.Service.GSTAmount === 0) {
        this.Service.GSTType = 'None'
        this.GstTypeDis = false
      }
      else if (this.Service.GSTType !== 'None') {
        if (this.Service.GSTPercentage === 0 || this.Service.GSTAmount === 0) {
          this.GstTypeDis = false
        }
      }
      else if (this.Service.GSTType === 'None') {
        if (this.Service.GSTPercentage !== 0 || this.Service.GSTAmount !== 0) {
          this.GstTypeDis = false
        }
      }

      this.serviceLists.push(this.Service);

      this.Service = {
        ID: null, CompanyID: null, ServiceType: null, Name: '', Description: null, cost: 0.00, Price: 0.00, GSTPercentage: 0, GSTAmount: 0.00, GSTType: 'None', TotalAmount: 0.00, Status: 1
      };
    }

    // additem Product
    if (this.category === 'Product') {

        // GSTType disable condition
        if (this.BillItem.GSTPercentage === 0 || this.BillItem.GSTAmount === 0) {
          this.BillItem.GSTType = 'None'
          this.GstTypeDis = false
        }

        else if (this.BillItem.GSTType !== 'None') {
          if (this.BillItem.GSTPercentage === 0) {
            this.GstTypeDis = false
          }
        }

        else if (this.BillItem.GSTType === 'None') {
          if (this.BillItem.GSTPercentage !== 0 || this.BillItem.GSTAmount !== 0) {
            this.GstTypeDis = false
          }
        }
        // GSTType disable condition

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
        // additem Pre order
        if (this.BillItem.Barcode === null || this.BillItem.Barcode === '') {
          if (this.BillItem.PreOrder) {
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
            this.BillItem.Barcode = '0'
            this.BillItem.BaseBarCode = '0'
            

            if (this.BillItem.WholeSale === true) {
              this.BillItem.WholeSalePrice = this.BillItem.UnitPrice
            } else if(this.BillItem.Barcode === 0) {
              this.BillItem.PurchasePrice = this.BillItem.PurchasePrice
            }else{
              this.BillItem.RetailPrice = this.BillItem.UnitPrice
            }
          }
        }

        if(this.BillItem.ProductTypeName  === 'LENS' || this.BillItem.ProductTypeName  === 'LENSES' || this.BillItem.ProductTypeName === 'CONTACT LENS'){
          let type = ''
           if(this.BillItem.ProductTypeName === 'LENS'){
              type = 'Lens'
           }else if(this.BillItem.ProductTypeName === 'CONTACT LENS'){
            type = 'ContactLens'
           }
          const subs: Subscription = this.cs.getMeasurementByCustomer(this.id , type).subscribe({
            next: (res: any) => {
              console.log(res);
              if (res.data.length !== 0) {
                if(res.success ){
                  this.BillItem.MeasurementID = JSON.stringify(res.data) ;
                  this.addProductItem();
                  this.sp.hide()
                }else{
                  this.as.errorToast(res.message)
                  Swal.fire({
                    position: 'center',
                    icon: 'warning',
                    title: 'Opps !!',
                    text: res.message,
                    showConfirmButton: true,
                    backdrop : false,
                  })
                }
              } else {
                this.BillItem.MeasurementID = []
                this.addProductItem();
              }

            },
            error: (err: any) => console.log(err.message),
            complete: () => subs.unsubscribe(),
          });
        }else{
          this.addProductItem();
        }
  }

    // this.BillMaster.Quantity = 0;
    // this.BillMaster.SubTotal = 0;
    // this.BillMaster.DiscountAmount = 0;
    // this.BillMaster.GSTAmount = 0;
    // this.BillMaster.TotalAmount = 0;
    // this.cgst = 0;
    // this.sgst = 0;
    // this.calculateGrandTotal()
  }

  onSubmit(content1: any) {
    this.sp.show()
    this.BillMaster.ShopID = this.loginShopID
    this.BillMaster.CustomerID = this.customerID2
    this.data.billMaseterData = this.BillMaster;
    this.data.billDetailData = this.billItemList;
    this.data.service = this.serviceLists;
    console.log(this.data);
    const subs: Subscription = this.bill.saveBill(this.data).subscribe({
      next: (res: any) => {
        console.log(res);
        if (res.success) {
          this.BillMaster.ID = res.data.ID;
          this.id2 = res.data.ID;
          this.id = res.data.CustomerID;
          if (this.id2 !== 0) {
            this.getBillById(this.id2)
            this.billByCustomer()
          }
          this.router.navigate(['/sale/billing', this.id, this.id2]);
          // Swal.fire({
          //   position: 'center',
          //   icon: 'success',
          //   title: 'Your file has been save.',
          //   showConfirmButton: false,
          //   timer: 1000
          // })
          this.as.successToast(res.message)
          this.sp.hide()
          this. openModal1(content1)
        } else {
          this.as.errorToast(res.message)
        }

      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
    this.sp.hide()
  }

  update() {
    this.sp.show()
    this.BillMaster.ShopID = this.loginShopID
    this.BillMaster.CustomerID = this.customerID2
    this.data.billMaseterData = this.BillMaster;
    let items: any = [];
    this.billItemList.forEach((ele: any) => {
      if (ele.ID === null || ele.Status == 2) {
        ele.UpdatedBy = this.user.ID;
        items.push(ele);
      }
    })
    this.data.billDetailData = items;
    this.data.service = this.serviceLists;
    console.log(this.data);
    const subs: Subscription = this.bill.updateBill(this.data).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.id2 = res.data.ID;
          this.getCustomerById1();
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Your file has been update.',
            showConfirmButton: false,
            timer: 1000
          })
          this.sp.hide()
        } else {
          this.as.errorToast(res.message)
        }
        console.log(res);
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
    this.sp.hide()
  }

  deleteItem(category: any, i: any) {
    if (category === "Product" ) {
      if (this.billItemList[i].ID === null) {
        this.billItemList[i].DuaCal = 'delete';
        this.calculateGrandTotal();
        this.billItemList.splice(i, 1);
        this.calculateGrandTotal();

      }  else {
        Swal.fire({
          title: 'Are you sure?',
          text: "You won't be able to revert this!",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Yes, delete it!',
          backdrop: false,
        }).then((result) => {
          if (result.isConfirmed) {
            // this.sp.show();
            this.billItemList[i].Status = 0;
            this.data.billMaseterData = this.BillMaster;
            this.data.billDetailData = this.billItemList[i];
            delete this.data.service
            const subs: Subscription = this.bill.deleteProduct(this.data).subscribe({
              next: (res: any) => {
                if (res.success) {
                  this.getBillById(res.data[0].BillMasterID)
                  this.sp.hide()
                } else {
                  this.as.errorToast(res.message)
                }
              },
              error: (err: any) => console.log(err.message),
              complete: () => subs.unsubscribe(),
            });
          }
        })
      }
    }

    else if (category === "Service") {
      if (this.serviceLists[i].ID === null) {
        this.serviceLists.splice(i, 1);
        this.calculateGrandTotal();
      } else {
        Swal.fire({
          title: 'Are you sure?',
          text: "You won't be able to revert this!",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Yes, delete it!',
          backdrop: false,
        }).then((result) => {
          if (result.isConfirmed) {
            // this.sp.show();
            this.serviceLists[i].Status = 0;
            this.data.service = this.serviceLists[i];
            this.data.billMaseterData = this.BillMaster;
            delete this.data.billDetailData
            const subs: Subscription = this.bill.deleteProduct(this.data).subscribe({
              next: (res: any) => {
                if (res.success) {
                  this.getBillById(res.data[0].BillMasterID)
                  this.sp.hide()
                } else {
                  this.as.errorToast(res.message)
                }
              },
              error: (err: any) => console.log(err.message),
              complete: () => subs.unsubscribe(),
            });
          }
        })


      }
    }

  }

  // update power 
  openModal(content: any, data:any){
    this.sp.show()
    this.modalService.open(content, { centered: true , backdrop : 'static', keyboard: false,size: 'md'});
    this.PowerByRow = []
    this.customerPowerLists = []
    if(data.MeasurementID !== ''){
      this.PowerByRow = JSON.parse(data.MeasurementID)
    }
    this.ProductDetails =  data.ProductTypeName + '/' + data.ProductName
    this.UpdatePowerID = data
    let type = '';
    if(data.ProductTypeName === "LENS" || data.ProductTypeName === "LENSES"){
       type = 'Lens'
    }else{
      type = 'ContactLens'
    }

    const subs: Subscription = this.cs.getMeasurementByCustomerForDropDown(this.id , type).subscribe({
      next: (res: any) => {
          if(res.success ){
             this.customerVisiList = res.data
          }else{
            this.as.errorToast(res.message)
            Swal.fire({
              position: 'center',
              icon: 'warning',
              title: 'Opps !!',
              text: res.message,
              showConfirmButton: true,
              backdrop : false,
            })
          }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
    this.sp.hide()
  }

  customerPowerDropdown(){
      let VisitNumber =   this.customerVisiList
      this.customerPowerLists = VisitNumber.filter((s:any) => s.VisitNo === this.PowerSelect);
      console.log(this.customerPowerLists);
  }

  updatePower(){
    this.sp.show()
   let ID = this.UpdatePowerID.ID
   let MeasurementID = JSON.stringify(this.customerPowerLists)
    const subs: Subscription = this.bill.updatePower(ID , MeasurementID).subscribe({
      next: (res: any) => {
          if(res.success ){
            this.getBillById(this.id2)
            Swal.fire({
              position: 'center',
              icon: 'success',
              title: 'Your Customer Power has been update.',
              showConfirmButton: false,
              timer: 1000
            })
          }else{
            this.as.errorToast(res.message)
            Swal.fire({
              position: 'center',
              icon: 'warning',
              title: 'Opps !!',
              text: res.message,
              showConfirmButton: true,
              backdrop : false,
            })
          }
          this.modalService.dismissAll()
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
    this.sp.hide()

  }

  // update payment 

  openModal1(content1: any){
    this.sp.show()
    this.modalService.open(content1, { centered: true , backdrop : 'static', keyboard: false,size: 'md'});
    this.billByCustomer()
    this.paymentHistoryByMasterID()
    this.sp.hide()
  }

  billByCustomer(){
    this.sp.show()
    let CustomerID = Number(this.id)
    const subs: Subscription = this.bill.billByCustomer(CustomerID).subscribe({
      next: (res: any) => {
        console.log(res);

          if(res.success ){
             this.invoiceList = res.data
          }else{
            this.as.errorToast(res.message)
            Swal.fire({
              position: 'center',
              icon: 'warning',
              title: 'Opps !!',
              text: res.message,
              showConfirmButton: true,
              backdrop : false,
            })
          }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
    this.sp.hide()
  }

  paymentHistoryByMasterID(){
    this.sp.show()
    let CustomerID = Number(this.id)
    let BillMasterID = Number(this.id2)
    const subs: Subscription = this.bill.paymentHistoryByMasterID(CustomerID,BillMasterID).subscribe({
      next: (res: any) => {
        console.log(res);

          if(res.success ){
             this.paidList = res.data
          }else{
            this.as.errorToast(res.message)
            Swal.fire({
              position: 'center',
              icon: 'warning',
              title: 'Opps !!',
              text: res.message,
              showConfirmButton: true,
              backdrop : false,
            })
          }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
    this.sp.hide()
  }


  // order supplier 
  openModal12(content12: any){
    this.sp.show()
    this.modalService.open(content12, { centered: true , backdrop : 'static', keyboard: false,size: 'md'});
    const subs: Subscription = this.bill.getSupplierPo(this.id2,'' ).subscribe({
      next: (res: any) => {
          if(res.success ){
             this.orderList = res.data
          }else{
            this.as.errorToast(res.message)
            Swal.fire({
              position: 'center',
              icon: 'warning',
              title: 'Opps !!',
              text: res.message,
              showConfirmButton: true,
              backdrop : false,
            })
          }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
    this.dropdownSupplierlist()
    this.sp.hide()
  }

  validate(v: { Sel: number | null; }, event: any) {
    if (v.Sel === 0 || v.Sel === null) {
        v.Sel = 1;
    } else {
        v.Sel = 0;
    }
  }

  multicheck() {
    for (var i = 0; i < this.orderList.length; i++) {
      const index = this.orderList.findIndex(((x: any) => x === this.orderList[i]));
      if (this.orderList[index].Sel == null || this.orderList[index].Sel === 0) {
        this.orderList[index].Sel = 1;
      } else {
        this.orderList[index].Sel = 0;
      }
    }
  }

  dropdownSupplierlist(){
    const subs: Subscription = this.sup.dropdownSupplierlist('').subscribe({
      next: (res: any) => {
        this.supplierList  = res.data
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  assignSupplierPo(){
    this.sp.show()
    this.filtersList = this.orderList.filter((d: { Sel: number; }) => d.Sel === 1);
    if (this.filtersList.length > 0) {
    this.filtersList.forEach((element: any) => {
      element.BillID = this.data.ID
      element.SupplierID = this.data.SupplierID;
    });

    let Body = this.filtersList
    const subs: Subscription =  this.bill.assignSupplierPo(Body).subscribe({
      next: (res: any) => {
        if(res.success){
          this.assignSupplierDoc()
          this.data.SupplierID = ''
          this.modalService.dismissAll()
          // this.getList()
          this.as.successToast(res.message)
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
    }else{
      Swal.fire({
        position: 'center',
        icon: 'warning',
        title: 'Opps !! <br> Select the check box !!',
        showConfirmButton: true,
        backdrop : false,
      })
    }
    this.sp.hide()
  }

 

  assignSupplierDoc() {
    this.sp.show()
    this.filtersList = this.orderList.filter((d: { Sel: number; }) => d.Sel === 1);
          this.filtersList.forEach((element: any) => {
            this.data.ID = element.BillID 
            this.data.SupplierID =  element.SupplierID 
            element.Sel = element.Sel;
            if(element.SupplierDocNo === '' || element.SupplierDocNo === null || element.SupplierDocNo === undefined){
              element.SupplierDocNo = 'NA'
            }else{
              element.SupplierDocNo = element.SupplierDocNo;
            }
          });
      let Body = this.filtersList;

      const subs: Subscription = this.bill.assignSupplierDoc(Body).subscribe({
        next: (res: any) => {
          if (res.success) {
            // this.as.successToast(res.message)
          } else {
            this.as.errorToast(res.message)
          }
          this.sp.hide()
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    this.sp.hide()
  }

  // fitter order
  dropdownfitterlist() {
    const subs: Subscription = this.fitters.dropdownlist().subscribe({
      next: (res: any) => {
        this.fitterList = res.data
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getRateCard() {
    let FitterID = this.data.FitterID
    const subs: Subscription = this.fitters.getRateCard(FitterID).subscribe({
      next: (res: any) => {
        this.rateCardList = res.data
        if(this.rateCardList.length === 0){
          this.data.FitterID = ''
          Swal.fire({
            icon: 'error',
            title: 'Can not Assign Fitter as Selected Fitter Does not have Rates Available for LensType !!!',
            footer: '',
            backdrop: false,
            showCancelButton: true,
          });
        }
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getLensTypeList() {
    this.sp.show();
    const subs: Subscription = this.supps.getList('LensType').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.lensList = res.data
          this.orderList.forEach((element: any) => {
            if(element.ProductTypeName === 'LENS'){
              element.LensType = '';
            }else{
              element.LensType = 'NO';
            }
          });
          console.log(this.orderList);
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
    this.sp.hide();
  }

  openModal13(content12: any){
    this.dropdownfitterlist()
    this.getLensTypeList()
    this.sp.show()
    this.modalService.open(content12, { centered: true , backdrop : 'static', keyboard: false,size: 'md'});
    const subs: Subscription = this.bill.getFitterPo(this.id2,'' ).subscribe({
      next: (res: any) => {
          if(res.success ){
             this.orderList = res.data
          }else{
            this.as.errorToast(res.message)
            Swal.fire({
              position: 'center',
              icon: 'warning',
              title: 'Opps !!',
              text: res.message,
              showConfirmButton: true,
              backdrop : false,
            })
          }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
    this.dropdownSupplierlist()
    this.sp.hide()
  }

  assignFitterPo(){
    let missingType = '';
    this.sp.show()
    this.filtersList = this.orderList.filter((d: { Sel: number; }) => d.Sel === 1);
    if (this.filtersList.length > 0) {
    this.filtersList.forEach((element: any) => {
      element.BillID = this.data.ID
      element.FitterID = this.data.FitterID;
      element.FitterStatus = "assign fitter"
      element.Remark = element.Remark ? element.Remark : ''

      const i = this.rateCardList.findIndex((ele: any, i: any) => {
        return ele.LensType === element.LensType
      })
      if (i === -1) {
        missingType = missingType + element.LensType + " ";
      }
      else {
        element.FitterCost = this.rateCardList[i].Rate;
      }

    });

    let Body = this.filtersList
    const subs: Subscription =  this.bill.assignFitterPo(Body).subscribe({
      next: (res: any) => {
        if(res.success){
          this.assignFitterDoc()
          this.data.FitterID = ''
          this.modalService.dismissAll()
          // this.getList()
          this.as.successToast(res.message)
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
    }else{
      Swal.fire({
        position: 'center',
        icon: 'warning',
        title: 'Opps !! <br> Select the check box !!',
        showConfirmButton: true,
        backdrop : false,
      })
    }
    this.sp.hide()
  }

  assignFitterDoc() {
    this.sp.show()
    this.filtersList = this.orderList.filter((d: { Sel: number; }) => d.Sel === 1);
          this.filtersList.forEach((element: any) => {
            this.data.ID = element.BillID 
            this.data.FitterID =  element.FitterID 
            element.Sel = element.Sel;
            if(element.FitterDocNo === '' || element.FitterDocNo === null || element.FitterDocNo === undefined){
              element.FitterDocNo = 'NA'
            }else{
              element.FitterDocNo = element.FitterDocNo;
            }
          });
      let Body = this.filtersList;

      const subs: Subscription = this.bill.assignFitterDoc(Body).subscribe({
        next: (res: any) => {
          if (res.success) {
            // this.as.successToast(res.message)
          } else {
            this.as.errorToast(res.message)
          }
          this.sp.hide()
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    this.sp.hide()
  }

}
