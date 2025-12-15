import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { routes } from 'src/app/shared/routes/routes';
import { AppointmentService } from 'src/app/core/services/appointment.service';
import { DoctorService } from 'src/app/core/services/doctor.service';

@Component({
  selector: 'app-patient-appoinment-details',
  templateUrl: './patient-appoinment-details.component.html',
  styleUrl: './patient-appoinment-details.component.scss',
  standalone: false,
})
export class PatientAppoinmentDetailsComponent implements OnInit {
  routes = routes;

  loading = false;
  error = '';

  appointment: any = null;
  doctor: any = null;

  constructor(
    private route: ActivatedRoute,
    private appointmentService: AppointmentService,
    private doctorService: DoctorService
  ) {}

  ngOnInit(): void {
    const id = Number(
      this.route.snapshot.queryParamMap.get('id') ||
      this.route.snapshot.paramMap.get('id')
    );

    if (!id) {
      this.error = 'No appointment selected.';
      return;
    }

    this.loadAppointment(id);
  }

  private loadAppointment(id: number): void {
    this.loading = true;
    this.error = '';

    this.appointmentService.getAppointment(id).subscribe({
      next: (res) => {
        this.appointment = res?.data ?? res ?? null;

        if (this.appointment?.doctor_id) {
          this.doctorService.getDoctor(this.appointment.doctor_id).subscribe({
            next: (docRes) => {
              this.doctor = docRes?.data ?? docRes ?? null;
              this.loading = false;
            },
            error: () => {
              this.loading = false;
            },
          });
        } else {
          this.loading = false;
        }
      },
      error: () => {
        this.error = 'Failed to load appointment.';
        this.loading = false;
      },
    });
  }

  get statusBadgeClass(): string {
    const status = (this.appointment?.status || '').toLowerCase();
    if (status === 'cancelled') return 'badge bg-red';
    if (status === 'completed') return 'badge bg-green';
    if (status === 'confirmed') return 'badge bg-green';
    return 'badge bg-yellow'; // pending / default
  }

  get statusLabel(): string {
    return this.appointment?.status
      ? this.appointment.status.charAt(0).toUpperCase() + this.appointment.status.slice(1)
      : 'Upcoming';
  }

  get appointmentTypeLabel(): string {
    const type = (this.appointment?.appointment_type || '').toLowerCase();
    if (type === 'online') return 'Video Call';
    if (type === 'in_clinic') return 'Clinic Visit';
    return 'Appointment';
  }

  get visitTypeLabel(): string {
    return this.appointment?.visit_type || 'General';
  }
}
