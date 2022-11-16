import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FitterListComponent } from './fitter-list/fitter-list.component';
import { FitterComponent } from './fitter/fitter.component';
import { PurchaseListComponent } from './purchase-list/purchase-list.component';
import { PurchaseComponent } from './purchase/purchase.component';
import { SupplierComponent } from './supplier/supplier.component';

const routes: Routes = [
  { path: '',
  children: [
    { path: 'supplier/:id', component: SupplierComponent },  
    { path: 'purchase/:id', component: PurchaseComponent },  
    { path: 'purchaseList', component: PurchaseListComponent },  
    { path: 'fitter/:id', component: FitterComponent },  
    { path: 'fitterList', component: FitterListComponent },  
  ]}
  ]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InventoryRoutingModule { }
