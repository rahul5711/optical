import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonComponent } from './common/common.component';
import { LoginComponent } from './common/login.component';
import { AuthGuard } from './auth/auth.guard';

const routes: Routes = [
  
  {path: '' , component: LoginComponent},
  {path: '', component: CommonComponent,
  children: [
    { path: 'admin',  loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule),canActivate: [AuthGuard]},
   
    
     ]
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
