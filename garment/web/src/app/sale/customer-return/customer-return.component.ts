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
import { CustomerService } from 'src/app/service/customer.service';
import { FormControl } from '@angular/forms';
import { BillService } from 'src/app/service/bill.service';
import { BillCalculationService } from 'src/app/service/helpers/bill-calculation.service';

@Component({
  selector: 'app-customer-return',
  templateUrl: './customer-return.component.html',
  styleUrls: ['./customer-return.component.css']
})
export class CustomerReturnComponent implements OnInit {
  env = environment;
  user = JSON.parse(localStorage.getItem('user') || '');
  company = JSON.parse(localStorage.getItem('company') || '');
  shop = JSON.parse(localStorage.getItem('shop') || '');
  companySetting = JSON.parse(localStorage.getItem('companysetting') || '');
  selectedShop:any =JSON.parse(localStorage.getItem('selectedShop') || '') ;
  permission = JSON.parse(localStorage.getItem('permission') || '[]');


  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private ps: ProductService,
    private purchaseService: PurchaseService,
    private billService: BillService,
    private ss: ShopService,
    private customer: CustomerService,
    public as: AlertService,
    private supps: SupportService,
    public calculation: BillCalculationService,
    public sp: NgxSpinnerService,

  ){
    this.id = this.route.snapshot.params['id'];
  }

  myControl = new FormControl('');
  filteredOptions: any;
  id: any;
  SearchBarCode: any;
  searchValue: any;
  selectedProduct: any;
  prodList:any;
  specList: any;
  shopList: any;
  CustomerList: any;
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

  xferItem: any = {
    ID: null, CompanyID: null, BillDetailID:null, ProductName: '',  ProductTypeID: null,ProductTypeName: '',  UnitPrice: 0.00,Quantity:0,   SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: 0, GSTAmount: 0.00, GSTType: 'None', TotalAmount: 0.00, Barcode: null, OrderRequest:0,PreOrder:0,Manual:0, Status: 1, Remark : '', InvoiceNo:null, BarCodeCount: null, 
  };

  selectedPurchaseMaster: any = {
    ID: null, CompanyID: null, CustomerID: null,  ShopID: null, SystemCn:'', CustomerCn :'',  Status: 1, CreatedBy: null, Quantity: 0, SubTotal: 0, DiscountAmount: 0, GSTAmount: 0, TotalAmount: 0, RoundOff: 0, BillDate:null
  };

  data:any = { PurchaseMaster: null, PurchaseDetail: null };

  ngOnInit(): void {
    if(this.user.UserGroup === 'Employee'){
      this.shopList  = this.shop;
      this.selectedPurchaseMaster.ShopID = this.shopList[0].ShopID
    }else{
      this.dropdownShoplist();
    }
    this.getProductList();
    if(this.id != 0){
      this.getSaleReturnById();
    }
  }


  getSaleReturnById(){
    this.sp.show()
    const subs: Subscription = this.billService.getSaleReturnById(this.id).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.selectedPurchaseMaster = res.result.SaleMaster[0]
          this.selectedPurchaseMaster.BillDate = moment(res.result.SaleMaster[0].BillDate).format('YYYY-MM-DD')
          this.itemList = res.result.SaleDetail
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

  customerSearch(searchKey: any, mode: any, type: any) {
    this.filteredOptions = []

    let dtm = { Type: '', Name: '' }
    if (type === 'Customer') {
      dtm = {
        Type: 'Customer',
        Name: this.selectedPurchaseMaster.CustomerID
      };
    }

    if (searchKey.length >= 2) {
      if (mode === 'Name') {
        dtm.Name = searchKey;
      }

      const subs: Subscription = this.supps.dropdownlistBySearch(dtm).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.filteredOptions = res.data
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

  CustomerSelection(mode: any, ID: any) {
    if (mode === 'Value') {
      this.selectedPurchaseMaster.CustomerID = ID
    }

    if (mode === 'All') {
      this.selectedPurchaseMaster.CustomerID = 0
    }
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
    const subs: Subscription =  this.billService.productDataByBarCodeNoSR(this.Req, 'false',this.selectedPurchaseMaster.ShopID,this.selectedPurchaseMaster.CustomerID).subscribe({
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
            this.xferItem.PreOrder = this.item.PreOrder;
            this.xferItem.Manual = this.item.Manual;
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
           let valueToAdd = element.SelectedValue ;
        valueToAdd = valueToAdd.replace(/^\d+_/, "");
        searchString = searchString + valueToAdd.trim() + "/";
        }
      });
      const subs: Subscription =  this.billService.barCodeListBySearchStringSR(searchString,this.shopMode,this.selectedProduct,this.selectedPurchaseMaster.ShopID, this.selectedPurchaseMaster.CustomerID,).subscribe({
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
    this.xferItem.GSTPercentage = this.item.GSTPercentageB ;
    this.xferItem.GSTAmount = this.item.GSTAmount ;
    this.xferItem.GSTType = this.item.GSTTypeB ;
    this.xferItem.TotalAmount = this.item.TotalAmount ;
    this.calculation.calculations('','',this.xferItem,'')
  }
 
  calculateGrandTotal(){
    let service:any = []
    this.calculation.calculateGrandTotal(this.selectedPurchaseMaster, this.itemList, service)
  }


    addItem(){
      if(this.selectedPurchaseMaster.CustomerCn === ''){
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
               let valueToAdd = element.SelectedValue ;
               valueToAdd = valueToAdd.replace(/^\d+_/, "");
              this.xferItem.ProductName = this.item.ProductName  + valueToAdd + "/";
            }
          });
          }
    
          this.xferItem.BillDetailID = this.item.BillDetailID;
          this.xferItem.ProductTypeID = this.item.ProductTypeID
          this.xferItem.ProductTypeName = this.item.ProductTypeName
          this.xferItem.ProductName = this.item.ProductName
          this.itemList.unshift(this.xferItem);
          
          this.xferItem = {
          ID: null, CompanyID: null, BillDetailID:null, ProductName: '',  ProductTypeID: null,ProductTypeName: '',  UnitPrice: 0.00,Quantity:0, SubTotal: 0.00, DiscountPercentage: 0, DiscountAmount: 0.00, GSTPercentage: 0, GSTAmount: 0.00, GSTType: 'None', TotalAmount: 0.00, Barcode: null, OrderRequest:0,PreOrder:0,Manual:0, Status: 1, Remark : '', InvoiceNo:null, BarCodeCount: null, 
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
            text: 'Return Quantity Can Not Be More Than Sale Quantity',
            footer: '',
            backdrop : false,
          });
          this.xferItem.Quantity = 0
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

       Swal.fire({
            title: 'Are you sure?',
            text: 'After you save a CustomerCNNo, You will be unable to update it again.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, Save it!'
          }).then((result) => {
            if (result.isConfirmed) {
              this.sp.show()
              this.selectedPurchaseMaster.SystemCn = (Math.floor(100000 + Math.random() * 900000)).toString();
              let dtm = {
               ReturnMaster: this.selectedPurchaseMaster,
               ReturnDetail: JSON.stringify(this.itemList)
             }
               const subs: Subscription =  this.billService.saveSaleReturn(dtm).subscribe({
                 next: (res: any) => {
                   if (res.success) {
                     if(res.data !== 0) {
                       this.id = res.data;
                       this.router.navigate(['/sale/customerReturn' , this.id]);
                       this.supplierCnPR()
                   
     
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
          })


    }


      supplierCnPR(){
        this.selectedPurchaseMaster.CustomerCNNo =  this.selectedPurchaseMaster.SystemCn;
        const subs: Subscription =  this.billService.customerCnSR(this.selectedPurchaseMaster.BillDate,this.selectedPurchaseMaster.CustomerCNNo,this.id).subscribe({
          next: (res: any) => {
            if(res.success){
              this.getSaleReturnById();
            }else{
              this.as.errorToast(res.message)
              Swal.fire({
                position: 'center',
                icon: 'error',
                title: res.message,
                showConfirmButton: true,
            })
            }
            this.sp.hide();
          },
          error: (err: any) => console.log(err.message), 
          complete: () => subs.unsubscribe(),
         });
      }
    
    updateSaleReturn(){
        this.sp.show()
        let items:any = [];
        this.itemList.forEach((ele: any) => {
          if(ele.ID !== null || ele.ID === null || ele.Status === 0  && ele.UpdatedBy === null) {
            ele.UpdatedBy = this.user.ID;
            items.push(ele);
          }
        })

        let dtm = {
          ReturnMaster: this.selectedPurchaseMaster,
          ReturnDetail: JSON.stringify(items)
        }
        const subs: Subscription =  this.billService.updateSaleReturn(dtm).subscribe({
          next: (res: any) => {
            if (res.success) {
              if(res.data !== 0) {
                this.getSaleReturnById();
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
                  const subs: Subscription = this.billService.deleteProductSR(this.itemList[i].ID,this.selectedPurchaseMaster).subscribe({
                    next: (res: any) => {
                      if (res.success) {
                        this.getSaleReturnById()
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
      
}
