import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { WebsocketService } from './websocket.service';

@Injectable({ providedIn: 'root' })
export class ChatService {
  constructor(private http: HttpClient, private ws: WebsocketService) {}

  getPatientConversations(): Observable<any> {
    return this.http.get(`${environment.apiBaseUrl}/patient/conversations`);
  }

  getPatientMessages(conversationId: number): Observable<any> {
    return this.http.get(`${environment.apiBaseUrl}/patient/conversations/${conversationId}/messages`);
  }

  sendPatientMessage(payload: { conversation_id?: number; doctor_id?: number; body?: string; attachment?: File; message_type?: string }): Observable<any> {
    const form = new FormData();
    if (payload.conversation_id) form.append('conversation_id', String(payload.conversation_id));
    if (payload.doctor_id) form.append('doctor_id', String(payload.doctor_id));
    if (payload.body) form.append('body', payload.body);
    if (payload.message_type) form.append('message_type', payload.message_type);
    if (payload.attachment) form.append('attachment', payload.attachment);
    return this.http.post(`${environment.apiBaseUrl}/patient/conversations/messages`, form);
  }

  getDoctorConversations(): Observable<any> {
    return this.http.get(`${environment.apiBaseUrl}/doctor/conversations`);
  }

  getDoctorMessages(conversationId: number): Observable<any> {
    return this.http.get(`${environment.apiBaseUrl}/doctor/conversations/${conversationId}/messages`);
  }

  sendDoctorMessage(payload: { conversation_id: number; body?: string; attachment?: File; message_type?: string }): Observable<any> {
    const form = new FormData();
    form.append('conversation_id', String(payload.conversation_id));
    if (payload.body) form.append('body', payload.body);
    if (payload.message_type) form.append('message_type', payload.message_type);
    if (payload.attachment) form.append('attachment', payload.attachment);
    return this.http.post(`${environment.apiBaseUrl}/doctor/conversations/messages`, form);
  }

  listen(conversationId: number): Observable<any> {
    return this.ws.listenToConversation(conversationId);
  }

  sendRealtime(conversationId: number, payload: any): void {
    this.ws.sendToConversation(conversationId, payload);
  }
}
