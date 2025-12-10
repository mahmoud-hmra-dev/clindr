/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { routes } from 'src/app/shared/routes/routes';
import { DoctorService } from 'src/app/core/services/doctor.service';

@Component({
    selector: 'app-available-timings',
    templateUrl: './available-timings.component.html',
    styleUrls: ['./available-timings.component.scss'],
    standalone: false
})
export class AvailableTimingsComponent implements OnInit {
  public routes = routes;

  form: FormGroup;
  clinics: any[] = [];
  loading = false;
  saving = false;
  message = '';
  error = '';

  dayOptions = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  constructor(
    private fb: FormBuilder,
    private doctorService: DoctorService
  ) {
    this.form = this.fb.group({
      availabilities: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  get availabilities(): FormArray {
    return this.form.get('availabilities') as FormArray;
  }

  private buildSlot(slot?: any): FormGroup {
    return this.fb.group({
      day_of_week: [slot?.day_of_week || 'monday', Validators.required],
      start_time: [this.toTimeInput(slot?.start_time), Validators.required],
      end_time: [this.toTimeInput(slot?.end_time), Validators.required],
      slot_capacity: [slot?.slot_capacity || 1, [Validators.required, Validators.min(1)]],
      fee_amount: [slot?.fee_amount ?? null, [Validators.min(0)]],
      clinic_id: [slot?.clinic_id || null],
    });
  }

  private toTimeInput(val?: string): string {
    if (!val) return '';
    if (val.length >= 5) return val.substring(0, 5);
    return val;
  }

  addSlot(): void {
    this.availabilities.push(this.buildSlot());
  }

  removeSlot(index: number): void {
    this.availabilities.removeAt(index);
  }

  loadProfile(): void {
    this.loading = true;
    this.doctorService.getMyProfile().subscribe({
      next: (res) => {
        const data = res?.data || res;
        this.clinics = data?.clinics || [];
        this.availabilities.clear();
        (data?.availabilities || []).forEach((slot: any) => this.availabilities.push(this.buildSlot(slot)));
        if (this.availabilities.length === 0) this.addSlot();
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load availabilities';
        this.loading = false;
      }
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    this.message = '';
    this.error = '';
    const payload = this.availabilities.value.map((slot: any) => ({
      ...slot,
      start_time: slot.start_time ? `${slot.start_time}:00` : null,
      end_time: slot.end_time ? `${slot.end_time}:00` : null,
    }));
    this.doctorService.updateMyProfile({ availabilities: payload }).subscribe({
      next: () => {
        this.message = 'Availabilities updated';
        this.saving = false;
        this.loadProfile();
      },
      error: () => {
        this.error = 'Failed to update availabilities';
        this.saving = false;
      }
    });
  }
}
