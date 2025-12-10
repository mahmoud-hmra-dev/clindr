import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService, private router: Router) {}

intercept(
  req: HttpRequest<any>,
  next: HttpHandler
): Observable<HttpEvent<any>> {
  const token = this.authService.getToken();

  // إذا الريكوست فيه Authorization جاهز (مثل mirotalkp2p_default_secret) لا نلمسه
  const hasCustomAuthorization = req.headers.has('Authorization');

  const authReq =
    token && !hasCustomAuthorization
      ? req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        })
      : req;

  return next.handle(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        this.authService.clearToken();
        this.router.navigate(['/authentication/login']);
      }
      return throwError(() => error);
    })
  );
}

}
