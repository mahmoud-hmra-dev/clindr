<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Resources\DoctorResource;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Specialty;
use Illuminate\Support\Carbon;
use Illuminate\Http\Request;

class DoctorPublicController extends Controller
{
    public function index(Request $request)
    {
        $query = Doctor::query()
            ->with([
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
}
