import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OwlOptions } from 'ngx-owl-carousel-o';
import { routes } from 'src/app/shared/routes/routes';
import { DoctorService } from 'src/app/core/services/doctor.service';

@Component({
    selector: 'app-doctor-profile1',
    templateUrl: './doctor-profile1.component.html',
    styleUrl: './doctor-profile1.component.scss',
    standalone: false
})
export class DoctorProfile1Component implements OnInit {
  public routes = routes
  doctor: any = null;
  loading = false;
  error = '';
  experienceSection?: HTMLElement;
  insurenceSection?: HTMLElement;
  servicesSection?: HTMLElement;
  specialitySection?: HTMLElement;
  availabilitySection?: HTMLElement;
  clinicSection?: HTMLElement;
  membershipSection?: HTMLElement;
  socialSection?: HTMLElement;
  awardsSection?: HTMLElement;
  bussinessHourSection?: HTMLElement;
  reviewSection?: HTMLElement;
  availabilityByDay: { day: string; slots: string[] }[] = [];
  private readonly slotDurationMinutes = 30;
  public ourDoctorOption: OwlOptions = {
    loop: true,
			margin: 24,
			dots: false,
			nav: true,
			smartSpeed: 2000,			
			navText: ['<i class="fa-solid fa-chevron-left "></i>', '<i class="fa-solid fa-chevron-right"></i>'],
    responsive: {
      0: {
        items: 1,
      },
      768: {
        items: 1,
      },
      1000: {
        items: 6,
      },
      1300: {
        items: 1,
      },
    },
  };
  public availabilyOption: OwlOptions = {
    loop: false,
			margin: 24,
			dots: false,
			nav: true,
			smartSpeed: 2000,		
			navText: ['<i class="fa-solid fa-chevron-left "></i>', '<i class="fa-solid fa-chevron-right"></i>'],
      responsive: {
				0: {
					items: 2
				},
				768: {
					items: 3
				},
				1000: {
					items: 5
				},
				1300: {
					items: 6
				},
				1400: {
					items: 7
				}
			}
  };
  public awardOption: OwlOptions = {
    loop: false,
    margin: 24,
    dots: false,
    nav: true,
    smartSpeed: 2000,	
    
			navText: ['<i class="fa-solid fa-chevron-left "></i>', '<i class="fa-solid fa-chevron-right"></i>'],
      responsive: {
				0: {
					items: 1
				},
				768: {
					items: 1
				},
				1000: {
					items: 4
				},
				1300: {
					items: 4
				},
				1400: {
					items: 4
				}
			}
  };
  activeTab: string = 'doc_bio';

  setActiveTab(tabName: string) {
    this.activeTab = tabName;
  }
  scrollToSection(section?: HTMLElement | null) {
    if (section) {
      this.scrollTo(section);
    }
  }

  scrollTo(element?: HTMLElement | null) {
    if (!element) return;
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  constructor(
    private route: ActivatedRoute,
    private doctorService: DoctorService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.queryParamMap.get('id') || this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.fetchDoctor(id);
    }
  }

  fetchDoctor(id: number): void {
    this.loading = true;
    this.doctorService.getDoctor(id).subscribe({
      next: (res) => {
        this.doctor = res?.data ?? res;
        this.loading = false;
        this.buildAvailabilityByDay();
      },
      error: () => {
        this.error = 'Unable to load doctor details';
        this.loading = false;
      },
    });
  }

  getDoctorName(): string {
    if (!this.doctor) return '';
    if (this.doctor.display_name) return this.doctor.display_name;
    return `${this.doctor.first_name || ''} ${this.doctor.last_name || ''}`.trim();
  }

  getLanguages(): string {
    const langsRaw = this.doctor?.languages ?? this.doctor?.languages_json;
    if (!langsRaw) return '';
    if (Array.isArray(langsRaw)) return langsRaw.join(', ');
    try {
      const parsed = JSON.parse(langsRaw);
      if (Array.isArray(parsed)) return parsed.join(', ');
    } catch (e) {
      // ignore
    }
    return typeof langsRaw === 'string' ? langsRaw : '';
  }

  getPrimaryClinic(): any {
    return this.doctor?.clinics?.[0] || null;
  }

  getFee(): number | string {
    return this.doctor?.default_fee ?? this.doctor?.services?.[0]?.price ?? this.getPrimaryClinic()?.fee_amount ?? 'N/A';
  }

  formatAvailability(slot: any): string {
    if (!slot) return '';
    const day = slot.day_of_week ? slot.day_of_week.toString() : '';
    const start = this.toTime(slot.start_time);
    const end = this.toTime(this.endTimeFromStart(slot.start_time));
    const range = [start, end].filter(Boolean).join(' - ');
    return [day, range].filter(Boolean).join(' ').trim();
  }

  private buildAvailabilityByDay(): void {
    if (!this.doctor?.availabilities?.length) {
      this.availabilityByDay = [];
      return;
    }
    const grouped: Record<string, string[]> = {};
    this.doctor.availabilities.forEach((slot: any) => {
      const day = slot.day_of_week || '';
      grouped[day] = grouped[day] || [];
      grouped[day].push(this.formatAvailability(slot));
    });
    this.availabilityByDay = Object.keys(grouped).map((day) => ({
      day,
      slots: grouped[day],
    }));
  }

  private toTime(value: any): string {
    if (!value) return '';
    const str = typeof value === 'string' ? value : String(value);
    if (str.includes('T')) return str.split('T')[1].substring(0, 5);
    if (str.includes(' ')) return str.split(' ')[1].substring(0, 5);
    return str.substring(0, 5);
  }

  private endTimeFromStart(time: any): string {
    if (!time) return '';
    const raw = typeof time === 'string' ? time : String(time);
    const timePart = raw.includes('T') ? raw.split('T')[1] : (raw.includes(' ') ? raw.split(' ')[1] : raw);
    const [hRaw, mRaw] = timePart.split(':');
    const h = parseInt(hRaw ?? '', 10);
    const m = parseInt(mRaw ?? '0', 10);
    if (Number.isNaN(h) || Number.isNaN(m)) return '';
    const d = new Date();
    d.setHours(h, m, 0, 0);
    d.setMinutes(d.getMinutes() + this.slotDurationMinutes);
    const hh = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');
    return `${hh}:${mm}:00`;
  }
}
