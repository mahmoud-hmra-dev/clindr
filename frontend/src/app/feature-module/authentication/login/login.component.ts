import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, Validators } from '@angular/forms';
import { routes } from 'src/app/shared/routes/routes';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: false,
})
export class LoginComponent {
  public routes = routes;
  public togglePasswordClass = false;

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private authService: AuthService
  ) {}

  togglePassword() {
    this.togglePasswordClass = !this.togglePasswordClass;
  }

  submit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.authService.login(this.loginForm.value as any).subscribe({
      next: (res) => {
        const roles = (res.user.roles || []).map((r: any) =>
          (typeof r === 'string' ? r : r?.name)?.toLowerCase()
        );
        if (roles.includes('admin')) {
          this.router.navigate(['/admin/dashboard']);
        } else if (roles.includes('doctor')) {
          this.router.navigate(['/doctors/doctor-dashboard']);
        } else {
          this.router.navigate(['/patients/patient-dashboard']);
        }
      },
    });
  }
}
