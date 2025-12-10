import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DoctorService } from 'src/app/core/services/doctor.service';
import { routes } from 'src/app/shared/routes/routes';

@Component({
  selector: 'app-doctor-education-settings',
  templateUrl: './doctor-education-settings.component.html',
  styleUrl: './doctor-education-settings.component.scss',
  standalone: false,
})
export class DoctorEducationSettingsComponent implements OnInit {
  public routes = routes;
  form: FormGroup = this.fb.group({
    educations: this.fb.array([]),
  });
  loading = false;
  error = '';
  success = '';

  constructor(private fb: FormBuilder, private doctorService: DoctorService) {}

  ngOnInit(): void {
    this.loadEducations();
  }

  get educations(): FormArray {
    return this.form.get('educations') as FormArray;
  }

  addEducation(data: any = {}): void {
    this.educations.push(
      this.fb.group({
        degree: [data.degree || '', Validators.required],
        institution: [data.institution || ''],
        year_completed: [data.year_completed || ''],
        description: [data.description || ''],
      })
    );
  }

  removeEducation(index: number): void {
    this.educations.removeAt(index);
  }

  loadEducations(): void {
    this.loading = true;
    this.doctorService.getMyProfile().subscribe({
      next: (res) => {
        const doctor = res?.data ?? res;
        this.educations.clear();
        (doctor?.educations || []).forEach((ed: any) => this.addEducation(ed));
        if (!this.educations.length) this.addEducation();
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load educations';
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
    this.doctorService.updateMyProfile({ educations: this.educations.value }).subscribe({
      next: () => {
        this.success = 'Educations updated successfully';
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to update educations';
        this.loading = false;
      },
    });
  }
}
