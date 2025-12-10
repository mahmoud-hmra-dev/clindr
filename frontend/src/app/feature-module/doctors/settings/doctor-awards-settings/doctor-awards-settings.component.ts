import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DoctorService } from 'src/app/core/services/doctor.service';
import { routes } from 'src/app/shared/routes/routes';

@Component({
  selector: 'app-doctor-awards-settings',
  templateUrl: './doctor-awards-settings.component.html',
  styleUrl: './doctor-awards-settings.component.scss',
  standalone: false,
})
export class DoctorAwardsSettingsComponent implements OnInit {
  public routes = routes;
  form: FormGroup = this.fb.group({
    awards: this.fb.array([]),
  });
  loading = false;
  error = '';
  success = '';

  constructor(private fb: FormBuilder, private doctorService: DoctorService) {}

  ngOnInit(): void {
    this.loadAwards();
  }

  get awards(): FormArray {
    return this.form.get('awards') as FormArray;
  }

  addAward(data: any = {}): void {
    this.awards.push(
      this.fb.group({
        name: [data.name || '', Validators.required],
        year: [data.year || ''],
        description: [data.description || ''],
      })
    );
  }

  removeAward(index: number): void {
    this.awards.removeAt(index);
  }

  loadAwards(): void {
    this.loading = true;
    this.doctorService.getMyProfile().subscribe({
      next: (res) => {
        const doctor = res?.data ?? res;
        this.awards.clear();
        (doctor?.awards || []).forEach((aw: any) => this.addAward(aw));
        if (!this.awards.length) this.addAward();
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load awards';
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
    this.doctorService.updateMyProfile({ awards: this.awards.value }).subscribe({
      next: () => {
        this.success = 'Awards updated successfully';
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to update awards';
        this.loading = false;
      },
    });
  }
}
