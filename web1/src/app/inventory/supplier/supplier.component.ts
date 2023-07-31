import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { FileUploadService } from 'src/app/service/helpers/file-upload.service';
import { SupplierService } from 'src/app/service/supplier.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { map, filter, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { fromEvent } from 'rxjs';
import { take } from 'rxjs/operators';
import { SupportService } from 'src/app/service/support.service';
import { CompressImageService } from 'src/app/service/helpers/compress-image.service';
import { ExcelService } from 'src/app/service/helpers/excel.service';
import { SupplierModel } from 'src/app/interface/Supplier';
import { PurchaseService } from 'src/app/service/purchase.service';

@Component({
  selector: 'app-supplier',
  templateUrl: './supplier.component.html',
  styleUrls: ['./supplier.component.css'],
  encapsulation: ViewEncapsulation.None
})

export class SupplierComponent implements OnInit {

  @ViewChild('searching') searching: ElementRef | any;
  user = JSON.parse(localStorage.getItem('user') || '');
  companysetting = JSON.parse(localStorage.getItem('companysetting') || '');

  env = environment;
  gridview = true;
  term: any;
  id: any;
  companyImage: any;
  img: any;
  dataList: any = [];
  currentPage = 1;
  itemsPerPage = 10;
  pageSize!: number;
  collectionSize = 0
  page = 4;
  suBtn = false;
  purchasVariable: any = 0;
  gstList: any;
  CustomerTotal:any = []
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    public as: AlertService,
    private ss: SupplierService,
    private fu: FileUploadService,
    private sp: NgxSpinnerService,
    private modalService: NgbModal,
    private compressImage: CompressImageService,
    private excelService: ExcelService,
    private supps: SupportService,
    private purchaseService: PurchaseService,
  ) {
    this.id = this.route.snapshot.params['id'];
    this.env = environment
  }

  data: any = {
    ID: null, Sno: 0, Name: null, MobileNo1: null, MobileNo2: '', PhoneNo: '', Address: null, Email: '', Website: '',
    GSTNo: '', GSTType: 'None', CINNo: '', PhotoURL: '', Remark: null, ContactPerson: '', Fax: '', DOB: '', Anniversary: '',
    Status: 1, CreatedBy: null, CreatedOn: null, UpdatedBy: null, UpdatedOn: null
  };

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.purchasVariable = +params['check'] || 0;
    });
    this.getList();
    this.getGSTList();
  }

  onsubmit() {
    this.sp.show()
    const subs: Subscription = this.ss.supplierSave(this.data).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.formReset();
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Your file has been Save.',
            showConfirmButton: false,
            timer: 1200
          })
          this.data = [];
          if (this.purchasVariable === 1) {
            this.router.navigate(['/inventory/purchase/0']);
          } else {
            this.getList();
          }
          this.getList();
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => {
        console.log(err.msg);
      },
      complete: () => subs.unsubscribe(),
    });
    this.modalService.dismissAll()
    this.getList();
    this.sp.hide()
  }

  getList() {
    this.sp.show()
    const dtm = {
      currentPage: this.currentPage,
      itemsPerPage: this.itemsPerPage
    }
    const subs: Subscription = this.ss.getList(dtm).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.collectionSize = res.count;
          this.dataList = res.data;
          this.dataList.forEach((element: { PhotoURL: any; }) => {
            if (element.PhotoURL !== "null" && element.PhotoURL !== '') {
              element.PhotoURL = (this.env.apiUrl + element.PhotoURL);
            } else {
              element.PhotoURL = "/assets/images/userEmpty.png"
            }
          });
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

  uploadImage(e: any, mode: any) {

    this.img = e.target.files[0];
    // console.log(`Image size before compressed: ${this.img.size} bytes.`)
    this.compressImage.compress(this.img).pipe(take(1)).subscribe((compressedImage: any) => {
      // console.log(`Image size after compressed: ${compressedImage.size} bytes.`)
      this.fu.uploadFileComapny(compressedImage).subscribe((data: any) => {
        if (data.body !== undefined && mode === 'company') {
          this.companyImage = this.env.apiUrl + data.body?.download;
          this.data.PhotoURL = data.body?.download;
          this.as.successToast(data.body?.message)
        }
      });
    })
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
        this.sp.show()
        const subs: Subscription = this.ss.deleteData(this.dataList[i].ID).subscribe({
          next: (res: any) => {
            if (res.success) {
              this.dataList.splice(i, 1);
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
        this.getList();
      }
    })
    this.sp.hide();
  }

  getSupplierById(datas: any) {
    this.companyImage = datas.PhotoURL;
    this.data = datas;
    this.suBtn = true;
  }

  Clear() {
    this.suBtn = false;
    this.id = 0;
    this.data = {
      ID: null, Sno: this.data.Sno, Name: null, MobileNo1: null, MobileNo2: '', PhoneNo: '', Address: null, Email: '', Website: '',
      GSTNo: '', CINNo: '', PhotoURL: '', Remark: '', ContactPerson: '', Fax: '', DOB: '', Anniversary: '',
      Status: 1, CreatedBy: null, CreatedOn: null, UpdatedBy: null, UpdatedOn: null
    };
  }

  supplierUpdate() {
    this.sp.show()
    const subs: Subscription = this.ss.supplierUpdate(this.data).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.formReset();
          this.modalService.dismissAll();
          this.getList();
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Your file has been Update.',
            showConfirmButton: false,
            timer: 1200
          })
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
    this.sp.hide();
  }

  onChange(event: { toUpperCase: () => any; toTitleCase: () => any; }) {
    if (this.companysetting.DataFormat === '1') {
      event = event.toUpperCase()
    } else if (this.companysetting.DataFormat == '2') {
      event = event.toTitleCase()
    }
    return event;
  }

  openModal(content: any) {
    this.companyImage = ''
    this.suBtn = false;
    this.id = 0;
     
    if (this.dataList.length === 0) {
      this.data.Sno = Number(this.data.Sno) + 1;
    } else {
      if (this.dataList[0].Sno != 'null') {
        this.data.Sno = Number(this.dataList[0].Sno) + 1;
      } else {
        this.data.Sno = 1
      }
    }

    this.data = {
      ID: null, Sno: this.data.Sno, Name: null, MobileNo1: null, MobileNo2: '', PhoneNo: '', Address: null, Email: '', Website: '',
      GSTNo: '', CINNo: '', PhotoURL: '', Remark: '', ContactPerson: '', Fax: '', DOB: '', Anniversary: '',
      Status: 1, CreatedBy: null, CreatedOn: null, UpdatedBy: null, UpdatedOn: null
    };
    this.modalService.open(content, { centered: true, backdrop: 'static', keyboard: false, size: 'xl' });
  }

  ngAfterViewInit() {
    // server-side search
    fromEvent(this.searching.nativeElement, 'keyup').pipe(
      // get value
      map((event: any) => {
        return event.target.value;
      }),

      // if character length greater then 2
      // filter(res => res.length > 2),

      // Time in milliseconds between key events
      debounceTime(1000),

      // If previous query is different from current
      distinctUntilChanged(),
      // tap((event: KeyboardEvent) => {
      //     console.log(event)
      //     console.log(this.input.nativeElement.value)
      //   })
      // subscription for response
    ).subscribe((text: string) => {
      //  const name = e.target.value;
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
        const subs: Subscription = this.ss.searchByFeild(dtm).subscribe({
          next: (res: any) => {
            if(res.success){
              this.collectionSize = 1;
              this.page = 1;
              this.dataList = res.data
              this.as.successToast(res.message)
            }else{
              this.as.errorToast(res.message)
            }
            this.sp.hide();
          },
          error: (err: any) => console.log(err.message),
          complete: () => subs.unsubscribe(),
        });
      } else {
        this.getList();
      }
    });
    this.sp.hide();
  }

  exportAsXLSX(): void {
    let data = this.dataList.map((e: any) => {
      return{
        Name: e.Name,
        MobileNo1 : e.MobileNo1,
        MobileNo2 : e.MobileNo2,
        GSTType : e.GSTType,
        GSTNo : e.GSTNo,
        PhoneNo : e.PhoneNo,
        Email : e.Email,
        Address : e.Address,
        ContactPerson : e.ContactPerson,
        CreatedPerson : e.CreatedPerson,
        UpdatedPerson : e.UpdatedPerson,
      }
    })
    this.excelService.exportAsExcelFile(data, 'supplier_list');
  }

  getGSTList() {
    this.sp.show();
    const subs: Subscription = this.supps.getList('TaxType').subscribe({
      next: (res: any) => {
        if(res.success){
          this.gstList = res.data
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
    this.sp.hide();
  }



  formReset() {
    this.data = {
      ID: null, Sno: 0, Name: null, MobileNo1: null, MobileNo2: '', PhoneNo: '', Address: null, Email: '', Website: '',
      GSTNo: '', GSTType: 'None', CINNo: '', PhotoURL: '', Remark: null, ContactPerson: '', Fax: '', DOB: '', Anniversary: '',
      Status: 1, CreatedBy: null, CreatedOn: null, UpdatedBy: null, UpdatedOn: null
    };
  }
}
