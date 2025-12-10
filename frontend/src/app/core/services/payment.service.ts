import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  constructor(private http: HttpClient) {}

  createHopePayment(payload: {
    project_id: string;
    project_name: string;
    prodact_id: string;
    user_id: string | number;
    firstName: string;
    lastName: string;
    email: string;
    price: string | number;
    currency: string;
    errorCallback: string;
    successCallback: string;
    cancelCallback: string;
  }): Observable<string> {
    return this.http.post(environment.hopePaymentUrl, payload, { responseType: 'text' });
  }
}
