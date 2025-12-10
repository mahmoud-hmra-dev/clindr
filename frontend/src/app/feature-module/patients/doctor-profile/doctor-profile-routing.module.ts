import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DoctorProfileComponent } from './doctor-profile.component';
import { DoctorProfile1Component } from './doctor-profile1/doctor-profile1.component';

const routes: Routes = [
  {
    path: '',
    component: DoctorProfileComponent,
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./doctor-profile1/doctor-profile1.module').then(
            (m) => m.DoctorProfile1Module
          ),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DoctorProfileRoutingModule {}
