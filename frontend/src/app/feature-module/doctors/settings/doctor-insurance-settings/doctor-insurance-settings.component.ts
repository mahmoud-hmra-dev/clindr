import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DoctorService } from 'src/app/core/services/doctor.service';
import { routes } from 'src/app/shared/routes/routes';

@Component({
  selector: 'app-doctor-insurance-settings',
  templateUrl: './doctor-insurance-settings.component.html',
  styleUrl: './doctor-insurance-settings.component.scss',
  standalone: false,
})
export class DoctorInsuranceSettingsComponent implements OnInit {
  public routes = routes;
  form: FormGroup = this.fb.group({
    insurances: this.fb.array([]),
  });
  loading = false;
  error = '';
  success = '';

  constructor(private fb: FormBuilder, private doctorService: DoctorService) {}

  ngOnInit(): void {
    this.loadInsurances();
  }

  get insurances(): FormArray {
    return this.form.get('insurances') as FormArray;
  }

  addInsurance(data: any = {}): void {
    this.insurances.push(
      this.fb.group({
        name: [data.name || '', Validators.required],
        logo_url: [data.logo_url || ''],
      })
    );
  }

  removeInsurance(index: number): void {
    this.insurances.removeAt(index);
  }

  loadInsurances(): void {
    this.loading = true;
    this.doctorService.getMyProfile().subscribe({
      next: (res) => {
        const doctor = res?.data ?? res;
        this.insurances.clear();
        (doctor?.insurances || []).forEach((ins: any) => this.addInsurance(ins));
        if (!this.insurances.length) this.addInsurance();
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load insurances';
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
    this.doctorService.updateMyProfile({ insurances: this.insurances.value }).subscribe({
      next: () => {
        this.success = 'Insurances updated successfully';
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to update insurances';
        this.loading = false;
      },
    });
  }
}
