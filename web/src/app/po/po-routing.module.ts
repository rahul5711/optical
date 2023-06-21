import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SupplierPoComponent } from './supplier-po/supplier-po.component';
import { PurchaseConvertComponent } from './purchase-convert/purchase-convert.component';
import { SupplierPoListComponent } from './supplier-po-list/supplier-po-list.component';
import { FitterPoComponent } from './fitter-po/fitter-po.component';

const routes: Routes = [ { path: '',
children: [
  { path: 'supplierPo', component: SupplierPoComponent }, 
  { path: 'convertToPurchase', component: PurchaseConvertComponent }, 
  { path: 'supplierPoList', component: SupplierPoListComponent }, 
  { path: 'fitterPo', component: FitterPoComponent }, 
 ]}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PoRoutingModule { }
