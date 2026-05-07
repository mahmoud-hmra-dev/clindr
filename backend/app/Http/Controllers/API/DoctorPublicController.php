<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Resources\DoctorResource;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Specialty;
use Illuminate\Support\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;

class DoctorPublicController extends Controller
{
    private int $slotDurationMinutes = 30;

    public function index(Request $request)
    {
        $query = Doctor::query()
            ->with([
                'user',
                'services.specialty',
                'clinics',
                'availabilities',
                'educations',
                'experiences',
                'awards',
                'insurances',
                'memberships',
                'socialLinks',
            ]);

        if ($name = $request->get('name')) {
            $query->where(function ($q) use ($name) {
                $q->where('display_name', 'like', '%' . $name . '%')
                    ->orWhere('first_name', 'like', '%' . $name . '%')
                    ->orWhere('last_name', 'like', '%' . $name . '%');
            });
        }

        if ($city = $request->get('city')) {
            $query->where('city', 'like', '%' . $city . '%');
        }

        $specialties = collect(explode(',', (string)$request->get('specialties')))->filter();
        if ($specialties->count()) {
            $query->whereHas('services', function ($q) use ($specialties) {
                $q->whereIn('specialty_id', $specialties);
            });
        }

        $minFee = $request->get('min_fee');
        $maxFee = $request->get('max_fee');
        if ($minFee !== null || $maxFee !== null) {
            $query->where(function ($q) use ($minFee, $maxFee) {
                if ($minFee !== null) {
                    $q->where(function ($inner) use ($minFee) {
                        $inner->where('default_fee', '>=', $minFee)
                            ->orWhereHas('services', function ($srv) use ($minFee) {
                                $srv->where('price', '>=', $minFee);
                            });
                    });
                }
                if ($maxFee !== null) {
                    $q->where(function ($inner) use ($maxFee) {
                        $inner->where('default_fee', '<=', $maxFee)
                            ->orWhereHas('services', function ($srv) use ($maxFee) {
                                $srv->where('price', '<=', $maxFee);
                            });
                    });
                }
            });
        }

        if ($availability = $request->get('availability')) {
            $range = $this->resolveAvailabilityRange($availability);

            if ($range) {
                [$from, $to] = $range;
                $hasDateColumn = Schema::hasColumn('doctor_availabilities', 'date');
                $hasStatusColumn = Schema::hasColumn('doctor_availabilities', 'status');
                $days = $hasDateColumn ? [] : $this->daysBetween($from, $to);

                $query->whereHas('availabilities', function ($q) use ($from, $to, $hasDateColumn, $hasStatusColumn, $days) {
                    $q->whereNotNull('start_time');

                    if ($hasDateColumn) {
                        $q->whereBetween('date', [$from->toDateString(), $to->toDateString()]);
                    } elseif (! empty($days)) {
                        $q->whereIn('day_of_week', $days);
                    }

                    if ($hasStatusColumn) {
                        $q->where('status', 'active');
                    }
                });
            }
        }

        $doctors = $query->paginate($request->get('per_page', 9));

        return DoctorResource::collection($doctors);
    }

    public function show(Doctor $doctor)
    {
        $doctor->load([
            'services.specialty',
            'clinics',
            'availabilities',
            'educations',
            'experiences',
            'awards',
            'insurances',
            'memberships',
            'socialLinks',
            'reviews',
        ]);

        $doctor->setRelation(
            'availabilities',
            $this->filterBookedOutSlots($doctor->availabilities, $doctor->id)
        );

        return new DoctorResource($doctor);
    }

    public function bookedSlots(Doctor $doctor, Request $request)
    {
        $validated = $request->validate([
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d'],
        ]);

        $from = $validated['from'] ?? Carbon::now()->format('Y-m-d');
        $to = $validated['to'] ?? Carbon::now()->addMonths(2)->format('Y-m-d');

        $fromDate = Carbon::createFromFormat('Y-m-d', $from);
        $toDate = Carbon::createFromFormat('Y-m-d', $to);

        if ($fromDate->gt($toDate)) {
            return response()->json([
                'message' => '"from" date must be before "to" date.',
            ], 422);
        }

        $bookings = Appointment::query()
            ->where('doctor_id', $doctor->id)
            ->whereNotIn('status', ['cancelled'])
            ->whereBetween('scheduled_at', [$fromDate->copy()->startOfDay(), $toDate->copy()->endOfDay()])
            ->orderBy('scheduled_at')
            ->get()
            ->map(function ($appt) {
                $start = Carbon::parse($appt->scheduled_at);
                $end = (clone $start)->addMinutes($appt->duration_minutes ?? 30);

                return [
                    'id' => $appt->id,
                    'start' => $start->toIso8601String(),
                    'end' => $end->toIso8601String(),
                    'status' => $appt->status,
                    'appointment_type' => $appt->appointment_type,
                    'clinic_id' => $appt->clinic_id,
                ];
            });

        return response()->json([
            'doctor_id' => $doctor->id,
            'range' => [
                'from' => $from,
                'to' => $to,
            ],
            'data' => $bookings,
        ]);
    }

    public function specialties()
    {
        $specialties = Specialty::whereHas('services')->orderBy('name')->get();
        return response()->json([
            'data' => $specialties
        ]);
    }

    private function resolveAvailabilityRange(string $availability): ?array
    {
        $today = Carbon::today();

        switch ($availability) {
            case 'today':
                $from = $today->copy();
                $to = $today->copy();
                break;
            case 'tomorrow':
                $from = $today->copy()->addDay();
                $to = $from->copy();
                break;
            case 'next_7':
                $from = $today->copy();
                $to = $today->copy()->addDays(7);
                break;
            case 'next_30':
                $from = $today->copy();
                $to = $today->copy()->addDays(30);
                break;
            default:
                return null;
        }

        return [$from, $to];
    }

    private function daysBetween(Carbon $from, Carbon $to): array
    {
        $days = [];
        $cursor = $from->copy();

        while ($cursor->lte($to)) {
            $days[] = strtolower($cursor->englishDayOfWeek);
            $cursor->addDay();
        }

        return array_values(array_unique($days));
    }

    private function filterBookedOutSlots(Collection $availabilities, int $doctorId): Collection
    {
        if (! $availabilities->count()) {
            return $availabilities;
        }

        $dates = $availabilities->pluck('date')->filter()->map(function ($d) {
            return $d instanceof Carbon ? $d->format('Y-m-d') : (is_string($d) ? $d : null);
        })->filter()->unique()->values();

        if (! $dates->count()) {
            return $availabilities;
        }

        $bookings = Appointment::query()
            ->where('doctor_id', $doctorId)
            ->whereNotIn('status', ['cancelled'])
            ->whereBetween('scheduled_at', [
                Carbon::createFromFormat('Y-m-d', $dates->min())->startOfDay(),
                Carbon::createFromFormat('Y-m-d', $dates->max())->endOfDay(),
            ])
            ->get();

        return $availabilities->filter(function ($slot) use ($bookings) {
            if (! $slot->date || ! $slot->start_time) {
                return false;
            }

            $dateString = $slot->date instanceof Carbon ? $slot->date->format('Y-m-d') : (string) $slot->date;
            $startTime = $this->normalizeTime($slot->start_time) ?? $slot->start_time;

            $slotStart = Carbon::createFromFormat(
                strlen($startTime) === 5 ? 'Y-m-d H:i' : 'Y-m-d H:i:s',
                "{$dateString} {$startTime}"
            );
            $slotEnd = (clone $slotStart)->addMinutes($this->slotDurationMinutes);

            foreach ($bookings as $booking) {
                if (! $booking->scheduled_at) {
                    continue;
                }
                $bookingStart = Carbon::parse($booking->scheduled_at);
                $bookingEnd = (clone $bookingStart)->addMinutes($booking->duration_minutes ?? $this->slotDurationMinutes);

                if ($slotStart < $bookingEnd && $bookingStart < $slotEnd) {
                    return false;
                }
            }

            return true;
        })->values();
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
}
