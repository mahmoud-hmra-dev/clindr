import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BookingRoutingModule } from './booking-routing.module';
import { BookingComponent } from './booking.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';

const calendarPlugins = [dayGridPlugin, interactionPlugin, timeGridPlugin];
(FullCalendarModule as any).registerPlugins?.(calendarPlugins);


@NgModule({
  declarations: [
    BookingComponent
  ],
  imports: [
    CommonModule,
    BookingRoutingModule,
    SharedModule,
    FullCalendarModule
  ]
})
export class BookingModule { }
