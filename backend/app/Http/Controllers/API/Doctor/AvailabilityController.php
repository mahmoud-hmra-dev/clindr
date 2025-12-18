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
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AvailabilityController extends Controller
{
    private int $slotDurationMinutes = 30;

    public function index(Request $request)
    {
        $doctor = $request->user()->doctor;
        abort_unless($doctor, 403);

        $hasDateColumn = $this->supportsColumn('date');
        $validated = $request->validate([
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d'],
        ]);

        $from = $validated['from'] ?? Carbon::now()->startOfMonth()->format('Y-m-d');
        $to = $validated['to'] ?? Carbon::now()->addMonths(2)->endOfMonth()->format('Y-m-d');

        if (Carbon::createFromFormat('Y-m-d', $from)->gt(Carbon::createFromFormat('Y-m-d', $to))) {
            return response()->json(['message' => 'Invalid range: "from" must be before "to".'], 422);
        }

        $availabilityData = [];
        if ($hasDateColumn) {
            $availabilities = DoctorAvailability::with('clinic')
                ->where('doctor_id', $doctor->id)
                ->whereBetween('date', [$from, $to])
                ->orderBy('date')
                ->orderBy('start_time')
                ->get();
            $availabilityData = DoctorAvailabilityResource::collection($availabilities)->resolve();
        } else {
            $availabilities = DoctorAvailability::with('clinic')
                ->where('doctor_id', $doctor->id)
                ->get();
            $availabilityData = $this->expandRecurringAvailabilities($availabilities, $from, $to);
        }

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

        $hasDateColumn = $this->supportsColumn('date');
        $hasTypeColumn = $this->supportsColumn('availability_type');
        $hasStatusColumn = $this->supportsColumn('status');

        $validated = $request->validate([
            'date' => ['required', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:date'],
            'availability_type' => ['required', Rule::in(['clinic', 'online'])],
            'clinic_id' => ['nullable', 'required_if:availability_type,clinic', 'exists:clinics,id'],
            'slots' => ['required', 'array', 'min:1'],
            'slots.*.start_time' => ['required', 'date_format:H:i'],
        ]);

        $this->ensureClinicBelongsToDoctor($doctor->id, $validated['clinic_id'] ?? null, $validated['availability_type']);

        $normalizedSlots = $this->normalizeSlots($validated['slots']);

        $startDate = Carbon::createFromFormat('Y-m-d', $validated['date'])->startOfDay();
        $endDate = isset($validated['to'])
            ? Carbon::createFromFormat('Y-m-d', $validated['to'])->endOfDay()
            : (clone $startDate)->endOfDay();

        if ($startDate->gt($endDate)) {
            return response()->json([
                'message' => 'Invalid date range.',
                'errors' => ['to must be after or equal to date.'],
            ], 422);
        }

        $allErrors = [];
        $cursor = (clone $startDate);
        while ($cursor->lte($endDate)) {
            $dateString = $cursor->toDateString();
            $conflicts = $this->detectConflicts($doctor->id, $dateString, $normalizedSlots);
            if (! empty($conflicts)) {
                foreach ($conflicts as $err) {
                    $allErrors[] = "{$dateString}: {$err}";
                }
            }
            $cursor->addDay();
        }

        if (! empty($allErrors)) {
            return response()->json([
                'message' => 'Availability conflicts detected.',
                'errors' => array_values(array_unique($allErrors)),
            ], 422);
        }

        $created = DB::transaction(function () use ($doctor, $validated, $normalizedSlots, $hasDateColumn, $hasTypeColumn, $hasStatusColumn, $startDate, $endDate) {
            $createdSlots = collect();

            $cursor = (clone $startDate);
            while ($cursor->lte($endDate)) {
                $dayOfWeek = strtolower($cursor->englishDayOfWeek);
                $dateString = $cursor->toDateString();

                foreach ($normalizedSlots as $slot) {
                    $data = [
                        'doctor_id' => $doctor->id,
                        'clinic_id' => $validated['clinic_id'] ?? null,
                        'day_of_week' => $dayOfWeek,
                        'start_time' => $slot['start_time'],
                        'slot_capacity' => $slot['slot_capacity'] ?? 1,
                        'fee_amount' => $slot['fee_amount'] ?? null,
                    ];
                    if ($hasDateColumn) {
                        $data['date'] = $dateString;
                    }
                    if ($hasTypeColumn) {
                        $data['availability_type'] = $validated['availability_type'];
                    }
                    if ($hasStatusColumn) {
                        $data['status'] = 'active';
                    }

                    $createdSlots->push(DoctorAvailability::create($data));
                }

                $cursor->addDay();
            }

            return $createdSlots;
        });

        $responseAvailabilities = $hasDateColumn
            ? DoctorAvailabilityResource::collection($created)->resolve()
            : $this->expandRecurringAvailabilities($created, $validated['date'], $validated['to'] ?? $validated['date']);

        return response()->json([
            'availabilities' => $responseAvailabilities,
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
            null
        );

        if ($hasBooking) {
            return response()->json(['message' => 'Cannot delete availability that overlaps with a booking.'], 422);
        }

        $doctorAvailability->delete();

        return response()->json(['success' => true]);
    }

    private function supportsColumn(string $column): bool
    {
        return Schema::hasColumn('doctor_availabilities', $column);
    }

    private function expandRecurringAvailabilities($availabilities, string $from, string $to): array
    {
        $byDay = collect($availabilities)->groupBy(fn ($a) => strtolower((string) $a->day_of_week));
        $out = [];

        $cursor = Carbon::createFromFormat('Y-m-d', $from)->startOfDay();
        $end = Carbon::createFromFormat('Y-m-d', $to)->endOfDay();
        while ($cursor->lte($end)) {
            $dayKey = strtolower($cursor->englishDayOfWeek);
            foreach ($byDay->get($dayKey, []) as $slot) {
                if (! $slot->start_time) {
                    continue;
                }
                $startTime = $this->normalizeTime($slot->start_time);
                $endTime = $this->defaultEndFromStart($slot->start_time);
                if (! $startTime || ! $endTime) {
                    continue;
                }

                $out[] = [
                    'id' => $slot->id,
                    'doctor_id' => $slot->doctor_id,
                    'clinic_id' => $slot->clinic_id,
                    'date' => $cursor->toDateString(),
                    'start_time' => $startTime,
                    'availability_type' => $slot->availability_type ?? 'online',
                    'clinic' => $slot->clinic ? [
                        'id' => $slot->clinic->id,
                        'name' => $slot->clinic->name,
                    ] : null,
                    'status' => $slot->status ?? 'active',
                    'day_of_week' => $slot->day_of_week,
                    'slot_capacity' => $slot->slot_capacity,
                    'fee_amount' => $slot->fee_amount,
                ];
            }
            $cursor->addDay();
        }

        return $out;
    }

    private function normalizeSlots(array $slots): array
    {
        $normalized = [];
        $errors = [];

        foreach ($slots as $idx => $slot) {
            $start = $this->normalizeTime($slot['start_time'] ?? null);
            $end = $this->defaultEndFromStart($slot['start_time'] ?? null);

            if (! $start || ! $end) {
                $errors["slots.$idx"] = 'Time must be in HH:mm format.';
                continue;
            }

            $normalized[] = [
                'start_time' => $start,
                'ends_at' => $end,
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
            $key = $slot['start_time'] . '-' . $slot['ends_at'];
            if (isset($unique[$key])) {
                $errors[] = "Duplicate slot {$slot['start_time']} - {$slot['ends_at']}.";
            }
            $unique[$key] = true;
        }

        // Payload internal overlaps
        for ($i = 0; $i < count($slots); $i++) {
            for ($j = $i + 1; $j < count($slots); $j++) {
                $aStart = $this->combineDateTime($date, $slots[$i]['start_time']);
                $aEnd = $this->combineDateTime($date, $slots[$i]['ends_at']);
                $bStart = $this->combineDateTime($date, $slots[$j]['start_time']);
                $bEnd = $this->combineDateTime($date, $slots[$j]['ends_at']);

                if ($this->slotsOverlap($aStart, $aEnd, $bStart, $bEnd)) {
                    $errors[] = "Slot {$slots[$i]['start_time']} - {$slots[$i]['ends_at']} overlaps with {$slots[$j]['start_time']} - {$slots[$j]['ends_at']}.";
                }
            }
        }

        $existing = DoctorAvailability::where('doctor_id', $doctorId)
            ->when(
                $this->supportsColumn('date'),
                fn ($q) => $q->whereDate('date', $date)
            )
            ->get();

        foreach ($slots as $slot) {
            $slotStart = $this->combineDateTime($date, $slot['start_time']);
            $slotEnd = $this->combineDateTime($date, $slot['ends_at']);

            foreach ($existing as $existingSlot) {
                if (! $this->supportsColumn('date') && strtolower((string) $existingSlot->day_of_week) !== strtolower(Carbon::parse($date)->englishDayOfWeek)) {
                    continue;
                }
                if (! $existingSlot->start_time) {
                    continue;
                }
                $existingStart = $this->combineDateTime(
                    $date,
                    $this->normalizeTime($existingSlot->start_time) ?? $existingSlot->start_time
                );
                $existingEnd = $this->combineDateTime(
                    $date,
                    $this->defaultEndFromStart($existingSlot->start_time) ?? $existingSlot->start_time
                );

                if ($this->slotsOverlap($slotStart, $slotEnd, $existingStart, $existingEnd)) {
                    $errors[] = "Slot {$slot['start_time']} - {$slot['ends_at']} overlaps existing availability {$existingStart->format('H:i')} - {$existingEnd->format('H:i')}.";
                }
            }

            if ($this->hasBookingOverlap($doctorId, $date, $slot['start_time'], $slot['ends_at'])) {
                $errors[] = "Slot {$slot['start_time']} - {$slot['ends_at']} conflicts with a booked appointment.";
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
            $bookingEnd = (clone $bookingStart)->addMinutes($booking->duration_minutes ?? $this->slotDurationMinutes);

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

        return Carbon::createFromFormat('H:i:s', $start)->addMinutes(30)->format('H:i:s');
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
