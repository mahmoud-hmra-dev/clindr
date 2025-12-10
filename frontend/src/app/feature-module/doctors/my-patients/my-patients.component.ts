import { Component, OnInit } from '@angular/core';
import { routes } from 'src/app/shared/routes/routes';
import { DoctorService } from 'src/app/core/services/doctor.service';

@Component({
    selector: 'app-my-patients',
    templateUrl: './my-patients.component.html',
    styleUrls: ['./my-patients.component.scss'],
    standalone: false
})
export class MyPatientsComponent implements OnInit {
  public routes = routes;
  patients: any[] = [];
  loading = false;
  error = '';
  bsRangeValue: Date[] = [];
  filter = false;

  constructor(private doctorService: DoctorService) {}

  ngOnInit(): void {
    this.loadPatients();
  }

  private loadPatients(): void {
    this.loading = true;
    this.error = '';
    this.doctorService.getMyPatients().subscribe({
      next: (res) => {
        this.patients = res?.data ?? res ?? [];
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load patients';
        this.loading = false;
      }
    });
  }

  public showFilter() {
    this.filter = !this.filter;
  }
}
