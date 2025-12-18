import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BookingRoutingModule } from './booking-routing.module';
import { BookingComponent } from './booking.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { FeatureCommonComponentsModule } from '../../common/common-components.module';


@NgModule({
  declarations: [
    BookingComponent
  ],
  imports: [
    CommonModule,
    BookingRoutingModule,
    SharedModule,
    FeatureCommonComponentsModule
  ]
})
export class BookingModule { }
