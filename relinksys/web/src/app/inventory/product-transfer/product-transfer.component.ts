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
import * as moment from 'moment';
import { BillService } from 'src/app/service/bill.service';
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
  companySetting = JSON.parse(localStorage.getItem('companysetting') || '');
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
  Req :any= {SearchBarCode : '', searchString: '', SupplierID:0}

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
    public bill: BillService,
  ){
    this.id = this.route.snapshot.params['id'];
  }

  xferItem: any = {
    ID: null, ProductName: null, Barcode: null, BarCodeCount: null, TransferCount: null,ToShopID: null, TransferFromShop: null, AcceptanceCode: null, DateStarted: null, DateCompleted: null, TransferStatus: null, CreatedBy: null, UpdatedBy: null, CreatedOn: null, UpdatedOn: null, Remark : ''
  };

  xferAccept:any = {secretCode: '', Remark:''}

  ngOnInit(): void {
    // this.getProductList();
      this.bill.productLists$.subscribe((list:any) => {
      this.prodList = list
    });
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
    this.sp.show()
    const subs: Subscription = this.purchaseService.getTransferList(dtm).subscribe({
      next: (res: any) => {
        if(res.success){
          this.collectionSize = res.count;
          res.data.forEach((el: any) => {
            el.DateStarted = moment(el.DateStarted).format(`${this.companySetting.DateFormat}`);
          })
          this.xferList = res.data;
          this.as.successToast(res.message)
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getProductList(){
    const subs: Subscription =  this.ps.getList().subscribe({
      next: (res: any) => {
        if(res.success){
          this.prodList = res.data.sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
        }else{
          this.as.errorToast(res.message)
        }
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getFieldList(){
    const subs: Subscription =  this.ps.getFieldList(this.selectedProduct).subscribe({
       next: (res: any) => {
        if(res.success){
          this.specList = res.data;
          this.getSptTableData();
        }else{
          this.as.errorToast(res.message)
        }
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
          if(res.success){
            element.SptTableData = res.data.sort((a: { TableValue: string; }, b: { TableValue: any; }) => (a.TableValue.trim()).localeCompare(b.TableValue));
            element.SptFilterData = res.data.sort((a: { TableValue: string; }, b: { TableValue: any; }) => (a.TableValue.trim()).localeCompare(b.TableValue));
          }else{
            this.as.errorToast(res.message)
          }
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
          if(res.success){
            element.SptTableData = res.data.sort((a: { TableValue: string; }, b: { TableValue: any; }) => (a.TableValue.trim()).localeCompare(b.TableValue));
            element.SptFilterData = res.data.sort((a: { TableValue: string; }, b: { TableValue: any; }) => (a.TableValue.trim()).localeCompare(b.TableValue));
          }else{
            this.as.errorToast(res.message)
          }
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
    if (this.companySetting.DataFormat === '1') {
      event = event.toUpperCase()
    } else if (this.companySetting.DataFormat == '2') {
      event = event.toTitleCase()
    }
    return event;
  }

  dropdownShoplist(){
    this.sp.show()
    const datum = {
      currentPage: 1,
      itemsPerPage: 100
    }
    const subs: Subscription = this.ss.getList(datum).subscribe({
      next: (res: any) => {
        if(res.success){
          let shop = res.data
          this.shopList = shop.filter((s:any) => s.ID !== Number(this.selectedShop[0]));
          this.shopLists = res.data
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  productSelect(data:any){
    this.Req.searchString = data.ProductName
    if(data !== undefined){
      this.Req.SupplierID = data.SupplierID;
    }else{
      this.Req.SupplierID = 0
    }
    this.getProductDataByBarCodeNo()
  }

  getProductDataByBarCodeNo(){
    this.sp.show()
    const subs: Subscription =  this.purchaseService.productDataByBarCodeNo(this.Req, 'false', 'false').subscribe({
      next: (res: any) => {
        if(res.success){
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
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getBarCodeList(index:any) {
    let searchString = "";
    this.specList.forEach((element: any, i: any) => {
      if (i <= index) {
        
        let valueToAdd = element.SelectedValue ;
        valueToAdd = valueToAdd.replace(/^\d+_/, "");
        searchString = searchString + valueToAdd.trim() + "/" ;
          
      }
    });
    const subs: Subscription =  this.purchaseService.barCodeListBySearchString(this.shopMode,this.selectedProduct, searchString.toString()).subscribe({
      next: (res: any) => {
        if(res.success){
          this.barCodeList = res.data;
        }else{
          this.as.errorToast(res.message)
        }
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
    this.sp.show()
    const subs: Subscription =  this.purchaseService.transferProduct(this.xferItem).subscribe({
      next: (res: any) => {
        if(res.success){
          this.xferList = res.data;
          if(this.xferItem.BarCodeCount - this.xferItem.TransferCount > 0) {
            this.getProductDataByBarCodeNo();
          }else{
            this.xferItem.TransferCount = 0;
            this.xferItem.BarCodeCount = 0;
            this.xferItem.AcceptanceCode = "";
          }
          this.getList();
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide()
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
        this.sp.show()
        const subs: Subscription = this.purchaseService.cancelTransfer(this.xferList[i]).subscribe({
          next: (res: any) => {
            if(res.success){
              this.xferList = res.data; 
              this.as.successToast(res.message)
              Swal.fire({
                position: 'center',
                icon: 'success',
                title: 'Your file has been Cancel.',
                showConfirmButton: false,
                timer: 1200
              })
            }else{
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

  acceptTransfer(){
    this.sp.show()
    const n = this.selectedRowID;
    if (this.xferAccept.secretCode === this.xferList[n].AcceptanceCode) {
        this.xferList[n].Remark = this.xferList[n].Remark + "  " + this.xferAccept.Remark;

      const subs: Subscription = this.purchaseService.acceptTransfer(this.xferList[n]).subscribe({
        next: (res: any) => {
          if(res.success){
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
          }
          this.sp.hide()
        },
          error: (err: any) => console.log(err.message),
          complete: () => subs.unsubscribe(),
      });
    }else {
      this.sp.hide()
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
    this.sp.show()
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
          if(res.success){
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
          }else{
            this.as.successToast(res.message)
          }
          this.sp.hide()
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
        if(res.success){
          this.collectionSize = res.count;
          this.page = 1;
          this.xferList = res.data
          this.as.successToast(res.message)
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide()
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
        if(res){
          const url = this.env.apiUrl + "/uploads/" + res;
          window.open(url, "_blank");
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

}
