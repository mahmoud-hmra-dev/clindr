/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CalendarOptions, DateSelectArg, EventClickArg } from '@fullcalendar/core';
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

  form: FormGroup;
  slotForm: FormGroup;
  clinics: any[] = [];
  appointments: any[] = [];
  loading = false;
  saving = false;
  message = '';
  error = '';
  modalOpen = false;
  selectedDateForAdd: Date | null = null;

  selectionMode: 'single-day' | 'full-week' | 'full-month' = 'single-day';
  horizonDays = 90;
  selectedDate = new Date();

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin, timeGridPlugin],
    initialView: 'dayGridMonth',
    selectable: true,
    selectMirror: true,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek'
    },
    select: (arg) => this.onCalendarSelect(arg),
    eventClick: (arg) => this.onEventClick(arg),
    events: [],
    height: 'auto'
  };

  dayOptions = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  constructor(
    private fb: FormBuilder,
    private doctorService: DoctorService
  ) {
    this.form = this.fb.group({
      availabilities: this.fb.array([])
    });

    this.slotForm = this.fb.group({
      start_time: ['', [Validators.required, Validators.pattern(/^\\d{2}:\\d{2}$/)]],
      end_time: ['', [Validators.required, Validators.pattern(/^\\d{2}:\\d{2}$/)]],
      slot_capacity: [1, [Validators.required, Validators.min(1)]],
      fee_amount: [null, [Validators.min(0)]],
      clinic_id: [null],
    });
  }

  ngOnInit(): void {
    this.loadProfile();
    this.loadAppointments();
  }

  get availabilities(): FormArray {
    return this.form.get('availabilities') as FormArray;
  }

  private buildSlot(slot?: any): FormGroup {
    return this.fb.group({
      day_of_week: [slot?.day_of_week || 'monday', Validators.required],
      start_time: [this.toTimeInput(slot?.start_time), [Validators.required, Validators.pattern(/^\\d{2}:\\d{2}$/)]],
      end_time: [this.toTimeInput(slot?.end_time), [Validators.required, Validators.pattern(/^\\d{2}:\\d{2}$/)]],
      slot_capacity: [slot?.slot_capacity || 1, [Validators.required, Validators.min(1)]],
      fee_amount: [slot?.fee_amount ?? null, [Validators.min(0)]],
      clinic_id: [slot?.clinic_id || null],
    });
  }

  private toTimeInput(val?: string): string {
    if (!val) return '';
    if (val.length >= 5) return val.substring(0, 5);
    return val;
  }

  addSlot(): void {
    const generated = this.generateSlotsFromSelection();
    if (!generated.length) {
      this.error = 'Select a date and time range to add availability.';
      return;
    }

    generated.forEach((slot) => this.availabilities.push(this.buildSlot(slot)));
    this.message = `Added ${generated.length} slot(s)`;
    this.refreshCalendarEvents();
  }

  removeSlot(index: number): void {
    this.availabilities.removeAt(index);
    this.refreshCalendarEvents();
  }

  openModal(date: Date): void {
    this.selectedDateForAdd = date;
    this.slotForm.reset({
      start_time: '',
      end_time: '',
      slot_capacity: 1,
      fee_amount: null,
      clinic_id: null
    });
    this.modalOpen = true;
  }

  closeModal(): void {
    this.modalOpen = false;
  }

  addSlotFromModal(): void {
    if (this.slotForm.invalid || !this.selectedDateForAdd) {
      this.slotForm.markAllAsTouched();
      return;
    }
    const dayOfWeek = this.selectedDateForAdd.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const slotCandidate = { ...this.slotForm.value, day_of_week: dayOfWeek };
    if (!this.isValidSlot(slotCandidate)) {
      this.error = 'Use HH:mm format and ensure end time is after start time.';
      return;
    }
    this.selectedDate = this.selectedDateForAdd;
    this.addSlot();
    this.closeModal();
  }

  onCalendarSelect(selectInfo: DateSelectArg): void {
    if (selectInfo.start) {
      this.selectedDate = selectInfo.start;
      this.openModal(selectInfo.start);
    }
  }

  onEventClick(info: EventClickArg): void {
    // reserved for future actions (e.g., inspect booked slot)
    info.jsEvent.preventDefault();
  }

  loadProfile(): void {
    this.loading = true;
    this.doctorService.getMyProfile().subscribe({
      next: (res) => {
        const data = res?.data || res;
        this.clinics = data?.clinics || [];
        this.loading = false;
        this.loadAvailabilities();
      },
      error: () => {
        this.error = 'Failed to load availabilities';
        this.loading = false;
      }
    });
  }

  private loadAvailabilities(): void {
    this.loading = true;
    this.doctorService.listMyAvailabilities().subscribe({
      next: (res) => {
        const list = res?.data ?? res ?? [];
        const items = Array.isArray(list) ? list : [];
        this.availabilities.clear();
        items.forEach((slot: any) => this.availabilities.push(this.buildSlot(slot)));
        this.loading = false;
        this.refreshCalendarEvents();
      },
      error: () => {
        this.error = 'Failed to load availabilities';
        this.loading = false;
      }
    });
  }

  private loadAppointments(): void {
    this.doctorService.getDoctorAppointments().subscribe({
      next: (res) => {
        const data = res?.data ?? res ?? [];
        const booked = Array.isArray(data) ? data : [];
        this.appointments = booked;
        this.refreshCalendarEvents();
      },
      error: () => {
        // ignore booking highlights on failure
      }
    });
  }

  save(): void {
    const validSlots = (this.availabilities.value as any[]).filter((slot) => this.isValidSlot(slot));
    if (!validSlots.length) {
      this.error = 'Add at least one valid availability (HH:mm times, end after start).';
      return;
    }
    this.saving = true;
    this.message = '';
    this.error = '';
    const payload = validSlots.map((slot: any) => ({
      ...slot,
      start_time: slot.start_time || null,
      end_time: slot.end_time || null,
    }));
    this.doctorService.syncMyAvailabilities(payload).subscribe({
      next: () => {
        this.message = 'Availabilities updated';
        this.saving = false;
        this.loadAvailabilities();
      },
      error: () => {
        this.error = 'Failed to update availabilities';
        this.saving = false;
      }
    });
  }

  private generateSlotsFromSelection(): any[] {
    if (this.slotForm.invalid || !this.selectedDate) {
      this.slotForm.markAllAsTouched();
      return [];
    }

    const { start_time, end_time, slot_capacity, fee_amount, clinic_id } = this.slotForm.value;
    const baseDate = this.selectedDate;
    const dates: Date[] = [];

    if (this.selectionMode === 'single-day') {
      dates.push(new Date(baseDate));
    } else if (this.selectionMode === 'full-week') {
      const first = this.startOfWeek(baseDate);
      for (let i = 0; i < 7; i++) {
        const d = new Date(first);
        d.setDate(first.getDate() + i);
        dates.push(d);
      }
    } else if (this.selectionMode === 'full-month') {
      const year = baseDate.getFullYear();
      const month = baseDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        dates.push(new Date(year, month, i));
      }
    }

    const slots: any[] = [];
    const uniqueKeys = new Set<string>();
    dates.forEach((d) => {
      if (!this.isValidTime(start_time) || !this.isValidTime(end_time) || start_time >= end_time) return;
      const day = d.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const key = `${day}-${start_time}-${end_time}-${clinic_id ?? 'any'}`;
      if (uniqueKeys.has(key)) return;
      uniqueKeys.add(key);

      slots.push({
        day_of_week: day,
        start_time,
        end_time,
        slot_capacity,
        fee_amount,
        clinic_id
      });
    });

    return slots;
  }

  private startOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay(); // 0 Sun .. 6 Sat
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  }

  private refreshCalendarEvents(): void {
    const events: any[] = [];
    const today = new Date();
    const slots = this.availabilities.value as any[];

    for (let i = 0; i <= this.horizonDays; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

      slots.forEach((slot) => {
        if (!slot?.start_time || !slot?.end_time) return;
        if ((slot?.day_of_week || '').toLowerCase() !== dayName) return;
        const start = this.combineDateTime(date, slot.start_time);
        const end = this.combineDateTime(date, slot.end_time);
        events.push({
          title: 'Available',
          start,
          end,
          display: 'background',
          classNames: ['fc-available'],
          extendedProps: { type: 'available', clinicId: slot.clinic_id }
        });
      });
    }

    this.appointments.forEach((appt: any) => {
      const status = (appt?.status || '').toLowerCase();
      if (status === 'cancelled') return;

      const startStr = appt?.scheduled_at || appt?.scheduledAt;
      if (!startStr) return;
      const start = new Date(startStr);
      if (isNaN(start.getTime())) return;

      const duration = Number(appt?.duration_minutes) || 30;
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + duration);

      events.push({
        title: appt?.patient?.name || 'Booked',
        start,
        end,
        classNames: ['fc-booked'],
        display: 'block'
      });
    });

    this.calendarOptions = { ...this.calendarOptions, events };
  }

  private combineDateTime(date: Date, time: string): string {
    const d = new Date(date);
    const [h, m] = (time || '').split(':').map((v) => parseInt(v, 10) || 0);
    d.setHours(h || 0, m || 0, 0, 0);
    return d.toISOString();
  }

  private isValidTime(value: string | null | undefined): boolean {
    if (!value) return false;
    return /^\\d{2}:\\d{2}$/.test(value);
  }

  private isValidSlot(slot: any): boolean {
    if (!slot?.day_of_week) return false;
    if (!this.isValidTime(slot.start_time) || !this.isValidTime(slot.end_time)) return false;
    return slot.start_time < slot.end_time;
  }
}
