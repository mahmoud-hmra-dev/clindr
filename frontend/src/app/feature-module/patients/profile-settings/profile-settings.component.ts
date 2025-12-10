import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { routes } from 'src/app/shared/routes/routes';
import { PatientService } from 'src/app/core/services/patient.service';

@Component({
    selector: 'app-profile-settings',
    templateUrl: './profile-settings.component.html',
    styleUrls: ['./profile-settings.component.scss'],
    standalone: false
})
export class ProfileSettingsComponent implements OnInit {
  public routes = routes;
  saving = false;
  message = '';
  error = '';

  profileForm = this.fb.group({
    first_name: ['', Validators.required],
    last_name: ['', Validators.required],
    dob: [''],
    phone: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    blood_group: [''],
    address: [''],
    city: [''],
    state: [''],
    country: [''],
    pincode: [''],
  });

  constructor(private fb: FormBuilder, private patientService: PatientService) {}

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile(): void {
    this.patientService.getProfile().subscribe({
      next: (res) => {
        const data = res?.data ?? res;
        this.profileForm.patchValue({
          first_name: data?.first_name || '',
          last_name: data?.last_name || '',
          dob: data?.dob || '',
          phone: data?.phone || '',
          email: data?.email || '',
          blood_group: data?.blood_group || '',
          address: data?.address || '',
          city: data?.city || '',
          state: data?.state || '',
          country: data?.country || '',
          pincode: data?.pincode || '',
        });
      },
      error: () => {
        this.error = 'Failed to load profile';
      }
    });
  }

  save(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    this.saving = true;
    this.error = '';
    this.message = '';
    const payload = { ...this.profileForm.value };
    const dob: any = this.profileForm.get('dob')?.value;
    if (dob instanceof Date) {
      payload['dob'] = dob.toISOString().slice(0, 10);
    } else if (dob) {
      payload['dob'] = dob;
    }
    this.patientService.updateProfile(payload).subscribe({
      next: (res) => {
        this.message = res?.message || 'Profile updated';
        this.saving = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to update profile';
        this.saving = false;
      }
    });
  }
}
