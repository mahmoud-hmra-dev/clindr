import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TwilioService {
  constructor(private http: HttpClient) {}

  getTokenForAppointment(id: number, role: 'patient' | 'doctor'): Observable<any> {
    return this.http.get(
      `${environment.apiBaseUrl}/appointments/${id}/twilio-token`,
      { params: { role } }
    );
  }
}
