import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DoctorService } from 'src/app/core/services/doctor.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { PatientService } from 'src/app/core/services/patient.service';

interface Doctor {
  id: number;
  display_name?: string;
  first_name?: string;
  last_name?: string;
  designation?: string;
  languages_json?: string[] | string;
  rating_avg?: number;
  default_fee?: number;
  profile_image_path?: string;
  specialty_name?: string;
  city?: string;
  country?: string;
  services?: any[];
  clinics?: any[];
}

@Component({
  selector: 'app-search2',
  templateUrl: './search2.component.html',
  styleUrls: ['./search2.component.scss'],
  standalone: false,
})
export class Search2Component implements OnInit {
  doctors: Doctor[] = [];
  isMore: boolean[] = [false, false, false, false];
  minvalue = 0;
  maxvalue = 250;
  loading = false;
  typingTimeout: any;
  favourites: Record<number, boolean> = {};
  specialties: any[] = [];
  filteredSpecialties: any[] = [];
  page = 1;
  perPage = 9;
  total = 0;
  pages: number[] = [];
  Math = Math;
  filters = {
    specialties: [] as (string | number)[],
    city: '',
    name: '',
    gender: '',
    availability: '',
    min_experience: 0,
    max_experience: 50,
    min_fee: 0,
    max_fee: 250,
  };

  constructor(
    private doctorService: DoctorService,
    private authService: AuthService,
    private patientService: PatientService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadFavourites();
    this.loadSpecialties();
    this.loadDoctors();
  }
public isDoctorAvailableNow(doctor: any): boolean {
  const availabilities = doctor?.availabilities || [];
  if (!availabilities.length) return false;

  const now = new Date();

  // الجمعة → friday
  const currentDay = now.toLocaleString('en-US', { weekday: 'long' }).toLowerCase();

  // الوقت الحالي بالدقائق
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (const a of availabilities) {
    if (!a.day_of_week) continue;

    // قارن اليوم
    if (a.day_of_week.toLowerCase() === currentDay) {

      // parse وقت البداية
      const [sh, sm] = a.start_time.split(':').map(Number);
      const startMinutes = sh * 60 + sm;

      // parse وقت النهاية
      const [eh, em] = a.end_time.split(':').map(Number);
      const endMinutes = eh * 60 + em;

      // تحقق من أن الوقت الآن ضمن الفترة المتاحة
      if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
        return true;
      }
    }
  }

  return false;
}


  loadDoctors(): void {
    const payload: any = {
      specialties: this.filters.specialties,
      city: this.filters.city,
      name: this.filters.name,
      gender: this.filters.gender,
      availability: this.filters.availability,
      min_fee: this.minvalue,
      max_fee: this.maxvalue,
      min_experience: this.filters.min_experience,
      max_experience: this.filters.max_experience,
      page: this.page,
      per_page: this.perPage,
    };

    this.loading = true;
    this.doctorService.getDoctors(payload).subscribe({
      next: (res: any) => {
        const meta = res?.meta || {};
        const data = res?.data ?? res ?? [];
        this.doctors = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        this.perPage = meta?.per_page ?? this.perPage;
        this.total = meta?.total ?? this.doctors.length;
        const totalPages = Math.max(1, Math.ceil(this.total / this.perPage));
        this.pages = Array.from({ length: totalPages }, (_, i) => i + 1);
        this.updateFilteredSpecialties();
        this.loading = false;
      },
      error: () => {
        this.doctors = [];
        this.updateFilteredSpecialties();
        this.loading = false;
      }
    });
  }

  loadSpecialties(): void {
    this.doctorService.getSpecialties().subscribe({
      next: (res) => {
        this.specialties = res?.data ?? res ?? [];
        this.updateFilteredSpecialties();
      },
      error: () => {
        this.specialties = [];
        this.filteredSpecialties = [];
      }
    });
  }

  applyFilters(): void {
    const name = (this.filters.name || '').trim();
    if (name && name.length < 3) {
      return;
    }
    this.page = 1;
    this.loadDoctors();
  }

  clearFilters(): void {
    this.filters = {
      specialties: [],
      city: '',
      name: '',
      gender: '',
      availability: '',
      min_experience: 0,
      max_experience: 50,
      min_fee: 0,
      max_fee: 250,
    };
    this.minvalue = 0;
    this.maxvalue = 250;
    this.page = 1;
    this.loadDoctors();
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadDoctors();
  }

  onNameChange(): void {
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    this.typingTimeout = setTimeout(() => {
      this.applyFilters();
    }, 500);
  }

  toggleFavourite(doctor: Doctor): void {
    if (!doctor?.id) {
      return;
    }
    if (!this.authService.getToken()) {
      this.router.navigate(['/authentication/login'], {
        queryParams: { redirect: this.router.url },
      });
      return;
    }
    if (this.favourites[doctor.id]) {
      this.patientService.removeFavourite(doctor.id).subscribe(() => {
        this.favourites[doctor.id] = false;
      });
    } else {
      this.patientService.addFavourite(doctor.id).subscribe(() => {
        this.favourites[doctor.id] = true;
      });
    }
  }

  isFav(doctorId: number | undefined): boolean {
    if (!doctorId) return false;
    return !!this.favourites[doctorId];
  }

  private loadFavourites(): void {
    if (!this.authService.getToken()) {
      this.favourites = {};
      return;
    }
    this.patientService.getFavourites().subscribe({
      next: (res) => {
        const data = res?.data ?? res ?? [];
        const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        this.favourites = {};
        list.forEach((doc: any) => {
          if (doc?.id) {
            this.favourites[doc.id] = true;
          }
        });
      },
      error: () => {
        this.favourites = {};
      },
    });
  }

  viewMore(index: number): void {
    this.isMore[index] = !this.isMore[index];
  }

  getDoctorName(doctor: Doctor): string {
    if (doctor.display_name) return doctor.display_name;
    const first = doctor.first_name ?? '';
    const last = doctor.last_name ?? '';
    return `${first} ${last}`.trim() || 'Doctor';
  }

  getDoctorLanguages(doctor: Doctor): string {
    const langs: any = (doctor as any).languages ?? doctor.languages_json;
    if (!langs) return '';
    if (Array.isArray(langs)) return langs.join(', ');
    try {
      const parsed = JSON.parse(langs as any);
      if (Array.isArray(parsed)) {
        return parsed.join(', ');
      }
    } catch (e) {
      // ignore parse error
    }
    return typeof langs === 'string' ? langs : '';
  }

  openProfile(doctor: Doctor): void {
    this.router.navigate(['/patients/doctor-profile'], {
      queryParams: { id: doctor.id },
    });
  }

  handleBook(doctor: Doctor): void {
    if (!this.authService.getToken()) {
      this.router.navigate(['/authentication/login'], {
        queryParams: { redirect: '/pages/booking', doctor: doctor.id },
      });
      return;
    }
    this.router.navigate(['/pages/booking'], {
      queryParams: { id: doctor.id },
    });
  }

  private updateFilteredSpecialties(): void {
    // Keep all specialties available for selection; do not hide options when a filter is applied.
    this.filteredSpecialties = this.specialties || [];
  }
}
