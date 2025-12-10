import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonService } from 'src/app/shared/common/common.service';
import { routes } from 'src/app/shared/routes/routes';
import { AuthService } from 'src/app/core/services/auth.service';
import { PatientService } from 'src/app/core/services/patient.service';

@Component({
    selector: 'app-patient-sidebar',
    templateUrl: './patient-sidebar.component.html',
    styleUrl: './patient-sidebar.component.scss',
    standalone: false
})
export class PatientSidebarComponent implements OnInit {
  public routes = routes
  public base = '';
  public page = '';
  public last = '';
  userName = '';
  userEmail = '';
  userId: number | null = null;
  patientGender = '';
  patientAgeText = '';

  constructor(
    private common: CommonService,
    private router: Router,
    private authService: AuthService,
    private patientService: PatientService
  ) {
    this.common.base.subscribe((base: string) => {
      this.base = base;
    });
    this.common.page.subscribe((page: string) => {
      this.page = page;
    });
    this.common.last.subscribe((last: string) => {
      this.last = last;
    });

    this.authService.getCurrentUser().subscribe((user) => {
      this.userName = user?.name || '';
      this.userEmail = user?.email || '';
      this.userId = user?.id ?? null;
    });
    if (this.authService.getToken()) {
      this.authService.me().subscribe();
    }
  }

  ngOnInit(): void {
    this.loadPatientProfile();
  }

  private loadPatientProfile(): void {
    this.patientService.getProfile().subscribe({
      next: (res) => {
        const data = res?.data ?? res;
        this.patientGender = data?.gender || '';
        this.patientAgeText = this.calculateAgeText(data?.dob);
      },
    });
  }

  private calculateAgeText(dob?: string): string {
    if (!dob) return '';
    const birth = new Date(dob);
    if (isNaN(birth.getTime())) return '';
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    if (now.getDate() < birth.getDate()) {
      months -= 1;
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    return `${years} years ${months.toString().padStart(2, '0')} Months`;
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate([routes.userLogin]),
      error: () => this.router.navigate([routes.userLogin]),
    });
  }
}
