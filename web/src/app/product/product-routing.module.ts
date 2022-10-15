import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddManageComponent } from './add-manage/add-manage.component';
import { ProductManageComponent } from './product-manage/product-manage.component';
import { ProductMasterComponent } from './product-master/product-master.component';

const routes: Routes = [
  { path: '',
  children: [
    { path: 'productManage', component: ProductManageComponent },
    { path: 'productMaster', component: ProductMasterComponent },
    { path: 'addManage', component: AddManageComponent },
  
     
  ]}
  ]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProductRoutingModule { }
