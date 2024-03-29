import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { ShopService } from 'src/app/service/shop.service';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { FileUploadService } from 'src/app/service/helpers/file-upload.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { map, filter, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { fromEvent } from 'rxjs';
import { take } from 'rxjs/operators';
import { CompressImageService } from 'src/app/service/helpers/compress-image.service';
import { ExcelService } from 'src/app/service/helpers/excel.service';


@Component({
  selector: 'app-shop-list',
  templateUrl: './shop-list.component.html',
  styleUrls: ['./shop-list.component.css']
})
export class ShopListComponent implements OnInit {

  @ViewChild('searching') searching: ElementRef | any;
  env = environment;
  gridview = true;
  term = "";
  company = JSON.parse(localStorage.getItem('company') || '');
  user = JSON.parse(localStorage.getItem('user') || '');
  reactiveForm!: FormGroup;
  toggleChecked = false
  companyImage: any;
  img: any;
  id: any;
  dataList: any;
  currentPage = 1;
  itemsPerPage = 10;
  pageSize!: number;
  collectionSize = 0
  page = 4;
  suBtn = true;

  data: any = {
    ID: null, CompanyID: null, Name: '', AreaName: '', MobileNo1: '', MobileNo2: '', PhoneNo: '', Address: '',
    Email: '', Website: '', GSTNo: '', CINNo: '', BarcodeName: '', Discount: false, GSTnumber: false, LogoURL: '', HSNCode: false, CustGSTNo: false, Rate: false, Discounts: false, Tax: false, SubTotal: false, Total: false, BillShopWise: false, ShopTiming: 'MON-SAT 10 AM - 8 PM, SUN OFF', WelcomeNote: 'No Terms and Conditions', Status: 1, CreatedBy: null, CreatedOn: null, UpdatedBy: null, UpdatedOn: null, ShopStatus: 0,
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
        if(res.success){
          this.collectionSize = res.count;
          this.dataList = res.data
          this.dataList.forEach((element: { LogoURL: any; }) => {
            if (element.LogoURL !== "null" && element.LogoURL !== '') {
              element.LogoURL = (this.env.apiUrl + element.LogoURL);
            } else {
              element.LogoURL = "/assets/images/userEmpty.png"
            }
          });
          this.as.successToast(res.message)
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
        this.sp.show();
        const subs: Subscription = this.ss.deleteData(this.dataList[i].ID).subscribe({
          next: (res: any) => {
            if(res.success){
              this.getList()
              this.as.successToast(res.message)
              Swal.fire({
                position: 'center',
                icon: 'success',
                title: 'Your file has been deleted.',
                showConfirmButton: false,
                timer: 1000
              })
            }else{
              this.as.errorToast(res.message)
            }
            this.sp.hide();
          },
          error: (err: any) => console.log(err.message),
          complete: () => subs.unsubscribe(),
        });
      }
    })
  }

  openModal(content: any) {
    // if (this.dataList.length >= this.company.NoOfShops){
    //   Swal.fire({
    //     icon: 'warning',
    //     title: 'You can not create shop !! <br> New shop can not be added as your plan does not allow. ',
    //     footer: '',
    //     backdrop : false,
    //   });
    // }else{
    //   this.suBtn = false;
    //   this.modalService.open(content, { centered: true, backdrop: 'static', keyboard: false, size: 'md' });
    // }
        this.companyImage = '';
        this.suBtn = false;
        this.modalService.open(content, { centered: true, backdrop: 'static', keyboard: false, size: 'md' });
  }

  openModalEdit(content: any, datas: any) {
    this.suBtn = true;
    this.modalService.open(content, { centered: true, backdrop: 'static', keyboard: false, });
    this.companyImage = datas.LogoURL;
    this.data = datas
    if(datas.length !== 0){
      if(datas.Discount === 'true') {
       this.data.Discount = true;
     } else if (datas.Discount === 'false' ) {
       this.data.Discount = false;
     }
     if(datas.GSTnumber === 'true') {
       this.data.GSTnumber = true;
     } else if (datas.GSTnumber === 'false' ) {
       this.data.GSTnumber = false;
     }
     if(datas.HSNCode === 'true') {
      this.data.HSNCode = true;
     } else if (datas.HSNCode === 'false' ) {
      this.data.HSNCode = false;
     }
     if(datas.CustGSTNo === 'true') {
      this.data.CustGSTNo = true;
     } else if (datas.CustGSTNo === 'false' ) {
      this.data.CustGSTNo = false;
     }
     if(datas.Rate === 'true') {
      this.data.Rate = true;
     } else if (datas.Rate === 'false' ) {
      this.data.Rate = false;
     }
     if(datas.Discounts === 'true') {
      this.data.Discounts = true;
     } else if (datas.Discounts === 'false' ) {
      this.data.Discounts = false;
     }
     if(datas.Tax === 'true') {
      this.data.Tax = true;
     } else if (datas.Tax === 'false' ) {
      this.data.Tax = false;
     }
     if(datas.SubTotal === 'true') {
      this.data.SubTotal = true;
     } else if (datas.SubTotal === 'false' ) {
      this.data.SubTotal = false;
     }
     if(datas.Total === 'true') {
      this.data.Total = true;
     } else if (datas.Total === 'false' ) {
      this.data.Total = false;
     }
     if(datas.BillShopWise === 'true') {
      this.data.BillShopWise = true;
     } else if (datas.BillShopWise === 'false' ) {
      this.data.BillShopWise = false;
     }

    }
  }

  copyData(val: any) {
    if (val) {
      this.data.Name = this.company.Name;
      this.data.GSTNo = this.company.GSTNo;
      this.data.CINNo = this.company.CINNo;
      this.data.Address = this.company.Address;
      this.data.Website = this.company.Website;
      this.data.Email = this.company.Email;
      this.data.LogoURL = this.company.LogoURL;
      this.data.PhoneNo = this.company.PhoneNo;
      this.data.MobileNo1 = this.company.MobileNo1;
      this.data.MobileNo2 = this.company.MobileNo2;
    }
  }

  onsubmit() {
    var shopdate = this.data ?? " ";
    const subs: Subscription = this.ss.shopSave(shopdate).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.formReset()
          this.modalService.dismissAll()
          this.getList();
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
          if(res.message){
            Swal.fire({
              position: 'center',
              icon: 'warning',
              title: 'Opps !!',
              text: res.message,
              showConfirmButton: true,
              backdrop : false,
            })
          }
        }
      },
      error: (err: any) => {
        console.log(err.msg);
      },
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
          this.data.LogoURL = data.body?.download
          this.as.successToast(data.body?.message)
        }
      });
    })

  }

  getShopById() {
    this.sp.show()
    const subs: Subscription = this.ss.getShopById(this.id).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.as.successToast(res.message)
          this.data = res.data[0]
          this.companyImage = this.env.apiUrl + res.data[0].LogoURL;
        } else {
          this.as.errorToast(res.message)
        }
      this.sp.hide()
      },
      error: (err: any) => {
        console.log(err.message);
      },
      complete: () => subs.unsubscribe(),
    })
    this.sp.hide()
  }

  updateShop() {
    this.sp.show()
    const subs: Subscription = this.ss.updateShop(this.data).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.formReset()
          this.modalService.dismissAll()
          this.getList();
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
      this.sp.hide()
      },
      error: (err: any) => {
        console.log(err.msg);
      },
      complete: () => subs.unsubscribe(),
    });
    this.sp.hide()
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
            this.sp.hide()
          },
          error: (err: any) => console.log(err.message),
          complete: () => subs.unsubscribe(),
        });
      } else {
        this.getList();
      }
    });
    this.sp.hide()
  }

  exportAsXLSX(): void {
    let data = this.dataList.map((e: any) => {
      return{
        Name: e.Name,
        AreaName: e.AreaName,
        MobileNo1 : e.MobileNo1,
        MobileNo2 : e.MobileNo2,
        PhoneNo : e.PhoneNo,
        Email : e.Email,
        Website : e.Website,
        GSTNo : e.GSTNo,
        CINNo : e.CINNo,
        ShopTiming : e.ShopTiming,
        CreatedPerson : e.CreatedPerson,
        UpdatedPerson : e.UpdatedPerson,
      }
    })
    this.excelService.exportAsExcelFile(data, 'shop_list');
  }

  formReset() {
    this.data = {
      ID: null, CompanyID: null, Name: '', AreaName: '', MobileNo1: '', MobileNo2: '', PhoneNo: '', Address: '',
      Email: '', Website: '', GSTNo: '', CINNo: '', BarcodeName: '', Discount: false, GSTnumber: false, LogoURL: '', HSNCode: false, CustGSTNo: false, Rate: false, Discounts: false, Tax: false, SubTotal: false, Total: false, ShopTiming: 'MON-SAT 10 AM - 8 PM, SUN OFF', WelcomeNote: 'No Terms and Conditions', Status: 1, CreatedBy: null, CreatedOn: null, UpdatedBy: null, UpdatedOn: null, ShopStatus: 0,
    };
    this.toggleChecked = false
  }

}
