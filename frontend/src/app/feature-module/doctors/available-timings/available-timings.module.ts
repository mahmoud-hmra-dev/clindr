import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AvailableTimingsRoutingModule } from './available-timings-routing.module';
import { AvailableTimingsComponent } from './available-timings.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';

const calendarPlugins = [dayGridPlugin, interactionPlugin, timeGridPlugin];
(FullCalendarModule as any).registerPlugins?.(calendarPlugins);


@NgModule({
  declarations: [
    AvailableTimingsComponent
  ],
  imports: [
    CommonModule,
    AvailableTimingsRoutingModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    FullCalendarModule
  ]
})
export class AvailableTimingsModule { }
