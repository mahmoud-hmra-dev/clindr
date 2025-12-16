import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private http: HttpClient) {}

  getStats(): Observable<any> {
    return this.http.get(`${environment.apiBaseUrl}/admin/stats`);
  }

  getDoctors(params: any = {}): Observable<any> {
    return this.http.get(`${environment.apiBaseUrl}/admin/doctors`, { params });
  }

  createDoctor(payload: any): Observable<any> {
    return this.http.post(`${environment.apiBaseUrl}/admin/doctors`, payload);
  }

  updateDoctor(id: number, payload: any): Observable<any> {
    return this.http.put(`${environment.apiBaseUrl}/admin/doctors/${id}`, payload);
  }

  deleteDoctor(id: number): Observable<any> {
    return this.http.delete(`${environment.apiBaseUrl}/admin/doctors/${id}`);
  }

  getPatients(params: any = {}): Observable<any> {
    return this.http.get(`${environment.apiBaseUrl}/admin/patients`, { params });
  }

  createPatient(payload: any): Observable<any> {
    return this.http.post(`${environment.apiBaseUrl}/admin/patients`, payload);
  }

  updatePatient(id: number, payload: any): Observable<any> {
    return this.http.put(`${environment.apiBaseUrl}/admin/patients/${id}`, payload);
  }

  deletePatient(id: number): Observable<any> {
    return this.http.delete(`${environment.apiBaseUrl}/admin/patients/${id}`);
  }

  getAppointments(params: any = {}): Observable<any> {
    return this.http.get(`${environment.apiBaseUrl}/admin/appointments`, { params });
  }

  createAppointment(payload: any): Observable<any> {
    return this.http.post(`${environment.apiBaseUrl}/admin/appointments`, payload);
  }

  updateAppointment(id: number, payload: any): Observable<any> {
    return this.http.put(`${environment.apiBaseUrl}/admin/appointments/${id}`, payload);
  }

  deleteAppointment(id: number): Observable<any> {
    return this.http.delete(`${environment.apiBaseUrl}/admin/appointments/${id}`);
  }

   getReviews(): Observable<any> {
     return this.http.get(`${environment.apiBaseUrl}/admin/reviews`);
   }

  getInvoices(params: any = {}): Observable<any> {
    return this.http.get(`${environment.apiBaseUrl}/admin/invoices`, { params });
  }

  getSpecialties(params: any = {}): Observable<any> {
    return this.http.get(`${environment.apiBaseUrl}/admin/specialties`, { params });
  }

  createSpecialty(payload: any): Observable<any> {
    return this.http.post(`${environment.apiBaseUrl}/admin/specialties`, payload);
  }

  updateSpecialty(id: number, payload: any): Observable<any> {
    return this.http.put(`${environment.apiBaseUrl}/admin/specialties/${id}`, payload);
  }

  deleteSpecialty(id: number): Observable<any> {
    return this.http.delete(`${environment.apiBaseUrl}/admin/specialties/${id}`);
  }
}
