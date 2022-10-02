import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProductManageComponent } from './product-manage/product-manage.component';
import { ProductMasterComponent } from './product-master/product-master.component';

const routes: Routes = [
  { path: '',
  children: [
    { path: 'productManage', component: ProductManageComponent },
    { path: 'productMaster', component: ProductMasterComponent },
  
     
  ]}
  ]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProductRoutingModule { }
