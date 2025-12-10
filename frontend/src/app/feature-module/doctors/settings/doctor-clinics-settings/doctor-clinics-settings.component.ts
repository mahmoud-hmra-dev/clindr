import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DoctorService } from 'src/app/core/services/doctor.service';
import { routes } from 'src/app/shared/routes/routes';

@Component({
  selector: 'app-doctor-clinics-settings',
  templateUrl: './doctor-clinics-settings.component.html',
  styleUrl: './doctor-clinics-settings.component.scss',
  standalone: false,
})
export class DoctorClinicsSettingsComponent implements OnInit {
  public routes = routes;
  form: FormGroup = this.fb.group({
    clinics: this.fb.array([]),
  });
  loading = false;
  error = '';
  success = '';

  constructor(private fb: FormBuilder, private doctorService: DoctorService) {}

  ngOnInit(): void {
    this.loadClinics();
  }

  get clinics(): FormArray {
    return this.form.get('clinics') as FormArray;
  }

  addClinic(data: any = {}): void {
    this.clinics.push(
      this.fb.group({
        name: [data.name || '', Validators.required],
        address: [data.address || ''],
        city: [data.city || ''],
        fee_amount: [data.fee_amount || ''],
      })
    );
  }

  removeClinic(index: number): void {
    this.clinics.removeAt(index);
  }

  loadClinics(): void {
    this.loading = true;
    this.doctorService.getMyProfile().subscribe({
      next: (res) => {
        const doctor = res?.data ?? res;
        this.clinics.clear();
        (doctor?.clinics || []).forEach((cl: any) => this.addClinic(cl));
        if (!this.clinics.length) this.addClinic();
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load clinics';
        this.loading = false;
      },
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.error = '';
    this.success = '';
    this.doctorService.updateMyProfile({ clinics: this.clinics.value }).subscribe({
      next: () => {
        this.success = 'Clinics updated successfully';
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to update clinics';
        this.loading = false;
      },
    });
  }
}
