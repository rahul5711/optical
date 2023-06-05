import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SupplierPoComponent } from './supplier-po/supplier-po.component';
import { PurchaseConvertComponent } from './purchase-convert/purchase-convert.component';

const routes: Routes = [ { path: '',
children: [
  { path: 'supplierPo', component: SupplierPoComponent }, 
  { path: 'convertToPurchase', component: PurchaseConvertComponent }, 
 ]}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PoRoutingModule { }
