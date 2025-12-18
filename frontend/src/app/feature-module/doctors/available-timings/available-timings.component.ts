/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CalendarOptions, DatesSetArg, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import { routes } from 'src/app/shared/routes/routes';
import { DoctorService } from 'src/app/core/services/doctor.service';

@Component({
    selector: 'app-available-timings',
    templateUrl: './available-timings.component.html',
    styleUrls: ['./available-timings.component.scss'],
    standalone: false
})
export class AvailableTimingsComponent implements OnInit {
  public routes = routes;

  clinics: any[] = [];
  availabilitySlots: any[] = [];
  bookingSlots: any[] = [];

  loading = false;
  saving = false;
  message = '';
  error = '';

  modalOpen = false;
  modalDate: string | null = null;
  modalError = '';
  deletingId: number | null = null;

  selectedDate = this.formatDate(new Date());
  calendarRange = { from: '', to: '' };

  modalForm: FormGroup;

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin, timeGridPlugin],
    initialView: 'dayGridMonth',
    selectable: true,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek'
    },
    dateClick: (info) => this.handleDateClick(info.dateStr),
    datesSet: (info) => this.onDatesSet(info),
    eventClick: (info) => this.onEventClick(info),
    events: [],
    height: 'auto',
    eventTimeFormat: { hour: '2-digit', minute: '2-digit', meridiem: false }
  };

  constructor(
    private fb: FormBuilder,
    private doctorService: DoctorService
  ) {
    this.modalForm = this.fb.group({
      availability_type: ['online', Validators.required],
      clinic_id: [null],
      scope: ['day'],
      slots: this.fb.array([this.buildSlotRow()]),
    });
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  get slots(): FormArray {
    return this.modalForm.get('slots') as FormArray;
  }

  get selectedDayAvailabilities(): any[] {
    return this.getDayAvailabilities(this.selectedDate);
  }

  get selectedDayBookings(): any[] {
    return this.getDayBookings(this.selectedDate);
  }

  private buildSlotRow(slot?: any): FormGroup {
    return this.fb.group({
      start_time: [slot?.start_time || '', Validators.required],
    });
  }

  private loadProfile(): void {
    this.loading = true;
    this.doctorService.getMyProfile().subscribe({
      next: (res) => {
        const data = res?.data || res;
        this.clinics = data?.clinics || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'Failed to load clinics.';
      }
    });
  }

  private onDatesSet(arg: DatesSetArg): void {
    const from = this.formatDate(arg.start);
    const end = new Date(arg.end);
    end.setDate(end.getDate() - 1);
    const to = this.formatDate(end);

    if (this.calendarRange.from === from && this.calendarRange.to === to) {
      return;
    }

    this.calendarRange = { from, to };
    this.fetchRange(from, to);
  }

  private fetchRange(from: string, to: string): void {
    this.loading = true;
    this.doctorService.getAvailabilityCalendar(from, to).subscribe({
      next: (res) => {
        this.availabilitySlots = res?.availabilities || [];
        this.bookingSlots = res?.bookings || [];
        this.loading = false;
        this.refreshCalendarEvents();
      },
      error: () => {
        this.loading = false;
        this.error = 'Failed to load availability data for the calendar.';
      }
    });
  }

  private refreshCalendarEvents(): void {
    const events: any[] = [];

    this.availabilitySlots.forEach((slot) => {
      if (!slot?.date || !slot?.start_time) {
        return;
      }
      const endTime = slot.end_time || this.addDefaultEnd(slot.start_time);
      events.push({
        id: `avail-${slot.id}`,
        title: slot.availability_type === 'clinic'
          ? `Available (${slot.clinic?.name || 'Clinic'})`
          : 'Available (Online)',
        start: this.combineDateTime(slot.date, slot.start_time),
        end: this.combineDateTime(slot.date, endTime),
        classNames: ['fc-available-event'],
        display: 'block',
      });
    });

    this.bookingSlots.forEach((booking: any) => {
      if (!booking?.start || !booking?.end) return;
      const start = this.normalizeDateTimeString(booking.start);
      const end = this.normalizeDateTimeString(booking.end);
      events.push({
        id: `book-${booking.id}`,
        title: booking?.patient?.name ? `Booked (${booking.patient.name})` : 'Booked',
        start,
        end,
        classNames: ['fc-booked-event'],
        display: 'block',
      });
    });

    this.calendarOptions = { ...this.calendarOptions, events };
  }

  handleDateClick(dateStr: string): void {
    this.selectedDate = dateStr;
    this.openModal(dateStr);
  }

  onEventClick(info: EventClickArg): void {
    info.jsEvent.preventDefault();
    const start = info.event.start;
    const dateStr = start ? this.formatDate(start) : this.selectedDate;
    this.selectedDate = dateStr;
    this.openModal(dateStr);
  }

  openModal(dateStr: string | null): void {
    if (!dateStr) return;
    this.modalDate = dateStr;
    this.modalOpen = true;
    this.modalError = '';
    this.error = '';
    this.message = '';
    this.modalForm.reset({
      availability_type: this.modalForm.get('availability_type')?.value || 'online',
      clinic_id: null,
      scope: this.modalForm.get('scope')?.value || 'day',
    });
    this.slots.clear();
    this.slots.push(this.buildSlotRow());
  }

  setScope(scope: 'day' | 'week' | 'month'): void {
    this.modalForm.patchValue({ scope });
  }

  closeModal(): void {
    this.modalOpen = false;
  }

  addSlotRow(): void {
    this.slots.push(this.buildSlotRow());
  }

  removeSlotRow(index: number): void {
    if (this.slots.length === 1) return;
    this.slots.removeAt(index);
  }

  saveSlots(): void {
    if (!this.modalDate) return;
    this.modalForm.markAllAsTouched();

    const payload = this.buildPayload();
    if (!payload) {
      return;
    }

    this.saving = true;
    this.modalError = '';
    this.doctorService.createAvailability(payload).subscribe({
      next: (res) => {
        this.message = 'Availability saved.';
        this.saving = false;
        this.closeModal();
        const from = this.calendarRange.from || this.modalDate!;
        const to = this.calendarRange.to || this.modalDate!;
        this.fetchRange(from, to);
      },
      error: (err) => {
        this.saving = false;
        this.modalError = err?.error?.message || 'Failed to save availability.';
        if (err?.error?.errors && Array.isArray(err.error.errors)) {
          this.modalError = err.error.errors.join(' ');
        }
      }
    });
  }

  formatSlotLabel(slot: any): string {
    if (slot?.availability_type === 'clinic') {
      return slot?.clinic?.name ? `Clinic - ${slot.clinic.name}` : 'Clinic availability';
    }
    return 'Online availability';
  }

  toTime(value: string | Date | null | undefined): string {
    if (!value) return '';
    if (value instanceof Date) {
      return value.toTimeString().substring(0, 5);
    }
    if (value.includes('T')) {
      return value.split('T')[1].substring(0, 5);
    }
    if (value.includes(' ')) {
      return value.split(' ')[1].substring(0, 5);
    }
    return value.substring(0, 5);
  }

  endTimeLabel(slot: any): string {
    const start = this.toTime(slot.start_time);
    if (!start) {
      return '';
    }
    const [h, m] = start.split(':').map((v) => parseInt(v, 10) || 0);
    const d = new Date();
    d.setHours(h, m || 0, 0, 0);
    d.setMinutes(d.getMinutes() + 30);
    const hh = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');
    return `${hh}:${mm}`;
  }

  private buildPayload(): any | null {
    if (!this.modalDate) return null;

    const availabilityType = this.modalForm.value.availability_type;
    const clinicId = availabilityType === 'clinic' ? this.modalForm.value.clinic_id : null;
    if (availabilityType === 'clinic' && !clinicId) {
      this.modalError = 'Select a clinic for clinic availability.';
      return null;
    }

    const slots = this.slots.controls.map((ctrl) => ctrl.value);
    const issues: string[] = [];

    slots.forEach((slot, idx) => {
      const start = this.timeToMinutes(slot.start_time);
      const end = start !== null ? start + 30 : null;
      if (start === null || end === null) {
        issues.push(`Slot ${idx + 1}: time must be HH:mm.`);
        return;
      }
      if (end <= start) {
        issues.push(`Slot ${idx + 1}: end time must be after start time.`);
      }
    });

    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        const aStart = this.timeToMinutes(slots[i].start_time);
        const aEnd = aStart !== null ? aStart + 30 : null;
        const bStart = this.timeToMinutes(slots[j].start_time);
        const bEnd = bStart !== null ? bStart + 30 : null;
        if (aStart === null || aEnd === null || bStart === null || bEnd === null) continue;
        if (this.rangesOverlap(aStart, aEnd, bStart, bEnd)) {
          issues.push(`Slots ${i + 1} and ${j + 1} overlap.`);
        }
      }
    }

    const existingAvailabilities = this.getDayAvailabilities(this.modalDate);
    const existingBookings = this.getDayBookings(this.modalDate);

    slots.forEach((slot, idx) => {
      const start = this.timeToMinutes(slot.start_time);
      const end = start !== null ? start + 30 : null;
      if (start === null || end === null) return;

      existingAvailabilities.forEach((existing) => {
        const existingStart = this.timeToMinutes(existing.start_time || existing.start || '');
        const existingEnd = existingStart !== null ? existingStart + 30 : null;
        if (existingStart === null || existingEnd === null) return;
        if (this.rangesOverlap(start, end, existingStart, existingEnd)) {
          issues.push(`Slot ${idx + 1} overlaps existing availability ${this.toTime(existing.start_time)} - ${this.toTime(existing.end_time)}.`);
        }
      });

      existingBookings.forEach((booking) => {
        const bookingStart = this.timeToMinutes(this.extractTime(booking.start));
        const bookingEnd = this.timeToMinutes(this.extractTime(booking.end));
        if (bookingStart === null || bookingEnd === null) return;
        if (this.rangesOverlap(start, end, bookingStart, bookingEnd)) {
          issues.push(`Slot ${idx + 1} conflicts with booked time ${this.toTime(booking.start)} - ${this.toTime(booking.end)}.`);
        }
      });
    });

    if (issues.length) {
      this.modalError = issues.join(' ');
      return null;
    }

    // حساب نطاق التاريخ حسب scope
    const scope = this.modalForm.value.scope || 'day';
    const fromDate = this.modalDate;
    let toDate = this.modalDate;

    if (scope === 'week') {
      const base = new Date(this.modalDate);
      const day = base.getDay(); // 0-6
      const diffToSunday = 6 - day;
      const end = new Date(base);
      end.setDate(base.getDate() + diffToSunday);
      toDate = this.formatDate(end);
    } else if (scope === 'month') {
      const base = new Date(this.modalDate);
      const end = new Date(base.getFullYear(), base.getMonth() + 1, 0);
      toDate = this.formatDate(end);
    }

    return {
      date: fromDate,
      to: toDate,
      availability_type: availabilityType,
      clinic_id: clinicId,
      slots: slots.map((slot) => ({
        start_time: this.normalizeTimeInput(slot.start_time),
      })),
    };
  }

  getDayAvailabilities(dateStr: string): any[] {
    return (this.availabilitySlots || []).filter((slot) => slot?.date === dateStr);
  }

  getDayBookings(dateStr: string): any[] {
    return (this.bookingSlots || []).filter((slot) => {
      if (slot?.date) return slot.date === dateStr;
      const startDate = slot?.start ? slot.start.split('T')[0] || slot.start.split(' ')[0] : '';
      return startDate === dateStr;
    });
  }

  private timeToMinutes(time: string | null | undefined): number | null {
    if (!time) return null;
    const parts = time.split(':').map((p) => parseInt(p, 10));
    if (parts.length < 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) return null;
    return parts[0] * 60 + parts[1];
  }

  private rangesOverlap(startA: number, endA: number, startB: number, endB: number): boolean {
    return startA < endB && startB < endA;
  }

  private normalizeTimeInput(time: string): string {
    if (!time) return '';
    const [h, m] = time.split(':');
    const hh = h?.padStart(2, '0') ?? '00';
    const mm = m?.padStart(2, '0') ?? '00';
    return `${hh}:${mm}`;
  }

  private combineDateTime(date: string, time: string): string {
    const normalized = this.normalizeDateTimeString(`${date} ${time}`);
    return normalized.replace(' ', 'T');
  }

  private normalizeDateTimeString(value: string): string {
    if (!value) return '';
    if (value.includes('T')) return value;
    return value.replace(' ', 'T');
  }

  private extractTime(value: string): string {
    if (!value) return '';
    if (value.includes('T')) {
      return value.split('T')[1] || '';
    }
    if (value.includes(' ')) {
      return value.split(' ')[1] || '';
    }
    return value;
  }

  private formatDate(date: Date | string): string {
    if (typeof date === 'string' && date.includes('-')) {
      const parts = date.split('T')[0].split('-').map((p) => parseInt(p, 10));
      if (parts.length === 3 && !parts.some((n) => Number.isNaN(n))) {
        const [y, m, d] = parts;
        return `${y.toString().padStart(4, '0')}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
      }
    }
    const d = date instanceof Date ? date : new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  displayDate(dateStr: string | null): string {
    if (!dateStr) return '';
    const parts = dateStr.split('-').map((p) => parseInt(p, 10));
    if (parts.length === 3 && !parts.some((n) => Number.isNaN(n))) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    }
    return dateStr;
  }

  private addDefaultEnd(time: string): string {
    const [h, m] = time.split(':').map((v) => parseInt(v, 10) || 0);
    const d = new Date();
    d.setHours(h, m || 0, 0, 0);
    d.setMinutes(d.getMinutes() + 30);
    const hh = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');
    return `${hh}:${mm}:00`;
  }

  deleteAvailability(slot: any): void {
    if (!slot?.id) return;
    this.deletingId = slot.id;
    this.modalError = '';
    this.error = '';
    this.doctorService.deleteAvailability(slot.id).subscribe({
      next: () => {
        this.deletingId = null;
        const from = this.calendarRange.from || this.modalDate!;
        const to = this.calendarRange.to || this.modalDate!;
        this.fetchRange(from, to);
      },
      error: (err) => {
        this.deletingId = null;
        this.modalError = err?.error?.message || 'Failed to delete availability.';
      },
    });
  }
}
