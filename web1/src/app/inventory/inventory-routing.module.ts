import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FitterListComponent } from './fitter-list/fitter-list.component';
import { FitterComponent } from './fitter/fitter.component';
import { InventorySummaryComponent } from './inventory-summary/inventory-summary.component';
import { PreOrderComponent } from './pre-order/pre-order.component';
import { PreorderListComponent } from './preorder-list/preorder-list.component';
import { ProductTransferComponent } from './product-transfer/product-transfer.component';
import { PurchaseListComponent } from './purchase-list/purchase-list.component';
import { PurchaseReturnListComponent } from './purchase-return-list/purchase-return-list.component';
import { PurchaseReturnComponent } from './purchase-return/purchase-return.component';
import { PurchaseComponent } from './purchase/purchase.component';
import { SearchBarcodeComponent } from './search-barcode/search-barcode.component';
import { SupplierComponent } from './supplier/supplier.component';
import { PerorderDummyListComponent } from './perorder-dummy-list/perorder-dummy-list.component';
import { LocationTrackerComponent } from './location-tracker/location-tracker.component';
import { PhysicalStockComponent } from './physical-stock/physical-stock.component';
import { LensGridViewComponent } from './lens-grid-view/lens-grid-view.component';

const routes: Routes = [
  { path: '',
  children: [
    { path: 'supplier', component: SupplierComponent },  
    { path: 'purchase/:id', component: PurchaseComponent },  
    { path: 'purchaseList/:id', component: PurchaseListComponent },  
    { path: 'fitter/:id', component: FitterComponent },  
    { path: 'fitterList', component: FitterListComponent },  
    { path: 'product-transfer', component: ProductTransferComponent },  
    { path: 'search-barcode', component: SearchBarcodeComponent },  
    { path: 'inventory-summary', component: InventorySummaryComponent },  
    { path: 'pre-order/:id', component: PreOrderComponent },  
    { path: 'preOrderList', component: PreorderListComponent },  
    { path: 'dummyPreorderList', component: PerorderDummyListComponent },  
    { path: 'purchase-return/:id', component: PurchaseReturnComponent },  
    { path: 'purchase-returnList', component: PurchaseReturnListComponent },  
    { path: 'location-tracker', component: LocationTrackerComponent },  
    { path: 'physical-stock', component: PhysicalStockComponent },  
    { path: 'lens-grid-view/:id', component: LensGridViewComponent },  
  ]} 
  ]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InventoryRoutingModule { }
