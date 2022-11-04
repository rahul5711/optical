import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FitterListComponent } from './fitter-list/fitter-list.component';
import { FitterComponent } from './fitter/fitter.component';
import { SupplierComponent } from './supplier/supplier.component';

const routes: Routes = [
  { path: '',
  children: [
    { path: 'supplier/:id', component: SupplierComponent },  
    { path: 'fitter/:id', component: FitterComponent },  
    { path: 'fitterList', component: FitterListComponent },  
  ]}
  ]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InventoryRoutingModule { }
