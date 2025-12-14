<?php

namespace App\Http\Controllers\API\Doctor;

use App\Http\Controllers\Controller;
use App\Http\Resources\DoctorAvailabilityResource;
use App\Models\DoctorAvailability;
use App\Models\Clinic;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AvailabilityController extends Controller
{
    public function index(Request $request)
    {
        $doctor = $request->user()->doctor;
        abort_unless($doctor, 403);

        $availabilities = DoctorAvailability::where('doctor_id', $doctor->id)->get();

        return DoctorAvailabilityResource::collection($availabilities);
    }

    public function sync(Request $request)
    {
        $doctor = $request->user()->doctor;
        abort_unless($doctor, 403);

        $validated = $request->validate([
            'availabilities' => ['required', 'array', 'max:200'],
            'availabilities.*.clinic_id' => ['nullable', 'exists:clinics,id'],
            'availabilities.*.day_of_week' => ['required', 'string', 'max:20'],
            'availabilities.*.start_time' => ['required', 'date_format:H:i'],
            'availabilities.*.slot_capacity' => ['nullable', 'integer', 'min:1', 'max:50'],
            'availabilities.*.fee_amount' => ['nullable', 'numeric', 'min:0'],
        ]);

        $normalized = [];
        foreach ($validated['availabilities'] as $slot) {
            $start = Carbon::createFromFormat('H:i', $slot['start_time']);
            $normalized[] = array_merge($slot, [
                'start_time' => $start->format('H:i'),
                'day_of_week' => strtolower($slot['day_of_week']),
                'slot_capacity' => $slot['slot_capacity'] ?? 1,
            ]);
        }

        // Ensure clinics belong to doctor
        $clinicIds = collect($normalized)
            ->pluck('clinic_id')
            ->filter()
            ->unique()
            ->all();
        if (! empty($clinicIds)) {
            $owned = Clinic::where('doctor_id', $doctor->id)->whereIn('id', $clinicIds)->pluck('id')->all();
            if (count($owned) !== count($clinicIds)) {
                abort(403, 'Invalid clinic for this doctor.');
            }
        }

        // Replace all current availabilities for doctor
        \DB::transaction(function () use ($doctor, $normalized) {
            DoctorAvailability::where('doctor_id', $doctor->id)->delete();
            $payload = collect($normalized)->map(function ($slot) use ($doctor) {
                return [
                    'doctor_id' => $doctor->id,
                    'clinic_id' => $slot['clinic_id'] ?? null,
                    'day_of_week' => $slot['day_of_week'],
                    'start_time' => $slot['start_time'],
                    'slot_capacity' => $slot['slot_capacity'] ?? 1,
                    'fee_amount' => $slot['fee_amount'] ?? null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            })->all();
            if (! empty($payload)) {
                DoctorAvailability::insert($payload);
            }
        });

        $fresh = DoctorAvailability::where('doctor_id', $doctor->id)->get();
        return DoctorAvailabilityResource::collection($fresh);
    }

    public function store(Request $request)
    {
        $doctor = $request->user()->doctor;
        abort_unless($doctor, 403);

        $validated = $request->validate([
            'clinic_id' => ['nullable', 'exists:clinics,id'],
            'day_of_week' => ['required', 'string', 'max:20'],
            'start_time' => ['required', 'date_format:H:i'],
            'slot_capacity' => ['nullable', 'integer', 'min:1', 'max:50'],
            'fee_amount' => ['nullable', 'numeric', 'min:0'],
        ]);

        if (! empty($validated['clinic_id'])) {
            Clinic::where('doctor_id', $doctor->id)->findOrFail($validated['clinic_id']);
        }

        $start = Carbon::createFromFormat('H:i', $validated['start_time']);
        $availability = DoctorAvailability::create([
            'doctor_id' => $doctor->id,
            'clinic_id' => $validated['clinic_id'] ?? null,
            'day_of_week' => strtolower($validated['day_of_week']),
            'start_time' => $start->format('H:i'),
            'slot_capacity' => $validated['slot_capacity'] ?? 1,
            'fee_amount' => $validated['fee_amount'] ?? null,
        ]);

        return (new DoctorAvailabilityResource($availability))->response()->setStatusCode(201);
    }

    public function update(Request $request, DoctorAvailability $doctorAvailability)
    {
        $doctor = $request->user()->doctor;
        abort_unless($doctor && $doctorAvailability->doctor_id === $doctor->id, 403);

        $validated = $request->validate([
            'clinic_id' => ['nullable', 'exists:clinics,id'],
            'day_of_week' => ['nullable', 'string', 'max:20'],
            'start_time' => ['nullable', 'date_format:H:i'],
            'slot_capacity' => ['nullable', 'integer', 'min:1', 'max:50'],
            'fee_amount' => ['nullable', 'numeric', 'min:0'],
        ]);

        if (! empty($validated['clinic_id'])) {
            Clinic::where('doctor_id', $doctor->id)->findOrFail($validated['clinic_id']);
        }

        $doctorAvailability->update(array_filter([
            'clinic_id' => $validated['clinic_id'] ?? null,
            'day_of_week' => isset($validated['day_of_week']) ? strtolower($validated['day_of_week']) : null,
            'start_time' => $validated['start_time'] ?? null,
            'slot_capacity' => $validated['slot_capacity'] ?? null,
            'fee_amount' => $validated['fee_amount'] ?? null,
        ], fn ($v) => $v !== null));

        return new DoctorAvailabilityResource($doctorAvailability->fresh());
    }

    public function destroy(DoctorAvailability $doctorAvailability)
    {
        $doctor = request()->user()->doctor;
        abort_unless($doctor && $doctorAvailability->doctor_id === $doctor->id, 403);

        $doctorAvailability->delete();

        return response()->json(['success' => true]);
    }
}
