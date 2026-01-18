import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProductComponent } from './product/product.component';
import { ShipmentComponent } from './shipment/shipment.component';
const routes: Routes = [ { path: '',
children: [
  { path: 'product', component: ProductComponent },  
  { path: 'shipment', component: ShipmentComponent },  
]}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EcommerceRoutingModule { }
