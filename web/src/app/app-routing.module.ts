import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonComponent } from './common/common.component';
import { LoginComponent } from './common/login.component';
import { AuthGuard } from './auth/auth.guard';
import { WelcomeComponent } from './admin/welcome.component';

const routes: Routes = [
  
  {path: '' , component: WelcomeComponent},
  {path: 'login' , component: LoginComponent},
  {path: '', component: CommonComponent,
  children: [
    { path: 'admin',  loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule)},
    { path: 'product',  loadChildren: () => import('./product/product.module').then(m => m.ProductModule)},
    { path: 'inventory',  loadChildren: () => import('./inventory/inventory.module').then(m => m.InventoryModule)},
    { path: 'sale',  loadChildren: () => import('./sale/sale.module').then(m => m.SaleModule)},
     ]
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
