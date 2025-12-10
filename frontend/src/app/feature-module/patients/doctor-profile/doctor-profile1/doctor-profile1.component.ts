import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OwlOptions } from 'ngx-owl-carousel-o';
import { routes } from 'src/app/shared/routes/routes';
import { DoctorService } from 'src/app/core/services/doctor.service';
import { formatDate } from '@angular/common';

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
    const start = slot.start_time ? formatDate(slot.start_time, 'shortTime', 'en-US') : '';
    const end = slot.end_time ? formatDate(slot.end_time, 'shortTime', 'en-US') : '';
    return `${day} ${start} - ${end}`.trim();
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
}
