import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DoctorService } from 'src/app/core/services/doctor.service';
import { routes } from 'src/app/shared/routes/routes';

@Component({
  selector: 'app-doctor-specialities',
  templateUrl: './doctor-specialities.component.html',
  styleUrl: './doctor-specialities.component.scss',
  standalone: false,
})
export class DoctorSpecialitiesComponent implements OnInit {
  public routes = routes;
  form: FormGroup = this.fb.group({
    services: this.fb.array([]),
  });
  specialties: any[] = [];
  loading = false;
  error = '';
  success = '';

  constructor(private fb: FormBuilder, private doctorService: DoctorService) {}

  ngOnInit(): void {
    this.loadServices();
    this.loadSpecialties();
  }

  get services(): FormArray {
    return this.form.get('services') as FormArray;
  }

  addService(data: any = {}): void {
    this.services.push(
      this.fb.group({
        specialty_id: [data.specialty_id || '', Validators.required],
        name: [data.name || '', Validators.required],
        price: [data.price || '', Validators.required],
        description: [data.description || ''],
      })
    );
  }

  removeService(index: number): void {
    this.services.removeAt(index);
    if (!this.services.length) this.addService();
  }

  loadServices(): void {
    this.loading = true;
    this.doctorService.getMyProfile().subscribe({
      next: (res) => {
        const doctor = res?.data ?? res;
        this.services.clear();
        (doctor?.services || []).forEach((svc: any) => this.addService(svc));
        if (!this.services.length) this.addService();
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load services';
        this.loading = false;
      },
    });
  }

  loadSpecialties(): void {
    this.doctorService.getSpecialties().subscribe({
      next: (res: any) => {
        this.specialties = res?.data ?? res ?? [];
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
    this.doctorService.updateMyProfile({ services: this.services.value }).subscribe({
      next: () => {
        this.success = 'Services updated successfully';
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to update services';
        this.loading = false;
      },
    });
  }
}
