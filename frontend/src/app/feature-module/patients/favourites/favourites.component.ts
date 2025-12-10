import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { PatientService } from 'src/app/core/services/patient.service';
import { routes } from 'src/app/shared/routes/routes';

@Component({
  selector: 'app-favourites',
  templateUrl: './favourites.component.html',
  styleUrls: ['./favourites.component.scss'],
  standalone: false,
})
export class FavouritesComponent implements OnInit {
  favourites: any[] = [];
  isFavourite: Record<number, boolean> = {};
  loading = false;
  routes = routes;

  constructor(
    private patientService: PatientService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchFavourites();
  }

  fetchFavourites(): void {
    this.loading = true;
    this.patientService.getFavourites().subscribe({
      next: (res) => {
        const data = res?.data ?? res ?? [];
        this.favourites = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        this.favourites.forEach((fav: any) => {
          if (fav?.id) {
            this.isFavourite[fav.id] = true;
          }
        });
        this.loading = false;
      },
      error: () => {
        this.favourites = [];
        this.loading = false;
      },
    });
  }

  toggleFavourite(doctorId: number): void {
    if (!this.authService.getToken()) {
      this.router.navigate(['/authentication/login'], {
        queryParams: { redirect: this.router.url },
      });
      return;
    }

    if (this.isFavourite[doctorId]) {
      this.patientService.removeFavourite(doctorId).subscribe(() => {
        this.isFavourite[doctorId] = false;
        this.favourites = this.favourites.filter((f) => f.id !== doctorId);
      });
    } else {
      this.patientService.addFavourite(doctorId).subscribe(() => {
        this.isFavourite[doctorId] = true;
        this.fetchFavourites();
      });
    }
  }

  getDoctorName(doc: any): string {
    if (doc?.display_name) return doc.display_name;
    return `${doc?.first_name || ''} ${doc?.last_name || ''}`.trim() || 'Doctor';
  }
}
