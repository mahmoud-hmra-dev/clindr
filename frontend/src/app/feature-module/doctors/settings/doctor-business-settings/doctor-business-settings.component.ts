import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DoctorService } from 'src/app/core/services/doctor.service';
import { routes } from 'src/app/shared/routes/routes';

@Component({
  selector: 'app-doctor-business-settings',
  templateUrl: './doctor-business-settings.component.html',
  styleUrl: './doctor-business-settings.component.scss',
  standalone: false,
})
export class DoctorBusinessSettingsComponent implements OnInit {
  public routes = routes;
  form: FormGroup = this.fb.group({
    availabilities: this.fb.array([]),
  });
  days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  loading = false;
  error = '';
  success = '';

  constructor(private fb: FormBuilder, private doctorService: DoctorService) {}

  ngOnInit(): void {
    this.loadAvailabilities();
  }

  get availabilities(): FormArray {
    return this.form.get('availabilities') as FormArray;
  }

  addAvailability(data: any = {}): void {
    this.availabilities.push(
      this.fb.group({
        day_of_week: [data.day_of_week || '', Validators.required],
        start_time: [this.toInputTime(data.start_time) || '', Validators.required],
        fee_amount: [data.fee_amount || ''],
        clinic_id: [data.clinic_id || ''],
        slot_capacity: [data.slot_capacity || ''],
      })
    );
  }

  removeAvailability(index: number): void {
    this.availabilities.removeAt(index);
  }

  loadAvailabilities(): void {
    this.loading = true;
    this.doctorService.getMyProfile().subscribe({
      next: (res) => {
        const doctor = res?.data ?? res;
        this.availabilities.clear();
        (doctor?.availabilities || []).forEach((av: any) => this.addAvailability(av));
        if (!this.availabilities.length) this.addAvailability();
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load business hours';
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
    const payload = this.availabilities.value.map((av: any) => ({
      ...av,
      start_time: this.toApiTime(av.start_time),
    }));
    this.doctorService.updateMyProfile({ availabilities: payload }).subscribe({
      next: () => {
        this.success = 'Business hours updated successfully';
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to update business hours';
        this.loading = false;
      },
    });
  }

  private toInputTime(val: any): string {
    if (!val) return '';
    try {
      const d = new Date(val);
      if (!isNaN(d.valueOf())) {
        return d.toISOString().substring(11, 16);
      }
    } catch (e) {
      // ignore
    }
    if (typeof val === 'string' && val.length >= 5) {
      return val.substring(0, 5);
    }
    return '';
  }

  private toApiTime(val: string): string {
    if (!val) return '';
    const lower = val.toLowerCase();
    if (lower.includes('am') || lower.includes('pm')) {
      const parsed = new Date(`1970-01-01T${val}`);
      if (!isNaN(parsed.valueOf())) {
        return parsed.toISOString().substring(11, 19);
      }
    }
    if (val.length === 5) {
      return `${val}:00`;
    }
    return val;
  }
}
