import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedRoutingModule } from './shared-routing.module';
import { DashcardComponent } from './dashcard/dashcard.component';


@NgModule({
  declarations: [
    DashcardComponent
  ],
  imports: [
    CommonModule,
    SharedRoutingModule
  ],
  exports: [DashcardComponent]
})
export class SharedModule { }
