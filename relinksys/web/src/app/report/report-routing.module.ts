import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EyetestReportComponent } from './eyetest-report/eyetest-report.component';
import { InventoryReportComponent } from './inventory-report/inventory-report.component';
import { ProductReturnComponent } from './product-return/product-return.component';
import { PurchaseReportComponent } from './purchase-report/purchase-report.component';
import { TransferProductReportComponent } from './transfer-product-report/transfer-product-report.component';
import { SaleReportComponent } from './sale-report/sale-report.component';
import { ExpenseComponent } from './expense/expense.component';
import { VendorCreditComponent } from './vendor-credit/vendor-credit.component';
import { CashCollectionComponent } from './cash-collection/cash-collection.component';
import { OldSaleComponent } from './old-sale/old-sale.component';
import { CustomerReportComponent } from './customer-report/customer-report.component';
import { LoyalityReportComponent } from './loyality-report/loyality-report.component';
import { LedgeReportComponent } from './ledge-report/ledge-report.component';
import { GstReportComponent } from './gst-report/gst-report.component';
import { PettycashReportComponent } from './pettycash-report/pettycash-report.component';
import { RewardReportComponent } from './reward-report/reward-report.component';
import { CustomerReturnComponent } from './customer-return/customer-return.component';
import { InsuranceComponent } from './insurance/insurance.component';

const routes: Routes = [
  { path: '',
  children: [
    { path: 'sale', component: SaleReportComponent },
    { path: 'purchase', component: PurchaseReportComponent },
    { path: 'customer', component: CustomerReportComponent },
    { path: 'product-transfer', component: TransferProductReportComponent }, 
    { path: 'product-return', component: ProductReturnComponent },
    { path: 'inventory', component: InventoryReportComponent },
    { path: 'eyetest', component: EyetestReportComponent },
    { path: 'expenes', component: ExpenseComponent },
    { path: 'supplierCredit', component: VendorCreditComponent },
    { path: 'cashCollection', component: CashCollectionComponent },
    { path: 'oldSale', component: OldSaleComponent },
    { path: 'loyality', component: LoyalityReportComponent },
    { path: 'ledger', component: LedgeReportComponent },
    { path: 'GST-filling', component: GstReportComponent },
    { path: 'petty-cash', component: PettycashReportComponent },
    { path: 'reward', component: RewardReportComponent },
    { path: 'customer-return', component: CustomerReturnComponent },
    { path: 'insurance', component: InsuranceComponent },

  ]}
  ]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportRoutingModule { }
