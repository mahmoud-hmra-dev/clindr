import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { routes } from 'src/app/shared/routes/routes';
import { DoctorService } from 'src/app/core/services/doctor.service';
import { environment } from 'src/environments/environment';
interface medical {}
@Component({
    selector: 'app-doctor-appointment-start',
    templateUrl: './doctor-appointment-start.component.html',
    styleUrl: './doctor-appointment-start.component.scss',
    standalone: false
})
export class DoctorAppointmentStartComponent implements OnInit {
  public routes = routes;
  values1: string[] = ['Skin Allergy'];
  values2: string[] = ['Hemoglobin A1c (HbA1c)', 'Liver Function Tests (LFTs)'];
  values3: string[] = ['Fever', 'Headache', 'Stomach Pain'];

  medical: medical[] = [{}];
  appointment: any = null;
  loading = false;
  error = '';
  onlineMeetingApiUrl = environment.onlineMeetingApiUrl;

  constructor(private route: ActivatedRoute, private doctorService: DoctorService) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id') || this.route.snapshot.queryParamMap.get('id'));
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
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load appointment';
        this.loading = false;
      }
    });
  }

  addMedical() {
    this.medical.push({});
  }

  dltMedical(index: number) {
    this.medical.splice(index, 1);
  }
}
