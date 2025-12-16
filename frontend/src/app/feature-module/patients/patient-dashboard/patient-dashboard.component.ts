import { Component, Renderer2, ViewChild, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { patientDashboard } from 'src/app/shared/models/models';
import { routes } from 'src/app/shared/routes/routes';
import { PatientService } from 'src/app/core/services/patient.service';
import { AppointmentService } from 'src/app/core/services/appointment.service';
import { AuthService } from 'src/app/core/services/auth.service';
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ApexAxisChartSeries,
  ApexChart,
  ChartComponent,
  ApexDataLabels,
  ApexXAxis,
  ApexPlotOptions,
  ApexFill,
  ApexLegend,
  ApexStroke,
} from 'ng-apexcharts';
import { OwlOptions } from 'ngx-owl-carousel-o';
export type ChartOptions = {
  series: ApexAxisChartSeries | any;
  chart: ApexChart | any;
  dataLabels: ApexDataLabels | any;
  plotOptions: ApexPlotOptions | any;
  xaxis: ApexXAxis | any;
  fill: ApexFill | any;
  legend: ApexLegend | any;
  stroke: ApexStroke | any;
};

@Component({
    selector: 'app-patient-dashboard',
    templateUrl: './patient-dashboard.component.html',
    styleUrls: ['./patient-dashboard.component.scss'],
    standalone: false
})
export class PatientDashboardComponent implements OnInit {
  @ViewChild('chart') chart!: ChartComponent;
  public chartOptions1: Partial<ChartOptions>;
  public chartOptions2: Partial<ChartOptions>;
  public routes = routes;
  public tableData: Array<patientDashboard> = [];
  public tableData2: Array<patientDashboard> = [];
  public tableData3: Array<patientDashboard> = [];
  public tableData4: Array<patientDashboard> = [];
  public base = '';
  public page = '';
  public last = '';
  patientName = '';
  latestVital: any = null;
  latestVitalDate = '';
  upcomingAppointments: any[] = [];
  appointments: any[] = [];
  medicalRecords: any[] = [];
  prescriptions: any[] = [];
  invoices: any[] = [];
  appointmentById: Record<number, any> = {};
  doctorById: Record<number, any> = {};
  loadingAppointments = false;
  loadingMedicalRecords = false;
  loadingInvoices = false;
  public doctorSliderOptions: OwlOptions = {
    loop: true,
    margin: 24,
    dots: false,
    nav: true,
    smartSpeed: 2000,
    navText: [
      '<i class="fas fa-chevron-left"></i>',
      '<i class="fas fa-chevron-right"></i>',
    ],
    responsive: {
      0: {
        items: 1,
      },
      500: {
        items: 1,
      },
      575: {
        items: 1,
      },
      768: {
        items: 1,
      },
      1000: {
        items: 1,
      },
      1200: {
        items: 1,
      },
    },
  };
  public patientSliderOptions: OwlOptions = {
    loop: true,
    margin: 5,
    dots: false,
    nav: true,
    smartSpeed: 2000,
    navText: [
      '<i class="fas fa-chevron-left"></i>',
      '<i class="fas fa-chevron-right"></i>',
    ],
    responsive: {
      0: {
        items: 5,
      },
      500: {
        items: 5,
      },

      768: {
        items: 5,
      },
      1000: {
        items: 5,
      },
      1300: {
        items: 5,
      },
    },
  };

  constructor(
    private router: Router,
    private renderer: Renderer2,
    private patientService: PatientService,
    private appointmentService: AppointmentService,
    private authService: AuthService,
  ) {
    if (this.page == 'patient-dashboard') {
      this.renderer.addClass(document.body, 'date-pickers');
    }
    this.chartOptions1 = {
      series: [
        {
          data: [140, 100, 180, 130, 100, 130],
        },
      ],
      chart: {
        height: 300,
        type: 'bar',
      },
      fill: {
        colors: ['#0e82fdd9'],
      },

      plotOptions: {
        bar: {
          columnWidth: '45%',
        },
      },
      dataLabels: {
        enabled: false,
      },
      xaxis: {
        categories: [['Mon'], ['Tue'], ['Wed'], ['Thu'], ['Fri'], ['Sat']],
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent'],
      },
      legend: {
        show: false,
      },
    };
    this.chartOptions2 = {
      series: [
        {
          data: [90, 60, 30, 60, 90, 70, 70],
        },
        {
          data: [110, 90, 40, 120, 130, 130, 130],
        },
      ],
      chart: {
        type: 'bar',
        height: 350,
      },
      fill: {
        colors: ['#0e82fdd9'],
        opacity: 1,
      },

      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          endingShape: 'rounded',
          borderRadius: 5,
          borderRadiusApplication:'end'
        },
      },
      dataLabels: {
        enabled: false,
      },
      xaxis: {
        categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      },
      legend: {
        show: false,
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent'],
      },
    };
  }

  ngOnInit(): void {
    this.authService.getCurrentUser().subscribe((user) => {
      this.patientName = user?.name || '';
    });
    this.loadVitals();
    this.loadAppointments();
    this.loadMedicalRecords();
    this.loadInvoices();
  }

  private loadVitals(): void {
    this.patientService.getVitals().subscribe((res) => {
      const vitals = Array.isArray(res?.data) ? res.data : res;
      if (vitals && vitals.length) {
        this.latestVital = vitals[0];
        this.latestVitalDate = this.latestVital.recorded_at || '';
      }
    });
  }

  private loadAppointments(): void {
    this.loadingAppointments = true;
    this.appointmentService.listPatientAppointments().subscribe({
      next: (res) => {
        const data = Array.isArray(res?.data) ? res.data : res;
        this.appointments = data || [];
        this.appointmentById = {};
        this.doctorById = {};
        this.appointments.forEach((a: any) => {
          if (a?.id) this.appointmentById[a.id] = a;
          if (a?.doctor_id && a?.doctor && !this.doctorById[a.doctor_id]) {
            this.doctorById[a.doctor_id] = a.doctor;
          }
        });
        this.upcomingAppointments = this.appointments.filter((a: any) =>
          ['pending', 'confirmed', 'waiting_payment'].includes((a?.status || '').toLowerCase())
        );
        this.loadingAppointments = false;
      },
      error: () => {
        this.loadingAppointments = false;
      },
    });
  }

  private loadMedicalRecords(): void {
    this.loadingMedicalRecords = true;
    this.patientService.getMedicalRecords().subscribe({
      next: (res) => {
        const data = Array.isArray(res?.data) ? res.data : res;
        this.medicalRecords = data || [];
        this.prescriptions = this.medicalRecords.filter((rec: any) =>
          (rec?.record_type || '').toString().toLowerCase().includes('prescription')
        );
        this.loadingMedicalRecords = false;
      },
      error: () => {
        this.loadingMedicalRecords = false;
      },
    });
  }

  private loadInvoices(): void {
    this.loadingInvoices = true;
    this.patientService.getInvoices().subscribe({
      next: (res) => {
        const data = Array.isArray(res?.data) ? res.data : res;
        this.invoices = data || [];
        this.loadingInvoices = false;
      },
      error: () => {
        this.loadingInvoices = false;
      },
    });
  }

  doctorDisplayName(doctorId?: number): string {
    const doctor = doctorId ? this.doctorById[doctorId] : null;
    if (!doctor) return 'Doctor';
    return doctor.display_name || `${doctor.first_name || ''} ${doctor.last_name || ''}`.trim() || 'Doctor';
  }

  doctorImage(doctorId?: number): string {
    const doctor = doctorId ? this.doctorById[doctorId] : null;
    return doctor?.profile_image_path || 'assets/img/doctors/doctor-thumb-01.jpg';
  }

  appointmentDoctorNameFromRecord(record: any): string {
    const appointment = record?.appointment_id ? this.appointmentById[record.appointment_id] : null;
    if (appointment?.doctor_id && this.doctorById[appointment.doctor_id]) {
      return this.doctorDisplayName(appointment.doctor_id);
    }
    return record?.doctor_id ? this.doctorDisplayName(record.doctor_id) : 'Doctor';
  }

  appointmentDateFromRecord(record: any): string | null {
    const appointment = record?.appointment_id ? this.appointmentById[record.appointment_id] : null;
    return appointment?.scheduled_at || null;
  }

  statusBadgeClass(status: string): string {
    const normalized = (status || '').toLowerCase();
    if (normalized === 'completed') return 'badge-soft-success';
    if (normalized === 'confirmed' || normalized === 'waiting_payment') return 'badge-soft-purple';
    if (normalized === 'pending') return 'badge-soft-purple';
    if (normalized === 'cancelled') return 'badge-soft-danger';
    return 'badge-soft-secondary';
  }

  statusLabel(status: string): string {
    const normalized = (status || '').replace('_', ' ');
    return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : 'N/A';
  }
}
