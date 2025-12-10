import { Component, OnInit } from '@angular/core';
import { routes } from 'src/app/shared/routes/routes';
import { DoctorService } from 'src/app/core/services/doctor.service';

@Component({
    selector: 'app-reviews',
    templateUrl: './reviews.component.html',
    styleUrls: ['./reviews.component.scss'],
    standalone: false
})
export class ReviewsComponent implements OnInit {
  public routes = routes;
  bsRangeValue: Date[] = [];
  reviews: any[] = [];
  loading = false;
  error = '';
  overallRating = 0;
  overallRounded = 0;

  constructor(private doctorService: DoctorService) {}

  ngOnInit(): void {
    this.loadReviews();
  }

  private loadReviews(): void {
    this.loading = true;
    this.error = '';
    this.doctorService.getMyReviews().subscribe({
      next: (res) => {
        const data = res?.data ?? res ?? [];
        this.reviews = data;
        this.overallRating = this.calculateOverall();
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load reviews';
        this.loading = false;
      }
    });
  }

  private calculateOverall(): number {
    if (!this.reviews.length) return 0;
    const sum = this.reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    const avg = Math.round((sum / this.reviews.length) * 10) / 10;
    this.overallRounded = Math.round(avg);
    return avg;
  }
}
