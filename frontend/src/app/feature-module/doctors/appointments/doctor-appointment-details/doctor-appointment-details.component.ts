import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { routes } from 'src/app/shared/routes/routes';
import { DoctorService } from 'src/app/core/services/doctor.service';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-doctor-appointment-details',
  templateUrl: './doctor-appointment-details.component.html',
  styleUrl: './doctor-appointment-details.component.scss',
  standalone: false
})
export class DoctorAppointmentDetailsComponent implements OnInit {
  public routes = routes;

  appointment: any = null;
  loading = false;
  error = '';

  // ====== Status UI ======
  statusOptions = [
    { value: 'pending',   label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'rescheduled', label: 'Rescheduled' }
  ];
  selectedStatus = 'pending';

  // Medical Records
  medicalRecords: any[] = [];
  newRecord: any = {
    record_type: '',
    title: '',
    comments: '',
    file_url: ''
  };
  recordFile: File | null = null;
  savingRecord = false;
  recordError = '';
  editingRecord: any | null = null;

  // Prescriptions
  prescriptions: any[] = [];
  newPrescription: any = {
    name: '',
    file_url: ''
  };
  prescriptionFile: File | null = null;
  savingPrescription = false;
  prescriptionError = '';
  editingPrescription: any | null = null;

  constructor(
    private route: ActivatedRoute,
    private doctorService: DoctorService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const id = Number(
      this.route.snapshot.paramMap.get('id') ||
      this.route.snapshot.queryParamMap.get('id')
    );
    if (id) {
      this.load(id);
    } else {
      this.error = 'Appointment not found';
    }
  }

  private load(id: number): void {
    this.loading = true;
    this.error = '';
    this.doctorService.getDoctorAppointment(id).subscribe({
      next: (res) => {
        this.appointment = res?.data ?? res;
        // ضبط الـ status المختار من قيمة الموعد
        this.selectedStatus = (this.appointment?.status || 'pending').toLowerCase();
        this.loading = false;
        if (this.appointment?.id) {
          this.loadMedicalRecords();
          this.loadPrescriptions();
        }
      },
      error: () => {
        this.error = 'Failed to load appointment';
        this.loading = false;
      }
    });
  }

  // ====== STATUS / LABEL HELPERS ======

  get statusBadgeClass(): string {
    const status = (this.appointment?.status || '').toLowerCase();
    if (status === 'cancelled') return 'badge bg-red';
    if (status === 'completed') return 'badge bg-green';
    if (status === 'confirmed') return 'badge bg-blue';
    return 'badge bg-yellow'; // pending / default
  }

  get statusLabel(): string {
    const status = (this.appointment?.status || '').toLowerCase();
    if (!status) return 'Upcoming';
    if (status === 'no_show') return 'No Show';
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  get appointmentTypeLabel(): string {
    const type = (this.appointment?.appointment_type || '').toLowerCase();
    if (type === 'online') return 'Video Call';
    if (type === 'in_clinic') return 'Clinic Visit';
    return this.appointment?.appointment_type || 'Appointment';
  }

  get visitTypeLabel(): string {
    return this.appointment?.visit_type || 'General';
  }

  // تغيير حالة الموعد من الواجهة
  onStatusChange(): void {
    if (!this.appointment?.id) return;

    const newStatus = this.selectedStatus;
    this.error = '';

    this.doctorService
      .updateDoctorAppointmentStatus(this.appointment.id, newStatus)
      .subscribe({
        next: (res) => {
          const updated = res?.data ?? res;
          this.appointment = updated;
          this.selectedStatus = (this.appointment?.status || newStatus).toLowerCase();
        },
        error: (err) => {
          this.error = err?.error?.message || 'Failed to update status';
          // رجّع القيمة لو حصل خطأ
          this.selectedStatus = (this.appointment?.status || this.selectedStatus).toLowerCase();
        }
      });
  }

  // ====== MEDICAL RECORDS ======

  private get appointmentId(): number | null {
    return this.appointment?.id ?? null;
  }

  loadMedicalRecords(): void {
    if (!this.appointmentId) return;
    this.http
      .get<any>(`${environment.apiBaseUrl}/doctor/appointments/${this.appointmentId}/medical-records`)
      .subscribe({
        next: (res) => {
          this.medicalRecords = res?.data ?? res ?? [];
        },
        error: () => {
          // ignore
        }
      });
  }

  onRecordFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.recordFile = input.files[0];
    } else {
      this.recordFile = null;
    }
  }

  startEditMedicalRecord(rec: any): void {
    this.editingRecord = rec;
    this.newRecord = {
      record_type: rec.record_type || '',
      title: rec.title || '',
      comments: rec.comments || '',
      file_url: rec.file_url || ''
    };
    this.recordFile = null;
    this.recordError = '';
  }

  cancelEditMedicalRecord(): void {
    this.editingRecord = null;
    this.resetRecordForm();
  }

  private resetRecordForm(): void {
    this.newRecord = {
      record_type: '',
      title: '',
      comments: '',
      file_url: ''
    };
    this.recordFile = null;
    this.recordError = '';
  }

  saveMedicalRecord(): void {
    if (!this.appointmentId) return;

    this.recordError = '';

    if (!this.newRecord.record_type || !this.newRecord.title) {
      this.recordError = 'Record type and title are required.';
      return;
    }

    const formData = new FormData();
    formData.append('record_type', this.newRecord.record_type);
    formData.append('title', this.newRecord.title);
    if (this.newRecord.comments) {
      formData.append('comments', this.newRecord.comments);
    }
    if (this.newRecord.file_url) {
      formData.append('file_url', this.newRecord.file_url);
    }
    if (this.recordFile) {
      formData.append('file', this.recordFile);
    }

    this.savingRecord = true;

    if (this.editingRecord) {
      const id = this.editingRecord.id;
      this.http
        .post<any>(`${environment.apiBaseUrl}/doctor/medical-records/${id}?_method=PUT`, formData)
        .subscribe({
          next: (res) => {
            const updated = res?.data ?? res;
            const idx = this.medicalRecords.findIndex((r) => r.id === id);
            if (idx !== -1) {
              this.medicalRecords[idx] = updated;
            }
            this.savingRecord = false;
            this.editingRecord = null;
            this.resetRecordForm();
          },
          error: (err) => {
            this.savingRecord = false;
            this.recordError = err?.error?.message || 'Failed to update medical record.';
          }
        });
    } else {
      this.http
        .post<any>(`${environment.apiBaseUrl}/doctor/appointments/${this.appointmentId}/medical-records`, formData)
        .subscribe({
          next: (res) => {
            const created = res?.data ?? res;
            this.medicalRecords.unshift(created);
            this.savingRecord = false;
            this.resetRecordForm();
          },
          error: (err) => {
            this.savingRecord = false;
            this.recordError = err?.error?.message || 'Failed to save medical record.';
          }
        });
    }
  }

  deleteMedicalRecord(rec: any): void {
    if (!rec?.id) return;
    if (!confirm('Are you sure you want to delete this medical record?')) return;

    this.savingRecord = true;
    this.http
      .delete<any>(`${environment.apiBaseUrl}/doctor/medical-records/${rec.id}`)
      .subscribe({
        next: () => {
          this.medicalRecords = this.medicalRecords.filter((r) => r.id !== rec.id);
          this.savingRecord = false;
          if (this.editingRecord?.id === rec.id) {
            this.editingRecord = null;
            this.resetRecordForm();
          }
        },
        error: () => {
          this.savingRecord = false;
          this.recordError = 'Failed to delete medical record.';
        }
      });
  }

  // ====== PRESCRIPTIONS ======

  loadPrescriptions(): void {
    if (!this.appointmentId) return;
    this.http
      .get<any>(`${environment.apiBaseUrl}/doctor/appointments/${this.appointmentId}/prescriptions`)
      .subscribe({
        next: (res) => {
          this.prescriptions = res?.data ?? res ?? [];
        },
        error: () => {
          // ignore
        }
      });
  }

  onPrescriptionFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.prescriptionFile = input.files[0];
    } else {
      this.prescriptionFile = null;
    }
  }

  startEditPrescription(p: any): void {
    this.editingPrescription = p;
    this.newPrescription = {
      name: p.name || '',
      file_url: p.file_url || ''
    };
    this.prescriptionFile = null;
    this.prescriptionError = '';
  }

  cancelEditPrescription(): void {
    this.editingPrescription = null;
    this.resetPrescriptionForm();
  }

  private resetPrescriptionForm(): void {
    this.newPrescription = {
      name: '',
      file_url: ''
    };
    this.prescriptionFile = null;
    this.prescriptionError = '';
  }

  savePrescription(): void {
    if (!this.appointmentId) return;

    this.prescriptionError = '';

    if (!this.newPrescription.name) {
      this.prescriptionError = 'Prescription name is required.';
      return;
    }

    const formData = new FormData();
    formData.append('name', this.newPrescription.name);
    if (this.newPrescription.file_url) {
      formData.append('file_url', this.newPrescription.file_url);
    }
    if (this.prescriptionFile) {
      formData.append('file', this.prescriptionFile);
    }

    this.savingPrescription = true;

    if (this.editingPrescription) {
      const id = this.editingPrescription.id;
      this.http
        .post<any>(`${environment.apiBaseUrl}/doctor/prescriptions/${id}?_method=PUT`, formData)
        .subscribe({
          next: (res) => {
            const updated = res?.data ?? res;
            const idx = this.prescriptions.findIndex((x) => x.id === id);
            if (idx !== -1) {
              this.prescriptions[idx] = updated;
            }
            this.savingPrescription = false;
            this.editingPrescription = null;
            this.resetPrescriptionForm();
          },
          error: (err) => {
            this.savingPrescription = false;
            this.prescriptionError = err?.error?.message || 'Failed to update prescription.';
          }
        });
    } else {
      this.http
        .post<any>(`${environment.apiBaseUrl}/doctor/appointments/${this.appointmentId}/prescriptions`, formData)
        .subscribe({
          next: (res) => {
            const created = res?.data ?? res;
            this.prescriptions.unshift(created);
            this.savingPrescription = false;
            this.resetPrescriptionForm();
          },
          error: (err) => {
            this.savingPrescription = false;
            this.prescriptionError = err?.error?.message || 'Failed to save prescription.';
          }
        });
    }
  }

  deletePrescription(p: any): void {
    if (!p?.id) return;
    if (!confirm('Are you sure you want to delete this prescription?')) return;

    this.savingPrescription = true;
    this.http
      .delete<any>(`${environment.apiBaseUrl}/doctor/prescriptions/${p.id}`)
      .subscribe({
        next: () => {
          this.prescriptions = this.prescriptions.filter((x) => x.id !== p.id);
          this.savingPrescription = false;
          if (this.editingPrescription?.id === p.id) {
            this.editingPrescription = null;
            this.resetPrescriptionForm();
          }
        },
        error: () => {
          this.savingPrescription = false;
          this.prescriptionError = 'Failed to delete prescription.';
        }
      });
  }
}
