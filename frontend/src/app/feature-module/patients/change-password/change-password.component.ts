import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { routes } from 'src/app/shared/routes/routes';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
    selector: 'app-change-password',
    templateUrl: './change-password.component.html',
    styleUrls: ['./change-password.component.scss'],
    standalone: false
})
export class ChangePasswordComponent {
  public routes = routes;

  public password: boolean[] = [false, false, false];
  form: FormGroup;
  message = '';
  error = '';
  saving = false;

  constructor(private fb: FormBuilder, private auth: AuthService) {
    this.form = this.fb.group({
      current_password: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', Validators.required],
    });
  }

  public togglePassword(index: number) {
    this.password[index] = !this.password[index];
  }

  submit(): void {
    this.message = '';
    this.error = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    this.auth.changePassword(this.form.value).subscribe({
      next: () => {
        this.message = 'Password updated successfully';
        this.saving = false;
        this.form.reset();
        this.password = [false, false, false];
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to update password';
        this.saving = false;
      }
    });
  }
}
