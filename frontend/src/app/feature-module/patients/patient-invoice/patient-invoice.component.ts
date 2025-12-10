import { Component, OnInit } from '@angular/core';
import { routes } from 'src/app/shared/routes/routes';
import { PatientService } from 'src/app/core/services/patient.service';

@Component({
    selector: 'app-patient-invoice',
    templateUrl: './patient-invoice.component.html',
    styleUrl: './patient-invoice.component.scss',
    standalone: false
})
export class PatientInvoiceComponent implements OnInit {
  public routes = routes;
  invoice: any = null;
  loading = false;
  error = '';

  constructor(private patientService: PatientService) {}

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading = true;
    this.error = '';
    this.patientService.getInvoices().subscribe({
      next: (res) => {
        const data = res?.data ?? res ?? [];
        this.invoice = Array.isArray(data) ? data[0] : data;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load invoices';
        this.loading = false;
      }
    });
  }
}
