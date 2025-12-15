<?php

namespace App\Http\Controllers\API\Doctor;

use App\Http\Controllers\Controller;
use App\Http\Resources\DoctorAvailabilityResource;
use App\Models\Appointment;
use App\Models\Clinic;
use App\Models\DoctorAvailability;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AvailabilityController extends Controller
{
    public function index(Request $request)
    {
        $doctor = $request->user()->doctor;
        abort_unless($doctor, 403);

        $validated = $request->validate([
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d'],
        ]);

        $from = $validated['from'] ?? Carbon::now()->startOfMonth()->format('Y-m-d');
        $to = $validated['to'] ?? Carbon::now()->addMonths(2)->endOfMonth()->format('Y-m-d');

        if (Carbon::createFromFormat('Y-m-d', $from)->gt(Carbon::createFromFormat('Y-m-d', $to))) {
            return response()->json(['message' => 'Invalid range: "from" must be before "to".'], 422);
        }

        $availabilities = DoctorAvailability::with('clinic')
            ->where('doctor_id', $doctor->id)
            ->whereBetween('date', [$from, $to])
            ->orderBy('date')
            ->orderBy('start_time')
            ->get();
        $availabilityData = DoctorAvailabilityResource::collection($availabilities)->resolve();

        $bookings = Appointment::with('patient')
            ->where('doctor_id', $doctor->id)
            ->whereNotIn('status', ['cancelled'])
            ->whereBetween('scheduled_at', [
                Carbon::createFromFormat('Y-m-d', $from)->startOfDay(),
                Carbon::createFromFormat('Y-m-d', $to)->endOfDay(),
            ])
            ->get()
            ->map(fn ($appt) => $this->formatBooking($appt));

        return response()->json([
            'range' => [
                'from' => $from,
                'to' => $to,
            ],
            'availabilities' => $availabilityData,
            'bookings' => $bookings,
        ]);
    }

    public function store(Request $request)
    {
        $doctor = $request->user()->doctor;
        abort_unless($doctor, 403);

        $validated = $request->validate([
            'date' => ['required', 'date_format:Y-m-d'],
            'availability_type' => ['required', Rule::in(['clinic', 'online'])],
            'clinic_id' => ['nullable', 'required_if:availability_type,clinic', 'exists:clinics,id'],
            'slots' => ['required', 'array', 'min:1'],
            'slots.*.start_time' => ['required', 'date_format:H:i'],
            'slots.*.end_time' => ['required', 'date_format:H:i'],
        ]);

        $this->ensureClinicBelongsToDoctor($doctor->id, $validated['clinic_id'] ?? null, $validated['availability_type']);

        $normalizedSlots = $this->normalizeSlots($validated['slots']);
        $conflicts = $this->detectConflicts($doctor->id, $validated['date'], $normalizedSlots);
        if (! empty($conflicts)) {
            return response()->json([
                'message' => 'Availability conflicts detected.',
                'errors' => $conflicts,
            ], 422);
        }

        $created = DB::transaction(function () use ($doctor, $validated, $normalizedSlots) {
            $dayOfWeek = strtolower(Carbon::createFromFormat('Y-m-d', $validated['date'])->englishDayOfWeek);

            return collect($normalizedSlots)->map(function ($slot) use ($doctor, $validated, $dayOfWeek) {
                return DoctorAvailability::create([
                    'doctor_id' => $doctor->id,
                    'clinic_id' => $validated['clinic_id'] ?? null,
                    'date' => $validated['date'],
                    'day_of_week' => $dayOfWeek,
                    'start_time' => $slot['start_time'],
                    'end_time' => $slot['end_time'],
                    'availability_type' => $validated['availability_type'],
                    'status' => 'active',
                    'slot_capacity' => $slot['slot_capacity'] ?? 1,
                    'fee_amount' => $slot['fee_amount'] ?? null,
                ]);
            });
        });

        return response()->json([
            'availabilities' => DoctorAvailabilityResource::collection($created)->resolve(),
        ], 201);
    }

    public function destroy(DoctorAvailability $doctorAvailability)
    {
        $doctor = request()->user()->doctor;
        abort_unless($doctor && $doctorAvailability->doctor_id === $doctor->id, 403);

        $hasBooking = $this->hasBookingOverlap(
            $doctor->id,
            optional($doctorAvailability->date)->format('Y-m-d'),
            $doctorAvailability->start_time,
            $doctorAvailability->end_time
        );

        if ($hasBooking) {
            return response()->json(['message' => 'Cannot delete availability that overlaps with a booking.'], 422);
        }

        $doctorAvailability->delete();

        return response()->json(['success' => true]);
    }

    private function normalizeSlots(array $slots): array
    {
        $normalized = [];
        $errors = [];

        foreach ($slots as $idx => $slot) {
            $start = $this->normalizeTime($slot['start_time'] ?? null);
            $end = $this->normalizeTime($slot['end_time'] ?? null);

            if (! $start || ! $end) {
                $errors["slots.$idx"] = 'Time must be in HH:mm format.';
                continue;
            }

            if ($end <= $start) {
                $errors["slots.$idx"] = 'End time must be after start time.';
                continue;
            }

            $normalized[] = [
                'start_time' => $start,
                'end_time' => $end,
                'index' => $idx,
            ];
        }

        if (! empty($errors)) {
            throw ValidationException::withMessages($errors);
        }

        return $normalized;
    }

    private function detectConflicts(int $doctorId, string $date, array $slots): array
    {
        $errors = [];
        $unique = [];

        foreach ($slots as $slot) {
            $key = $slot['start_time'] . '-' . $slot['end_time'];
            if (isset($unique[$key])) {
                $errors[] = "Duplicate slot {$slot['start_time']} - {$slot['end_time']}.";
            }
            $unique[$key] = true;
        }

        // Payload internal overlaps
        for ($i = 0; $i < count($slots); $i++) {
            for ($j = $i + 1; $j < count($slots); $j++) {
                $aStart = $this->combineDateTime($date, $slots[$i]['start_time']);
                $aEnd = $this->combineDateTime($date, $slots[$i]['end_time']);
                $bStart = $this->combineDateTime($date, $slots[$j]['start_time']);
                $bEnd = $this->combineDateTime($date, $slots[$j]['end_time']);

                if ($this->slotsOverlap($aStart, $aEnd, $bStart, $bEnd)) {
                    $errors[] = "Slot {$slots[$i]['start_time']} - {$slots[$i]['end_time']} overlaps with {$slots[$j]['start_time']} - {$slots[$j]['end_time']}.";
                }
            }
        }

        $existing = DoctorAvailability::where('doctor_id', $doctorId)
            ->whereDate('date', $date)
            ->get();

        foreach ($slots as $slot) {
            $slotStart = $this->combineDateTime($date, $slot['start_time']);
            $slotEnd = $this->combineDateTime($date, $slot['end_time']);

            foreach ($existing as $existingSlot) {
                if (! $existingSlot->start_time) {
                    continue;
                }
                $existingStart = $this->combineDateTime(
                    $date,
                    $this->normalizeTime($existingSlot->start_time) ?? $existingSlot->start_time
                );
                $existingEndTime = $existingSlot->end_time
                    ? ($this->normalizeTime($existingSlot->end_time) ?? $existingSlot->end_time)
                    : $this->defaultEndFromStart($existingSlot->start_time);
                if (! $existingEndTime) {
                    continue;
                }
                $existingEnd = $this->combineDateTime($date, $existingEndTime);

                if ($this->slotsOverlap($slotStart, $slotEnd, $existingStart, $existingEnd)) {
                    $errors[] = "Slot {$slot['start_time']} - {$slot['end_time']} overlaps existing availability {$existingStart->format('H:i')} - {$existingEnd->format('H:i')}.";
                }
            }

            if ($this->hasBookingOverlap($doctorId, $date, $slot['start_time'], $slot['end_time'])) {
                $errors[] = "Slot {$slot['start_time']} - {$slot['end_time']} conflicts with a booked appointment.";
            }
        }

        return array_values(array_unique($errors));
    }

    private function hasBookingOverlap(int $doctorId, ?string $date, ?string $startTime, ?string $endTime = null): bool
    {
        if (! $date || ! $startTime) {
            return false;
        }

        $start = $this->combineDateTime($date, $startTime);
        $resolvedEnd = $endTime ?? $this->defaultEndFromStart($startTime);
        if (! $resolvedEnd) {
            return false;
        }
        $end = $this->combineDateTime($date, $resolvedEnd);

        $bookings = Appointment::where('doctor_id', $doctorId)
            ->whereDate('scheduled_at', $date)
            ->whereNotIn('status', ['cancelled'])
            ->get();

        foreach ($bookings as $booking) {
            if (! $booking->scheduled_at) {
                continue;
            }
            $bookingStart = Carbon::parse($booking->scheduled_at);
            $bookingEnd = (clone $bookingStart)->addMinutes($booking->duration_minutes ?? 30);

            if ($this->slotsOverlap($start, $end, $bookingStart, $bookingEnd)) {
                return true;
            }
        }

        return false;
    }

    private function combineDateTime(string $date, string $time): Carbon
    {
        $format = strlen($time) === 5 ? 'Y-m-d H:i' : 'Y-m-d H:i:s';

        return Carbon::createFromFormat($format, "{$date} {$time}");
    }

    private function normalizeTime(?string $time): ?string
    {
        if (! $time) {
            return null;
        }

        $format = strlen($time) === 5 ? 'H:i' : 'H:i:s';
        try {
            return Carbon::createFromFormat($format, $time)->format('H:i:s');
        } catch (\Throwable $e) {
            return null;
        }
    }

    private function defaultEndFromStart(?string $startTime): ?string
    {
        $start = $this->normalizeTime($startTime);
        if (! $start) {
            return null;
        }

        return Carbon::createFromFormat('H:i:s', $start)->addHour()->format('H:i:s');
    }

    private function slotsOverlap(Carbon $startA, Carbon $endA, Carbon $startB, Carbon $endB): bool
    {
        return $startA < $endB && $startB < $endA;
    }

    private function ensureClinicBelongsToDoctor(int $doctorId, ?int $clinicId, string $availabilityType): void
    {
        if ($availabilityType === 'clinic') {
            $clinic = Clinic::where('doctor_id', $doctorId)->find($clinicId);
            abort_unless($clinic, 403, 'Invalid clinic for this doctor.');
        }
    }

    private function formatBooking(Appointment $appointment): array
    {
        $start = $appointment->scheduled_at ? Carbon::parse($appointment->scheduled_at) : null;
        $end = $start ? (clone $start)->addMinutes($appointment->duration_minutes ?? 30) : null;

        return [
            'id' => $appointment->id,
            'date' => $start?->format('Y-m-d'),
            'start' => $start?->format('Y-m-d H:i:s'),
            'end' => $end?->format('Y-m-d H:i:s'),
            'appointment_type' => $appointment->appointment_type,
            'status' => $appointment->status,
            'patient' => $appointment->patient ? [
                'id' => $appointment->patient->id,
                'name' => trim($appointment->patient->first_name . ' ' . $appointment->patient->last_name),
            ] : null,
            'clinic_location' => $appointment->clinic_location,
        ];
    }
}
