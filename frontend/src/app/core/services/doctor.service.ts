import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DoctorService {
  constructor(private http: HttpClient) {}

  getDoctors(filters: {
    specialties?: (string | number)[];
    city?: string;
    name?: string;
    min_fee?: number;
    max_fee?: number;
    gender?: string;
    availability?: string;
    min_experience?: number;
    max_experience?: number;
    page?: number;
    per_page?: number;
  } = {}): Observable<any> {
    let params = new HttpParams();
    if (filters.specialties && filters.specialties.length) {
      params = params.set('specialties', filters.specialties.join(','));
    }
    if (filters.city) params = params.set('city', filters.city);
    if (filters.name) params = params.set('name', filters.name);
    if (filters.min_fee !== undefined) params = params.set('min_fee', filters.min_fee);
    if (filters.max_fee !== undefined) params = params.set('max_fee', filters.max_fee);
    if (filters.gender) params = params.set('gender', filters.gender);
    if (filters.availability) params = params.set('availability', filters.availability);
    if (filters.min_experience !== undefined) params = params.set('min_experience', filters.min_experience);
    if (filters.max_experience !== undefined) params = params.set('max_experience', filters.max_experience);
    if (filters.page) params = params.set('page', filters.page);
    if (filters.per_page) params = params.set('per_page', filters.per_page);

    return this.http.get(`${environment.apiBaseUrl}/doctors`, { params });
  }

  getDoctor(id: number): Observable<any> {
    return this.http.get(`${environment.apiBaseUrl}/doctors/${id}`);
  }

  getMyReviews(params: any = {}): Observable<any> {
    return this.http.get(`${environment.apiBaseUrl}/doctor/reviews`, { params });
  }

  getMyPatients(params: any = {}): Observable<any> {
    return this.http.get(`${environment.apiBaseUrl}/doctor/my-patients`, { params });
  }

  getDoctorInvoices(params: any = {}): Observable<any> {
    return this.http.get(`${environment.apiBaseUrl}/doctor/invoices`, { params });
  }

  getDoctorAppointments(params: any = {}): Observable<any> {
    return this.http.get(`${environment.apiBaseUrl}/doctor/appointments`, { params });
  }

  getDoctorAppointment(id: number): Observable<any> {
    return this.http.get(`${environment.apiBaseUrl}/doctor/appointments/${id}`);
  }

  getMyProfile(): Observable<any> {
    return this.http.get(`${environment.apiBaseUrl}/doctor/profile`);
  }

  updateMyProfile(payload: any): Observable<any> {
    if (payload?.profile_image_file instanceof File) {
      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (key === 'profile_image_file') {
          formData.append('profile_image', value as File);
        } else if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else {
          if (value !== undefined && value !== null) formData.append(key, String(value));
        }
      });
      return this.http.post(`${environment.apiBaseUrl}/doctor/profile?_method=PUT`, formData);
    }
    return this.http.put(`${environment.apiBaseUrl}/doctor/profile`, payload);
  }

  listMyAvailabilities(): Observable<any> {
    return this.http.get(`${environment.apiBaseUrl}/doctor/availability`);
  }

  syncMyAvailabilities(payload: any): Observable<any> {
    // Deprecated: kept for compatibility, forwards to the new availability endpoint.
    return this.http.post(`${environment.apiBaseUrl}/doctor/availability`, payload);
  }

  getAvailabilityCalendar(from: string, to: string): Observable<any> {
    let params = new HttpParams();
    params = params.set('from', from);
    params = params.set('to', to);
    return this.http.get(`${environment.apiBaseUrl}/doctor/availability`, { params });
  }

  createAvailability(payload: any): Observable<any> {
    return this.http.post(`${environment.apiBaseUrl}/doctor/availability`, payload);
  }

  deleteAvailability(id: number): Observable<any> {
    return this.http.delete(`${environment.apiBaseUrl}/doctor/availability/${id}`);
  }

  getSpecialties(): Observable<any> {
    return this.http.get(`${environment.apiBaseUrl}/specialties`);
  }


  createAppointmentMedicalRecord(appointmentId: number, payload: any) {
    return this.http.post(
      `${environment.apiBaseUrl}/doctor/appointments/${appointmentId}/medical-records`,
      payload
    );
  }

  createAppointmentPrescription(appointmentId: number, payload: any) {
    return this.http.post(
      `${environment.apiBaseUrl}/doctor/appointments/${appointmentId}/prescriptions`,
      payload
    );
  }

  updateDoctorAppointmentStatus(appointmentId: number, status: string, notes?: string): Observable<any> {
    const body: any = { status };
    if (notes) {
      body.notes = notes;
    }
    return this.http.put(
      `${environment.apiBaseUrl}/doctor/appointments/${appointmentId}/status`,
      body
    );
  }
}
