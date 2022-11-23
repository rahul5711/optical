import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2'; 
import { ShopService } from 'src/app/service/shop.service';
import { AlertService } from 'src/app/service/alert.service';
import { FileUploadService } from 'src/app/service/file-upload.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { map, filter, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { fromEvent   } from 'rxjs';
import {CompressImageService} from '../../service/compress-image.service'
import { take } from 'rxjs/operators';
import { ExcelService } from '../../service/excel.service';

@Component({
  selector: 'app-shop-list',
  templateUrl: './shop-list.component.html',
  styleUrls: ['./shop-list.component.css']
})
export class ShopListComponent implements OnInit {
  
  @ViewChild('searching') searching: ElementRef | any;
  term = "";
  loggedInCompany:any = (localStorage.getItem('LoggedINCompany') || '');
  user = JSON.parse(localStorage.getItem('user') || '');
  reactiveForm!: FormGroup;
  toggleChecked = false
  companyImage:any;
  img: any;
  env: { production: boolean; apiUrl: string; appUrl: string; };
  id: any;
  
  dataList: any;
  currentPage = 1;
  itemsPerPage = 10;
  pageSize!: number;
  collectionSize = 0
  page = 4;
  suBtn = true;

  data: any = { ID : null,  CompanyID: null, Name : '', AreaName: '', MobileNo1 : '', MobileNo2 : '', PhoneNo : '', Address : '', 
     Email :'', Website : '', GSTNo : '', CINNo : '', BarcodeName: '', Discount: false, GSTnumber: false, LogoURL : '',HSNCode: false, CustGSTNo:false, Rate:false, Discounts:false, Tax:false, SubTotal:false, Total:false,  ShopTiming : 'MON-SAT 10 AM - 8 PM, SUN OFF', WelcomeNote : 'No Terms and Conditions',   Status : 1, CreatedBy : null, CreatedOn : null, UpdatedBy : null, UpdatedOn : null, ShopStatus: 0,
  };

  constructor(
    private router: Router,
    public as: AlertService,
    private ss: ShopService,
    private fu: FileUploadService,
    private sp: NgxSpinnerService,
    private modalService: NgbModal,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private compressImage: CompressImageService,
    private excelService: ExcelService,

  ) { 
    this.id = this.route.snapshot.params['id'];
    this.env = environment
    this.reactiveForm = new FormGroup({
      Name : new FormControl(null, Validators.required)
    })
  }

  ngOnInit(): void {
    this.getList();   
    
  }

  onPageChange(pageNum: number): void {
    this.pageSize = this.itemsPerPage * (pageNum - 1);
  }

  changePagesize(num: number): void {
    this.itemsPerPage = this.pageSize + num;
  }

  getList() {
    this.sp.show()
    const dtm = {
      currentPage: this.currentPage,
      itemsPerPage: this.itemsPerPage
    }
    const subs: Subscription = this.ss.getList(dtm).subscribe({
      next: (res: any) => {
        this.collectionSize = res.count;
        this.dataList = res.data
        this.sp.hide();
        this.as.successToast(res.message)
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });

  }

  deleteItem(i:any){
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

        const subs: Subscription = this.ss.deleteData(this.dataList[i].ID).subscribe({
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

  openModal(content: any) {
    this.suBtn = false;
    this.modalService.open(content, { centered: true , backdrop : 'static', keyboard: false, size:'md' });

  }

  openModalEdit(content: any,datas: any) {
    this.data = datas
    this.suBtn = true;
    this.modalService.open(content, { centered: true , backdrop : 'static', keyboard: false, });
  }

  copyData(val: any) {
    if (val) {
      this.data.GSTNo = this.user.Company.GSTNo;
      this.data.CINNo = this.user.Company.CINNo;
      this.data.Address = this.user.Company.Address;
      this.data.Website = this.user.Company.Website;
      this.data.Email = this.user.Company.Email;
      this.data.LogoURL = this.user.Company.LogoURL;
      this.data.PhoneNo = this.user.Company.PhoneNo;
      this.data.MobileNo1 = this.user.Company.MobileNo1;
      this.data.MobileNo2 = this.user.Company.MobileNo2; 
    }
  }
  
  onsubmit() {
    var shopdate = this.data ?? " ";
    const subs: Subscription =  this.ss.shopSave( shopdate).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.router.navigate(['/admin/shopList']); 
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
    this.getList();
    this.modalService.dismissAll()
  } 

  uploadImage(e:any, mode:any){
   
    this.img = e.target.files[0];
      // console.log(`Image size before compressed: ${this.img.size} bytes.`)
    this.compressImage.compress(this.img).pipe(take(1)).subscribe((compressedImage: any) => {
      // console.log(`Image size after compressed: ${compressedImage.size} bytes.`)
    this.fu.uploadFileComapny(compressedImage).subscribe((data:any) => {
      if (data.body !== undefined && mode === 'company') {
        this.companyImage = this.env.apiUrl + data.body?.download;
        this.data.LogoURL = data.body?.download
        this.as.successToast(data.body?.message)
      }
     });
   })

  }

  getShopById(){
    const subs: Subscription = this.ss.getShopById(this.id).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.as.successToast(res.message)
          this.data = res.data[0]
          this.companyImage = this.env.apiUrl + res.data[0].LogoURL;

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

  updateShop(){
    const subs: Subscription =  this.ss.updateShop( this.data).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.router.navigate(['/admin/shopList']);
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
      },
      error: (err: any) => {
        console.log(err.msg);
      },
      complete: () => subs.unsubscribe(),
    });
    this.modalService.dismissAll()
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
    if(data.searchQuery !== "") {
      const dtm = {
        currentPage: 1,
        itemsPerPage: 50000,
        searchQuery: data.searchQuery 
      }
      const subs: Subscription = this.ss.searchByFeild(dtm).subscribe({
        next: (res: any) => {
          this.collectionSize = res.count;
          this.page = 1;
          this.dataList = res.data
          this.sp.hide();
          this.as.successToast(res.message)
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    } else {
      this.getList();
    } 
    });
  }

  exportAsXLSX(): void {
    this.excelService.exportAsExcelFile(this.dataList, 'shop_list');
  }

}
