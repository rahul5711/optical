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
import { ExcelService } from 'src/app/service/helpers/excel.service';


@Component({
  selector: 'app-bill-bluk',
  templateUrl: './bill-bluk.component.html',
  styleUrls: ['./bill-bluk.component.css']
})
export class BillBlukComponent implements OnInit {

  selectedShop: any = JSON.parse(localStorage.getItem('selectedShop') || '');
  env: any;
  customerUpload: any
  currentPage = 1;
  itemsPerPage = 10;
  pageSize!: number;
  collectionSize = 0;
  page = 4;
  dataList: any;
  id: any;
  supplierList: any;
  tempProcessFile: any;

  BillDetailUpload: any;
  BillDetailList:any
  currentPageBillDetail = 1;
  itemsPerPageBillDetail = 10;
  pageSizeBillDetail!: number;
  collectionSizeBillDetail = 0;
  pageBillDetail = 4;
  tempProcessFileBillDetail: any;

  constructor(
    private uploader: UploaderService,
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    public as: AlertService,
    private sp: NgxSpinnerService,
    private excelService: ExcelService,

  ) {
    this.env = environment
  }

  josnData = [
    {
      'SystemID': '',
      'BillNo': '',
      'SerialNo': '',
      'BillDate': '',
      'DeliveryDate': '',
      'Qty': '',
      'SubTotal': '',
      'GSTPercentage': '',
      'GST': '',
      'AdditionalDiscountPercentage': '',
      'AdditionalDiscount': '',
      'GrandTotal': '',
    }
  ]

  josnDetailData = [
    {
      'BillNo': '',
      'ProductDescription': '',
      'UnitPrice': '',
      'Qty': '',
      'DiscountPercentage': '',
      'Discount': '',
      'SubTotal': '',
      'GSTPercentage': '',
      'GST': '',
      'Amount': '',
    }
  ]

  ngOnInit(): void {
    this.getList();
    this.getDetailList();
  }

  selectFile(e: any) {
    if (e.target.files.length) {
      this.customerUpload = e.target.files[0];
      const elem: any = document.getElementById("uploadButton");
      elem.innerText = 'name : ' + this.customerUpload.name;
    } else {
      this.customerUpload = null;
    }
  }

  submit(frm: NgForm) {
    console.log(frm, 'sun');
    if (frm.valid) {
      const elem: any = document.getElementById("uploadButton");
      this.uploader.uploadBillMaster(this.customerUpload).subscribe((resp: any) => {
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
            "fileType": 'Customer',
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
      "Type": "BillMaster"
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
      Type: "BillMaster"
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

  processFile(data: any) {
    Swal.fire({
      title: 'Are you sure?',
      text: "Are You Able To Upload Customer File!",
      icon: 'warning',
      showCancelButton: true,
      backdrop: false,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, Upload it!'
    }).then((result) => {
      if (result.isConfirmed) {
        const ID = data.ID
        const dtm = {
          filename: data.fileName,
          originalname: data.originalname,
          path: data.path,
          destination: data.destination,
        }
        const subs: Subscription = this.uploader.processCustomerBillFile(dtm).subscribe({
          next: (res: any) => {
            Swal.fire({
              position: 'center',
              icon: 'success',
              title: 'Your bill master has been imported',
              showConfirmButton: false,
              timer: 2000
            })
            if (res.success) {
              this.updateFileRecord(ID)
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
    })
  }

  updateFileRecord(ID: any) {
    this.sp.show();
    const dtm = {
      "ID": ID,
      "key": "Process",
      "value": 1,
      "Type": "BillMaster"
    }

    const subs: Subscription = this.uploader.updateFileRecord(dtm).subscribe({
      next: (res: any) => {
        if (res.success) {

          // this.router.navigate(['/sale/customerList'])
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => {
        console.log(err.msg);
      },
      complete: () => subs.unsubscribe(),
    });

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

  generateExcel(): void {
    this.excelService.exportAsExcelFile(this.josnData, 'BillMaster_uploader');
  }

  // bill details code 

  selectDetailFile(e: any) {
    if (e.target.files.length) {
      this.BillDetailUpload = e.target.files[0];
      const elem: any = document.getElementById("uploadButton");
      elem.innerText = 'name : ' + this.BillDetailUpload.name;
    } else {
      this.BillDetailUpload = null;
    }
  }

  submitDetail(frm: NgForm) {
    console.log(frm, 'sun');
    if (frm.valid) {
      const elem: any = document.getElementById("uploadButton");
      this.uploader.uploadBillDetails(this.BillDetailUpload).subscribe((resp: any) => {
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
            "fileType": 'Customer',
            "file_name": fs.filename,
            "path": fs.path.replaceAll("\\", "/"),
            "size": fs.size
          }
          this.createDetailFileRecord(fileData);
          frm.reset();
        }
      });
    } else {
      this.as.warningToast("Please fill all the fields properly!");
    }
  }

  createDetailFileRecord(frm: any) {
    const dtm = {
      "ID": null,
      "originalname": frm.original_name,
      "fileName": frm.file_name,
      "download": frm.download,
      "path": frm.path,
      "destination": frm.location,
      "Type": "BillDetail"
    }
    this.uploader.saveFileRecord(dtm).subscribe((resp: any) => {
      if (resp.success) {
        this.as.successToast("File Added!");
        this.getDetailList();
      } else {
        this.as.warningToast(resp.message);
      }
    });
  }

  changeDetailPagesize(num: number): void {
    this.itemsPerPageBillDetail = this.pageSizeBillDetail + num;
  }

  getDetailList() {
    this.sp.show()
    const dtm = {
      currentPage: this.currentPageBillDetail,
      itemsPerPage: this.itemsPerPageBillDetail,
      Type: "BillDetail"
    }
    const subs: Subscription = this.uploader.getList(dtm).subscribe({
      next: (res: any) => {
        this.collectionSizeBillDetail = res.count;
        this.BillDetailList = res.data;
        this.sp.hide();
        this.as.successToast(res.message)
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  processDetailFile(data: any) {
    Swal.fire({
      title: 'Are you sure?',
      text: "Are You Able To Upload Customer File!",
      icon: 'warning',
      showCancelButton: true,
      backdrop: false,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, Upload it!'
    }).then((result) => {
      if (result.isConfirmed) {
        const ID = data.ID
        const dtm = {
          filename: data.fileName,
          originalname: data.originalname,
          path: data.path,
          destination: data.destination,
        }
        this.sp.show();
        const subs: Subscription = this.uploader.processCustomerBillDetailsFile(dtm).subscribe({
          next: (res: any) => {
            Swal.fire({
              position: 'center',
              icon: 'success',
              title: 'Your Customer Has Been Imported',
              showConfirmButton: false,
              timer: 2000
            })
            this.sp.show();
            if (res.success) {
              this.updateFileRecord(ID)
            } else {
              this.as.errorToast(res.message)
            }
            this.sp.hide();
          },
          error: (err: any) => {
            console.log(err.msg);
          },
          complete: () => subs.unsubscribe(),
        });
      }
    })
  }

  updateDetailFileRecord(ID: any) {
    const dtm = {
      "ID": ID,
      "key": "Process",
      "value": 1,
      "Type": "BillDetail"
    }
    this.sp.show();
    const subs: Subscription = this.uploader.updateFileRecord(dtm).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.sp.show();
          // this.router.navigate(['/sale/customerList'])
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => {
        console.log(err.msg);
      },
      complete: () => subs.unsubscribe(),
    });

  }

  deleteDetailItem(data: any, i: any) {
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

  generateDetailExcel(): void {
    this.excelService.exportAsExcelFile(this.josnDetailData, 'BillDetail_uploader');
  }


}
