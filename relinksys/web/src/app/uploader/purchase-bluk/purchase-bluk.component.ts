
import { UploaderService } from 'src/app/service/uploader.service';
import { HttpEventType } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SupplierService } from 'src/app/service/supplier.service';
import { ExcelService } from 'src/app/service/helpers/excel.service';
import { ProductService } from 'src/app/service/product.service';


@Component({
  selector: 'app-purchase-bluk',
  templateUrl: './purchase-bluk.component.html',
  styleUrls: ['./purchase-bluk.component.css']
})

export class PurchaseBlukComponent implements OnInit {

  selectedShop: any = JSON.parse(localStorage.getItem('selectedShop') || '');
    company = JSON.parse(localStorage.getItem('company') || '');
  env: any;
  purchaseUpload: any;
  currentPage = 1;
  itemsPerPage = 10;
  pageSize!: number;
  collectionSize = 0;
  page = 4;
  dataList: any;
  id: any;
  supplierList: any;
  tempProcessFile: any;

  purchaseUpload1: any;
  currentPage1 = 1;
  itemsPerPage1 = 10;
  pageSize1!: number;
  collectionSize1 = 0;
  page1 = 4;
  dataList1: any;
  id1: any;
  supplierList1: any;
  tempProcessFile1: any;

  selectedProduct: any;
  prodList: any;
  specList: any;
  searchValue: any;
  ProductCategory: any;

  constructor(
    private uploader: UploaderService,
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    public as: AlertService,
    private sp: NgxSpinnerService,
    private modalService: NgbModal,
    private ss: SupplierService,
    private excelService: ExcelService,
    private ps: ProductService,

  ) {
    this.env = environment
  }

  selectedPurchaseMaster: any = {
    ID: null, SupplierID: null, SupplierName: null, CompanyID: null, GSTNo: null, ShopID: null, ShopName: null, PurchaseDate: null,
    PaymentStatus: null, InvoiceNo: null, Status: 1, CreatedBy: null, Quantity: 0, SubTotal: 0, DiscountAmount: 0,
    GSTAmount: 0, TotalAmount: 0, RoundOff: 0, preOrder: false,
  };
  selectedPurchaseMaster1: any = {
    ID: null, SupplierID: null, SupplierName: null, CompanyID: null, GSTNo: null, ShopID: null, ShopName: null, PurchaseDate: null,
    PaymentStatus: null, InvoiceNo: null, Status: 1, CreatedBy: null, Quantity: 0, SubTotal: 0, DiscountAmount: 0,
    GSTAmount: 0, TotalAmount: 0, RoundOff: 0, preOrder: false,
  };

  josnData = [
    {
      'ProductName': '',
      'ProductTypeName': '',
      'UnitPrice': '',
      'Quantity': '',
      'DiscountPercentage': '',
      'GSTPercentage': '',
      'GSTType': 'IGST',
      'RetailPrice': '',
      'WholeSalePrice': '',
      'WholeSale': '',
      'BrandType': '',
      'BarcodeExist': '',
      'BaseBarCode': '',
      'ProductExpDate': '"YYYY-MM-DD"',
    },
    {
      'ProductName': '',
      'ProductTypeName': '',
      'UnitPrice': '',
      'Quantity': '',
      'DiscountPercentage': '',
      'GSTPercentage': '',
      'GSTType': 'CGST-SGST',
      'RetailPrice': '',
      'WholeSalePrice': '',
      'WholeSale': '',
      'BrandType': '',
      'BarcodeExist': '',
      'BaseBarCode': '',
      'ProductExpDate': '"0000-00-00"',
    },
    {
      'ProductName': '',
      'ProductTypeName': '',
      'UnitPrice': '',
      'Quantity': '',
      'DiscountPercentage': '',
      'GSTPercentage': '',
      'GSTType': 'None',
      'RetailPrice': '',
      'WholeSalePrice': '',
      'WholeSale': '',
      'BrandType': '',
      'BarcodeExist': '',
      'BaseBarCode': '',
      'ProductExpDate': '"0000-00-00"',
    }
  ]
  josnData1 = [
    {
      'ProductName': '',
      'ProductTypeName': '',
      'UnitPrice': '',
      'Quantity': '',
      'DiscountPercentage': '',
      'GSTPercentage': '',
      'GSTType': 'IGST',
      'RetailPrice': '',
      'WholeSalePrice': '',
      'WholeSale': '',
      'BrandType': '',
      'BarcodeExist': '',
      'BaseBarCode': '',
      'ProductExpDate': '"YYYY-MM-DD"',
    },
    {
      'ProductName': '',
      'ProductTypeName': '',
      'UnitPrice': '',
      'Quantity': '',
      'DiscountPercentage': '',
      'GSTPercentage': '',
      'GSTType': 'CGST-SGST',
      'RetailPrice': '',
      'WholeSalePrice': '',
      'WholeSale': '',
      'BrandType': '',
      'BarcodeExist': '',
      'BaseBarCode': '',
      'ProductExpDate': '"0000-00-00"',
    },
    {
      'ProductName': '',
      'ProductTypeName': '',
      'UnitPrice': '',
      'Quantity': '',
      'DiscountPercentage': '',
      'GSTPercentage': '',
      'GSTType': 'None',
      'RetailPrice': '',
      'WholeSalePrice': '',
      'WholeSale': '',
      'BrandType': '',
      'BarcodeExist': '',
      'BaseBarCode': '',
      'ProductExpDate': '"0000-00-00"',
    }
  ]

  selectedProductType: string = ''; // example
  productDummyConfig: any = {
    FRAME: [
      {
        TYPE: 'FULL FRAME',
        BRAND: 'FASTRACK',
        'MODEL NO': '001',
        ProductTypeName: 'FRAME',
        UnitPrice: 1200,
        Quantity: 1,
        DiscountPercentage: 0,
        GSTPercentage: 0,
        GSTType: 'None',
        RetailPrice: 1500,
        WholeSalePrice: 1000,
        WholeSale: '',
        BrandType: 0,
        BarcodeExist: '',
        BaseBarCode: ''
      },
      {
        TYPE: 'SUPRA',
        BRAND: 'RAYBAN',
        'MODEL NO': '002',
        ProductTypeName: 'FRAME',
        UnitPrice: 1800,
        Quantity: 1,
        DiscountPercentage: 0,
        GSTPercentage: 18,
        GSTType: 'IGST',
        RetailPrice: 2200,
        WholeSalePrice: 1600,
        WholeSale: '',
        BrandType: 0,
        BarcodeExist: '',
        BaseBarCode: ''
      },
      {
        TYPE: 'RIMLESS',
        BRAND: 'TITAN',
        'MODEL NO': '003',
        ProductTypeName: 'FRAME',
        UnitPrice: 2500,
        Quantity: 1,
        DiscountPercentage: 0,
        GSTPercentage: 18,
        GSTType: 'CGST-SGST',
        RetailPrice: 3000,
        WholeSalePrice: 2200,
        WholeSale: '',
         BrandType: 0,
        BarcodeExist: '',
        BaseBarCode: ''
      }
    ],
    'CONTACT LENS': [
      {
        COMPANY: 'BAUSCH AND LOMB',
        TYPE: '2 WEEKS',
        BRAND: 'BIO TRUE',
        EXPIRY: '0000-00-00',
        ProductTypeName: 'CONTACT LENS',
        UnitPrice: 500,
        Quantity: 2,
        DiscountPercentage: 0,
        GSTPercentage: 12,
        GSTType: 'None',
        RetailPrice: 650,
        WholeSalePrice: 450,
        WholeSale: '',
        BrandType: 0,
        BarcodeExist: '',
        BaseBarCode: ''
      },
      {
        COMPANY: 'ALCON',
        TYPE: 'DAILY',
        BRAND: 'AIR OPTIX',
        EXPIRY: '2026-01-31',
        ProductTypeName: 'CONTACT LENS',
        UnitPrice: 800,
        Quantity: 1,
        DiscountPercentage: 0,
        GSTPercentage: 12,
        GSTType: 'IGST',
        RetailPrice: 1000,
        WholeSalePrice: 700,
         WholeSale: '',
         BrandType: 0,
        BarcodeExist: '',
        BaseBarCode: ''
      },
      {
        COMPANY: 'CELEBRATION',
        TYPE: 'HALF YEARLY',
        BRAND: 'COLOUR LENS',
        EXPIRY: '2026-01-19',
        ProductTypeName: 'CONTACT LENS',
        UnitPrice: 800,
        Quantity: 1,
        DiscountPercentage: 0,
        GSTPercentage: 12,
        GSTType: 'CGST-SGST',
        RetailPrice: 1000,
        WholeSalePrice: 700,
         WholeSale: '',
        BrandType: 0,
        BarcodeExist: '',
        BaseBarCode: ''
      }
    ],
    SUNGLASS: [
      {
        BRAND: 'FASTRACK',
        'MODEL NO': 'SG-00',
        ProductTypeName: 'SUNGLASS',
        UnitPrice: 1500,
        Quantity: 1,
        DiscountPercentage: 0,
        GSTPercentage: 18,
        GSTType: 'None',
        RetailPrice: 2000,
        WholeSalePrice: 1300,
         WholeSale: '',
    BrandType: 0,
        BarcodeExist: '',
        BaseBarCode: ''
      },
      {
        BRAND: 'RAYBAN',
        'MODEL NO': 'SG-01',
        ProductTypeName: 'SUNGLASS',
        UnitPrice: 1500,
        Quantity: 1,
        DiscountPercentage: 0,
        GSTPercentage: 18,
        GSTType: 'IGST',
        RetailPrice: 2000,
        WholeSalePrice: 1300,
         WholeSale: '',
        BrandType: 0,
        BarcodeExist: '',
        BaseBarCode: ''
      },
      {
        BRAND: 'OAKLEY',
        'MODEL NO': 'SG-02',
        ProductTypeName: 'SUNGLASS',
        UnitPrice: 2800,
        Quantity: 1,
        DiscountPercentage: 0,
        GSTPercentage: 18,
        GSTType: 'CGST-SGST',
        RetailPrice: 3500,
        WholeSalePrice: 2400,
         WholeSale: '',
   BrandType: 0,
        BarcodeExist: '',
        BaseBarCode: ''
      }
    ],
    SOLUTION: [
      {
        COMPANY: 'ALCON',
        BRAND: 'OPTIFREE',
        ML: '120 ML',
        EXPIRY:  `${'2026-12-20'}`,
        ProductTypeName: 'SOLUTION',
        UnitPrice: 200,
        Quantity: 1,
        DiscountPercentage: 0,
        GSTPercentage: 5,
        GSTType: 'IGST',
        RetailPrice: 250,
        WholeSalePrice: 170,
         WholeSale: '',
        BrandType: 0,
        BarcodeExist: '',
        BaseBarCode: ''
      },
      {
        COMPANY: 'AQUA SOFT',
        BRAND: 'COMBO',
        ML: '120 ML',
        EXPIRY: `${'2026-12-27'}`,
        ProductTypeName: 'SOLUTION',
        UnitPrice: 350,
        Quantity: 1,
        DiscountPercentage: 0,
        GSTPercentage: 5,
        GSTType: 'CGST-SGST',
        RetailPrice: 450,
        WholeSalePrice: 300,
         WholeSale: '',
     BrandType: 0,
        BarcodeExist: '',
        BaseBarCode: ''
      }
    ]
  };


  ngOnInit(): void {
    this.getList();
    this.getList1();
    this.getdropdownSupplierlist();
    this.dropdownlistForPreOrder();
  }

  openModalExcel(content: any) {
    this.modalService.open(content, { centered: true, backdrop: 'static', keyboard: false, size: 'md' });
    this.getProductList()
  }

  getProductList() {
    this.sp.show();
    const subs: Subscription = this.ps.getList().subscribe({
      next: (res: any) => {
        if (res.success) {
             this.prodList = res.data.filter((el: any) => {
            return el.Name.toUpperCase() != 'LENS' && el.Name.toUpperCase() != 'LENS.' && el.Name.toUpperCase() != 'LENS N';
          });
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getFieldList(ID: any) {
    this.ProductCategory = ID
    if (this.ProductCategory !== 0) {
      this.prodList.forEach((element: any) => {
        if (element.ID === this.ProductCategory) {
          this.selectedProduct = element.Name;
        }
      })
      const subs: Subscription = this.ps.getFieldList(this.selectedProduct).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.specList = res.data;
            this.selectedProductType = this.selectedProduct
            this.generateExcel()
            this.getSptTableData();
            this.modalService.dismissAll();
          } else {
            this.as.errorToast(res.message)
          }
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    } else {
      this.specList = [];
      this.ProductCategory = 0;
    }
  }

  // getSptTableData() {
  //   this.specList.forEach((element: any) => {
  //     if (element.FieldType === 'DropDown' && element.Ref === '0') {
  //       const subs: Subscription = this.ps.getProductSupportData('0', element.SptTableName).subscribe({
  //         next: (res: any) => {
  //           if (res.success) {
  //             element.SptTableData = res.data.sort((a: { TableValue: string; }, b: { TableValue: any; }) => (a.TableValue.trim()).localeCompare(b.TableValue));
  //             element.SptFilterData = res.data.sort((a: { TableValue: string; }, b: { TableValue: any; }) => (a.TableValue.trim()).localeCompare(b.TableValue));
  //             if (element.SptFilterData.FieldName === 'TYPE') {
  //               element.SptFilterData =  element.SptFilterData.filter(
  //                 (item: any) => item.TableValue === 'PROGRESSIVE'
  //               );
  //             }
  //           } else {
  //             this.as.errorToast(res.message)
  //           }
  //         },
  //         error: (err: any) => console.log(err.message),
  //         complete: () => subs.unsubscribe(),
  //       });
  //     }
  //   });
  // }

  getSptTableData() {
    this.specList.forEach((element: any) => {
      if (element.FieldType === 'DropDown' && element.Ref === '0') {
        const subs: Subscription = this.ps.getProductSupportData('0', element.SptTableName).subscribe({
          next: (res: any) => {
            if (res.success) {
              // Sort the data
              element.SptTableData = res.data.sort((a: { TableValue: string }, b: { TableValue: any }) =>
                a.TableValue.trim().localeCompare(b.TableValue.trim())
              );

              // Copy sorted data to SptFilterData
              element.SptFilterData = [...res.data];

              // Apply filter if FieldName is 'TYPE'

            } else {
              this.as.errorToast(res.message);
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

  filter() {
    let productName = '';
    this.specList.forEach((element: any) => {
      if (productName === '') {
        productName = element.ProductName + '/' + element.SelectedValue;
      } else if (element.SelectedValue !== '') {
        productName += '/' + element.SelectedValue;
      }
    });

  }

  getdropdownSupplierlist() {
    const subs: Subscription = this.ss.dropdownSupplierlist('').subscribe({
      next: (res: any) => {
        this.supplierList = res.data;
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }
  dropdownlistForPreOrder() {
    const subs: Subscription = this.ss.dropdownlistForPreOrder('').subscribe({
      next: (res: any) => {
        this.supplierList1 = res.data;
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  submit(frm: NgForm) {
    console.log(frm, 'sun');
    if (frm.valid) {
      const elem: any = document.getElementById("uploadButton");
      this.uploader.uploadPurchase(this.purchaseUpload).subscribe((resp: any) => {
        if (resp.type == HttpEventType.UploadProgress) {
          let uploadProgress = 0;
          uploadProgress = Math.round((resp.loaded / resp.total) * 100);
          elem.innerText = `uploaded : ${uploadProgress} % `;
        } else if (resp.type == HttpEventType.Response) {
          const body: any = resp.body;
          const fs = body.file

          const fileData = {
            "fieldname": fs.fieldname,
            "original_name": fs.originalname,
            "download": body.download,
            "encoding": fs.encoding,
            "mimetype": fs.mimetype,
            "location": fs.destination,
            "fileType": 'purchase',
            "file_name": fs.filename,
            "path": fs.path.replaceAll("\\", "/"),
            "size": fs.size
          }
          this.createFileRecord(fileData);
          frm.reset();
        }
      });
    } else {
      this.as.warningToast("Please fill all the fields properly!");
    }
  }

  createFileRecord(frm: any) {
    const dtm = {
      "ID": null,
      "originalname": frm.original_name,
      "fileName": frm.file_name,
      "download": frm.download,
      "path": frm.path,
      "destination": frm.location,
      "Type": "Purchase"
    }
    this.uploader.saveFileRecord(dtm).subscribe((resp: any) => {
      if (resp.success) {
        this.as.successToast("File Added!");
        this.getList();
      } else {
        this.as.warningToast(resp.message);
      }
    });
  }

  changePagesize(num: number): void {
    this.itemsPerPage = this.pageSize + num;
  }

  getList() {
    this.sp.show()
    const dtm = {
      currentPage: this.currentPage,
      itemsPerPage: this.itemsPerPage,
      Type: "Purchase"
    }
    const subs: Subscription = this.uploader.getList(dtm).subscribe({
      next: (res: any) => {
        this.collectionSize = res.count;
        this.dataList = res.data;
        this.sp.hide();
        this.as.successToast(res.message)
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  selectFile(e: any) {
    if (e.target.files.length) {
      this.purchaseUpload = e.target.files[0];
      const elem: any = document.getElementById("uploadButton");
      elem.innerText = 'name : ' + this.purchaseUpload.name;
    } else {
      this.purchaseUpload = null;
    }
  }

  deleteItem(data: any, i: any) {
    if (data.Process === 1) {
      Swal.fire({
        position: 'center',
        icon: 'error',
        title: 'You Can Not Delete This File, You Have Already Processed',
        showConfirmButton: true,
        backdrop: false,
      })
      return this.as.errorToast("You Can Not Delete This File, You Have Already Processed")
    }
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      backdrop: false,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        const subs: Subscription = this.uploader.deleteFileRecord(data.ID).subscribe({
          next: (res: any) => {
            this.dataList.splice(i, 1);
            this.as.successToast(res.message)
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

  openModal(content: any, data: any) {
    this.tempProcessFile = data;
    this.modalService.open(content, { centered: true, backdrop: 'static', keyboard: false, size: 'md' });
  }

  processFile() {
    if (this.tempProcessFile.Process === 1) {
      return this.as.errorToast("You  Can Not Delete This File, You Have Already Processed")
    }
    const ID = this.tempProcessFile.ID
    const dtm = {
      filename: this.tempProcessFile.fileName,
      originalname: this.tempProcessFile.originalname,
      path: this.tempProcessFile.path,
      destination: this.tempProcessFile.destination,
      PurchaseMaster: {
        ID: null,
        SupplierID: this.selectedPurchaseMaster.SupplierID,
        PurchaseDate: this.selectedPurchaseMaster.PurchaseDate,
        InvoiceNo: this.selectedPurchaseMaster.InvoiceNo,
        ShopID: Number(this.selectedShop[0]),
      },
    }
    this.sp.show();
    const subs: Subscription = this.uploader.processPurchaseFile(dtm).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.sp.show();
          if (res.data !== 0) {
            this.id = res.data;
          }
          this.updateFileRecord(ID)
        } else {
          this.as.errorToast(res.message)
          Swal.fire({
            position: 'center',
            icon: 'error',
            title: res.message,
            showConfirmButton: true,
            backdrop: false,
          })

        }
        this.sp.hide();
      },
      error: (err: any) => {
        console.log(err.msg);
      },
      complete: () => subs.unsubscribe(),
    });
  }

  updateFileRecord(ID: any) {
    const dtm = {
      "ID": ID,
      "key": "Process",
      "value": 1,
      "Type": "Purchase"
    }
    const subs: Subscription = this.uploader.updateFileRecord(dtm).subscribe({
      next: (res: any) => {
        console.log(res);
        // return
        if (res.success) {
          this.modalService.dismissAll();
          //  this.router.navigate(['/inventory/purchaseList'])
          this.router.navigate(['/inventory/purchase', this.id])

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

  // generateExcel(): void {
  //   this.excelService.exportAsExcelFile(this.josnData, 'Purchase_Upload');
  // }

 generateExcel(): void {

  const rows: any[] = [];

  const dummyList = this.productDummyConfig[this.selectedProductType] || [{}];

  const isWholesaleOn = this.company?.WholeSale === 'true' 

  dummyList.forEach((dummy: any) => {

    const excelRow: any = {};
 
    // 1️⃣ Dynamic columns (specList)
    this.specList.forEach((spec: any) => {
      if (spec.FieldName && !excelRow.hasOwnProperty(spec.FieldName)) {
        excelRow[spec.FieldName] = dummy[spec.FieldName] ?? '';
      }
    });

    // 2️⃣ Fixed common columns
    excelRow['ProductTypeName'] = dummy.ProductTypeName ?? this.selectedProductType;
    excelRow['UnitPrice'] = dummy.UnitPrice ?? '';
    excelRow['Quantity'] = dummy.Quantity ?? '';
    excelRow['DiscountPercentage'] = dummy.DiscountPercentage ?? '';
    excelRow['GSTPercentage'] = dummy.GSTPercentage ?? '';
    excelRow['GSTType'] = dummy.GSTType ?? '';
    excelRow['RetailPrice'] = dummy.RetailPrice ?? '';

    // 🔥 Wholesale columns — ONLY when enabled
    if (isWholesaleOn) {
      excelRow['WholeSalePrice'] = dummy.WholeSalePrice ?? '';
      excelRow['WholeSale'] = dummy.WholeSale ?? '';
    }

    excelRow['BrandType'] = dummy.BrandType ?? '';
    excelRow['BarcodeExist'] = dummy.BarcodeExist ?? '';
    excelRow['BaseBarCode'] = dummy.BaseBarCode ?? '';

    rows.push(excelRow);
  });

  // 3️⃣ Export
  this.josnData = rows;
  this.excelService.exportAsExcelFile(this.josnData, 'Purchase_Upload');
}





  // pricelist code
  submit1(frm: NgForm) {
    console.log(frm, 'sun');
    if (frm.valid) {
      const elem: any = document.getElementById("uploadButton1");
      this.uploader.pricelistupload(this.purchaseUpload1).subscribe((resp: any) => {
        if (resp.type == HttpEventType.UploadProgress) {
          let uploadProgress = 0;
          uploadProgress = Math.round((resp.loaded / resp.total) * 100);
          elem.innerText = `uploaded : ${uploadProgress} % `;
        } else if (resp.type == HttpEventType.Response) {
          const body: any = resp.body;
          const fs = body.file

          const fileData = {
            "fieldname": fs.fieldname,
            "original_name": fs.originalname,
            "download": body.download,
            "encoding": fs.encoding,
            "mimetype": fs.mimetype,
            "location": fs.destination,
            "fileType": 'pricelist',
            "file_name": fs.filename,
            "path": fs.path.replaceAll("\\", "/"),
            "size": fs.size
          }
          this.createFileRecord1(fileData);
          frm.reset();
        }
      });
    } else {
      this.as.warningToast("Please fill all the fields properly!");
    }
  }

  generateExcel1(): void {
    this.excelService.exportAsExcelFile(this.josnData1, 'PriceList_Upload');
  }

  changePagesize1(num: number): void {
    this.itemsPerPage1 = this.pageSize1 + num;
  }

  selectFile1(e: any) {
    if (e.target.files.length) {
      this.purchaseUpload1 = e.target.files[0];
      const elem: any = document.getElementById("uploadButton1");
      elem.innerText = 'name : ' + this.purchaseUpload1.name;
    } else {
      this.purchaseUpload1 = null;
    }
  }

  getList1() {
    this.sp.show()
    const dtm = {
      currentPage: this.currentPage1,
      itemsPerPage: this.itemsPerPage1,
      Type: "pricelist"
    }
    const subs: Subscription = this.uploader.getList(dtm).subscribe({
      next: (res: any) => {
        this.collectionSize1 = res.count;
        this.dataList1 = res.data;
        this.sp.hide();
        this.as.successToast(res.message)
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  openModal1(content1: any, data: any) {
    this.tempProcessFile1 = data;
    this.modalService.open(content1, { centered: true, backdrop: 'static', keyboard: false, size: 'md' });
  }

  createFileRecord1(frm: any) {
    const dtm = {
      "ID": null,
      "originalname": frm.original_name,
      "fileName": frm.file_name,
      "download": frm.download,
      "path": frm.path,
      "destination": frm.location,
      "Type": "pricelist"
    }
    this.uploader.saveFileRecord(dtm).subscribe((resp: any) => {
      if (resp.success) {
        this.as.successToast("File Added!");
        this.getList1();
      } else {
        this.as.warningToast(resp.message);
      }
    });
  }

  deleteItem1(data: any, i: any) {
    if (data.Process === 1) {
      Swal.fire({
        position: 'center',
        icon: 'error',
        title: 'You Can Not Delete This File, You Have Already Processed',
        showConfirmButton: true,
        backdrop: false,
      })
      return this.as.errorToast("You Can Not Delete This File, You Have Already Processed")
    }
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      backdrop: false,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        const subs: Subscription = this.uploader.deleteFileRecord(data.ID).subscribe({
          next: (res: any) => {
            this.dataList1.splice(i, 1);
            this.as.successToast(res.message)
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


  processFile1() {
    if (this.tempProcessFile1.Process === 1) {
      return this.as.errorToast("You  Can Not Delete This File, You Have Already Processed")
    }
    const ID = this.tempProcessFile1.ID
    const dtm = {
      filename: this.tempProcessFile1.fileName,
      originalname: this.tempProcessFile1.originalname,
      path: this.tempProcessFile1.path,
      destination: this.tempProcessFile1.destination,
      PurchaseMaster: {
        ID: null,
        SupplierID: this.selectedPurchaseMaster1.SupplierID,
        PurchaseDate: this.selectedPurchaseMaster1.PurchaseDate,
        InvoiceNo: this.selectedPurchaseMaster1.InvoiceNo,
        ShopID: Number(this.selectedShop[0]),
      },
    }
    this.sp.show();
    const subs: Subscription = this.uploader.processPriceListFile(dtm).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.sp.show();
          if (res.data !== 0) {
            this.id = res.data;
          }
          this.updateFileRecord1(ID)
        } else {
          this.as.errorToast(res.message)
          Swal.fire({
            position: 'center',
            icon: 'error',
            title: res.message,
            showConfirmButton: true,
            backdrop: false,
          })

        }
        this.sp.hide();
      },
      error: (err: any) => {
        console.log(err.msg);
      },
      complete: () => subs.unsubscribe(),
    });
  }

  updateFileRecord1(ID: any) {
    const dtm = {
      "ID": ID,
      "key": "Process",
      "value": 1,
      "Type": "pricelist"
    }
    const subs: Subscription = this.uploader.updateFileRecord(dtm).subscribe({
      next: (res: any) => {
        console.log(res);
        // return
        if (res.success) {
          this.modalService.dismissAll();
          //  this.router.navigate(['/inventory/purchaseList'])
          this.router.navigate(['/inventory/pre-order', this.id])

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
}
