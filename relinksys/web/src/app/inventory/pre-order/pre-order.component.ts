import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import { AlertService } from 'src/app/service/helpers/alert.service';
import { ProductService } from 'src/app/service/product.service';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { SupplierService } from 'src/app/service/supplier.service';
import { SupportService } from 'src/app/service/support.service';
import { CalculationService } from 'src/app/service/helpers/calculation.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { PurchaseService } from 'src/app/service/purchase.service';
import { BillService } from 'src/app/service/bill.service';
@Component({
  selector: 'app-pre-order',
  templateUrl: './pre-order.component.html',
  styleUrls: ['./pre-order.component.css']
})
export class PreOrderComponent implements OnInit {
  evn = environment;
  user = JSON.parse(localStorage.getItem('user') || '');
  company = JSON.parse(localStorage.getItem('company') || '');
  shop = JSON.parse(localStorage.getItem('shop') || '');
  companySetting = JSON.parse(localStorage.getItem('companysetting') || '');
  selectedShop:any =JSON.parse(localStorage.getItem('selectedShop') || '') ;
  permission = JSON.parse(localStorage.getItem('permission') || '[]');

  editBtn = false;
  searchValue:any;
  
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private ps: ProductService,
    private ss: SupplierService,
    private supps: SupportService,
    private purchaseService: PurchaseService,
    public as: AlertService,
    public calculation: CalculationService,
    public sp: NgxSpinnerService,
        public bill: BillService,
  ){
    this.id = this.route.snapshot.params['id'];
   }

   selectedPurchaseMaster: any = {
    ID: null, SupplierID: null, SupplierName: null, CompanyID: null, GSTNo: null, ShopID: null, ShopName: null, PurchaseDate: null,
    PaymentStatus: null, InvoiceNo: null, Status: 1, CreatedBy: null, Quantity: 0, SubTotal: 0, DiscountAmount: 0,
    GSTAmount: 0, TotalAmount: 0, preOrder:true,
  };

  item: any = {
    ID: null, PurchaseID: null, CompanyID: null, ProductName: '', ProductTypeName: '', ProductTypeID: null, UnitPrice: 0.00,
    Quantity: 1, SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: 0, GSTAmount: 0.00, GSTType: 'None', TotalAmount: 0.00, Multiple: false, RetailPrice: 0.00, WholeSalePrice: 0.00, Ledger: false, WholeSale: false, BaseBarCode: '', NewBarcode: '',  Status: 1, BrandType: 0, ProductExpDate: '0000-00-00',
  };

  data:any = { PurchaseMaster: null,  PurchaseDetail: null };
  GstTypeDis = false

  id: any;
  supplierList:any;
  category = 'Product';
  selectedProduct :any;
  prodList:any;
  specList: any;
  disableAddButtons = false;
  gstperLock = false;
  gstLock = false;
  BrandLock = false;
  gstList:any;
  tempItem = { Item: null, Spec: null };
  itemList:any = [];
  dataListt:any = [] ;
  checked = false;
  gst_detail:any = [];

  editOrderPrice = false
  addOrderPrice = false
  deleteOrderPrice = false
  currentTime = ''

  ngOnInit(): void {
    this.permission.forEach((element: any) => {
      if (element.ModuleName === 'OrderPrice') {
        this.editOrderPrice = element.Edit;
        this.addOrderPrice = element.Add;
        this.deleteOrderPrice = element.Delete;
      }
    });
    // this.getProductList();
      this.bill.productLists$.subscribe((list:any) => {
      this.prodList = list
    });
      this.bill.taxList$.subscribe((list:any) => {
        this.gstList = list
          this.gst_detail = [];
          list.forEach((ele: any) => {
            if(ele.Name !== ' '){
             let obj = {GSTType: '', Amount: 0};
              obj.GSTType = ele.Name;
              this.gst_detail.push(obj);
            }
          })
    });

    // this.getdropdownSupplierlist();
    // this.getGSTList();
    this.dropdownlistForPreOrder();
    if (this.id != 0){
      this.getPurchaseByIdPreOrder();
    }else{
      this.selectedPurchaseMaster.PurchaseDate = moment().format('YYYY-MM-DD');
    }
     this.currentTime = new Date().toLocaleTimeString('en-US', { hourCycle: 'h23'})
  }

  getPurchaseByIdPreOrder(){
    this.sp.show()
    const subs: Subscription = this.purchaseService.getPurchaseByIdPreOrder(this.id).subscribe({
      next: (res: any) => {
        this.selectedPurchaseMaster = res.result.PurchaseMaster[0]
        this.selectedPurchaseMaster.PurchaseDate =  moment(res.result.PurchaseMaster[0].PurchaseDate).format('YYYY-MM-DD')
        this.itemList = res.result.PurchaseDetail
        this.gst_detail = this.selectedPurchaseMaster.gst_detail
        this.calculateGrandTotal();
        if (res.success) {
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

  // getdropdownSupplierlist(){
  //   this.sp.show()
  //   const subs: Subscription =  this.ss.dropdownSupplierlist('').subscribe({
  //     next: (res: any) => {
  //       if(res.success){
  //         this.supplierList = res.data;
  //         this.as.successToast(res.message)
  //       }else{
  //         this.as.errorToast(res.message)
  //       }
  //       this.sp.hide()
  //     },
  //     error: (err: any) => console.log(err.message),
  //     complete: () => subs.unsubscribe(),
  //   });
  // }

  dropdownlistForPreOrder(){
    this.sp.show()
    const subs: Subscription =  this.ss.dropdownlistForPreOrder('').subscribe({
      next: (res: any) => {
        if(res.success){
          this.supplierList = res.data;
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

  getGSTList(){
    this.sp.show()
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
        this.sp.hide()
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
  }

  displayAddField(i:any){
     this.specList[i].DisplayAdd = 1;
     this.specList[i].SelectedValue = '';
  }

  saveFieldData(i: any) {

    this.specList[i].DisplayAdd = 0;
    let count = 0;
    this.specList[i].SptTableData.forEach((element: { TableValue: string; }) => {
      if (element.TableValue.toLowerCase() === this.specList[i].SelectedValue.toLowerCase()) { count = count + 1; }
    });
    if (count !== 0 || this.specList[i].SelectedValue === '') {
      //  alert ("Duplicate or Empty Values are not allowed");
      Swal.fire({
        icon: 'error',
        title: 'Duplicate or Empty values are not allowed',
        footer: ''
      });
    } else {
      const Ref = this.specList[i].Ref;
      let RefValue = 0;
      if (Ref !== 0) {
        this.specList.forEach((element: any, j: any) => {
          if (element.FieldName === Ref) { RefValue = element.SelectedValue; }
        });
      }
      this.sp.show()
      const subs: Subscription = this.ps.saveProductSupportData(this.specList[i].SptTableName, RefValue, this.specList[i].SelectedValue).subscribe({
        next: (res: any) => {
          const subss: Subscription = this.ps.getProductSupportData(RefValue, this.specList[i].SptTableName).subscribe({
            next: (res: any) => {
              if (res.success) {
                this.specList[i].SptTableData = res.data;
                this.specList[i].SptFilterData = res.data;
                this.as.successToast(res.message)
              } else {
                this.as.errorToast(res.message)
              }
              this.sp.hide()
            },
            error: (err: any) => console.log(err.message),
            complete: () => subss.unsubscribe(),
          });
          if (res.success) { }
          else { this.as.errorToast(res.message) }
        },
        error: (err: any) => {
          console.log(err.msg);
        },
        complete: () => subs.unsubscribe(),
      });
    }
  }

  getSupplierDetails(event:any){
      const index = this.supplierList.findIndex((element:any) => element.ID === event.value);
      this.selectedPurchaseMaster.SupplierID = this.supplierList[index].ID;
      this.selectedPurchaseMaster.SupplierName = this.supplierList[index].Name;
      this.item.GSTType = this.supplierList[index].GSTType;
  }

  onChange(event: { toUpperCase: () => any; toTitleCase: () => any; }) {
    if (this.companySetting.DataFormat === '1') {
      event = event.toUpperCase()
    } else if (this.companySetting.DataFormat == '2') {
      event = event.toTitleCase()
    }
    return event;
  }

  calculateFields(fieldName:any,mode:any){
   this.calculation.calculateFields(fieldName,mode,this.item,'')
  }

  calculateGrandTotal(){
    this.calculation.calculateGrandTotal(this.selectedPurchaseMaster, this.itemList,'')
  }

  addItem(){
    if (this.category === 'Product'){

      if ((this.item.GSTType === 'None' && this.item.GSTPercentage !== 0) || (this.item.GSTPercentage === 0 && this.item.GSTType !== 'None') || (this.item.GSTPercentage === null && this.item.GSTType !== 'None')) {
        Swal.fire({
          position: 'center',
          icon: 'warning',
          title: 'Without GSTType, the selected value will not be saved',
          showConfirmButton: true,
          backdrop: false,
        })
        this.GstTypeDis = true
      }else{

     

      if (this.selectedPurchaseMaster.ID !== null){this.item.Status = 2; }
        this.item.ProductName = "";
        this.item.ProductTypeID = "";

        this.specList.forEach((element: any) => {
            this.prodList.forEach((elements: any) => {
              if(elements.Name === element.ProductName){
                this.item.ProductTypeID = elements.ID
                this.item.ProductTypeName = elements.Name
              }
            });

           if (element.SelectedValue !== "") {
              let valueToAdd = element.SelectedValue;
              valueToAdd = valueToAdd.replace(/^\d+_/, "");
              this.item.ProductName = this.item.ProductName + valueToAdd + "/";
          }
          if(element.FieldType === "Date") {
            this.item.ProductExpDate = element.SelectedValue;
          }
        });

        this.item.ProductExpDate = this.item.ProductExpDate === '' ? "0000-00-00" : this.item.ProductExpDate;
        this.item.ProductTypeID = this.item.ProductTypeID
        this.item.ProductTypeName = this.item.ProductTypeName
        this.item.ProductName = this.item.ProductName.substring(0, this.item.ProductName.length - 1)
        this.itemList.unshift(this.item);
          
        this.tempItem = { Item: null, Spec: null };

        if(this.gstLock === false && this.gstperLock === false ) {
          this.item = {
            ID: null, PurchaseID: null, CompanyID: null, ProductName: '', ProductTypeName: this.selectedProduct, ProductTypeID: null, UnitPrice: 0.00, Quantity: 1, SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: 0, GSTAmount: 0.00, GSTType: 'None', TotalAmount: 0.00, Multiple: false, RetailPrice: '', WholeSalePrice: 0, Ledger: true, WholeSale:this.item.WholeSale, BaseBarCode: null, NewBarcode: '', Status: 1, BrandType: this.item.BrandType,ProductExpDate: '0000-00-00', UniqueBarcode: ''
          };
        } else if (this.gstLock === true && this.gstperLock === false) {
          this.item = {
            ID: null, PurchaseID: null, CompanyID: null, ProductName: '', ProductTypeName: this.selectedProduct, ProductTypeID: null, UnitPrice: 0.00, Quantity: 1, SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: 0, GSTAmount: 0.00, GSTType: this.item.GSTType, TotalAmount: 0.00, Multiple: false, RetailPrice: '', WholeSalePrice: 0, Ledger: true, WholeSale:this.item.WholeSale,BaseBarCode: null, NewBarcode: '', Status: 1, BrandType: this.item.BrandType,ProductExpDate: '0000-00-00', UniqueBarcode: ''
          };
        } else if (this.gstLock === false && this.gstperLock === true) {
          this.item = {
            ID: null, PurchaseID: null, CompanyID: null, ProductName: '', ProductTypeName: this.selectedProduct, ProductTypeID: null, UnitPrice: 0.00, Quantity: 1, SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: this.item.GSTPercentage, GSTAmount: 0.00, GSTType: 'None', TotalAmount: 0.00, Multiple: false, RetailPrice: '', WholeSalePrice: 0, Ledger: true, WholeSale:this.item.WholeSale, BaseBarCode: null, NewBarcode: '', Status: 1, BrandType: this.item.BrandType,ProductExpDate: '0000-00-00', UniqueBarcode: ''
          };
        } else {
          this.item = {
          ID: null, PurchaseID: null, CompanyID: null, ProductName: '', ProductTypeName: this.selectedProduct, ProductTypeID: null, UnitPrice: 0.00, Quantity: 1, SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: this.item.GSTPercentage, GSTAmount: 0.00, GSTType: this.item.GSTType, TotalAmount: 0.00, Multiple: false, RetailPrice: '', WholeSalePrice: 0, Ledger: true, WholeSale:this.item.WholeSale, BaseBarCode: null, NewBarcode: '', Status: 1, BrandType: this.item.BrandType, ProductExpDate: '0000-00-00', UniqueBarcode: ''
          }
        }

        if(this.BrandLock === true){
          this.item = {
            ID: null, PurchaseID: null, CompanyID: null, ProductName: '', ProductTypeName: this.selectedProduct, ProductTypeID: null, UnitPrice: 0.00, Quantity: 1, SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: this.item.GSTPercentage, GSTAmount: 0.00, GSTType: this.item.GSTType, TotalAmount: 0.00, Multiple: false, RetailPrice: '', WholeSalePrice: 0, Ledger: true, WholeSale:this.item.WholeSale, BaseBarCode: null, NewBarcode: '', Status: 1, BrandType: this.item.BrandType, ProductExpDate: '0000-00-00', UniqueBarcode: ''
          }
        }else{
          this.item = {
            ID: null, PurchaseID: null, CompanyID: null, ProductName: '', ProductTypeName: this.selectedProduct, ProductTypeID: null, UnitPrice: 0.00, Quantity: 1, SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: this.item.GSTPercentage, GSTAmount: 0.00, GSTType: this.item.GSTType, TotalAmount: 0.00, Multiple: false, RetailPrice: '', WholeSalePrice: 0, Ledger: true, WholeSale:this.item.WholeSale, BaseBarCode: null, NewBarcode: '', Status: 1, BrandType: 0, ProductExpDate: '0000-00-00', UniqueBarcode: ''
          }
        }

        this.specList.forEach((element: any) => {
          if(element.CheckBoxValue === false || element.CheckBoxValue === undefined) {
            element.SelectedValue = '';
          } else {
            element.SelectedValue = element.SelectedValue;
          }
        });
    }
    this.calculateGrandTotal();
  }
}

  notifyGst() {
    if(this.item.GSTPercentage !== 0 && this.item.GSTPercentage !== "0") {
     if(this.item.GSTType === 'None') {
      alert("please select GstType");
     }
    }
  }

  onSumbit(){
    if(this.selectedPurchaseMaster.ID === null){
    this.sp.show()
    // this.selectedPurchaseMaster.ShopID = this.shop[0].ShopID;
    this.data.PurchaseDetail = JSON.stringify(this.itemList);
    this.selectedPurchaseMaster.PurchaseDate =  this.selectedPurchaseMaster.PurchaseDate + ' ' + this.currentTime;
    this.data.PurchaseMaster = this.selectedPurchaseMaster;
    const subs: Subscription = this.purchaseService.createPreOrder(this.data).subscribe({
      next: (res: any) => {
        if (res.success) {
          if(res.data !== 0) {
            this.id = res.data;
            this.router.navigate(['/inventory/pre-order' , this.id]);
            this.getPurchaseByIdPreOrder();
            this.selectedProduct = "";
            this.specList = [];
          }
          Swal.fire({
            position: 'center',
            icon: 'success',
            title: 'Your file has been Save.',
            showConfirmButton: false,
            timer: 1200
          })
        } else {
          this.currentTime = ''
          this.as.errorToast(res.message)
        }
       this.sp.hide()
      },
      error: (err: any) => {
        console.log(err.msg);
      },
      complete: () => subs.unsubscribe(),
    });
  }
  }

  deleteItem(Category:any ,i:any){
    if(Category === 'Product'){
      if (this.itemList[i].ID === null){
        this.itemList.splice(i, 1);
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
            const subs: Subscription = this.purchaseService.deleteProductPreOrder(this.itemList[i].ID,this.selectedPurchaseMaster).subscribe({
              next: (res: any) => {
                if(res.success){
                  this.itemList[i].Status = 0;
                  this.getPurchaseByIdPreOrder()
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
                  this.itemList[i].Status = 1;
                  this.calculateGrandTotal();
                  Swal.fire({
                    position: 'center',
                    icon: 'warning',
                    title: res.message ,
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
        })
      }
    }
  }

  edititem(mode:any,data:any){
    this.editBtn = true
    if(mode === 'Product'){
      this.selectedProduct = data.ProductTypeName
      this.item.ProductName = data.ProductName
      this.item = data
    }
  }

  editUpdate(){
    this.itemList.forEach((ele: any) =>{
      if(ele.ID !== null && ele.ID === null ){
        ele = this.item
      }
    });
    this.calculateGrandTotal()
    this.item = {
      ID: null, PurchaseID: null, CompanyID: null, ProductName: '', ProductTypeName: '', ProductTypeID: null, UnitPrice: 0.00,
      Quantity: 1, SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: 0, GSTAmount: 0.00, GSTType: 'None', TotalAmount: 0.00, Multiple: false, RetailPrice: 0.00, WholeSalePrice: 0.00, Ledger: false, WholeSale: false, BaseBarCode: '', NewBarcode: '',  Status: 1, BrandType: 0
    };
    this.editBtn = false
    this.specList = []
    this.selectedProduct = "";
  }

  updatedPurchase(){
    this.sp.show()
    // this.selectedPurchaseMaster.ShopID = this.shop[0].ShopID;
    let items:any = [];
    this.itemList.forEach((ele: any) => {
      if(ele.ID !== null || ele.ID === null || ele.Status == 0 && ele.UpdatedBy === null) {
        ele.UpdatedBy = this.user.ID;
        items.push(ele);
      }
    })
    this.data.PurchaseDetail = JSON.stringify(items) ;
    this.selectedPurchaseMaster.preOrder = true;
    this.selectedPurchaseMaster.PurchaseDate = this.selectedPurchaseMaster.PurchaseDate + ' ' + this.currentTime;
    this.data.PurchaseMaster = this.selectedPurchaseMaster;
    const subs: Subscription =  this.purchaseService.updatePreOrder(this.data).subscribe({
      next: (res: any) => {
        if (res.success) {
          if(res.data !== 0) {
            this.getPurchaseByIdPreOrder();
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
          this.currentTime = ''
          this.as.errorToast(res.message)
        }
      this.sp.hide()
      },
      error: (err: any) => {
        console.log(err.msg);
      },
      complete: () => subs.unsubscribe(),
    });
  }

  selectAllPreorder(type: any) {
    if (type === 'all') {
      this.sp.show();
      this.dataListt = [];

      const isChecked = !this.checked;

      for (let i = 0; i < this.itemList.length; i++) {
        let ele = this.itemList[i];
        ele.Checked = isChecked;
        ele.index = i;
        if (isChecked) {
          if(ele.Status === 1){
            this.dataListt.push(ele);
          }
        }
      }
      this.checked = isChecked;
      this.sp.hide();
    }
  }

  singleSelectPreOrder(i: any) {
    const item = this.itemList[i];

    if (item.Checked === false || item.Checked === 0) {
      item.index = i;
      this.dataListt.push(item);
    } else if (item.Checked === true || item.Checked === 1) {
      const indexToRemove = this.dataListt.findIndex((el: any) => el.index === i);
      if (indexToRemove !== -1) {
        this.dataListt.splice(indexToRemove, 1);
      }
    }
  }

  deleteAllItem(){
    if (this.dataListt.length === 0 ) {
      Swal.fire({
       position: 'center',
       icon: 'warning',
       title: 'Please select checkboxes. || Note that rows have already been deleted.',
       showConfirmButton: true,
       backdrop:false
     })
   } else {
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
        let FullData:any = []
        let PurchaseDetailRow:any = []
        this.dataListt.forEach((ele: any) =>{
          if (ele.ID !== null || ele.Status === 1) {
           ele.Sel = 1;
           ele.Status = 0;
           ele.Quantity = 0;
            FullData.push(ele)
            this.calculateFields(ele,'')
            PurchaseDetailRow.push(ele)
          }
        })
        this.calculateGrandTotal()
        const body = {
          PurchaseMaster: this.selectedPurchaseMaster,
          PurchaseDetail: PurchaseDetailRow
        }
   
        const subs: Subscription = this.purchaseService.deleteAllPreOrderDummy(body).subscribe({
         next: (res: any) => {
           if (res.success) {
             this.getPurchaseByIdPreOrder();
             Swal.fire({
               position: 'center',
               icon: 'success',
               title: 'Your file has been delete.',
               showConfirmButton: false,
               timer: 1200
             })
             this.as.successToast(res.message)
           } else {
             this.as.successToast(res.message)
           }
           this.sp.hide();
         },
         error: (err: any) => console.log(err.message),
         complete: () => subs.unsubscribe(),
       });
      }
    })

   }
  }
}
