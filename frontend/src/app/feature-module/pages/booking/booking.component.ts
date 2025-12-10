import { HttpClient, HttpContext, HttpContextToken, HttpHeaders } from '@angular/common/http';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { routes } from 'src/app/shared/routes/routes';
import { DoctorService } from 'src/app/core/services/doctor.service';
import { AppointmentService } from 'src/app/core/services/appointment.service';
import { PaymentService } from 'src/app/core/services/payment.service';
import { AuthService, AuthUser } from 'src/app/core/services/auth.service';
import { environment } from 'src/environments/environment';

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
  isClinic = true;

  doctor: any = null;
  selectedServiceId: number | null = null;
  selectedAppointmentType: 'in_clinic' | 'online' = 'in_clinic';
  selectedDateTime: string | null = null;
  selectedClinicId: number | null = null;
  slotDurationMinutes = 30;

  patientName = '';
  patientEmail = '';
  patientPhone = '';

  bookingError = '';
  bookingMessage = '';

  // مبالغ الدفع
  amount = 0;              // المجموع النهائي
  bookingFee = 0;          // لو بدك تضيف رسوم حجز
  taxAmount = 0;           // لو في ضريبة
  discountAmount = 0;      // لو في خصم

  currentUser: AuthUser | null = null;


  get timeSlots(): { value: string; label: string }[] {
  const slots: { value: string; label: string }[] = [];

  const avs = this.filteredAvailabilities || [];
  if (!avs.length) {
    return slots;
  }

  for (const av of avs) {
    if (!av.start_time || !av.end_time) continue;

    const start = new Date(av.start_time);
    const end   = new Date(av.end_time);

    // safety: لو end قبل start، طنّشه
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      continue;
    }

    const current = new Date(start);

    while (current < end) {
      const value = current.toISOString(); // هذا اللي نرسله لـ scheduled_at

      const label = current.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });

      slots.push({ value, label });

      // زِد 30 دقيقة (أو القيمة اللي حاطها في slotDurationMinutes)
      current.setMinutes(current.getMinutes() + this.slotDurationMinutes);
    }
  }

  return slots;
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

    if (!this.isClinic || !this.selectedClinicId) {
      return avs;
    }
    return avs.filter((a: any) => a.clinic_id === this.selectedClinicId);
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
    }
  }

  offClinic(): void {
    this.isClinic = false;
    this.selectedAppointmentType = 'online';
    this.selectedClinicId = null;
  }

  selectService(id: number, price: number): void {
    this.selectedServiceId = id;
    // price موجود لو حاب تستعمله، بس نضمن الحساب統 واحد
    this.updateAmount();
  }

  selectSlot(slot: string): void {
    this.selectedDateTime = slot;
  }

  selectClinic(id: number): void {
    this.selectedClinicId = id;
  }

  confirmAndPay(): void {
 const SKIP_AUTH = new HttpContextToken(() => false);

        let onlineMeetingUrl = '';

        this.HttpClient.post<any>(
          'https://clindr-call.hdf.usj.edu.lb/api/v1/meeting',
          {},
          {
            headers: new HttpHeaders({
              Authorization: 'mirotalkp2p_default_secret',
              'Content-Type': 'application/json'
            }),
            context: new HttpContext().set(SKIP_AUTH, true) // لمنع التغيير على الـ header
          }
        )
        .subscribe({
          next: (meetingResponse) => {
            onlineMeetingUrl = meetingResponse.meeting;
            alert('Online meeting created: ' + onlineMeetingUrl);
          },
          error: () => {
            this.bookingError = 'Failed to create online meeting.';
          }
        });


    this.bookingError = '';

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
          price: this.amount.toString(), // المبلغ الحقيقي
          currency: environment.hopePaymentCurrency,
          errorCallback: `${window.location.origin}/patients/booking/booking-error`,
          successCallback: `${window.location.origin}/patients/booking/booking-Success`,
          cancelCallback: `${window.location.origin}/patients/booking/booking-cancel`,
          appointment_id: appointment?.id,
        };

        this.paymentService.createHopePayment(paymentPayload).subscribe({
          next: (url) => {
            const redirectUrl = (url || '').trim();
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
}
