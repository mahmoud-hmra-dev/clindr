import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DoctorsRoutingModule } from './doctors-routing.module';
import { DoctorsComponent } from './doctors.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { DoctorSpecialitiesComponent } from './doctor-specialities/doctor-specialities.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    DoctorsComponent,
    DoctorSpecialitiesComponent
  ],
  imports: [
    CommonModule,
    DoctorsRoutingModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class DoctorsModule { }
