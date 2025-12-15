import { HttpClient, HttpContext, HttpContextToken, HttpHeaders } from '@angular/common/http';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { routes } from 'src/app/shared/routes/routes';
import { DoctorService } from 'src/app/core/services/doctor.service';
import { AppointmentService } from 'src/app/core/services/appointment.service';
import { PaymentService } from 'src/app/core/services/payment.service';
import { AuthService, AuthUser } from 'src/app/core/services/auth.service';
import { environment } from 'src/environments/environment';
import { BsDatepickerConfig, DatepickerDateCustomClasses } from 'ngx-bootstrap/datepicker';

@Component({
  selector: 'app-booking',
  standalone: false,
  templateUrl: './booking.component.html',
  styleUrl: './booking.component.scss'
})
export class BookingComponent {
  routes = routes;
  public selectedFieldSet = [0];
  loading = false;
  bsInlineValue = new Date();
  bsInlineConfig: Partial<BsDatepickerConfig> = {};
  isClinic = true;

  doctor: any = null;
  selectedServiceId: number | null = null;
  selectedAppointmentType: 'in_clinic' | 'online' = 'in_clinic';
  selectedDateTime: string | null = null;
  selectedClinicId: number | null = null;
  slotDurationMinutes = 30;
  selectedDate = new Date();

  patientName = '';
  patientEmail = '';
  patientPhone = '';

  bookingError = '';
  bookingMessage = '';
  availableDateKeys = new Set<string>();

  // مبالغ الدفع
  amount = 0;              // المجموع النهائي
  bookingFee = 0;          // لو بدك تضيف رسوم حجز
  taxAmount = 0;           // لو في ضريبة
  discountAmount = 0;      // لو في خصم

  currentUser: AuthUser | null = null;

timeSlots: { value: string; label: string }[] = [];

private getTimePartFromIso(iso: string): string | null {
  if (!iso) return null;

  // مثال: 2025-12-11T16:59:00.000000Z
  const parts = iso.split('T');
  if (parts.length < 2) return null;

  let timePart = parts[1];              // "16:59:00.000000Z"
  timePart = timePart.replace('Z', ''); // "16:59:00.000000"
  timePart = timePart.substring(0, 8);  // "16:59:00"

  return timePart;
}




  get selectedService(): any {
    if (!this.doctor?.services) return null;
    return this.doctor.services.find((s: any) => s.id === this.selectedServiceId);
  }

  get selectedClinic(): any {
    if (!this.doctor?.clinics || !this.selectedClinicId) return null;
    return this.doctor.clinics.find((c: any) => c.id === this.selectedClinicId);
  }

  get filteredAvailabilities(): any[] {
    const avs = this.doctor?.availabilities || [];
    const selectedDay = this.selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const selectedDateKey = this.formatDateKey(this.selectedDate);
    return avs.filter((a: any) => {
      const matchesDate = a.date ? a.date === selectedDateKey : (a.day_of_week || '').toLowerCase() === selectedDay;
      if (!matchesDate) return false;

      if (this.selectedAppointmentType === 'online') {
        return !a.clinic_id;
      }

      // in clinic: يسمح بالفتحات المخصصة للعيادة أو العامة (clinic_id null)
      if (!this.selectedClinicId) return true;
      return !a.clinic_id || a.clinic_id === this.selectedClinicId;
    });
  }

  constructor(
    private route: ActivatedRoute,
    private doctorService: DoctorService,
    private appointmentService: AppointmentService,
    private paymentService: PaymentService,
    private authService: AuthService,
    private HttpClient: HttpClient
  ) {
    this.authService.getCurrentUser().subscribe((user) => {
      this.currentUser = user;
      if (user) {
        this.patientName = user.name;
        this.patientEmail = user.email;
      }
    });

    const doctorId = Number(
      this.route.snapshot.queryParamMap.get('id') ||
      this.route.snapshot.paramMap.get('id')
    );
    if (doctorId) {
      this.loadDoctor(doctorId);
    }
  }
  onDateChange(date: Date): void {
    this.bsInlineValue = date;
    this.selectedDate = date;
    this.selectedDateTime = null;
      this.recalculateTimeSlots();
  }

  private updateAmount(): void {
    const servicePrice = this.selectedService?.price || this.doctor?.default_fee || 0;
    this.amount = servicePrice + this.bookingFee + this.taxAmount - this.discountAmount;
  }

  loadDoctor(id: number): void {
    this.loading = true;
    this.doctorService.getDoctor(id).subscribe({
      next: (res) => {
        this.doctor = res?.data ?? res;

        if (this.doctor?.services?.length) {
          this.selectedServiceId = this.doctor.services[0].id;
        }

        if (this.doctor?.clinics?.length) {
          this.selectedClinicId = this.doctor.clinics[0].id;
          this.isClinic = true;
          this.selectedAppointmentType = 'in_clinic';
        } else {
          this.isClinic = false;
          this.selectedAppointmentType = 'online';
        }

        // حساب المبلغ بعد تحميل الداتا
        this.updateAmount();
        this.loading = false;
        this.recalculateTimeSlots();
        this.rebuildAvailableDateClasses();
      },
      error: () => {
        this.loading = false;
        this.bookingError = 'Failed to load doctor data';
      }
    });
  }

  showClinic(): void {
    if (this.doctor?.clinics?.length) {
      this.isClinic = true;
      this.selectedAppointmentType = 'in_clinic';
      this.selectedClinicId = this.selectedClinicId ?? this.doctor.clinics[0].id;
      this.selectedDateTime = null;
      this.recalculateTimeSlots();
      this.rebuildAvailableDateClasses();
    }
  }

  offClinic(): void {
    this.isClinic = false;
    this.selectedAppointmentType = 'online';
    this.selectedClinicId = null;
    this.selectedDateTime = null;
    this.recalculateTimeSlots();
    this.rebuildAvailableDateClasses();
  }

  selectService(id: number, price: number): void {
    this.selectedServiceId = id;
    // price موجود لو حاب تستعمله، بس نضمن الحساب統 واحد
    this.updateAmount();
  }

  selectSlot(slot: string): void {
    this.selectedDateTime = slot;
  }
private combineDateAndTime(date: Date, time: string): Date {
  const [hours, minutes, seconds] = time.split(':').map((v) => parseInt(v, 10) || 0);

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hours,
    minutes,
    seconds || 0,
    0
  );
}

private recalculateTimeSlots(): void {
  const slots: { value: string; label: string }[] = [];

  for (const av of this.filteredAvailabilities) {
    if (!av.start_time) continue;

    const startTimeStr = this.getTimePartFromIso(av.start_time) || av.start_time;
    let endTimeStr   = this.getTimePartFromIso(av.end_time) || av.end_time;
    if (!endTimeStr && startTimeStr) {
      endTimeStr = this.addDefaultEndTime(startTimeStr);
    }

    if (!startTimeStr || !endTimeStr) continue;

    const start = this.combineDateAndTime(this.selectedDate, startTimeStr);
    const end   = this.combineDateAndTime(this.selectedDate, endTimeStr);

    // Debug مرة واحدة بس لو حابب
    // console.log('Availability:', av, 'startTimeStr:', startTimeStr, 'Start:', start, 'End:', end);

    if (end <= start) continue;

    const current = new Date(start);

    // حماية زيادة لو صار slotDurationMinutes = 0 بالغلط
    if (!this.slotDurationMinutes || this.slotDurationMinutes <= 0) break;

    while (current < end) {
      if (current > new Date()) {
        slots.push({
          value: this.formatLocalDateTime(current),
          label: current.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          })
        });


      }
      current.setMinutes(current.getMinutes() + this.slotDurationMinutes);
    }
  }

  this.timeSlots = slots;
}


private formatLocalDateTime(date: Date): string {
  const y  = date.getFullYear();
  const m  = (date.getMonth() + 1).toString().padStart(2, '0');
  const d  = date.getDate().toString().padStart(2, '0');
  const hh = date.getHours().toString().padStart(2, '0');
  const mm = date.getMinutes().toString().padStart(2, '0');
  const ss = date.getSeconds().toString().padStart(2, '0');

  // Laravel و Carbon يحبّوا هذا الشكل
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
}

private addDefaultEndTime(start: string): string {
  const [hours, minutes] = start.split(':').map((v) => parseInt(v, 10) || 0);
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  d.setHours(d.getHours() + 1);
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  const ss = d.getSeconds().toString().padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}



  selectClinic(id: number): void {
    this.selectedClinicId = id;
    this.selectedDateTime = null;
    this.recalculateTimeSlots();
    this.rebuildAvailableDateClasses();
  }

confirmAndPay(): void {
  if (!this.selectedDateTime) {
    this.bookingError = 'Please select a time slot before booking.';
    return;
  }

  if (this.selectedAppointmentType === 'in_clinic' && !this.selectedClinicId) {
    this.bookingError = 'Please choose a clinic for in-clinic appointments.';
    return;
  }

  this.bookingError = '';

  if (this.selectedAppointmentType === 'online') {
    this.createOnlineMeetingAndBook();
  } else {
    // لو عيادة: ما في داعي لمكالمة فيديو
    this.createOnlineMeetingAndBook();
  }
}
private createOnlineMeetingAndBook(): void {
  const SKIP_AUTH = new HttpContextToken(() => false);
  const onlineMeetingApiUrl = environment.onlineMeetingApiUrl;

  console.log('Creating online meeting...');

  this.HttpClient.post<any>(
    `${onlineMeetingApiUrl}/api/v1/meeting`,
    {},
    {
      headers: new HttpHeaders({
        Authorization: 'mirotalkp2p_default_secret',
        'Content-Type': 'application/json'
      }),
      context: new HttpContext().set(SKIP_AUTH, true)
    }
  ).subscribe({
    next: (meetingResponse) => {
      console.log('Meeting response:', meetingResponse);

      let onlineMeetingUrl = meetingResponse?.meeting;

      if (!onlineMeetingUrl) {
        this.bookingError = 'Meeting created but URL is missing.';
        return;
      }

              onlineMeetingUrl = onlineMeetingUrl.replace(
              'https://127.0.0.1:8082',
              `${environment.onlineMeetingApiUrl}`
            );

      // بعد ما يجهز الـ URL نحجز الموعد
      this.bookAppointment(onlineMeetingUrl);
    },
    error: (err) => {
      console.error('Meeting create error:', err);
      this.bookingError = 'Failed to create online meeting.';
    }
  });
}


private bookAppointment(onlineMeetingUrl: string): void {
  const selectedService = this.selectedService;

  const payload: any = {
    doctor_id: this.doctor.id,
    appointment_type: this.selectedAppointmentType,
    visit_type: selectedService?.name || 'general',
    scheduled_at: this.selectedDateTime,
    duration_minutes: 30,
    reason: '',
    online_meeting_url: onlineMeetingUrl
  };

  if (this.selectedAppointmentType === 'in_clinic' && this.selectedClinicId) {
    payload.clinic_id = this.selectedClinicId;
  }

  this.appointmentService.createAppointment(payload).subscribe({
    next: (res) => {
      const appointment = res?.data ?? res;

      const fullName = this.currentUser?.name || this.patientName || 'User Booking';
      const nameParts = fullName.split(' ');
      const firstName = nameParts.shift() || 'User';
      const lastName = nameParts.join(' ') || 'Booking';

      const paymentPayload: any = {
        project_id: environment.hopePaymentProjectId,
        project_name: environment.hopePaymentProjectName,
        prodact_id: selectedService?.id || environment.hopePaymentProjectName,
        user_id: this.currentUser?.id || 'guest',
        firstName,
        lastName,
        email: this.currentUser?.email || this.patientEmail || 'user@example.com',
        price: this.amount.toString(),
        currency: environment.hopePaymentCurrency,
        errorCallback: `${environment.baseurl}/patients/booking/booking-error`,
        successCallback: `${environment.baseurl}/patients/booking/booking-Success`,
        cancelCallback: `${environment.baseurl}/patients/booking/booking-cancel`,
        appointment_id: appointment?.id,
      };

      this.paymentService.createHopePayment(paymentPayload).subscribe({
        next: (url) => {
          let redirectUrl = (url || '').trim();
              redirectUrl = redirectUrl.replace(
              'http://localhost:8001',
              `${environment.paymenturl}`
            );
          if (redirectUrl) {
            window.location.href = redirectUrl;
          } else {
            this.bookingMessage = 'Appointment created. Proceed to payment.';
            this.selectedFieldSet[0] = 5;
          }
        },
        error: () => {
          this.bookingError = 'Payment initiation failed';
        }
      });
    },
    error: () => {
      this.bookingError = 'Failed to create appointment';
    }
  });
}

private rebuildAvailableDateClasses(): void {
  const keys = new Set<string>();
  const today = new Date();
  const horizonDays = 60;

  for (let i = 0; i <= horizonDays; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    if (this.hasAvailabilityOnDate(date)) {
      keys.add(this.formatDateKey(date));
    }
  }

  this.availableDateKeys = keys;
  this.refreshDatepickerClasses();
}

private hasAvailabilityOnDate(date: Date): boolean {
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const availabilities = this.doctor?.availabilities || [];

  return availabilities.some((av: any) => {
    if ((av?.day_of_week || '').toLowerCase() !== dayName) return false;

    if (this.selectedAppointmentType === 'online') {
      return !av?.clinic_id;
    }

    if (this.selectedClinicId) {
      return !av?.clinic_id || av?.clinic_id === this.selectedClinicId;
    }

    return true;
  });
}

private refreshDatepickerClasses(): void {
  const dateCustomClasses: DatepickerDateCustomClasses[] = [];

  for (const key of this.availableDateKeys) {
    const parsed = this.parseDateKey(key);
    if (parsed) {
      dateCustomClasses.push({
        date: parsed,
        classes: ['booking-available']
      });
    }
  }

  this.bsInlineConfig = { ...this.bsInlineConfig, dateCustomClasses };
}

private formatDateKey(date: Date): string {
  const y  = date.getFullYear();
  const m  = (date.getMonth() + 1).toString().padStart(2, '0');
  const d  = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

private parseDateKey(key: string): Date | null {
  const parts = key.split('-').map((v) => parseInt(v, 10));
  if (parts.length !== 3) return null;
  const [y, m, d] = parts;
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

}
