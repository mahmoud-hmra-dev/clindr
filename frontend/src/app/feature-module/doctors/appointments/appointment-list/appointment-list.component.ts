import { Component, OnInit } from '@angular/core';
import { routes } from 'src/app/shared/routes/routes';
import { DoctorService } from 'src/app/core/services/doctor.service';

@Component({
    selector: 'app-appointment-list',
    templateUrl: './appointment-list.component.html',
    styleUrl: './appointment-list.component.scss',
    standalone: false
})
export class AppointmentListComponent implements OnInit {
  public routes = routes;
  public filter = false;
  bsRangeValue: Date[] = [];
  upcoming: any[] = [];
  cancelled: any[] = [];
  completed: any[] = [];
  loading = false;
  error = '';

  constructor(private doctorService: DoctorService) {}

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading = true;
    this.error = '';
    this.doctorService.getDoctorAppointments().subscribe({
      next: (res) => {
        const data = res?.data ?? res ?? [];
        this.upcoming = data.filter((a: any) => a.status === 'pending' || a.status === 'confirmed');
        this.cancelled = data.filter((a: any) => a.status === 'cancelled');
        this.completed = data.filter((a: any) => a.status === 'completed');
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load appointments';
        this.loading = false;
      }
    });
  }

  public showFilter(){
    this.filter = !this.filter;
  }

  appointmentTypes(appt: any): string[] {
    const types: string[] = [];
    if (appt.appointment_type) types.push(appt.appointment_type === 'online' ? 'Online' : 'In Clinic');
    if (appt.visit_type) types.push(appt.visit_type);
    return types;
  }
}
