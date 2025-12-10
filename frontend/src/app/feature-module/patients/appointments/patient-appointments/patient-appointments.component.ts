import { Component, OnInit } from '@angular/core';
import { routes } from 'src/app/shared/routes/routes';
import { AppointmentService } from 'src/app/core/services/appointment.service';

@Component({
    selector: 'app-patient-appointments',
    templateUrl: './patient-appointments.component.html',
    styleUrl: './patient-appointments.component.scss',
    standalone: false
})
export class PatientAppointmentsComponent implements OnInit {
  public routes = routes;
  public filter = false;
  bsValue = new Date();
  bsRangeValue: Date[];
  maxDate = new Date();
  appointments: any[] = [];
  upcoming: any[] = [];
  cancelled: any[] = [];
  completed: any[] = [];
  loading = false;

  constructor(private appointmentService: AppointmentService) {
    this.maxDate.setDate(this.maxDate.getDate() + 7);
    this.bsRangeValue = [this.bsValue, this.maxDate];
  }

  ngOnInit(): void {
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.loading = true;
    this.appointmentService.listPatientAppointments().subscribe({
      next: (res) => {
        this.appointments = res?.data ?? res ?? [];
        this.splitStatuses();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  private splitStatuses(): void {
    this.upcoming = [];
    this.cancelled = [];
    this.completed = [];
    for (const appt of this.appointments) {
      const status = (appt.status || '').toLowerCase();
      if (status === 'cancelled') {
        this.cancelled.push(appt);
      } else if (status === 'completed') {
        this.completed.push(appt);
      } else {
        this.upcoming.push(appt);
      }
    }
  }

  public showFilter(){
    this.filter = !this.filter
  }
}
