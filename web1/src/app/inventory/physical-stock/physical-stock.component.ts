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
import * as moment from 'moment';

@Component({
  selector: 'app-physical-stock',
  templateUrl: './physical-stock.component.html',
  styleUrls: ['./physical-stock.component.css']
})

export class PhysicalStockComponent implements OnInit {
  evn = environment;
  user = JSON.parse(localStorage.getItem('user') || '');
  company = JSON.parse(localStorage.getItem('company') || '');
  shop = JSON.parse(localStorage.getItem('shop') || '');
  companySetting = JSON.parse(localStorage.getItem('companysetting') || '');
  selectedShop: any = JSON.parse(localStorage.getItem('selectedShop') || '');
  Physicaldatas: any;

  id: any;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private ps: ProductService,
    private purchaseService: PurchaseService,
    private ss: ShopService,
    public as: AlertService,
    public sp: NgxSpinnerService,
  ) {
    this.id = this.route.snapshot.params['id'];
  }

  data: any = {
    ProductCategory: '', ProductName: '', ShopID: ''
  }
  master: any = {
    TotalAvailableQty: '', TotalPhysicalQty: '',TotalQtyDiff:0, InvoiceNo: '', Remark: ''
  }

  searchValue: any
  Barcode: any = "";
  ProductSearch: any = ""
  shopList: any = []
  selectedProduct: any
  dataList: any = []
  prodList: any = []
  specList: any = []
  totalAvailableQty: any = 0
  totalPhysicalQty: any = 0
  totalQtyDiff: any = 0
  barcodeIndex: number = -1;
  searchButton = true;

  ngOnInit(): void {
    const storedData = localStorage.getItem('PhysicalData');
    if (storedData) {
      this.Physicaldatas = JSON.parse(storedData);
    } else {
      this.Physicaldatas = []; 
    }
    this.dataList = this.Physicaldatas.dataList
    this.totalAvailableQty = this.Physicaldatas.totalAvailableQty
    this.totalPhysicalQty = this.Physicaldatas.totalPhysicalQty
    this.searchButton = this.Physicaldatas.searchButton
    this.dropdownShoplist()
    this.getProductList()

    if(this.id != 0){
      this.getPhysicalStockProductByID()
    }
  }

  reset() {
      Swal.fire({
        title: 'Are you sure all clear?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, All Clear!'
      }).then((result) => {
        if (result.isConfirmed) {
          localStorage.removeItem('PhysicalData');
         
          this.totalAvailableQty = 0;
          this.totalPhysicalQty = 0;
          this.totalQtyDiff = 0;
          this.searchButton = true;
          this.dataList = [];
          this.selectedProduct='';
          this.prodList = [];
          this.specList = [];
          this.ProductSearch = "";
          this.Barcode = "";
          this.router.navigate(['/inventory/physical-stock',0]).then(() => {
            window.location.reload();
          });
        }
      })
  }

  getProductList() {
    this.sp.show()
    const subs: Subscription = this.ps.getList().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.prodList = res.data.sort((a: { Name: string; }, b: { Name: any; }) => a.Name.localeCompare(b.Name));
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide()
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getFieldList() {
    if (this.data.ProductCategory !== 0) {
      this.prodList.forEach((element: any) => {
        if (element.ID === this.data.ProductCategory) {
          this.selectedProduct = element.Name;
        }
      })
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
    } else {
      this.specList = [];
      this.data.ProductName = '';
      this.data.ProductCategory = 0;
    }
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
  }

  filter() {
    let productName = '';
    this.specList.forEach((element: any) => {
      if (productName === '') {
        productName = element.SelectedValue;
      } else if (element.SelectedValue !== '') {
        productName += '/' + element.SelectedValue;
      }
    });
    this.data.ProductName = productName;
  }

  dropdownShoplist() {
    const subs: Subscription = this.ss.dropdownShoplist('').subscribe({
      next: (res: any) => {
        this.shopList = res.data
        let shop = this.shopList
        this.shopList = shop.filter((s: any) => s.ID === Number(this.selectedShop[0]));
        this.data.ShopID = this.shopList[0].ID
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  getList() {
    this.sp.show();
    let Parem = '';

    if (this.data.ShopID != "") {
      Parem = Parem + ' and barcodemasternew.ShopID = ' + this.data.ShopID;
    }

    if (this.data.ProductCategory !== 0) {
      this.filter();
    }

    if (this.data.ProductName !== '') {
      Parem = Parem + ' and purchasedetailnew.ProductName Like ' + " '%" + this.data.ProductName.trim() + "%' ";
    }

    const subs: Subscription = this.purchaseService.getPhysicalStockProductList(Parem, this.ProductSearch).subscribe({
      next: (res: any) => {
        this.specList = [];
      this.data.ProductName = '';
      this.data.ProductCategory = '';
        this.dataList = res.data;
        this.totalAvailableQty = res.calculation[0].totalAvailableQty;
        this.totalPhysicalQty = res.calculation[0].totalPhysicalQty;
        this.searchButton = false
        // Save dataList to localStorage
        const storageData = {
          dataList: this.dataList,
          totalAvailableQty: this.totalAvailableQty,
          totalPhysicalQty: this.totalPhysicalQty,
          searchButton: this.searchButton
        };

        localStorage.setItem('PhysicalData', JSON.stringify(storageData));

        if (res.success) {
          this.as.successToast(res.message);
        } else {
          this.as.errorToast(res.message);
        }
        this.sp.hide();
      },
      error: (err: any) => {
        console.log(err.message);
      },
      complete: () => subs.unsubscribe(),
    });
  }

  barcodeScan() {
    // const foundItems = this.dataList.filter((item: any) => item.Barcode === this.Barcode);

    // if (foundItems.length > 0) {
    //   let updatedCount = 0;

    //   foundItems.forEach((item: any) => {
    //     if (item.PhysicalAvailable < item.Available) {
    //       item.PhysicalAvailable += 1;
    //       updatedCount += 1; // Count how many we have updated
    //     }
    //   });

    //   if (updatedCount > 0) {
    //     this.as.successToast('Updated Physical Quantity');
    //   } else {
    //     Swal.fire({
    //       position: 'center',
    //       icon: 'warning',
    //       title: 'Not enough available quantity to increment Physical Available for any item.',
    //       showCancelButton: true,
    //       backdrop: false,
    //     })

    //   }
    // } else {
    //   Swal.fire({
    //     position: 'center',
    //     icon: 'warning',
    //     title: 'Barcode not found.',
    //     showCancelButton: true,
    //     backdrop: false,
    //   })
    // }

    const matchingItems = this.dataList.filter((item: any) => item.Barcode === this.Barcode);

    if (matchingItems.length > 0) {
      // Try to find the first item with available quantity
      const itemToUpdate = matchingItems.find((item: any) => item.PhysicalAvailable < item.Available);
      
      if (itemToUpdate) {
        itemToUpdate.PhysicalAvailable += 1;
        itemToUpdate.QtyDiff = itemToUpdate.Available - itemToUpdate.PhysicalAvailable
         // Increment the Physical Available count
        this.as.successToast('Updated Physical Quantity');
        // alert(`Physical Available updated to ${itemToUpdate.PhysicalAvailable} for barcode ${this.Barcode}`);
      } else {
        Swal.fire({
          position: 'center',
          icon: 'warning',
          title: 'No more available quantity to increment Physical Available for this barcode.',
          showCancelButton: true,
          backdrop: false,
        })
      }
    } else {
      Swal.fire({
        position: 'center',
        icon: 'warning',
        title: 'Barcode not found.',
        showCancelButton: true,
        backdrop: false,
      })
    }
    this.totalPhysicalQtycal()
    this.Barcode =""
  }

  totalPhysicalQtycal() {
    this.totalPhysicalQty = 0;
    this.totalQtyDiff=0;
    this.searchButton = false
    this.dataList.forEach((item: any) => {
      this.totalPhysicalQty += item.PhysicalAvailable;
      this.totalQtyDiff += item.QtyDiff;
    });

    const storageData = {
      dataList: this.dataList,
      totalAvailableQty: this.totalAvailableQty,
      totalPhysicalQty: this.totalPhysicalQty,
      totalQtyDiff: this.totalQtyDiff,
      searchButton: this.searchButton
      
    };

    localStorage.setItem('PhysicalData', JSON.stringify(storageData));
  }

  getPhysicalStockProductByID(){
    this.sp.show();
    const subs: Subscription = this.purchaseService.getPhysicalStockProductByID(this.id).subscribe({
      next: (res: any) => {
        if (res.success === true) {
              this.master = res.result.xMaster[0]
              this.totalAvailableQty = res.result.xMaster[0].TotalAvailableQty
              this.totalPhysicalQty = res.result.xMaster[0].TotalPhysicalQty
              this.totalQtyDiff = res.result.xMaster[0].TotalQtyDiff
              this.dataList = res.result.xDetail

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

  onSubmit() {
    this.sp.show();
    this.master.TotalAvailableQty = this.totalAvailableQty;
    this.master.TotalPhysicalQty = this.totalPhysicalQty;
    this.master.Remark = this.master.Remark || '';
    this.master.TotalQtyDiff = this.totalQtyDiff || 0;
    this.master.InvoiceDate = moment().format('yyyy-MM-DD');

    this.dataList.forEach((r:any)=>{
       r.AvailableQty =  r.Available 
       r.PhysicalAvailableQty = r.PhysicalAvailable
    })

    let dtm = {
      xMaster: this.master,
      xDetail: this.dataList
    }

    const subs: Subscription = this.purchaseService.savePhysicalStockProduct(dtm).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.id = res.data
          this.router.navigate(['/inventory/physical-stock', this.id]);
          this.getPhysicalStockProductByID();
          // this.dataList = res.data;
        } else {
          this.as.errorToast(res.message)
        }
        this.sp.hide();
      },
      error: (err: any) => console.log(err.message),
      complete: () => subs.unsubscribe(),
    });
  }

  update() {
    this.sp.show();
    this.master.TotalAvailableQty = this.totalAvailableQty;
    this.master.TotalPhysicalQty = this.totalPhysicalQty;
    this.master.Remark = this.master.Remark || '';
    this.master.TotalQtyDiff = this.totalQtyDiff || 0;
    this.master.InvoiceDate = moment().format('yyyy-MM-DD');

    this.dataList.forEach((r:any)=>{
       r.AvailableQty =  r.Available 
       r.PhysicalAvailableQty = r.PhysicalAvailable
    })

    let dtm = {
      xMaster: this.master,
      xDetail: this.dataList
    }

    const subs: Subscription = this.purchaseService.updatePhysicalStockProduct(dtm).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.id = res.data
          this.router.navigate(['/inventory/physical-stock', this.id]);
          this.getPhysicalStockProductByID();
          // this.dataList = res.data;
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
