import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { routes } from 'src/app/shared/routes/routes';
import { PatientService } from 'src/app/core/services/patient.service';

@Component({
    selector: 'app-medical-records',
    templateUrl: './medical-records.component.html',
    styleUrls: ['./medical-records.component.scss'],
    standalone: false
})
export class MedicalRecordsComponent implements OnInit {
  public routes = routes;
  medicalRecords: any[] = [];
  prescriptions: any[] = [];
  loading = false;
  error = '';
  saving = false;

  recordForm = this.fb.group({
    title: ['', Validators.required],
    record_type: [''],
    recorded_at: [''],
    comments: [''],
  });

  constructor(private patientService: PatientService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.loadRecords();
  }

  loadRecords(): void {
    this.loading = true;
    this.error = '';
    this.patientService.getMedicalRecords().subscribe({
      next: (res) => {
        const data = res?.data ?? res ?? [];
        this.medicalRecords = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'Failed to load medical records';
      },
    });
  }

  addRecord(): void {
    if (this.recordForm.invalid) {
      this.recordForm.markAllAsTouched();
      return;
    }
    this.saving = true;
    const payload = { ...this.recordForm.value };
    const recordedAt: any = this.recordForm.get('recorded_at')?.value;
    if (recordedAt instanceof Date) {
      payload['recorded_at'] = recordedAt.toISOString().slice(0, 10);
    }
    this.patientService.createMedicalRecord(payload).subscribe({
      next: () => {
        this.saving = false;
        this.recordForm.reset();
        this.loadRecords();
      },
      error: () => {
        this.saving = false;
      },
    });
  }
}
