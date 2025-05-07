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
  company = JSON.parse(localStorage.getItem('company') || '');
  shop: any = JSON.parse(localStorage.getItem('shop') || '');
  selectedShop: any = JSON.parse(localStorage.getItem('selectedShop') || '');
  user: any = JSON.parse(localStorage.getItem('user') || '');
  companySetting: any = JSON.parse(localStorage.getItem('companysetting') || '[]');
  env = environment;

  
  public parseMeasurementID(v: any): any[] {
    return JSON.parse(v.MeasurementID || '[]');
  }
  
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
  lensList: any;
  rateCardList: any = [];

  fitter: any = '';
  fitterID = 'All'

  ID = 0
  currentPage = 1;
  itemsPerPage = 10;
  pageSize!: number;
  collectionSize = 0
  page = 4;

  orderFitter = false
  assginfitterbtn = true
  orderFitterbtn = true
  orderComplete = false
  Orderpower: any = []
  multiCheck: any;
  supllierPDF= ''
  totalQty:any = 0;
  PdfDisabled = false
  // call Api ngOnInit start 
  ngOnInit(): void {
    this.sp.show()
    if (this.user.UserGroup === 'Employee') {
      this.shopList = this.shop;
      this.data.ShopID = this.shopList[0].ShopID
    } else {
      this.dropdownShoplist();
      // this.getFitterPo();
    }
    this.dropdownfitterlist();
    this.getLensTypeList();
    this.sp.hide();
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
          this.lensList = res.data.sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }
  // call Api ngOnInit end 

  multicheck($event: any) {
    for (var i = 0; i < this.orderList.length; i++) {
      const index = this.orderList.findIndex(((x: any) => x === this.orderList[i]));
      if (this.orderList[index].Sel === 0 || this.orderList[index].Sel === null || this.orderList[index].Sel === undefined) {
        this.orderList[index].Sel = 1;
        this.orderFitterbtn = false
        this.assginfitterbtn = false
      } else {
        this.orderList[index].Sel = 0;
        this.orderFitterbtn = true
        this.assginfitterbtn = true
      }
    }
    this.check('')
  }

  validate(v: any, event: any) {
    if (v.Sel === 0 || v.Sel === null || v.Sel === undefined) {
      v.Sel = 1;
      this.orderFitterbtn = false
      this.assginfitterbtn = false
    } else {
      v.Sel = 0;
      this.orderFitterbtn = true
      this.assginfitterbtn = true
    }
    this.check(v)
  }

  // order pendding list 
  getFitterPo() {
    this.sp.show()
    let Parem = '';
    this.orderFitter = true
    if (this.user.UserGroup === 'Employee') {
      Parem = Parem + ' and barcodemasternew.ShopID = ' + this.data.ShopID;
    } else {
      Parem = '';
    }
    const subs: Subscription = this.bill.getFitterPo(this.ID, Parem).subscribe({
      next: (res: any) => {
        if (res.success) {
          res.data.forEach((element: any) => {
            if (element.ProductTypeName !== 'LENS' && (element.LensType === null || element.LensType === '')) {
              element.LensType = 'NO';
            }else{
              element.LensType = '';
            }
          });
          this.orderList = res.data;

          this.orderList = res.data
          this.totalQty = res.sumQty
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
        this.fitterList = res.data.sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  // select fitter then rate to fittercost
  getRateCard() {
    this.sp.show()
    let FitterID = Number(this.fitter)
    const subs: Subscription = this.fitters.getRateCard(FitterID).subscribe({
      next: (res: any) => {
        this.rateCardList = res.data
        if (this.rateCardList.length === 0) {
          this.fitter = ''
          Swal.fire({
            icon: 'error',
            title: 'Can not Assign Fitter as Selected Fitter Does not have Rates Available for LensType !!!',
            footer: '',
            backdrop: false,
            showCancelButton: true,
          });
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  calculateFitterCost(lensType: string): number {
    const rateCardItem = this.rateCardList.find((ele: any) => ele.LensType === lensType);
    return rateCardItem ? rateCardItem.Rate : 0;
  }

  // assing fitter 
  assignFitterPo(mode: any) {
    let missingType = '';
    this.sp.show()
    this.filtersList = this.orderList.filter((d: any) => d.Sel === 1);

    if (this.filtersList.length > 0) {
      switch (mode) {
        case "Assign":
          this.filtersList.forEach((element: any) => {
          this.data.ID = element.BillID;
          element.FitterID = Number(this.fitter);
          element.FitterStatus = "assign fitter";
          element.Remark = element.Remark ? element.Remark : '';

          const i = this.rateCardList.findIndex((ele: any) => ele.LensType === element.LensType);

          if (i === -1) {
            missingType = missingType + element.LensType + " ";
          } else if (element.LensType == '' || element.LensType == null) {
            element.LensType = 'NO';
          } else {
            element.FitterCost = this.calculateFitterCost(element.LensType);
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
            this.fitterID = 'All'
            this.data = { ID: '', FromDate: '', ToDate: '', FitterID: 'All', ShopID: 'All', stringProductName: '' }
            this.multiCheck = true
            this.assginfitterbtn = true
            this.orderList = []
            this.totalQty = 0
            this.assignFitterDoc()


          } else {
            this.as.errorToast(res.message)
          }
          this.sp.hide()
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    }
  }

  // order done 
  getList() {
    this.sp.show()
    const subs: Subscription = this.bill.getFitterPoList(this.ID, '').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.collectionSize = res.count;
          this.orderList = res.data;
          this.totalQty = res.sumQty
          this.multiCheck = false
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

  // order All prosecc this function order cancel/ qc check/ qc cancel/ Complete 
  assignAllFitterPo(mode: any) {
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
            element.Remark = element.Remark ? element.Remark : ''
          });
          this.orderFitter = false
          this.orderComplete = true
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Your Per-Order Fitter Order Cancel !!',
            showConfirmButton: false,
            timer: 1200
          })
          break;

        case "QcCheck":
          this.filtersList.forEach((element: any) => {
            element.Sel = element.Sel
            element.BillID = element.BillID
            element.LensType = element.LensType
            element.FitterCost = element.FitterCost
            element.FitterID = element.FitterID
            element.FitterStatus = "qc check"
            element.Remark = element.Remark ? element.Remark : ''
          });
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Your Per-Order Fitter To QC Check !!',
            showConfirmButton: false,
            timer: 1200
          })
          break;

        case "QCCancel":
          this.filtersList.forEach((element: any) => {
            element.Sel = element.Sel
            element.BillID = element.BillID
            element.LensType = element.LensType
            element.FitterCost = element.FitterCost
            element.FitterID = element.FitterID
            element.FitterStatus = "qc cancel"
            element.Remark = element.Remark ? element.Remark : ''
          });
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Your Per-Order Fitter To QC cancel !!',
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
            this.orderFitterbtn = true
            this.getList()
            // this.as.successToast(res.message)
          } else {
            this.as.errorToast(res.message)
          }
          this.sp.hide()
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    }
  }

  completePo(mode: any) {
    this.filtersList = this.orderList.filter((d: { Sel: number; }) => d.Sel === 1);

    if (this.filtersList.length > 0) {
      Swal.fire({
        title: 'Are you sure? <br> You have not been able to edit anything after completing !!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, complete it!',
        backdrop: false,
      }).then((result) => {
        if (result.isConfirmed) {
          this.sp.show()
          switch (mode) {
            case "Complete":
              this.filtersList.forEach((element: any) => {
                element.Sel = element.Sel
                element.BillID = element.BillID
                element.LensType = element.LensType
                element.FitterCost = element.FitterCost
                element.FitterID = element.FitterID
                element.FitterStatus = "complete"
                element.Remark = element.Remark ? element.Remark : ''
              });
              Swal.fire({
                position: 'center',
                icon: 'success',
                title: 'Your Per-Order Fitter Process Are Complete !!',
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
                this.orderFitterbtn = true
                this.getList()
                // this.as.successToast(res.message)
              } else {
                this.as.errorToast(res.message)
              }
              this.sp.hide()
            },
            error: (err: any) => console.log(err.message),
            complete: () => subs.unsubscribe(),
          });
        }
      })
    }
  }

  // fitter doc No  
  assignFitterDoc() {
    this.sp.show()
    this.filtersList = this.orderList.filter((d: { Sel: number; }) => d.Sel === 1);
    this.filtersList.forEach((element: any) => {
      this.data.ID = element.BillID
      element.FitterID = Number(this.fitter)
      element.Sel = element.Sel;
      element.Remark = element.Remark
      if (element.FitterDocNo === '' || element.FitterDocNo === null || element.FitterDocNo === undefined) {
        element.FitterDocNo = 'NA'
      } else {
        element.FitterDocNo = element.FitterDocNo;
      }
    });
    let Body = this.filtersList;

    const subs: Subscription = this.bill.assignFitterDoc(Body).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.multiCheck = true
          this.orderFitterbtn = true
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

  // top buttons to function
  Assigned() {
    this.orderFitter = false
    this.orderComplete = true
    this.orderFitterbtn = true
    this.getList();
    if (this.user.UserGroup === 'Employee') {
      this.data = { ID: '', FromDate: '', ToDate: '', FitterID: 'All', ShopID: this.data.ShopID, stringProductName: '' }
    } else {
      this.data = { ID: '', FromDate: '', ToDate: '', FitterID: 'All', ShopID: 'All', stringProductName: '' }
    }
  }

  // top buttons to function
  Unassigned() {
    // this.getFitterPo()
    this.orderFitter = true
    this.orderComplete = false
    this.orderList = []
    this.totalQty = 0;
    this.fitterID = 'All'
    if (this.user.UserGroup === 'Employee') {
      this.data = { ID: '', FromDate: '', ToDate: '', FitterID: 'All', ShopID: this.data.ShopID, stringProductName: '' }
    } else {
      this.data = { ID: '', FromDate: '', ToDate: '', FitterID: 'All', ShopID: 'All', stringProductName: '' }
    }

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
    this.PdfDisabled = false
    let ID = 0
    let Parem = '';

    if (this.data.FromDate !== '' && this.data.FromDate !== null) {
      let FromDate = moment(this.data.FromDate).format('YYYY-MM-DD')
      Parem = Parem + 'and DATE_FORMAT(billmaster.BillDate, "%Y-%m-%d")  between ' + `'${FromDate}'`;
    }

    if (this.data.ToDate !== '' && this.data.ToDate !== null) {
      let ToDate = moment(this.data.ToDate).format('YYYY-MM-DD')
      Parem = Parem + ' and ' + `'${ToDate}'`;
    }

    if (this.fitterID !== null && this.fitterID !== 'All') {
      this.PdfDisabled = true
      Parem = Parem + ' and barcodemasternew.FitterID = ' + this.fitterID;
    }

    if (this.data.ShopID !== null && this.data.ShopID !== 'All') {
      Parem = Parem + ' and barcodemasternew.ShopID = ' + this.data.ShopID;
    }

    if (this.data.stringProductName !== '') {
      Parem = Parem + ' and billdetail.ProductTypeName = ' + `'${this.data.stringProductName}'`;
    }


    if (this.orderComplete === false) {
      const subs: Subscription = this.bill.getFitterPo(ID, Parem).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.orderList = res.data
            this.totalQty = res.sumQty
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
            this.totalQty = res.sumQty
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
  }

  // reset form befor Search 
  Reset() {
    this.data = { ID: '', FromDate: '', ToDate: '', FitterID: 'All', ShopID: 'All', stringProductName: '' }
    // this.Search(this.mode);
  }

  check(v: any) {
    this.orderList.forEach((ele: any) => {
      if (ele.Sel === 1 && ele.LensType === '' || ele.LensType === null) {
        this.assginfitterbtn = true;
      } else if (ele.Sel === 1 && ele.LensType !== '' || ele.LensType !== null) {
        this.assginfitterbtn = false;
      }
    })

  }

  AssignFitterPDF() {
    this.sp.show();
    this.filtersList = this.orderList.filter((d: any) => d.Sel === 1);
    if (this.filtersList.length > 0) {
      let body: any = { productList: this.filtersList }
      const subs: Subscription = this.bill.AssignFitterPDF(body).subscribe({
        next: (res: any) => {
          if (res) {
            const url = this.env.apiUrl + "/uploads/" + res;
            this.supllierPDF = url
            window.open(url, "_blank");
          } else {
            this.as.errorToast(res.message)
          }
          this.sp.hide();
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    }
  }

  dateFormat(date: any): string {
    if (date == null || date == "") {
      return '0000-00-00'; // Default Value
    }
    return moment(date).format(this.companySetting?.DateFormat || 'YYYY-MM-DD');
  }

  sendWhatsapp(mode: any) {
    let temp = JSON.parse(this.companySetting.WhatsappSetting);
    let s: any = []

    this.fitterList.forEach((sk: any) => {
      if (this.filtersList[0].FitterID === sk.ID) {
        s.push(sk)
      }
    })

    this.shop = this.shop.filter((sh: any) => sh.ID === Number(this.selectedShop[0]));

    let WhatsappMsg = '';

    WhatsappMsg = 'Fitting details ';
    var msg = `*Hi ${s[0].Name},*%0A` +
      `${WhatsappMsg}%0A` +
      `*Customer Fitting details PDF*: ${this.supllierPDF}%0A` +
      `*${this.shop[0].Name}* - ${this.shop[0].AreaName}%0A${this.shop[0].MobileNo1}%0A${this.shop[0].Website}`;


    if (s[0].MobileNo1 != '') {
      var mob = this.company.Code + s[0].MobileNo1;
      var url = `https://wa.me/${mob}?text=${msg}`;
      window.open(url, "_blank");
    } else {
      Swal.fire({
        position: 'center',
        icon: 'warning',
        title: '<b>' + s[0].Name + '</b>' + ' Mobile number is not available.',
        showConfirmButton: true,
      })
    }
  }
}
