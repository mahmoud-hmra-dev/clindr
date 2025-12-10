import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PatientsComponent } from './patients.component';
import { PatientInvoiceComponent } from './patient-invoice/patient-invoice.component';
import { AuthGuard } from '../../core/guards/auth.guard';
import { RoleGuard } from '../../core/guards/role.guard';

const routes: Routes = [
  {
    path: '',
    component: PatientsComponent,
    children: [
      {
        path: 'booking',
        loadChildren: () =>
          import('./booking/booking.module').then((m) => m.BookingModule),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['patient'] },
      },
      {
        path: 'doctors',
        loadChildren: () =>
          import('./doctors/doctors.module').then((m) => m.DoctorsModule),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['patient'] },
      },
      {
        path: 'search-doctor',
        loadChildren: () =>
          import('./search-doctor/search-doctor.module').then(
            (m) => m.SearchDoctorModule
          ),
      },
      {
        path: 'doctor-profile',
        loadChildren: () =>
          import('./doctor-profile/doctor-profile.module').then(
            (m) => m.DoctorProfileModule
          ),
      },
      {
        path: 'checkout',
        loadChildren: () =>
          import('./checkout/checkout.module').then((m) => m.CheckoutModule),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['patient'] },
      },
      {
        path: 'patient-dashboard',
        loadChildren: () =>
          import('./patient-dashboard/patient-dashboard.module').then(
            (m) => m.PatientDashboardModule
          ),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['patient'] },
      },
      {
        path: 'favourites',
        loadChildren: () =>
          import('./favourites/favourites.module').then(
            (m) => m.FavouritesModule
          ),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['patient'] },
      },
      {
        path: 'chat',
        loadChildren: () =>
          import('./chat/chat.module').then((m) => m.ChatModule),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['patient'] },
      },
      {
        path: 'profile-settings',
        loadChildren: () =>
          import('./profile-settings/profile-settings.module').then(
            (m) => m.ProfileSettingsModule
          ),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['patient'] },
      },
      {
        path: 'change-password',
        loadChildren: () =>
          import('./change-password/change-password.module').then(
            (m) => m.ChangePasswordModule
          ),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['patient'] },
      },
      {
        path: 'consultation',
        loadChildren: () =>
          import('./consultation/consultation.module').then(
            (m) => m.ConsultationModule
          ),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['patient'] },
      },
      {
        path: 'dependent',
        loadChildren: () =>
          import('./dependent/dependent.module').then((m) => m.DependentModule),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['patient'] },
      },
      {
        path: 'payment',
        loadChildren: () =>
          import('./payment/payment.module').then((m) => m.PaymentModule),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['patient'] },
      },
      {
        path: 'register',
        loadChildren: () =>
          import('./register/register.module').then((m) => m.RegisterModule),
      },
      {
        path: 'medical-records',
        loadChildren: () =>
          import('./medical-records/medical-records.module').then(
            (m) => m.MedicalRecordsModule
          ),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['patient'] },
      },
      {
        path: 'medical-details',
        loadChildren: () =>
          import('./medical-details/medical-details.module').then(
            (m) => m.MedicalDetailsModule
          ),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['patient'] },
      },
      {
        path: 'appointments',
        loadChildren: () =>
          import('./appointments/appointments.module').then(
            (m) => m.AppointmentsModule
          ),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['patient'] },
      },

      {
        path: 'patient-invoice',
        component: PatientInvoiceComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['patient'] },
      },
      {
        path: 'doctor-profile',
        loadChildren: () =>
          import('./doctor-profile/doctor-profile.module').then(
            (m) => m.DoctorProfileModule
          ),
        },
        { path: 'delete-account', loadChildren: () => import('./delete-account/delete-account.module').then(m => m.DeleteAccountModule), canActivate: [AuthGuard, RoleGuard], data: { roles: ['patient'] } },

        // BookingRoutingModule
        { path: 'booking', loadChildren: () => import('./booking/booking.module').then(m => m.BookingModule), canActivate: [AuthGuard, RoleGuard], data: { roles: ['patient'] } },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PatientsRoutingModule {}
