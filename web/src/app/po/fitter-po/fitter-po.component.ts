import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';
import { BillService } from 'src/app/service/bill.service';
import { ProductService } from 'src/app/service/product.service';
import { SupplierService } from 'src/app/service/supplier.service';
import { ShopService } from 'src/app/service/shop.service';
import { FitterService } from 'src/app/service/fitter.service';
import { SupportService } from 'src/app/service/support.service';

@Component({
  selector: 'app-fitter-po',
  templateUrl: './fitter-po.component.html',
  styleUrls: ['./fitter-po.component.css']
})
export class FitterPoComponent implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    public as: AlertService,
    private sp: NgxSpinnerService,
    public bill: BillService,
    private ps: ProductService,
    private modalService: NgbModal,
    private ss: ShopService,
    private sup: SupplierService,
    private fitters: FitterService,
    private supps: SupportService,

  ) { }

  data = { ID: '', FromDate: '', ToDate: '', FitterID: 'All', ShopID: 'All', stringProductName: '' }

  sendData: any = { supplier: null, filterList: null, supplierList: null };

  mode = "Unassigned";
  shopList: any = []
  fitterList: any = []
  orderList: any = []
  filtersList: any = [];
  lensList: any = [];
  rateCardList: any = [];

  fitter: any;
  fitterID = 'All'

  ID = 0
  currentPage = 1;
  itemsPerPage = 10;
  pageSize!: number;
  collectionSize = 0
  page = 4;

  orderFitter = false
  orderFitterbtn = true
  orderComplete = false
  Orderpower: any = []
  multiCheck: any 

  // call Api ngOnInit start 
  ngOnInit(): void {
    this.sp.show()
    this.dropdownShoplist();
    this.dropdownfitterlist();
    this.getFitterPo();
    this.getLensTypeList();
    this.sp.hide()
  }

  dropdownShoplist() {
    const subs: Subscription = this.ss.dropdownShoplist('').subscribe({
      next: (res: any) => {
        this.shopList = res.data
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
  // call Api ngOnInit end 

  multicheck($event:any) {
    for (var i = 0; i < this.orderList.length; i++) {
      const index = this.orderList.findIndex(((x: any) => x === this.orderList[i]));
      if (this.orderList[index].Sel === 0 || this.orderList[index].Sel === null || this.orderList[index].Sel === undefined) {
        this.orderList[index].Sel = 1;
        this.orderFitterbtn = false
      } else {
        this.orderList[index].Sel = 0;
        this.orderFitterbtn = true
      }
    }
    console.log($event);
  }

  validate(v:any,event:any) {
    if (v.Sel === 0 || v.Sel === null || v.Sel === undefined) {
      v.Sel = 1;
      this.orderFitterbtn = false
    } else {
      v.Sel = 0;
      this.orderFitterbtn = true
    }
  }

  
  // order pendding list 
  getFitterPo() {
    this.sp.show()
    this.orderFitter = true
    const subs: Subscription = this.bill.getFitterPo(this.ID, '').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.orderList = res.data
          this.multiCheck = false
        } else {
          this.as.errorToast(res.message)
          Swal.fire({
            position: 'center',
            icon: 'warning',
            title: 'Opps !!',
            text: res.message,
            showConfirmButton: true,
            backdrop: false,
          })
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
    this.sp.hide()
  }

  // popup opne by fitter assing 
  openModal(content: any) {
    this.sp.show()
    this.modalService.open(content, { centered: true, backdrop: 'static', keyboard: false, size: 'sm' });
    this.sp.hide()
  }

  // fitter assing droplist 
  dropdownfitterlist() {
    const subs: Subscription = this.fitters.dropdownlist().subscribe({
      next: (res: any) => {
        this.fitterList = res.data
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  // select fitter then rate to fittercost
  getRateCard() {
    let FitterID = Number(this.fitter) 
    const subs: Subscription = this.fitters.getRateCard(FitterID).subscribe({
      next: (res: any) => {
        this.rateCardList = res.data
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  // assing fitter 
  assignFitterPo(mode: any) {
    let missingType = '';
    this.sp.show()
    this.filtersList = this.orderList.filter((d: { Sel: number; }) => d.Sel === 1);

    if (this.filtersList.length > 0) {
      switch (mode) {
        case "Assign":
          this.filtersList.forEach((element: any) => {
              this.data.ID = element.BillID 
              element.FitterID = Number(this.fitter)  
              element.FitterStatus = "assign fitter"
              element.Remark =  element.Remark ? element.Remark : ''

              const i = this.rateCardList.findIndex((ele: any, i: any) => {
                return  ele.LensType === element.LensType
            })
            if (i === -1){
              missingType = missingType + element.LensType + " "; 
            } 
            else {
              element.FitterCost = this.rateCardList[i].Rate;
            }  
          });
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Your Per-Order Fitter To Assign !!',
            showConfirmButton: false,
            timer: 1200
          })
          break;
      }

      let Body = this.filtersList;

      const subs: Subscription = this.bill.assignFitterPo(Body).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.modalService.dismissAll()
            this.multiCheck = true
            this.fitter = ''
            this.assignFitterDoc() 
            this.getFitterPo()

          } else {
            this.as.errorToast(res.message)
          }
          this.sp.hide()
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    }
    this.sp.hide()
  }

  // order done 
  getList() {
    this.sp.show()
    const subs: Subscription = this.bill.getFitterPoList(this.ID,'').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.collectionSize = res.count;
          this.orderList = res.data;
          this.as.successToast(res.message)
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
    this.sp.hide()
  }

  // order cancel 
  assignFitterPoCancel(mode: any) {
    this.sp.show()
    this.filtersList = this.orderList.filter((d: { Sel: number; }) => d.Sel === 1);

    if (this.filtersList.length > 0) {
      switch (mode) {
        case "Cancel":
          this.filtersList.forEach((element: any) => {
            this.data.ID = element.BillID;
            element.LensType = "";
            element.FitterCost = '0';
            element.FitterID = '0'
            element.FitterStatus = "initiate"
          });
          this.orderFitter = false
          this.orderComplete = true
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Your Order Cancel !!',
            showConfirmButton: false,
            timer: 1200
          })
          break;
      }

      let Body = this.filtersList;

      const subs: Subscription = this.bill.assignFitterPo(Body).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.multiCheck = true
            this.getList()
            this.as.successToast(res.message)
          } else {
            this.as.errorToast(res.message)
          }
          this.sp.hide()
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    }
    this.sp.hide()
  }

  // fitter doc No  
  assignFitterDoc() {
    this.sp.show()
    this.filtersList = this.orderList.filter((d: { Sel: number; }) => d.Sel === 1);
          this.filtersList.forEach((element: any) => {
            this.data.ID = element.BillID 
            element.FitterID = Number(this.fitter)  
            element.Sel = element.Sel;
            element.Remark =  element.Remark
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
            this.as.successToast(res.message)
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
  
  // top buttons to function
  Assigned() {
    this.getList()
    this.orderFitter = false
    this.orderComplete = true
    this.data = { ID: '', FromDate: '', ToDate: '', FitterID: 'All', ShopID: 'All', stringProductName: '' }
  }

 // top buttons to function
  Unassigned() {
    this.getFitterPo()
    this.orderFitter = true
    this.orderComplete = false
    this.data = { ID: '', FromDate: '', ToDate: '', FitterID: 'All', ShopID: 'All', stringProductName: '' }
  }

  // power popup
  openModal1(content1: any, data: any) {
    this.sp.show()
    if (data.MeasurementID == "undefined") {
      Swal.fire({
        icon: 'warning',
        title: 'Customer Power Not Be Found',
        text: '',
        footer: '',
        backdrop: false,
      });
    } else {
      this.Orderpower = JSON.parse(data.MeasurementID)
      this.modalService.open(content1, { centered: true, backdrop: 'static', keyboard: false, size: 'md' });
    }
    this.sp.hide()
  }

  // Search list
  Search(mode: any) {
    this.sp.show()

    let ID = 0
    let Parem = '';

    if (this.data.FromDate !== '' && this.data.FromDate !== null) {
      let FromDate = moment(this.data.FromDate).format('YYYY-MM-DD')
      Parem = Parem + 'and billmaster.BillDate between ' + `'${FromDate}'`;
    }

    if (this.data.ToDate !== '' && this.data.ToDate !== null) {
      let ToDate = moment(this.data.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'`;
    }
  
    if (this.fitterID !== null && this.fitterID !== 'All') {
      Parem = Parem + ' and barcodemasternew.FitterID = ' + this.fitterID;
    }

    if (this.data.ShopID !== null && this.data.ShopID !== 'All') {
      Parem = Parem + ' and barcodemasternew.ShopID = ' + this.data.ShopID;
    }

    if (this.data.stringProductName !== '') {
      Parem = Parem + ' and billdetail.ProductTypeName = ' +  `'${this.data.stringProductName}'`;
    }


      if (this.orderComplete === false) {
        const subs: Subscription = this.bill.getFitterPo(ID, Parem).subscribe({
          next: (res: any) => {
            if (res.success) {
              this.orderList = res.data
              this.as.successToast(res.message)
            } else {
              this.as.errorToast(res.message)
            }
            this.sp.hide()
          },
          error: (err: any) => console.log(err.message),
          complete: () => subs.unsubscribe(),
        });
      } else {
      
        const subs: Subscription = this.bill.getFitterPoList(ID, Parem).subscribe({
          next: (res: any) => {
            if (res.success) {
              this.collectionSize = 1;
              this.page = 1;
              this.orderList = res.data;
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

    this.sp.hide()
  }

  // reset form befor Search 
  Reset() {
    this.data = { ID: '', FromDate: '', ToDate: '', FitterID: 'All', ShopID: 'All', stringProductName: '' }
    // this.Search(this.mode);
  }

}
