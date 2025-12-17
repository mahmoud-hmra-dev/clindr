/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, ViewChild, OnInit } from '@angular/core';
import { routes } from 'src/app/shared/routes/routes';
import { AdminService } from 'src/app/core/services/admin.service';
import {
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexTooltip,
  ApexStroke,
  ApexMarkers,
  ApexLegend,
} from "ng-apexcharts";

export type ChartOptions = {
  series: ApexAxisChartSeries | any;
  chart: ApexChart | any;
  xaxis: ApexXAxis | any;
  stroke: ApexStroke | any;
  tooltip: ApexTooltip | any;
  dataLabels: ApexDataLabels | any;
  legend: ApexLegend |any;
  markers: ApexMarkers |any;
};

type DashboardCounts = {
  doctors: number;
  patients: number;
  appointments: number;
  revenue: number;
};

type DoctorSummaryRow = {
  id: number;
  name: string;
  designation: string;
  city: string;
  country: string;
  defaultFee: string;
  profileImage: string;
};

type PatientSummaryRow = {
  id: number;
  name: string;
  phone: string;
  email: string;
  city: string;
  country: string;
  profileImage: string;
};

type AppointmentSummaryRow = {
  id: number;
  doctorName: string;
  patientName: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  amount: string;
  doctorImage: string;
  patientImage: string;
};
@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
    standalone: false
})
export class DashboardComponent implements OnInit {
  public routes = routes;
  counts: DashboardCounts = {
    doctors: 0,
    patients: 0,
    appointments: 0,
    revenue: 0,
  };
  latestDoctors: DoctorSummaryRow[] = [];
  latestPatients: PatientSummaryRow[] = [];
  recentAppointments: AppointmentSummaryRow[] = [];
  loading = false;
  errorMessage = '';

  @ViewChild("chart") chart!: ChartComponent;
  public chartOptions1: Partial<ChartOptions>;
  public chartOptions2: Partial<ChartOptions>;

  constructor(private adminService: AdminService) {
    this.chartOptions1 = {
      series: [
        {
          name: "Revenue",
          data: [],
          color: "#1b5a90"
        },
      ],
      chart: {
        height: 350,
        type: "area",
        toolbar: {
          show: false
        },
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: "smooth",
        width: 2
      },
      xaxis: {
        categories: []
      },
      markers: {
        size: 4,
        strokeWidth: 0,
        hover: {
          sizeOffset: 3
        }
      },
    };
    this.chartOptions2 = {
      series: [
        {
          name: 'Appointments',
          data: [],
          color: '#ff9d00',
        },
      ],
      chart: {
        height: 350,
        width: '100%',
        type: 'line',
        toolbar: {
          show: false,
        },
        zoom: {
          enabled: false,
        },
      },
      dataLabels: {
        enabled: false,
      },
      legend: {
        show: false,
      },
      stroke: {
        show: true,
        curve: 'smooth',
        width: 2,
        dashArray: 0,
    },
      xaxis: {
        categories: [],
      },
      markers: {
        size: 4,
        strokeWidth: 0,
        hover: {
          sizeOffset: 3
        }
      },
    };
  }

  ngOnInit(): void {
    this.loadDashboard();
  }

  private loadDashboard(): void {
    this.loading = true;
    this.errorMessage = '';
    this.adminService.getStats().subscribe({
      next: (res: any) => {
        const counts = res?.counts ?? {};
        this.counts = {
          doctors: counts?.doctors ?? 0,
          patients: counts?.patients ?? 0,
          appointments: counts?.appointments ?? 0,
          revenue: counts?.revenue ?? 0,
        };

        const doctorData = res?.latest_doctors?.data ?? res?.latest_doctors ?? [];
        const patientData = res?.latest_patients?.data ?? res?.latest_patients ?? [];
        const appointmentData = res?.recent_appointments?.data ?? res?.recent_appointments ?? [];

        this.latestDoctors = this.mapDoctorRows(Array.isArray(doctorData) ? doctorData : []);
        this.latestPatients = this.mapPatientRows(Array.isArray(patientData) ? patientData : []);
        this.recentAppointments = this.mapAppointmentRows(Array.isArray(appointmentData) ? appointmentData : []);

        this.updateStatusChart();
        this.loadRevenueChart();
      },
      error: () => {
        this.errorMessage = 'Failed to load dashboard data.';
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  private loadRevenueChart(): void {
    this.adminService.getInvoices({ per_page: 7 }).subscribe({
      next: (res: any) => {
        const invoices = res?.data ?? res ?? [];
        const rows = Array.isArray(invoices) ? invoices : [];
        const sorted = rows
          .filter((row: any) => row?.booked_on)
          .sort((a: any, b: any) => {
            return new Date(a.booked_on).getTime() - new Date(b.booked_on).getTime();
          });

        const categories = sorted.map((row: any) =>
          new Date(row.booked_on).toLocaleDateString()
        );
        const data = sorted.map((row: any) => row?.amount ?? 0);

        if (data.length) {
          this.chartOptions1 = {
            ...this.chartOptions1,
            series: [
              {
                name: 'Revenue',
                data,
                color: "#1b5a90",
              },
            ],
            xaxis: {
              categories,
            },
          };
        }
      },
      error: () => {
        // Keep existing chart settings if invoices fail.
      },
    });
  }

  private updateStatusChart(): void {
    const statusCounts: Record<string, number> = {};
    this.recentAppointments.forEach((row) => {
      const key = (row.status || 'unknown').toLowerCase();
      statusCounts[key] = (statusCounts[key] || 0) + 1;
    });

    const categories = Object.keys(statusCounts);
    const data = categories.map((key) => statusCounts[key]);

    if (data.length) {
      this.chartOptions2 = {
        ...this.chartOptions2,
        series: [
          {
            name: 'Appointments',
            data,
            color: '#1b5a90',
          },
        ],
        xaxis: {
          categories,
        },
        legend: {
          show: false,
        },
      };
    }
  }

  private mapDoctorRows(rows: any[]): DoctorSummaryRow[] {
    return rows.map((res: any) => ({
      id: res.id,
      name: res.display_name || res.full_name || `#${res.id}`,
      designation: res.designation || '--',
      city: res.city || '--',
      country: res.country || '',
      defaultFee:
        res.default_fee !== null && res.default_fee !== undefined
          ? `${res.default_fee}`
          : '--',
      profileImage: res.profile_image_path || 'assets/admin/img/doctors/default.jpg',
    }));
  }

  private mapPatientRows(rows: any[]): PatientSummaryRow[] {
    return rows.map((res: any) => ({
      id: res.id,
      name: res.full_name || `#${res.id}`,
      phone: res.phone || '--',
      email: res.email || '--',
      city: res.city || '--',
      country: res.country || '',
      profileImage: 'assets/admin/img/patients/patient.jpg',
    }));
  }

  private mapAppointmentRows(rows: any[]): AppointmentSummaryRow[] {
    return rows.map((res: any) => {
      const scheduledAt = res.scheduled_at ? new Date(res.scheduled_at) : null;
      const amount = res.invoice?.amount
        ? `${res.invoice.amount} ${res.invoice.currency || ''}`.trim()
        : '--';
      return {
        id: res.id,
        doctorName: res.doctor?.display_name || res.doctor?.full_name || `#${res.doctor_id || res.id}`,
        patientName: res.patient?.full_name || `#${res.patient_id || res.id}`,
        appointmentDate: scheduledAt ? scheduledAt.toLocaleDateString() : '--',
        appointmentTime: scheduledAt
          ? scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '--',
        status: res.status || 'pending',
        amount,
        doctorImage: res.doctor?.profile_image_path || 'assets/admin/img/doctors/default.jpg',
        patientImage: 'assets/admin/img/patients/patient.jpg',
      };
    });
  }
}
