import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SupplierPoComponent } from './supplier-po/supplier-po.component';

const routes: Routes = [ { path: '',
children: [
  { path: 'supplierPo', component: SupplierPoComponent }, 
 ]}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PoRoutingModule { }
