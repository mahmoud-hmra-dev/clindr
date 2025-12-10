import { Component, OnInit } from '@angular/core';
import { routes } from 'src/app/shared/routes/routes';
import { DoctorService } from 'src/app/core/services/doctor.service';

@Component({
  selector: 'app-invoices',
  standalone: false,
  templateUrl: './invoices.component.html',
  styleUrl: './invoices.component.scss'
})
export class InvoicesComponent implements OnInit {
  routes = routes;
  invoices: any[] = [];
  loading = false;
  error = '';

  constructor(private doctorService: DoctorService) {}

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading = true;
    this.error = '';
    this.doctorService.getDoctorInvoices().subscribe({
      next: (res) => {
        this.invoices = res?.data ?? res ?? [];
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load invoices';
        this.loading = false;
      }
    });
  }
}
