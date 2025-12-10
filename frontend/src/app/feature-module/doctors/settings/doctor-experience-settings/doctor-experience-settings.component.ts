import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DoctorService } from 'src/app/core/services/doctor.service';
import { routes } from 'src/app/shared/routes/routes';

@Component({
  selector: 'app-doctor-experience-settings',
  templateUrl: './doctor-experience-settings.component.html',
  styleUrl: './doctor-experience-settings.component.scss',
  standalone: false,
})
export class DoctorExperienceSettingsComponent implements OnInit {
  public routes = routes;
  form: FormGroup = this.fb.group({
    experiences: this.fb.array([]),
  });
  loading = false;
  error = '';
  success = '';

  constructor(private fb: FormBuilder, private doctorService: DoctorService) {}

  ngOnInit(): void {
    this.loadExperiences();
  }

  get experiences(): FormArray {
    return this.form.get('experiences') as FormArray;
  }

  addExperience(data: any = {}): void {
    this.experiences.push(
      this.fb.group({
        organization: [data.organization || '', Validators.required],
        department: [data.department || ''],
        city: [data.city || ''],
        start_date: [data.start_date || ''],
        end_date: [data.end_date || ''],
        description: [data.description || ''],
      })
    );
  }

  removeExperience(index: number): void {
    this.experiences.removeAt(index);
  }

  loadExperiences(): void {
    this.loading = true;
    this.doctorService.getMyProfile().subscribe({
      next: (res) => {
        const doctor = res?.data ?? res;
        this.experiences.clear();
        (doctor?.experiences || []).forEach((exp: any) => this.addExperience(exp));
        if (!this.experiences.length) this.addExperience();
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load experiences';
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
    this.doctorService
      .updateMyProfile({ experiences: this.experiences.value })
      .subscribe({
        next: () => {
          this.success = 'Experiences updated successfully';
          this.loading = false;
        },
        error: () => {
          this.error = 'Failed to update experiences';
          this.loading = false;
        },
      });
  }
}
