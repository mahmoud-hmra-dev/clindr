import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  Router,
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { AuthService, AuthUser } from '../services/auth.service';
import { switchMap, map, catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    const expectedRoles: string[] = route.data?.['roles'] || [];

    const ensureUser$: Observable<AuthUser | null> = this.authService.getCurrentUser().pipe(
      switchMap((user) => {
        if (user) {
          return of(user);
        }
        return this.authService.me().pipe(catchError(() => of(null)));
      })
    );

    return ensureUser$.pipe(
      map((user) => {
        if (!user) {
          return this.router.parseUrl('/authentication/login');
        }
        if (!expectedRoles.length) {
          return true;
        }
        const userRoles = (user.roles || [])
          .map((r) => (typeof r === 'string' ? r : (r as any)?.name))
          .filter(Boolean)
          .map((r) => (r as string).toLowerCase());
        const allowed = expectedRoles.some((r) => userRoles.includes(r.toLowerCase()));
        return allowed ? true : this.router.parseUrl('/not-authorized');
      })
    );
  }
}
