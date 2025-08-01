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
  selector: 'app-transfer-product-invoice',
  templateUrl: './transfer-product-invoice.component.html',
  styleUrls: ['./transfer-product-invoice.component.css']
})
export class TransferProductInvoiceComponent implements OnInit {

  env = environment;
  user = JSON.parse(localStorage.getItem('user') || '');
  company = JSON.parse(localStorage.getItem('company') || '');
  shop = JSON.parse(localStorage.getItem('shop') || '');
  companySetting = JSON.parse(localStorage.getItem('companysetting') || '');
  selectedShop: any = JSON.parse(localStorage.getItem('selectedShop') || '');
  id: any;

  constructor(private router: Router,
    private route: ActivatedRoute,
    private ps: ProductService,
    private purchaseService: PurchaseService,
    private ss: ShopService,
    public as: AlertService,
    private modalService: NgbModal,
    public bill: BillService,
    private sp: NgxSpinnerService,) {
    this.id = this.route.snapshot.params['id'];
  }

  Req: any = { SearchBarCode: '', searchString: '', SupplierID: 0 }

  xferItem: any = {
    ID: null, CompanyID: null, ProductName: null, Barcode: null, BarCodeCount: null, TransferStatus: 'Transfer Initiated', TransferCount: null, TransferToShop: null, TransferFromShop: null, Remark: '', CreatedBy: null, UpdatedBy: null, CreatedOn: null, UpdatedOn: null
  };

  xferMaster: any = {
    ID: null, CompanyID: null, InvoiceNo: '', Quantity: 0, AcceptanceCode: null, TransferStatus: 'Transfer Initiated', TransferToShop: null, TransferFromShop: null, Remark: '', Status: 1, CreatedBy: null, UpdatedBy: null, CreatedOn: null, UpdatedOn: null,
  };

  xferAccept:any = {secretCode: '', Remark:''}

  data: any = { xMaster: null, xDetail: null, };
  tempItem = { xferItem: null, Spec: null };

  SearchBarCode: any;
  searchValue: any;
  selectedProduct: any;
  prodList: any;
  specList: any;
  shopList: any;
  shopLists: any;
  barCodeList: any;
  xferList: any = [];
  showAdd = false;
  shopMode = 'false';
  item: any;
  loginShop: any;

  ToShop:any=[]
  FromShop:any=[]
  toShop:any=[]
  toShopdisabled = false
  ngOnInit(): void {
    // this.getProductList();
     this.bill.productLists$.subscribe((list:any) => {
      this.prodList = list
    });
    this.dropdownShoplist();
    [this.loginShop] = this.shop.filter((s: any) => s.ID === Number(this.selectedShop[0]));
    if(this.id != 0){
      this.bulkTransferProductByID()
    }
  }


  bulkTransferProductByID() {
    this.sp.show();
    const subs: Subscription = this.purchaseService.bulkTransferProductByID(this.id).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.toShopdisabled = true
          this.xferMaster = res.data.master[0]
          this.xferMaster.CreatedOn = moment(this.xferMaster.CreatedOn).format('DD-MM-YYYY hh:mm:ss A');
          this.xferList = res.data.data
          this.as.successToast(res.message)
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => {
        console.log(err.message);
      },
      complete: () => subs.unsubscribe(),
    })
  }


  getProductList() {
    const subs: Subscription = this.ps.getList().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.prodList = res.data.sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
        } else {
          this.as.errorToast(res.message)
        }
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getFieldList() {
    const subs: Subscription = this.ps.getFieldList(this.selectedProduct).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.specList = res.data;
          this.getSptTableData();
        } else {
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
        const subs: Subscription = this.ps.getProductSupportData('0', element.SptTableName).subscribe({
          next: (res: any) => {
            if (res.success) {
              element.SptTableData = res.data.sort((a: { TableValue: string; }, b: { TableValue: any; }) => (a.TableValue.trim()).localeCompare(b.TableValue));
              element.SptFilterData = res.data.sort((a: { TableValue: string; }, b: { TableValue: any; }) => (a.TableValue.trim()).localeCompare(b.TableValue));
            } else {
              this.as.errorToast(res.message)
            }
          },
          error: (err: any) => console.log(err.message),
          complete: () => subs.unsubscribe(),
        });
      }
    });
  }

  getFieldSupportData(index: any) {
    this.specList.forEach((element: any) => {
      if (element.Ref === this.specList[index].FieldName.toString()) {
        const subs: Subscription = this.ps.getProductSupportData(this.specList[index].SelectedValue, element.SptTableName).subscribe({
          next: (res: any) => {
            if (res.success) {
              element.SptTableData = res.data.sort((a: { TableValue: string; }, b: { TableValue: any; }) => (a.TableValue.trim()).localeCompare(b.TableValue));
              element.SptFilterData = res.data.sort((a: { TableValue: string; }, b: { TableValue: any; }) => (a.TableValue.trim()).localeCompare(b.TableValue));
            } else {
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

  onChange(event: any) {
    if (this.companySetting.DataFormat === '1') {
      event = event.toUpperCase()
    } else if (this.companySetting.DataFormat == '2') {
      event = event.toTitleCase()
    }
    return event;
  }

  dropdownShoplist() {
    this.sp.show()
    const datum = {
      currentPage: 1,
      itemsPerPage: 100
    }
    const subs: Subscription = this.ss.getList(datum).subscribe({
      next: (res: any) => {
        if (res.success) {
          let shop = res.data
          this.shopList = shop.filter((s: any) => s.ID !== Number(this.selectedShop[0]));
          this.shopLists = res.data
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  productSelect(data: any) {
    this.Req.searchString = data.ProductName
    if (data !== undefined) {
      this.Req.SupplierID = data.SupplierID;
    } else {
      this.Req.SupplierID = 0
    }
    this.getProductDataByBarCodeNo()
  }

  getProductDataByBarCodeNo() {
   
    if(this.Req.SearchBarCode != ""){
      this.sp.show()
      const subs: Subscription = this.purchaseService.productDataByBarCodeNo(this.Req, 'false', 'false').subscribe({
        next: (res: any) => {
          if (res.success) {
            this.item = res.data;
            if (this.item.Barcode === null) {
              Swal.fire({
                icon: 'warning',
                title: 'Product Not Available in this Shop for Selected Barcode for Transfer.',
                text: ' Please Check the Barcode. ',
                footer: '',
                backdrop: false,
              });
            } else {
              this.xferItem.CompanyID = this.company.ID
              this.xferItem.ProductName = (this.item.ProductTypeName + '/' + this.item.ProductName).toUpperCase();
              this.xferItem.Barcode = this.item.Barcode;
              this.xferItem.BarCodeCount = this.item.BarCodeCount;
              this.xferItem.TransferCount = 0;
              this.xferItem.TransferFromShop = this.loginShop.ID
              // this.xferItem.TransferFromShop = Number(this.selectedShop[0]);
              this.xferItem.TransferStatus = "Transfer Initiated";
  
              if (this.item !== undefined || this.item.Barcode !== null && this.item.BarCodeCount !== 0) {
                if (this.xferList.length !== 0 && this.xferItem.ProductName !== "" ) {
                  let itemCount = 0;
                  this.xferList.forEach((element: any) => {
                    if (element.ProductName == this.xferItem.ProductName && element.Barcode == this.xferItem.Barcode && element.ID === null) {
                      itemCount = itemCount + element.TransferCount;
                    }
                  })
                  
                  // Ensure BarCodeCount does not go below zero
                  this.xferItem.BarCodeCount = Math.max(this.item.BarCodeCount - itemCount, 0); 
                }
              }
  
            }
          } else {
            this.as.errorToast(res.message)
          }
          this.sp.hide();
        },
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    }else{
      Swal.fire({
        icon: 'warning',
        title: 'Enter the barcode number for transfer.',
        text: '  ',
        footer: '',
        backdrop: false,
      });
    }
    
  }

  getBarCodeList(index: any) {
    let searchString = "";
    this.specList.forEach((element: any, i: any) => {
      if (i <= index) {
         let valueToAdd = element.SelectedValue ;
        valueToAdd = valueToAdd.replace(/^\d+_/, "");
        searchString = searchString + valueToAdd.trim() + "/";
      }
    });
    const subs: Subscription = this.purchaseService.barCodeListBySearchString(this.shopMode, this.selectedProduct, searchString.toString()).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.barCodeList = res.data;
        } else {
          this.as.errorToast(res.message)
        }
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  TransferCountLimit() {
    if (this.xferItem.TransferCount > this.xferItem.BarCodeCount) {
      Swal.fire({
        icon: 'warning',
        title: 'Opps !!',
        text: 'Transfer Count can not be more than Available Count',
        footer: '',
        backdrop: false,
      });
      this.xferItem.TransferCount = 0;
    }
  }

  addItem() {
    this.toShopdisabled = true

   this.toShop = this.shop.filter((s: any) => s.ID === Number(this.xferMaster.TransferToShop));
   if(this.toShop.length === 0){
    this.toShop = this.shop
   }
  this.xferItem.ToShop = this.toShop[0].Name + ' (' + this.toShop[0].AreaName + ')'
    this.xferItem.FromShop= this.loginShop.Name + ' (' + this.loginShop.AreaName + ')'
    this.xferItem.TransferToShop = this.xferMaster.TransferToShop
    this.xferList.unshift(this.xferItem);
    this.xferMaster.Quantity = 0
    this.xferList.forEach((e: any) => {
      this.xferMaster.Quantity += e.TransferCount
    })
    this.tempItem = { xferItem: null, Spec: null };
    this.xferItem = {
      ID: null, CompanyID: null, ProductName: null, Barcode: null, BarCodeCount: null, TransferStatus: 'Transfer Initiated', TransferCount: null, TransferToShop: null, TransferFromShop: null, Remark: '', CreatedBy: null, UpdatedBy: null, CreatedOn: null, UpdatedOn: null
    };
    this.Req = { SearchBarCode: '', searchString: '', SupplierID: 0 }
    this.SearchBarCode = '';
    this.selectedProduct = '';
    this.specList = []
    this.item = []
    this.barCodeList  = []
  }

  onSumbit() {
    this.sp.show();
    this.xferMaster.CompanyID = this.company.ID
    this.xferMaster.TransferFromShop = this.loginShop.ID

    this.data.xMaster = this.xferMaster;
    this.data.xDetail = JSON.stringify(this.xferList);
    const subs: Subscription = this.purchaseService.bulkTransferProduct(this.data).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.id = res.data.RefID;
          this.router.navigate(['/inventory/transfer-product', this.id]);
          this.bulkTransferProductByID();
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Your file has been Save.',
            showConfirmButton: false,
            timer: 1200
          })
        } else {
          this.as.errorToast(res.message)
          Swal.fire({
            position: 'center',
            icon: 'warning',
            title: res.message,
            showConfirmButton: true,
            backdrop: false,
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

  update() {
    this.sp.show();
    this.data.xMaster = this.xferMaster;
    let items: any = [];
    this.xferList.forEach((ele: any) => {
      if ((ele.ID !== null || ele.ID === null) &&  ele.UpdatedBy === null) {
        ele.UpdatedBy = this.user.ID;
        items.push(ele);
      }
    });
    this.data.xDetail = JSON.stringify(items); 

    const subs: Subscription = this.purchaseService.bulkTransferProductUpdate(this.data).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.bulkTransferProductByID();
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Your file has been update.',
            showConfirmButton: false,
            timer: 1200
          })
        } else {
          this.as.errorToast(res.message)
          Swal.fire({
            position: 'center',
            icon: 'warning',
            title: res.message,
            showConfirmButton: true,
            backdrop: false,
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

  deleteItem(Category: any, data: any) {
    if (Category === 'Product') {
      if (data.ID === null) {
        this.xferList.splice(data, 1);
        this.xferMaster.Quantity =  this.xferMaster.Quantity - data.TransferCount
      }
    }
  }

  cancelTransfer(data:any){
    Swal.fire({
      title: 'Are you sure Cancel Product?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, Cancel it!',
      cancelButtonText: 'No'
    }).then((result) => {
      if (result.isConfirmed) {
      this.sp.show()
       this.xferList.forEach((x:any)=>{
         if(x.ID == data.ID){
              this.xferMaster.Quantity =  this.xferMaster.Quantity - x.TransferCount
         }
       })
       
        let dtm = {
         xMaster: this.xferMaster,
         xDetail: JSON.stringify([data]),
        }

        const subs: Subscription = this.purchaseService.bulkTransferProductCancel(dtm).subscribe({
          next: (res: any) => {
            if(res.success){
              this.bulkTransferProductByID();
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

  openModal(content: any,data:any) {
    this.modalService.open(content, { centered: true , backdrop : 'static', keyboard: false,size: 'sm'});
  }

  acceptTransfer(){
  
    if(this.xferAccept.secretCode === this.xferMaster.AcceptanceCode){
      this.sp.show()

      let dtm = {
        xMaster: this.xferMaster,
        xDetail: JSON.stringify(this.xferList),
       }

        const subs: Subscription = this.purchaseService.bulkTransferProductAccept(dtm).subscribe({
          next: (res: any) => {
            if(res.success){
              this.modalService.dismissAll();
              this.router.navigate(['/inventory/transfer-list']);
              Swal.fire({
                position: 'center',
                icon: 'success',
                title: 'Your Product has been Accepted.',
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
    }else{
      this.sp.hide()
      Swal.fire({
        icon: 'error',
        title: 'Secret Code ' + `<span style = "font-size:25px;color:red;font-weight:bold;">${this.xferAccept.secretCode}</span>` + ' Does Not Match!!!!',
        footer: '',
        backdrop : false,
      });
      this.xferAccept = [];
    }
  }

  PDFtransfer(){
    this.sp.show();
    let PDFtransfer = {
      xDetail : JSON.stringify(this.xferList) ,
     xMaster : this.xferMaster 
    }    
    const subs: Subscription =  this.purchaseService.bulkTransferProductPDF(PDFtransfer).subscribe({
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
