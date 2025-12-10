import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminComponent } from './admin.component';
import { AuthGuard } from '../core/guards/auth.guard';
import { RoleGuard } from '../core/guards/role.guard';

const routes: Routes = [
  {
    path: '',
    component: AdminComponent,
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./authentication/authentication.module').then(
            (m) => m.AuthenticationModule
          ),
      },
      {
        path: 'appointment-list',
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['admin'] },
        loadChildren: () =>
          import('./appointment-list/appointment-list.module').then(
            (m) => m.AppointmentListModule
          ),
      },
      {
        path: 'blank-page',
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['admin'] },
        loadChildren: () =>
          import('./blank-page/blank-page.module').then(
            (m) => m.BlankPageModule
          ),
      },
      {
        path: 'components',
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['admin'] },
        loadChildren: () =>
          import('./components/components.module').then(
            (m) => m.ComponentsModule
          ),
      },

      {
        path: 'doctor-list',
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['admin'] },
        loadChildren: () =>
          import('./doctor-list/doctor-list.module').then(
            (m) => m.DoctorListModule
          ),
      },

      {
        path: 'invoice',
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['admin'] },
        loadChildren: () =>
          import('./invoice/invoice.module').then((m) => m.InvoiceModule),
      },

      {
        path: 'patient-list',
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['admin'] },
        loadChildren: () =>
          import('./patient-list/patient-list.module').then(
            (m) => m.PatientListModule
          ),
      },
      {
        path: 'profile',
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['admin'] },
        loadChildren: () =>
          import('./profile/profile.module').then((m) => m.ProfileModule),
      },

      {
        path: 'reviews',
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['admin'] },
        loadChildren: () =>
          import('./reviews/reviews.module').then((m) => m.ReviewsModule),
      },
      {
        path: 'settings',
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['admin'] },
        loadChildren: () =>
          import('./settings/settings.module').then((m) => m.SettingsModule),
      },
      {
        path: 'specialities',
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['admin'] },
        loadChildren: () =>
          import('./specialities/specialities.module').then(
            (m) => m.SpecialitiesModule
          ),
      },

      {
        path: 'transactions-list',
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['admin'] },
        loadChildren: () =>
          import('./transactions-list/transactions-list.module').then(
            (m) => m.TransactionsListModule
          ),
      },
      {
        path: 'forms',
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['admin'] },
        loadChildren: () =>
          import('./forms/forms.module').then((m) => m.FormsModule),
      },
      {
        path: 'errors',
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['admin'] },
        loadChildren: () =>
          import('./errors/errors.module').then((m) => m.ErrorsModule),
      },
      {
        path: 'tables',
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['admin'] },
        loadChildren: () =>
          import('./tables/tables.module').then((m) => m.TablesModule),
      },
      {
        path: 'reports',
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['admin'] },
        loadChildren: () =>
          import('./reports/reports.module').then((m) => m.ReportsModule),
      },
      {
        path: 'dashboard',
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['admin'] },
        loadChildren: () =>
          import('./dashboard/dashboard.module').then((m) => m.DashboardModule),
      }
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
