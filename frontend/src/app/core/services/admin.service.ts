import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private http: HttpClient) {}

  getDoctors(): Observable<any> {
    return this.http.get(`${environment.apiBaseUrl}/admin/doctors`);
  }

  getPatients(): Observable<any> {
    return this.http.get(`${environment.apiBaseUrl}/admin/patients`);
  }

  getAppointments(): Observable<any> {
    return this.http.get(`${environment.apiBaseUrl}/admin/appointments`);
  }

   getReviews(): Observable<any> {
     return this.http.get(`${environment.apiBaseUrl}/admin/reviews`);
   }

  getInvoices(params: any = {}): Observable<any> {
    return this.http.get(`${environment.apiBaseUrl}/admin/invoices`, { params });
  }
}
