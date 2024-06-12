import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SupplierPoComponent } from './supplier-po/supplier-po.component';
import { PurchaseConvertComponent } from './purchase-convert/purchase-convert.component';
import { SupplierPoListComponent } from './supplier-po-list/supplier-po-list.component';
import { FitterPoComponent } from './fitter-po/fitter-po.component';
import { FitterInvoiceComponent } from './fitter-invoice/fitter-invoice.component';
import { FitterInvoiceListComponent } from './fitter-invoice-list/fitter-invoice-list.component';
import { FitterInvoiceDetailComponent } from './fitter-invoice-detail/fitter-invoice-detail.component';
import { QuotationComponent } from './quotation/quotation.component';
import { QuotationListComponent } from './quotation-list/quotation-list.component';

const routes: Routes = [ { path: '',
children: [
  { path: 'supplierPo', component: SupplierPoComponent }, 
  { path: 'convertToPurchase', component: PurchaseConvertComponent }, 
  { path: 'supplierPoList', component: SupplierPoListComponent }, 
  { path: 'fitterPo', component: FitterPoComponent }, 
  { path: 'fitterInvoice', component: FitterInvoiceComponent }, 
  { path: 'fitterInvoiceList/:id', component: FitterInvoiceListComponent }, 
  { path: 'fitterInvoiceDetail/:id', component: FitterInvoiceDetailComponent }, 
  { path: 'quotation/:id', component: QuotationComponent }, 
  { path: 'quotationList', component: QuotationListComponent}, 
 ]}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PoRoutingModule { }
