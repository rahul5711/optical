import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CustomerBlukComponent } from './customer-bluk/customer-bluk.component';
import { PurchaseBlukComponent } from './purchase-bluk/purchase-bluk.component';
import { BillBlukComponent } from './bill-bluk/bill-bluk.component';
import { SupplierBulkComponent } from './supplier-bulk/supplier-bulk.component';

const routes: Routes = [
  {path: 'purchase' , component: PurchaseBlukComponent},
  {path: 'customer' , component: CustomerBlukComponent},
  {path: 'bill' , component: BillBlukComponent},
  {path: 'supplier-uploader' , component: SupplierBulkComponent},

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UploaderRoutingModule { }
