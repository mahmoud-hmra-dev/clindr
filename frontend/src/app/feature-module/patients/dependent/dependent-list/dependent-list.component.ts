import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { routes } from 'src/app/shared/routes/routes';
import { PatientService } from 'src/app/core/services/patient.service';

@Component({
    selector: 'app-dependent-list',
    templateUrl: './dependent-list.component.html',
    styleUrls: ['./dependent-list.component.scss'],
    standalone: false
})
export class DependentListComponent implements OnInit {
  public routes = routes;
  dependents: any[] = [];
  loading = false;
  saving = false;
  editingId: number | null = null;
  showForm = false;

  form = this.fb.group({
    name: ['', Validators.required],
    relationship: ['', Validators.required],
    gender: [''],
    blood_group: [''],
    is_active: [true],
  });

  constructor(private patientService: PatientService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.loadDependents();
  }

  loadDependents(): void {
    this.loading = true;
    this.patientService.getDependents().subscribe({
      next: (res) => {
        this.dependents = res?.data ?? res ?? [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  startAdd(): void {
    this.editingId = null;
    this.form.reset({ is_active: true });
    this.showForm = true;
  }

  startEdit(dep: any): void {
    this.editingId = dep?.id || null;
    this.form.patchValue({
      name: dep?.name || '',
      relationship: dep?.relationship || '',
      gender: dep?.gender || '',
      blood_group: dep?.blood_group || '',
      is_active: dep?.is_active ?? true,
    });
    this.showForm = true;
  }

  toggleActive(dep: any): void {
    const updated = { ...dep, is_active: !dep?.is_active };
    this.patientService.updateDependent(dep.id, { is_active: updated.is_active }).subscribe(() => {
      dep.is_active = updated.is_active;
    });
  }

  delete(dep: any): void {
    if (!dep?.id) return;
    this.patientService.deleteDependent(dep.id).subscribe(() => {
      this.dependents = this.dependents.filter((d) => d.id !== dep.id);
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const payload = { ...this.form.value };
    const req = this.editingId
      ? this.patientService.updateDependent(this.editingId, payload)
      : this.patientService.createDependent(payload);

    req.subscribe({
      next: () => {
        this.saving = false;
        this.showForm = false;
        this.form.reset({ is_active: true });
        this.loadDependents();
      },
      error: () => {
        this.saving = false;
      },
    });
  }
}
