import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PurchaseBlukComponent } from './purchase-bluk/purchase-bluk.component';

const routes: Routes = [
  {path: 'purchase' , component: PurchaseBlukComponent},

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UploaderRoutingModule { }
