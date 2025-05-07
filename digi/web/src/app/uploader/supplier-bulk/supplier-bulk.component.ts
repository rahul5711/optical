
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
  selector: 'app-supplier-bulk',
  templateUrl: './supplier-bulk.component.html',
  styleUrls: ['./supplier-bulk.component.css']
})
export class SupplierBulkComponent implements OnInit {
  selectedShop: any = JSON.parse(localStorage.getItem('selectedShop') || '');
  env: any;

  customerUpload: any;
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
    private excelService: ExcelService,

  ) {
    this.env = environment
  }

  josnData = [
    {
      "Name": "",
      "MobileNo1": "",
      "MobileNo2": "",
      "PhoneNo": "",
      "Address": "",
      "GSTNo": "",
      "GSTType": "None",
      "Email": "",
      "Website": "",
      "CINNo": "",
      "Fax": "",
      "PhotoURL": "",
      "ContactPerson": "",
      "Remark": "",
      "DOB": '"0000-00-00"',
      "Anniversary": '"0000-00-00"',
      "Gender": "",
      "VisitDate": '"0000-00-00"'
    }
  ]

  ngOnInit(): void {
    this.getList();
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
      this.uploader.uploadSupplier(this.customerUpload).subscribe((resp: any) => {
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
            "fileType": 'Supplier',
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
      "Type": "Supplier"
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
      Type: "Supplier"
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
        this.sp.show();
        const subs: Subscription = this.uploader.processSupplierFile(dtm).subscribe({
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
              Swal.fire({
                position: 'center',
                icon: 'error',
                title: res.message,
                showConfirmButton: true,
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
    })
  }

  updateFileRecord(ID: any) {
    const dtm = {
      "ID": ID,
      "key": "Process",
      "value": 1,
      "Type": "Supplier"
    }
    this.sp.show();
    const subs: Subscription = this.uploader.updateFileRecord(dtm).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.sp.show();
          this.router.navigate(['/inventory/supplier'])
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
    this.excelService.exportAsExcelFile(this.josnData, 'Supplier_Upload');
  }

}
