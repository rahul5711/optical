
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


@Component({
  selector: 'app-purchase-bluk',
  templateUrl: './purchase-bluk.component.html',
  styleUrls: ['./purchase-bluk.component.css']
})

export class PurchaseBlukComponent implements OnInit {

  selectedShop:any =JSON.parse(localStorage.getItem('selectedShop') || '') ;
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

  ) {
    this.env = environment
  }

  selectedPurchaseMaster: any = {
    ID: null, SupplierID: null, SupplierName: null, CompanyID: null, GSTNo: null, ShopID: null, ShopName: null, PurchaseDate: null,
    PaymentStatus: null, InvoiceNo: null, Status: 1, CreatedBy: null, Quantity: 0, SubTotal: 0, DiscountAmount: 0,
    GSTAmount: 0, TotalAmount: 0, RoundOff: 0, preOrder: false,
  };

  josnData = [
    {
    'ProductName' : '',
    'ProductTypeName' : '',
    'UnitPrice' : '',
    'Quantity' : '',
    'DiscountPercentage' : '',
    'GSTPercentage' : '',
    'GSTType' : 'IGST',
    'RetailPrice' : '',
    'WholeSalePrice' : '',
    'WholeSale' : '',
    'BrandType' : '',
    'BarcodeExist' : '',
    'BaseBarCode' : '',
    'ProductExpDate' : '"YYYY-MM-DD"',
  },
  {
    'ProductName' : '',
    'ProductTypeName' : '',
    'UnitPrice' : '',
    'Quantity' : '',
    'DiscountPercentage' : '',
    'GSTPercentage' : '',
    'GSTType' : 'CGST-SGST',
    'RetailPrice' : '',
    'WholeSalePrice' : '',
    'WholeSale' : '',
    'BrandType' : '',
    'BarcodeExist' : '',
    'BaseBarCode' : '',
    'ProductExpDate' : '"0000-00-00"',
  },
  {
    'ProductName' : '',
    'ProductTypeName' : '',
    'UnitPrice' : '',
    'Quantity' : '',
    'DiscountPercentage' : '',
    'GSTPercentage' : '',
    'GSTType' : 'None',
    'RetailPrice' : '',
    'WholeSalePrice' : '',
    'WholeSale' : '',
    'BrandType' : '',
    'BarcodeExist' : '',
    'BaseBarCode' : '',
    'ProductExpDate' : '"0000-00-00"',
  }
]

  ngOnInit(): void {
    this.getList();
    this.getdropdownSupplierlist();
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
        backdrop : false,
      })
      return this.as.errorToast("You Can Not Delete This File, You Have Already Processed")
    }
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      backdrop : false,
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
      filename:this.tempProcessFile.fileName,
      originalname:this.tempProcessFile.originalname,
      path:this.tempProcessFile.path,
      destination:this.tempProcessFile.destination,
      PurchaseMaster: {
        ID : null,
        SupplierID : this.selectedPurchaseMaster.SupplierID,
        PurchaseDate : this.selectedPurchaseMaster.PurchaseDate,
        InvoiceNo : this.selectedPurchaseMaster.InvoiceNo,
        ShopID : Number(this.selectedShop[0]) ,
      },
    }
    this.sp.show();
    const subs: Subscription =  this.uploader.processPurchaseFile(dtm).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.sp.show();
          if(res.data !== 0) {
            this.id = res.data;
          }
         this.updateFileRecord(ID)
        } else {
          this.as.errorToast(res.message )
          Swal.fire({
            position: 'center',
            icon: 'error',
            title: res.message,
            showConfirmButton: true,
            backdrop : false,
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

  updateFileRecord(ID:any){
   const dtm = {
    "ID": ID,
    "key": "Process",
    "value": 1,
    "Type": "Purchase"
   }
   const subs: Subscription =  this.uploader.updateFileRecord(dtm).subscribe({
    next: (res: any) => {
      console.log(res);
      // return
      if (res.success) {
        this.modalService.dismissAll();
      //  this.router.navigate(['/inventory/purchaseList'])
       this.router.navigate(['/inventory/purchase' , this.id])
      
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

  generateExcel(): void {
    this.excelService.exportAsExcelFile(this.josnData, 'Purchase_Upload');
  }
  

}
