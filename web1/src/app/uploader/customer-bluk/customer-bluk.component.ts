
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
  selector: 'app-customer-bluk',
  templateUrl: './customer-bluk.component.html',
  styleUrls: ['./customer-bluk.component.css']
})
export class CustomerBlukComponent implements OnInit {

  selectedShop:any =JSON.parse(localStorage.getItem('selectedShop') || '') ;
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

  SpectacleUpload: any;
  spectacleList:any
  currentPageSpec = 1;
  itemsPerPageSpec = 10;
  pageSizeSpec!: number;
  collectionSizeSpec = 0;
  pageSpec = 4;
  tempProcessFileSpec: any;

  ContactUpload:any
  contactList:any
  currentPageCon = 1;
  itemsPerPageCon = 10;
  pageSizeCon!: number;
  collectionSizeCon = 0;
  pageCon = 4;

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
    'SystemID' : '',
    'Name' : '',
    'MobileNo1' : '',
    'MobileNo2' : '',
    'PhoneNo' : '',
    'Address' : '',
    'Email' : '',
    'DOB' : '',
    'Age' : '',
    'Anniversary' : '',
    'Gender' : '',
    'VisitDate' : '',
    'Remarks' : '',
    'Category' : '',
    'SR_MRD_No' : '',
    }
  ]

  josnDataSpec = [
    {
      "SystemID": '',
      "REDPSPH": '',
      "REDPCYL": '',
      "REDPAxis": '',
      "REDPVA": '',
      "LEDPSPH": '',
      "LEDPCYL": '',
      "LEDPAxis": '',
      "LEDPVA": '',
      "RENPSPH": '',
      "RENPCYL": '',
      "RENPAxis": '',
      "RENPVA": '',
      "LENPSPH": '',
      "LENPCYL": '',
      "LENPAxis": '',
      "LENPVA": '',
      "REPD": '',
      "LEPD": '',
      "R_Addition": '',
      "L_Addition": '',
      "R_Prism": '',
      "L_Prism": '',
      "Lens": '',
      "Shade": '',
      "Frame": '',
      "VertexDistance": '',
      "RefractiveIndex": '',
      "FittingHeight": '',
      "ConstantUse": '',
      "NearWork": '',
      "DistanceWork": '',
      "ExpiryDate": '"0000-00-00"',
      "VisitDate": '"0000-00-00"',
    }
  ]

  josnDataCon = [
    {
      "SystemID": '',
      "REDPSPH": '',
      "REDPCYL": '',
      "REDPAxis": '',
      "REDPVA": '',
      "LEDPSPH": '',
      "LEDPCYL": '',
      "LEDPAxis": '',
      "LEDPVA": '',
      "RENPSPH": '',
      "RENPCYL": '',
      "RENPAxis": '',
      "RENPVA": '',
      "LENPSPH": '',
      "LENPCYL": '',
      "LENPAxis": '',
      "LENPVA": '',
      "REPD": '',
      "LEPD": '',
      "R_Addition": '',
      "L_Addition": '',
      "R_KR": '',
      "L_KR": '',
      "R_HVID": '',
      "L_HVID": '',
      "R_CS": '',
      "L_CS": '',
      "R_BC": '',
      "L_BC": '',
      "R_Diameter": '',
      "L_Diameter": '',
      "BR": '',
      "Material": '',
      "Modality": '',
      "Other": '',
      "ConstantUse": '',
      "NearWork": '',
      "DistanceWork": '',
      "__EMPTY": '',
      "Multifocal": '',
      "ExpiryDate": '"0000-00-00"',
      "VisitDate": '"0000-00-00"',

    }
  ]

  ngOnInit(): void {
    this.getList();
    this.getListSpec();
    this.getListCon();
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
      this.uploader.uploadCustomer(this.customerUpload).subscribe((resp: any) => {
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
      "Type": "Customer"
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
      Type: "Customer"
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

  processFile(data:any) {
    Swal.fire({
      title: 'Are you sure?',
      text: "Are You Able To Upload Customer File!",
      icon: 'warning',
      showCancelButton: true,
      backdrop : false,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, Upload it!'
    }).then((result) => {
      if (result.isConfirmed) {
        const ID = data.ID
        const dtm = {
          filename:data.fileName,
          originalname:data.originalname,
          path:data.path,
          destination:data.destination,
        }
        this.sp.show();
        const subs: Subscription =  this.uploader.processCustomerFile(dtm).subscribe({
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
              this.as.errorToast(res.message )
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

  updateFileRecord(ID:any){
    const dtm = {
     "ID": ID,
     "key": "Process",
     "value": 1,
     "Type": "Customer"
    }
    this.sp.show();
    const subs: Subscription =  this.uploader.updateFileRecord(dtm).subscribe({
     next: (res: any) => {
       if (res.success) {
        this.sp.show();
        this.router.navigate(['/sale/customerList'])
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

  generateExcel(): void {
    this.excelService.exportAsExcelFile(this.josnData, 'Customer_Upload');
  }

  // spectacle code
  selectFileSpectacle(e: any) {
    if (e.target.files.length) {
      this.SpectacleUpload = e.target.files[0];
      const elem: any = document.getElementById("uploadButton");
      elem.innerText = 'name : ' + this.SpectacleUpload.name;
    } else {
      this.SpectacleUpload = null;
    }
  }

  submitSpectacle(frm: NgForm) {
    console.log(frm, 'sun');
    if (frm.valid) {
      const elem: any = document.getElementById("uploadButton");
      this.uploader.uploadSpectacle(this.SpectacleUpload).subscribe((resp: any) => {
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
              "fileType": 'spectacle_rx',
              "file_name": fs.filename,
              "path": fs.path.replaceAll("\\", "/"),
              "size": fs.size
            }
            this.createFileRecordSpectacle(fileData);
            frm.reset();
          }
        });
    } else {
      this.as.warningToast("Please fill all the fields properly!");
    }
  }

  createFileRecordSpectacle(frm: any) {
    const dtm = {
      "ID": null,
      "originalname": frm.original_name,
      "fileName": frm.file_name,
      "download": frm.download,
      "path": frm.path,
      "destination": frm.location,
      "Type": "spectacle_rx"
    }
    this.uploader.saveFileRecord(dtm).subscribe((resp: any) => {
      if (resp.success) {
        this.as.successToast("File Added!");
        this.getListSpec();
      } else {
        this.as.warningToast(resp.message);
      }
    });
  }

  changePagesizeSpec(num: number): void {
    this.itemsPerPageSpec = this.pageSizeSpec + num;
  }

  getListSpec() {
    this.sp.show()
    const dtm = {
      currentPage: this.currentPageSpec,
      itemsPerPage: this.itemsPerPageSpec,
      Type: "spectacle_rx"
    }
    const subs: Subscription = this.uploader.getList(dtm).subscribe({
      next: (res: any) => {
        this.collectionSizeSpec = res.count;
        this.spectacleList = res.data;
        this.sp.hide();
        this.as.successToast(res.message)
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  processFileSpec(data:any) {
    Swal.fire({
      title: 'Are you sure?',
      text: "Are You Able To Upload Customer Spectacle File!",
      icon: 'warning',
      showCancelButton: true,
      backdrop : false,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, Upload it!'
    }).then((result) => {
      if (result.isConfirmed) {
        const ID = data.ID
        const dtm = {
          filename:data.fileName,
          originalname:data.originalname,
          path:data.path,
          destination:data.destination,
        }
        this.sp.show();
        const subs: Subscription =  this.uploader.processCusSpectacleFile(dtm).subscribe({
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
             this.updateFileRecordSpec(ID)
            } else {
              this.as.errorToast(res.message )
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

  updateFileRecordSpec(ID:any){
    const dtm = {
     "ID": ID,
     "key": "Process",
     "value": 1,
     "Type": "spectacle_rx"
    }
    this.sp.show();
    const subs: Subscription =  this.uploader.updateFileRecord(dtm).subscribe({
     next: (res: any) => {
       if (res.success) {
        this.sp.show();
        this.router.navigate(['/sale/customerList'])
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

  deleteItemSpec(data: any, i: any) {
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
            this.spectacleList.splice(i, 1);
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

  generateExcelSpectacle(): void {
    this.excelService.exportAsExcelFile(this.josnDataSpec, 'Customer_Spectacle_Upload');
  }

  // Contact code
  selectFileCon(e: any) {
    if (e.target.files.length) {
      this.ContactUpload = e.target.files[0];
      const elem: any = document.getElementById("uploadButton");
      elem.innerText = 'name : ' + this.ContactUpload.name;
    } else {
      this.ContactUpload = null;
    }
  }

  submitCon(frm: NgForm) {
    console.log(frm, 'sun');
    if (frm.valid) {
      const elem: any = document.getElementById("uploadButton");
      this.uploader.uploadSpectacle(this.ContactUpload).subscribe((resp: any) => {
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
              "fileType": 'contact_lens_rx',
              "file_name": fs.filename,
              "path": fs.path.replaceAll("\\", "/"),
              "size": fs.size
            }
            this.createFileRecordCon(fileData);
            frm.reset();
          }
        });
    } else {
      this.as.warningToast("Please fill all the fields properly!");
    }
  }

  createFileRecordCon(frm: any) {
    const dtm = {
      "ID": null,
      "originalname": frm.original_name,
      "fileName": frm.file_name,
      "download": frm.download,
      "path": frm.path,
      "destination": frm.location,
      "Type": "contact_lens_rx"
    }
    this.uploader.saveFileRecord(dtm).subscribe((resp: any) => {
      if (resp.success) {
        this.as.successToast("File Added!");
        this.getListCon();
      } else {
        this.as.warningToast(resp.message);
      }
    });
  }

  changePagesizeCon(num: number): void {
    this.itemsPerPageCon = this.pageSizeCon + num;
  }

  getListCon() {
    this.sp.show()
    const dtm = {
      currentPage: this.currentPageCon,
      itemsPerPage: this.itemsPerPageCon,
      Type: "contact_lens_rx"
    }
    const subs: Subscription = this.uploader.getList(dtm).subscribe({
      next: (res: any) => {
        this.collectionSizeCon = res.count;
        this.contactList = res.data;
        this.sp.hide();
        this.as.successToast(res.message)
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  processFileCon(data:any) {
    Swal.fire({
      title: 'Are you sure?',
      text: "Are You Able To Upload Customer Spectacle File!",
      icon: 'warning',
      showCancelButton: true,
      backdrop : false,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, Upload it!'
    }).then((result) => {
      if (result.isConfirmed) {
        const ID = data.ID
        const dtm = {
          filename:data.fileName,
          originalname:data.originalname,
          path:data.path,
          destination:data.destination,
        }
        this.sp.show();
        const subs: Subscription =  this.uploader.processCusContactFile(dtm).subscribe({
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
             this.updateFileRecordCon(ID)
            } else {
              this.as.errorToast(res.message )
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

  updateFileRecordCon(ID:any){
    const dtm = {
     "ID": ID,
     "key": "Process",
     "value": 1,
     "Type": "contact_lens_rx"
    }
    this.sp.show();
    const subs: Subscription =  this.uploader.updateFileRecord(dtm).subscribe({
     next: (res: any) => {
       if (res.success) {
        this.sp.show();
        this.router.navigate(['/sale/customerList'])
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

  deleteItemCon(data: any, i: any) {
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
            this.contactList.splice(i, 1);
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

  generateExcelCon(): void {
    this.excelService.exportAsExcelFile(this.josnDataCon, 'Customer_Contact_Upload');
  }

}
