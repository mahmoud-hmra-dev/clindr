import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, timer } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

type VersionFile = {
  version?: string;
  buildTime?: string;
};

@Injectable({
  providedIn: 'root',
})
export class VersionCheckService {
  private readonly versionUrl = 'assets/version.json';
  private currentVersion?: string;

  constructor(private http: HttpClient) {}

  watch(intervalMs = 5 * 60 * 1000): Observable<{
    hasUpdate: boolean;
    latest?: string;
    buildTime?: string;
  }> {
    const headers = new HttpHeaders({
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    });

    return timer(0, intervalMs).pipe(
      switchMap(() =>
        this.http.get<VersionFile>(this.versionUrl, {
          headers,
          params: { t: Date.now() },
        }).pipe(
          catchError((error) => {
            console.warn('Version check failed', error);
            return of<VersionFile>({ version: this.currentVersion });
          })
        )
      ),
      map((versionFile) => {
        const latest = versionFile?.version;
        const hasUpdate =
          !!latest && this.currentVersion !== undefined && this.currentVersion !== latest;
        if (latest) {
          this.currentVersion = latest;
        }

        return {
          hasUpdate,
          latest,
          buildTime: versionFile?.buildTime,
        };
      })
    );
  }
}
