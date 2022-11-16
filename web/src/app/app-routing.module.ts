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
    { path: 'admin',  loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule),canActivate: [AuthGuard]},
    { path: 'product',  loadChildren: () => import('./product/product.module').then(m => m.ProductModule),canActivate: [AuthGuard]},
    { path: 'inventory',  loadChildren: () => import('./inventory/inventory.module').then(m => m.InventoryModule),canActivate: [AuthGuard]},
    { path: 'sale',  loadChildren: () => import('./sale/sale.module').then(m => m.SaleModule),canActivate: [AuthGuard]},
     ]
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { 
  
}
