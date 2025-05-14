import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { ProductService } from 'src/app/service/product.service';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { PurchaseService } from 'src/app/service/purchase.service';
import { ShopService } from 'src/app/service/shop.service';
import { SupplierService } from 'src/app/service/supplier.service';
import { CalculationService } from 'src/app/service/helpers/calculation.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { SupportService } from 'src/app/service/support.service';
import * as moment from 'moment';
import { BillService } from 'src/app/service/bill.service';

@Component({
  selector: 'app-purchase-return',
  templateUrl: './purchase-return.component.html',
  styleUrls: ['./purchase-return.component.css']
})
export class PurchaseReturnComponent implements OnInit {

  env = environment;
  user = JSON.parse(localStorage.getItem('user') || '');
  company = JSON.parse(localStorage.getItem('company') || '');
  shop = JSON.parse(localStorage.getItem('shop') || '');
  companySetting = JSON.parse(localStorage.getItem('companysetting') || '');
  selectedShop:any =JSON.parse(localStorage.getItem('selectedShop') || '') ;
  permission = JSON.parse(localStorage.getItem('permission') || '[]');

  id: any;
  SearchBarCode: any;
  searchValue: any;
  selectedProduct: any;
  prodList:any;
  specList: any;
  shopList: any;
  supplierList: any;
  barCodeList: any;
  xferList: any;
  showAdd = false;
  shopMode = 'false';
  item: any = [];
  itemList: any = [];
  Req :any= {SearchBarCode : ''} 
  gst_detail:any = [];
  gstList:any
  ReturnPDF = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private ps: ProductService,
    private purchaseService: PurchaseService,
    private ss: ShopService,
    private sup: SupplierService,
    public as: AlertService,
    private supps: SupportService,
    public calculation: CalculationService,
    public sp: NgxSpinnerService,
    public bill: BillService,
  ){
    this.id = this.route.snapshot.params['id'];
  }

  xferItem: any = {
    ID: null, CompanyID: null, PurchaseDetailID:null, ProductName: '', ProductTypeName: '', ProductTypeID: null, InvoiceNo:null, Barcode: null, BarCodeCount: null, Quantity:0,  UnitPrice: 0.00, SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: 0, GSTAmount: 0.00, GSTType: 'None', TotalAmount: 0.00, Status: 1, Remark : ''
  };

  selectedPurchaseMaster: any = {
    ID: null, CompanyID: null, SupplierID: null,  ShopID: null, SystemCn:'', SupplierCn
    :'',  Status: 1, CreatedBy: null, Quantity: 0, SubTotal: 0, DiscountAmount: 0, GSTAmount: 0, TotalAmount: 0, RoundOff: 0, PurchaseDate:null
  };

  data:any = { PurchaseMaster: null, PurchaseDetail: null };

  editPurchaseReturn = false
  addPurchaseReturn = false
  deletePurchaseReturn = false

  ngOnInit(): void {
    this.permission.forEach((element: any) => {
      if (element.ModuleName === 'PurchaseReturn') {
        this.editPurchaseReturn = element.Edit;
        this.addPurchaseReturn = element.Add;
        this.deletePurchaseReturn = element.Delete;
      }
    });

    if(this.user.UserGroup === 'Employee'){
      this.shopList  = this.shop;
      this.selectedPurchaseMaster.ShopID = this.shopList[0].ShopID
    }else{
      this.dropdownShoplist();
    }

    this.getProductList();
    this.dropdownSupplierlist(); 
    if (this.id != 0){
      this.getPurchaseReturnById(); 
    }
  }

  dropdownShoplist(){
    this.sp.show()
    const subs: Subscription = this.ss.dropdownShoplist('').subscribe({
      next: (res: any) => {
        if(res.success){
          this.shopList  = res.data.filter((s:any) => s.ID === Number(this.selectedShop[0]));
          this.selectedPurchaseMaster.ShopID = this.shopList[0].ID
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  dropdownSupplierlist(){
    this.sp.show()
    const subs: Subscription = this.sup.dropdownSupplierlist('').subscribe({
      next: (res: any) => {
        if(res.success){
          this.supplierList  = res.data.sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getGSTList(){
    const subs: Subscription = this.supps.getList('TaxType').subscribe({
      next: (res: any) => {
        if(res.success){
          this.gstList = res.data
          this.gst_detail = [];
          res.data.forEach((ele: any) => {
            if(ele.Name !== ' '){
             let obj = {GSTType: '', Amount: 0};
              obj.GSTType = ele.Name;
              this.gst_detail.push(obj);
            }
          })
        }else{
          this.as.errorToast(res.message)
        }
      },
    error: (err: any) => console.log(err.message),
    complete: () => subs.unsubscribe(),
    });
  }

  getPurchaseReturnById(){
    this.sp.show()
    const subs: Subscription = this.purchaseService.getPurchaseReturnById(this.id).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.selectedPurchaseMaster = res.result.PurchaseMaster[0]
          this.selectedPurchaseMaster.PurchaseDate = moment(res.result.PurchaseMaster[0].PurchaseDate).format('YYYY-MM-DD')
          this.itemList = res.result.PurchaseDetail
          this.gst_detail = this.selectedPurchaseMaster.gst_detail
          this.calculateGrandTotal();
          this.as.successToast(res.message)
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
  }

  getProductList(){
    this.sp.show()
    const subs: Subscription =  this.ps.getList().subscribe({
      next: (res: any) => {
        if(res.success){
          this.prodList = res.data.sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getFieldList(){
    this.sp.show()
    const subs: Subscription =  this.ps.getFieldList(this.selectedProduct).subscribe({
       next: (res: any) => {
        if(res.success){
          this.specList = res.data;
          this.getSptTableData();
        }else{
          this.as.errorToast(res.message)
        }
        this.sp.hide()
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
  }

  getProductDataByBarCodeNo(){
    const subs: Subscription =  this.purchaseService.productDataByBarCodeNoPR(this.Req, 'false', 'false',this.selectedPurchaseMaster.SupplierID,this.selectedPurchaseMaster.ShopID).subscribe({
      next: (res: any) => {
        if(res.success){
          this.item  = res.data;
          if (this.item.Barcode === null) {
            Swal.fire({
              icon: 'warning',
              title: 'Product Not Available OR This barcode assign to another supplier',
              footer: '',
              backdrop : false,
            });
          }else{
            this.xferItem.ProductTypeName = this.item.ProductTypeName;
            this.xferItem.ProductName = this.item.ProductName;
            this.xferItem.Barcode = this.item.Barcode;
            this.xferItem.InvoiceNo = this.item.InvoiceNo;
            this.xferItem.BarCodeCount = this.item.BarCodeCount;
            this.xferItem.Quantity = 0

            if (this.item !== undefined || this.item.Barcode !== null && this.item.BarCodeCount !== 0) {
              if (this.itemList.length !== 0 && this.xferItem.ProductName !== "") {
                let itemCount = 0;
                this.itemList.forEach((element: any) => {
                  if (element.ProductName === this.xferItem.ProductName && element.ID === null) {
                    itemCount = itemCount + element.Quantity;
                  }
                })
                this.item.BarCodeCount = this.item.BarCodeCount - itemCount;
              }
            }
          }


        }else{
          this.as.errorToast(res.message)
          Swal.fire({
            position: 'center',
            icon: 'warning',
            title: res.message,
            showCancelButton: true,
          })
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
        searchString = searchString + element.SelectedValue.trim() + "/" ;
      }
    });
    const subs: Subscription =  this.purchaseService.barCodeListBySearchStringPR(this.shopMode,this.selectedProduct, searchString, this.selectedPurchaseMaster.SupplierID,this.selectedPurchaseMaster.ShopID).subscribe({
      next: (res: any) => {
        if(res.success){
          this.barCodeList = res.data;
        }else{
          this.as.errorToast(res.message)
            Swal.fire({
              position: 'center',
              icon: 'warning',
              title: res.message,
              showCancelButton: true,
            })
        }
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  onChange(event: { toUpperCase: () => any; toTitleCase: () => any; }) {
    if (this.companySetting.DataFormat === '1') {
      event = event.toUpperCase()
    } else if (this.companySetting.DataFormat == '2') {
      event = event.toTitleCase()
    }
    return event;
  }

  calculateFields(){
    this.xferItem.UnitPrice = this.item.UnitPrice ;
    this.xferItem.DiscountPercentage = this.item.DiscountPercentage;
    this.xferItem.DiscountAmount = this.item.DiscountAmount ;
    this.xferItem.GSTPercentage = this.item.GSTPercentage ;
    this.xferItem.GSTAmount = this.item.GSTAmount ;
    this.xferItem.GSTType = this.item.GSTType ;
    this.xferItem.TotalAmount = this.item.TotalAmount ;
    this.calculation.calculateFields('','',this.xferItem,'')
  }
 
  calculateGrandTotal(){
    this.calculation.calculateGrandTotal(this.selectedPurchaseMaster, this.itemList, '')
  }

  addItem(){
    if(this.selectedPurchaseMaster.SupplierCn === ''){
      if(this.item.BarCodeCount >= this.xferItem.Quantity ){
        this.xferItem.ProductName = "";
        this.xferItem.ProductTypeID = "";
  
        if(this.barCodeList !== undefined){
          this.specList.forEach((element: any) => {
            this.prodList.forEach((elements: any) => {
              if(elements.Name === element.ProductName){
                this.xferItem.ProductTypeID = elements.ID
                this.xferItem.ProductTypeName = elements.Name
              }
            });
          if(element.SelectedValue !== "") {
            this.xferItem.ProductName = this.item.ProductName  + element.SelectedValue + "/";
          }
        });
        }
  
        this.xferItem.PurchaseDetailID = this.item.PurchaseDetailID;
        this.xferItem.ProductTypeID = this.item.ProductTypeID
        this.xferItem.ProductTypeName = this.item.ProductTypeName
        this.xferItem.ProductName = this.item.ProductName
        this.itemList.unshift(this.xferItem);
        this. xferItem = {
          ID: null, CompanyID: null, PurchaseDetailID:null, ProductName: '', ProductTypeName: '', ProductTypeID: null, InvoiceNo:null, Barcode: null, BarCodeCount: null, Quantity:0, Remark : '', UnitPrice: 0.00, SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: 0, GSTAmount: 0.00, GSTType: 'None', TotalAmount: 0.00, Status: 1
        };

        this.item.BarCodeCount = 0;
        this.specList = [];
        this.Req = {SearchBarCode : ''}
        this.calculateFields();
        this.calculateGrandTotal();
      }else{
        Swal.fire({
          icon: 'warning',
          title: 'Opps !!',
          text: 'Return Quantity Can Not Be More Than Available Quantity',
          footer: '',
          backdrop : false,
        });
      }
    }else{
      Swal.fire({
        position: 'center',
        icon: 'warning',
        title: `You have already added SupplierCn NO.`,
        showCancelButton: true,
      })
    }
  }

  onSumbit(){
    this.sp.show()
    this.data.PurchaseMaster = this.selectedPurchaseMaster;
    this.data.PurchaseDetail = JSON.stringify(this.itemList);
    const subs: Subscription =  this.purchaseService.savePurchaseReturn(this.data).subscribe({
      next: (res: any) => {
        if (res.success) {
          if(res.data !== 0) {
            this.id = res.data;
            this.router.navigate(['/inventory/purchase-return' , this.id]);
            this.getPurchaseReturnById();
            this.selectedProduct = "";
            this.specList = [];
            Swal.fire({
              position: 'center',
              icon: 'success',
              title: 'Your file has been Save.',
              showConfirmButton: false,
              timer: 1200
            })
          }
        } else {
          this.as.errorToast(res.message)
          Swal.fire({
            position: 'center',
            icon: 'warning',
            title: res.message,
            showCancelButton: true,
          })
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  updatedPurchaseReturn(){
    this.sp.show()
    this.data.PurchaseMaster = this.selectedPurchaseMaster;
    let items:any = [];
    this.itemList.forEach((ele: any) => {
      if(ele.ID !== null || ele.ID === null || ele.Status === 0  && ele.UpdatedBy === null) {
        ele.UpdatedBy = this.user.ID;
        items.push(ele);
      }
    })
    this.data.PurchaseDetail = JSON.stringify(items) ;
    const subs: Subscription =  this.purchaseService.updatePurchaseReturn(this.data).subscribe({
      next: (res: any) => {
        if (res.success) {
          if(res.data !== 0) {
            this.getPurchaseReturnById();
            this.selectedProduct = "";
            this.specList = [];
          }
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Your file has been Update.',
            showConfirmButton: false,
            timer: 1200
          })
        } else {
          this.as.errorToast(res.message)
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: res.message,
            showConfirmButton: false,
            timer: 1200
          })
        }
        this.sp.hide()
      },
      error: (err: any) => {
        console.log(err.msg);
      },
      complete: () => subs.unsubscribe(),
    });
  }

  deleteItem(Category:any ,i:any){
    if(Category === 'Product'){
      if (this.itemList[i].ID === null){
        this.itemList.splice(i, 1);
        this.calculateGrandTotal();
      }else{
        Swal.fire({
          title: 'Are you sure?',
          text: "You won't be able to revert this!",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Yes, delete it!',
          backdrop : false,
        }).then((result) => {
          if (result.isConfirmed) {
            this.sp.show()

            if(this.itemList[i].ID !== null || this.itemList[i].Status === 1){
              this.itemList[i].Status = 0;
              this.calculateGrandTotal();
            }

            const subs: Subscription = this.purchaseService.deleteProductPR(this.itemList[i].ID,this.selectedPurchaseMaster).subscribe({
              next: (res: any) => {
                if (res.success) {
                  this.itemList[i].Status = 0;
                  Swal.fire({
                    position: 'center',
                    icon: 'success',
                    title: 'Your file has been deleted.',
                    showConfirmButton: false,
                    timer: 1000
                  })
                  this.as.successToast(res.message) 
                } else {
                  Swal.fire({
                    position: 'center',
                    icon: 'warning',
                    title: res.message,
                    showCancelButton: true,
                  })
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
  }


  PurchaseDetailPDF() {
    let itemList2:any = []
    this.itemList.forEach((ele: any) => {
      if(ele.Status === 1){
        itemList2.push(ele)
      }
    });
    let body = { PurchaseMaster: this.selectedPurchaseMaster, PurchaseDetails: itemList2, }
    this.sp.show();
    const subs: Subscription = this.purchaseService.purchaseRetrunPDF(body).subscribe({
      next: (res: any) => {
        if (res) {
          const url = this.env.apiUrl + "/uploads/" + res;
          this.ReturnPDF = url
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

  sendWhatsapp(mode: any) {
    let temp = JSON.parse(this.companySetting.WhatsappSetting);
    let s: any = []

    this.supplierList.forEach((sk: any) => {
      if (this.selectedPurchaseMaster.SupplierID === sk.ID) {
        s.push(sk)
      }
    })

    this.shop = this.shop.filter((sh: any) => sh.ID === Number(this.selectedShop[0]));

    let WhatsappMsg = '';

    WhatsappMsg = 'Product are return';
    var msg = `*Hi ${s[0].Name},*%0A` +
      `${WhatsappMsg}%0A` +
      `*Product Return Detail*: ${this.ReturnPDF}%0A` +
      `*${this.shop[0].Name}* - ${this.shop[0].AreaName}%0A${this.shop[0].MobileNo1}%0A${this.shop[0].Website}`;


    if (s[0].MobileNo1 != '') {
      var mob = "91" + s[0].MobileNo1;
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

   sendEmail() {
      this.sp.show()
      let s: any = []

      this.supplierList.forEach((sk: any) => {
        if (this.selectedPurchaseMaster.SupplierID === sk.ID) {
          s.push(sk)
        }
      })
  
      this.shop = this.shop.filter((sh: any) => sh.ID === Number(this.selectedShop[0]));

      let dtm = {
        mainEmail: s[0].Email,
        mailSubject:  `SystemCn - ${this.selectedPurchaseMaster.SystemCn} - ${s[0].Name}`,
        mailTemplate: ` Product are return <br>
                        <div style="padding-top: 10px;">
                          <b> ${this.shop[0].Name} (${this.shop[0].AreaName}) </b> <br>
                          <b> ${this.shop[0].MobileNo1} </b><br>
                              ${this.shop[0].Website} <br>
                              Please give your valuable Review for us !
                        </div>`,
        attachment: [
          {
            filename: `Purchase_Retrun.pdf`,
            path: this.ReturnPDF, // Absolute or relative path
            contentType: 'application/pdf'
          }
        ],
      }
    
      const subs: Subscription = this.bill.sendMail(dtm).subscribe({
        next: (res: any) => {
          if (res) {
              Swal.fire({
                position: 'center',
                icon: 'success',
                title: 'Mail Sent Successfully',
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
        error: (err: any) => console.log(err.message),
        complete: () => subs.unsubscribe(),
      });
    }
}
