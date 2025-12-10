import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  constructor(private http: HttpClient) {}

  listPatientAppointments(): Observable<any> {
    return this.http.get(`${environment.apiBaseUrl}/patient/appointments`);
  }

  createAppointment(payload: any): Observable<any> {
    return this.http.post(`${environment.apiBaseUrl}/patient/appointments`, payload);
  }

  getAppointment(id: number): Observable<any> {
    return this.http.get(`${environment.apiBaseUrl}/patient/appointments/${id}`);
  }

  cancelAppointment(id: number): Observable<any> {
    return this.http.delete(`${environment.apiBaseUrl}/patient/appointments/${id}`);
  }

  listDoctorAppointments(): Observable<any> {
    return this.http.get(`${environment.apiBaseUrl}/doctor/appointments`);
  }

  updateDoctorAppointmentStatus(id: number, status: string, notes?: string): Observable<any> {
    return this.http.put(`${environment.apiBaseUrl}/doctor/appointments/${id}/status`, { status, notes });
  }
}
