import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { ProductService } from 'src/app/service/product.service';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { NgxSpinnerService } from 'ngx-spinner';
import { PurchaseService } from 'src/app/service/purchase.service';
import { ShopService } from 'src/app/service/shop.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-product-transfer',
  templateUrl: './product-transfer.component.html',
  styleUrls: ['./product-transfer.component.css']
})

export class ProductTransferComponent implements OnInit {

  env = environment;
  user = JSON.parse(localStorage.getItem('user') || '');
  company = JSON.parse(localStorage.getItem('company') || '');
  shop = JSON.parse(localStorage.getItem('shop') || '');
  companysetting = JSON.parse(localStorage.getItem('companysetting') || '');
  selectedShop:any =JSON.parse(localStorage.getItem('selectedShop') || '') ;

  id: any;
  SearchBarCode: any;
  searchValue: any;
  selectedProduct: any;
  prodList:any;
  specList: any;
  shopList: any;
  shopLists: any;
  barCodeList: any;
  xferList: any;
  showAdd = false;
  shopMode = 'false';
  item: any;
  Req :any= {SearchBarCode : ''}

  ID:any
  currentPage = 1;
  itemsPerPage = 10;
  pageSize!: number;
  collectionSize = 0
  page = 4;

  selectedRowID = -1;
  tempShopArray:any = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private ps: ProductService,
    private purchaseService: PurchaseService,
    private ss: ShopService,
    public as: AlertService,
    private modalService: NgbModal,
    private sp: NgxSpinnerService,

  ){
    this.id = this.route.snapshot.params['id'];
  }

  xferItem: any = {
    ID: null, ProductName: null, Barcode: null, BarCodeCount: null, TransferCount: null,ToShopID: null, TransferFromShop: null, AcceptanceCode: null, DateStarted: null, DateCompleted: null, TransferStatus: null, CreatedBy: null, UpdatedBy: null, CreatedOn: null, UpdatedOn: null, Remark : ''
  };

  xferAccept:any = {secretCode: '', Remark:''}

  ngOnInit(): void {
    this.getProductList();
    this.dropdownShoplist();
    this.getList();
  }

  changePagesize(num: number): void {
    this.itemsPerPage = this.pageSize + num;
  }

  getList() {
    const dtm = {
      currentPage: this.currentPage,
      itemsPerPage: this.itemsPerPage,
    }
    const subs: Subscription = this.purchaseService.getTransferList(dtm).subscribe({
      next: (res: any) => {
        this.collectionSize = res.count;
        this.xferList = res.data;
        this.as.successToast(res.message)
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getProductList(){
    const subs: Subscription =  this.ps.getList().subscribe({
      next: (res: any) => {
        this.prodList = res.data;
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getFieldList(){
    const subs: Subscription =  this.ps.getFieldList(this.selectedProduct).subscribe({
       next: (res: any) => {
       this.specList = res.data;
       this.getSptTableData();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
   
  }

  getSptTableData() { 
    this.specList.forEach((element: any) => {
     if (element.FieldType === 'DropDown' && element.Ref === '0') {
       const subs: Subscription =  this.ps.getProductSupportData('0', element.SptTableName).subscribe({
         next: (res: any) => {
           element.SptTableData = res.data;   
           element.SptFilterData = res.data;  
         },
         error: (err: any) => console.log(err.message),
         complete: () => subs.unsubscribe(),
       });
     }
    });
  }

  getFieldSupportData(index:any) {
    this.specList.forEach((element: any) => {
     if (element.Ref === this.specList[index].FieldName.toString() ) {
       const subs: Subscription =  this.ps.getProductSupportData( this.specList[index].SelectedValue,element.SptTableName).subscribe({
         next: (res: any) => {
           element.SptTableData = res.data; 
           element.SptFilterData = res.data;   
         },
         error: (err: any) => console.log(err.message),
         complete: () => subs.unsubscribe(),
       });
      }
     });
     this.xferItem.ProductName = ''
     this.xferItem.Barcode = ''
     this.xferItem.BarCodeCount = ''
  }

  onChange(event: any ) {
    if (this.companysetting.DataFormat === '1') {
      event = event.toUpperCase()
    } else if (this.companysetting.DataFormat == '2') {
      event = event.toTitleCase()
    }
    return event;
  }

  dropdownShoplist(){
    const subs: Subscription = this.ss.dropdownShoplist('').subscribe({
      next: (res: any) => {
          let shop = res.data
          this.shopList = shop.filter((s:any) => s.ID !== Number(this.selectedShop[0]));
          this.shopLists = res.data
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getProductDataByBarCodeNo(){
    const subs: Subscription =  this.purchaseService.productDataByBarCodeNo(this.Req, 'false', 'false').subscribe({
      next: (res: any) => {
        this.item  = res.data;
        if (this.item.Barcode === null) {
          Swal.fire({
            icon: 'warning',
            title: 'Product Not Available in this Shop for Selected Barcode for Transfer.',
            text: ' Please Check the Barcode. ',
            footer: '',
            backdrop : false,
          });
        }else{
          this.xferItem.ProductName = (this.item.ProductTypeName + '/' +  this.item.ProductName).toUpperCase();
          this.xferItem.Barcode = this.item.Barcode;
          this.xferItem.BarCodeCount = this.item.BarCodeCount;
          this.xferItem.TransferCount = 0;
          this.xferItem.ToShopID = null;
          this.xferItem.TransferFromShop = Number(this.selectedShop[0]);
          this.xferItem.TransferStatus = "";
        }
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getBarCodeList(index:any) {
    let searchString = "";
    this.specList.forEach((element: any, i: any) => {
      if (i <= index) {
        searchString = searchString + element.SelectedValue + "/" ;
      }
    });
    const subs: Subscription =  this.purchaseService.barCodeListBySearchString(this.shopMode,this.selectedProduct, searchString).subscribe({
      next: (res: any) => {
        this.barCodeList = res.data;
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  TransferCountLimit(){
    if ( this.xferItem.TransferCount > this.xferItem.BarCodeCount ){
      Swal.fire({
        icon: 'warning',
        title: 'Opps !!',
        text: 'Transfer Count can not be more than Available Count',
        footer: '',
        backdrop : false,
      });
      this.xferItem.TransferCount = 0;
    }
  }
  
  onSubmit(){
    const subs: Subscription =  this.purchaseService.transferProduct(this.xferItem).subscribe({
      next: (res: any) => {
        this.xferList = res.data;
        if(this.xferItem.BarCodeCount - this.xferItem.TransferCount > 0) {
          this.getProductDataByBarCodeNo();
        }else{
          this.xferItem.TransferCount = 0;
          this.xferItem.BarCodeCount = 0;
          this.xferItem.AcceptanceCode = "";
        }
        this.getList();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  cancelTransfer(i:any){
    Swal.fire({
      title: 'Are you sure Cancel Product?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, Cancel it!',
      cancelButtonText: 'No'
    }).then((result) => {
      if (result.isConfirmed) {
        const subs: Subscription = this.purchaseService.cancelTransfer(this.xferList[i]).subscribe({
          next: (res: any) => {
              this.xferList = res.data; 
              this.as.successToast(res.message)
          },
          error: (err: any) => console.log(err.message),
          complete: () => subs.unsubscribe(),
        });
        Swal.fire({
          position: 'center',
          icon: 'success',
          title: 'Your file has been Cancel.',
          showConfirmButton: false,
          timer: 1200
        })
      }
    })
  }

  acceptTransfer(){
    const n = this.selectedRowID;
    if (this.xferAccept.secretCode === this.xferList[n].AcceptanceCode) {
        this.xferList[n].Remark = this.xferList[n].Remark + "  " + this.xferAccept.Remark;

      const subs: Subscription = this.purchaseService.acceptTransfer(this.xferList[n]).subscribe({
        next: (res: any) => {
          this.xferList = res.data;
          this.modalService.dismissAll();
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Your Product has been Accepted.',
            showConfirmButton: false,
            timer: 1200
          })
          this.xferAccept = [];
          this.getList();
        },
          error: (err: any) => console.log(err.message),
          complete: () => subs.unsubscribe(),
      });
    }else {
      const message = "Please check with the Sender: " + this.xferList[n].CreatedByUser + " from Shop " + this.xferList[n].FromShop + " for Product: " + this.xferList[n].ProductName;
      Swal.fire({
        icon: 'error',
        title: 'Secret Code ' + `<span style = "font-size:25px;color:red;font-weight:bold;">${this.xferAccept.secretCode}</span>` + ' Does Not Match!!!!',
        text: `${message}`,
        footer: '',
        backdrop : false,
      });
      this.xferAccept = [];
    }
  }

  openModal(content: any,data:any) {
    this.modalService.open(content, { centered: true , backdrop : 'static', keyboard: false,size: 'sm'});
  }

  FilterData(ID:any){
    if(ID !== '0') {
      this.tempShopArray = [];
      let id = 0
      if (ID === "" || ID === null || ID === undefined) {
          id = ID 
      } else{
          id = Number(this.selectedShop[0]);
      }
        const dtm = {
        id : id,
        currentPage: 1,
        itemsPerPage: 50000,
      }
      const subs: Subscription = this.purchaseService.getTransferList(dtm).subscribe({
        next: (res: any) => {
          this.collectionSize = res.count;
          this.page = 1;
          this.xferList = res.data
          this.xferList.forEach((element: any) => {
            if(element.TransferToShop === ID){
              this.tempShopArray.push(element);
            }
          });
          this.xferList = this.tempShopArray;
          this.as.successToast(res.message)
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    }else{
      const dtm = {
      ID : Number(this.selectedShop[0]),
      currentPage: 1,
      itemsPerPage: 50000,
    }
    const subs: Subscription = this.purchaseService.getTransferList(dtm).subscribe({
      next: (res: any) => {
        this.collectionSize = res.count;
        this.page = 1;
        this.xferList = res.data
        this.as.successToast(res.message)
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
    }
  }

  formReset() {
    this.specList = [];
    this.barCodeList = [];
    this.xferItem.ProductName = "";
    this.xferItem.Barcode = "";
    this.xferItem.BarCodeCount = 0;
    this.xferItem.TransferCount = 0;
    this.xferItem.TransferToShop = null;
    this.xferItem.TransferStatus = "";
    this.xferItem.ToShopID = "";
    this.SearchBarCode = "";
    this.selectedProduct = "";
    this.Req = "";
  }

  PDFtransfer(){
    this.sp.show();
    let PDFtransfer = JSON.stringify(this.xferList)    
    const subs: Subscription =  this.purchaseService.transferProductPDF(PDFtransfer).subscribe({
      next: (res: any) => {
        this.sp.hide();
        const url = this.env.apiUrl + "/uploads/" + res;
        window.open(url, "_blank");
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

}
