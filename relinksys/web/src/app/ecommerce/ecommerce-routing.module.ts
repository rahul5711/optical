import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProductComponent } from './product/product.component';
import { ShipmentComponent } from './shipment/shipment.component';
import { BillingComponent } from './billing/billing.component';
import { BillComponent } from './bill/bill.component';
const routes: Routes = [ { path: '',
children: [
  { path: 'product', component: ProductComponent },  
  { path: 'shipment', component: ShipmentComponent },  
  { path: 'billing', component: BillingComponent },  
  { path: 'bill/:id', component: BillComponent },  
]}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EcommerceRoutingModule { }
