import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PatientService {
  constructor(private http: HttpClient) {}

  getInvoices(params: any = {}): Observable<any> {
    return this.http.get(`${environment.apiBaseUrl}/patient/invoices`, { params });
  }

  getInvoice(id: number): Observable<any> {
    return this.http.get(`${environment.apiBaseUrl}/patient/invoices/${id}`);
  }

  getProfile(): Observable<any> {
    return this.http.get(`${environment.apiBaseUrl}/patient/profile`);
  }

  updateProfile(payload: any): Observable<any> {
    return this.http.put(`${environment.apiBaseUrl}/patient/profile`, payload);
  }

  getMedicalRecords(params: any = {}): Observable<any> {
    return this.http.get(`${environment.apiBaseUrl}/patient/medical-records`, { params });
  }

  createMedicalRecord(payload: any): Observable<any> {
    return this.http.post(`${environment.apiBaseUrl}/patient/medical-records`, payload);
  }

  getVitals(params: any = {}): Observable<any> {
    return this.http.get(`${environment.apiBaseUrl}/patient/vitals`, { params });
  }

  createVital(payload: any): Observable<any> {
    return this.http.post(`${environment.apiBaseUrl}/patient/vitals`, payload);
  }

  getDependents(): Observable<any> {
    return this.http.get(`${environment.apiBaseUrl}/patient/dependents`);
  }

  createDependent(payload: any): Observable<any> {
    return this.http.post(`${environment.apiBaseUrl}/patient/dependents`, payload);
  }

  updateDependent(id: number, payload: any): Observable<any> {
    return this.http.put(`${environment.apiBaseUrl}/patient/dependents/${id}`, payload);
  }

  deleteDependent(id: number): Observable<any> {
    return this.http.delete(`${environment.apiBaseUrl}/patient/dependents/${id}`);
  }

  getFavourites(): Observable<any> {
    return this.http.get(`${environment.apiBaseUrl}/patient/favourites`);
  }

  addFavourite(doctorId: number): Observable<any> {
    return this.http.post(`${environment.apiBaseUrl}/patient/favourites`, { doctor_id: doctorId });
  }

  removeFavourite(doctorId: number): Observable<any> {
    return this.http.delete(`${environment.apiBaseUrl}/patient/favourites/${doctorId}`);
  }
}
