import { Component, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, Validators } from '@angular/forms';
import { routes } from 'src/app/shared/routes/routes';
import intlTelInput from 'intl-tel-input';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  standalone: false,
})
export class RegisterComponent implements AfterViewInit {
  public routes = routes;
  public togglePasswordClass = false;

  registerForm = this.fb.group({
    name: ['', [Validators.required]],
    phone: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
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
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    this.authService.registerPatient(this.registerForm.value as any).subscribe({
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

  ngAfterViewInit(): void {
    const input = document.querySelector('#phone') as HTMLInputElement;
    if (!input) return;
    intlTelInput(input, {
      initialCountry: 'us',
      preferredCountries: ['us', 'gb', 'in'],
      utilsScript:
        'https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.19/js/utils.js',
    } as any);
    input.addEventListener('input', () => {
      input.value = input.value.replace(/[^0-9+()-\\s]/g, '');
    });
  }
}
