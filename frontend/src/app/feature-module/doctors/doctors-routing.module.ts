import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';
import { RoleGuard } from '../../core/guards/role.guard';
import { DoctorsComponent } from './doctors.component';
import { DoctorRequestComponent } from './doctor-request/doctor-request.component';
import { DoctorSpecialitiesComponent } from './doctor-specialities/doctor-specialities.component';

const routes: Routes = [
  {
    path: '',
    component: DoctorsComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['doctor'] },
    children: [
      {
        path: 'appointments',
        loadChildren: () =>
          import('./appointments/appointments.module').then(
            (m) => m.AppointmentsModule
          ),
      },
      {
        path: 'available-timings',
        loadChildren: () =>
          import('./available-timings/available-timings.module').then(
            (m) => m.AvailableTimingsModule
          ),
      },
      {
        path: 'add-prescription',
        loadChildren: () =>
          import('./add-prescription/add-prescription.module').then(
            (m) => m.AddPrescriptionModule
          ),
      },
      {
        path: 'edit-prescription',
        loadChildren: () =>
          import('./edit-prescription/edit-prescription.module').then(
            (m) => m.EditPrescriptionModule
          ),
      },
      {
        path: 'doctor-dashboard',
        loadChildren: () =>
          import('./doctor-dashboard/doctor-dashboard.module').then(
            (m) => m.DoctorDashboardModule
          ),
      },
      {
        path: 'my-patients',
        loadChildren: () =>
          import('./my-patients/my-patients.module').then(
            (m) => m.MyPatientsModule
          ),
      },
      {
        path: 'patient-profile',
        loadChildren: () =>
          import('./patient-profile/patient-profile.module').then(
            (m) => m.PatientProfileModule
          ),
      },
      {
        path: 'chat-doctor',
        loadChildren: () =>
          import('./chat-doctor/chat-doctor.module').then(
            (m) => m.ChatDoctorModule
          ),
      },

      {
        path: 'reviews',
        loadChildren: () =>
          import('./reviews/reviews.module').then((m) => m.ReviewsModule),
      },
      {
        path: 'register',
        loadChildren: () =>
          import('./register/register.module').then((m) => m.RegisterModule),
      },
      {
        path: 'doctor-change-password',
        loadChildren: () =>
          import('./doctor-change-password/doctor-change-password.module').then(
            (m) => m.DoctorChangePasswordModule
          ),
      },

      {
        path: 'available-timings',
        loadChildren: () =>
          import('./schedule-timings/schedule-timings.module').then(
            (m) => m.ScheduleTimingsModule
          ),
      },
      {
        path: 'patient-details',
        loadChildren: () =>
          import('./patient-details/patient-details.module').then(
            (m) => m.PatientDetailsModule
          ),
      },
      {
        path: 'appointments',
        loadChildren: () =>
          import('./appointments/appointments.module').then(
            (m) => m.AppointmentsModule
          ),
      },
      {
        path: 'settings',
        loadChildren: () =>
          import('./settings/settings.module').then((m) => m.SettingsModule),
      },
      {
        path: 'doctor-request',
        component: DoctorRequestComponent,
      },
      {
        path: 'doctor-specialities',
        component: DoctorSpecialitiesComponent,
      },
    ],
  },
  { path: 'invoices', loadChildren: () => import('./invoices/invoices.module').then(m => m.InvoicesModule) },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DoctorsRoutingModule {}
