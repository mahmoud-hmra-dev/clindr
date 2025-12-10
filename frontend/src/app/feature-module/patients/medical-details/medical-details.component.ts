import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { routes } from 'src/app/shared/routes/routes';
import { PatientService } from 'src/app/core/services/patient.service';

@Component({
    selector: 'app-medical-details',
    templateUrl: './medical-details.component.html',
    styleUrls: ['./medical-details.component.scss'],
    standalone: false
})
export class MedicalDetailsComponent implements OnInit {
  public routes = routes;
  vitals: any[] = [];
  loading = false;
  saving = false;
  showAddForm = false;

  vitalForm = this.fb.group({
    recorded_at: [''],
    blood_pressure: [''],
    heart_rate: [''],
    glucose_level: [''],
    body_temperature: [''],
    bmi: [''],
    spo2: [''],
    weight: [''],
    fbc_status: [''],
  });

  constructor(private patientService: PatientService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.loadVitals();
  }

  loadVitals(): void {
    this.loading = true;
    this.patientService.getVitals().subscribe({
      next: (res) => {
        this.vitals = res?.data ?? res ?? [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  addVital(): void {
    this.saving = true;
    const payload = { ...this.vitalForm.value };
    const recordedAt: any = this.vitalForm.get('recorded_at')?.value;
    if (recordedAt instanceof Date) {
      payload['recorded_at'] = recordedAt.toISOString().slice(0, 10);
    }
    this.patientService.createVital(payload).subscribe({
      next: () => {
        this.saving = false;
        this.vitalForm.reset();
        this.showAddForm = false;
        this.loadVitals();
      },
      error: () => {
        this.saving = false;
      },
    });
  }
}
