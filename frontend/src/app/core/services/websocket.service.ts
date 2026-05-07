import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Observable, Subject } from 'rxjs';

declare const window: any;

@Injectable({ providedIn: 'root' })
export class WebsocketService {
  private sockets = new Map<number, { socket: WebSocket; subject: Subject<any> }>();

  listenToConversation(conversationId: number): Observable<any> {
    const existing = this.sockets.get(conversationId);
    if (existing) {
      return existing.subject.asObservable();
    }

    const subject = new Subject<any>();
    const socket = this.createSocket(conversationId, subject);
    this.sockets.set(conversationId, { socket, subject });

    return subject.asObservable();
  }

  private createSocket(conversationId: number, subject: Subject<any>): WebSocket {
    const token = localStorage.getItem('auth_token') || '';
    // Always use wss:// in production; fall back to wss:// (not ws://) for security
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'wss';
    const base =
      environment.websocketUrl ||
      `${protocol}://${window.location.hostname}:${environment.websocketPort || 6001}`;
    const baseClean = base.endsWith('/') ? base.slice(0, -1) : base;
    const wsUrl = `${baseClean}/conversation/${conversationId}`;
    const urlWithToken = token ? `${wsUrl}?token=${token}` : wsUrl;

    const socket = new WebSocket(urlWithToken);

    socket.onopen = () => {
      // flush could happen here if we queued messages
    };

    socket.onmessage = (event) => {
      try {
        subject.next(JSON.parse(event.data));
      } catch {
        subject.next(event.data);
      }
    };

    socket.onerror = () => {
      // let onclose handle reconnection
    };

    socket.onclose = () => {
      setTimeout(() => {
        const current = this.sockets.get(conversationId);
        if (current && current.subject === subject) {
          current.socket = this.createSocket(conversationId, subject);
        }
      }, 1000);
    };

    return socket;
  }

  sendToConversation(conversationId: number, payload: any): void {
    const entry = this.sockets.get(conversationId);
    if (entry?.socket?.readyState === WebSocket.OPEN) {
      entry.socket.send(JSON.stringify(payload));
      return;
    }
    const subject = entry?.subject || new Subject<any>();
    const socket = entry?.socket || this.createSocket(conversationId, subject);
    this.sockets.set(conversationId, { socket, subject });
    socket.addEventListener('open', () => {
      socket.send(JSON.stringify(payload));
    }, { once: true });
  }
}
