import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AvailableTimingsRoutingModule } from './available-timings-routing.module';
import { AvailableTimingsComponent } from './available-timings.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    AvailableTimingsComponent
  ],
  imports: [
    CommonModule,
    AvailableTimingsRoutingModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class AvailableTimingsModule { }
