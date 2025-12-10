import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthenticationComponent } from './authentication.component';

const routes: Routes = [
  {
    path: '',
    component: AuthenticationComponent,
    children: [
      {
        path: 'doctor-signup',
        loadChildren: () =>
          import('./doctor-signup/doctor-signup.module').then(
            (m) => m.DoctorSignupModule
          ),
      },
      {
        path: 'patient-signup',
        loadChildren: () =>
          import('./patient-signup/patient-signup.module').then(
            (m) => m.PatientSignupModule
          ),
      },
      {
        path: 'forgot-password',
        loadChildren: () =>
          import('./forgot-password/forgot-password.module').then(
            (m) => m.ForgotPasswordModule
          ),
      },

      {
        path: 'signup-success',
        loadChildren: () =>
          import('./signup-success/signup-success.module').then(
            (m) => m.SignupSuccessModule
          ),
      },
      {
        path: 'reset-password',
        loadChildren: () =>
          import('./reset-password/reset-password.module').then(
            (m) => m.ResetPasswordModule
          ),
      },
      {
        path: 'register',
        loadChildren: () =>
          import('./register/register.module').then((m) => m.RegisterModule),
      },
      {
        path: 'login',
        loadChildren: () =>
          import('./login/login.module').then((m) => m.LoginModule),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AuthenticationRoutingModule {}
