<?php

namespace App\Http\Controllers\API\Doctor;

use App\Http\Controllers\Controller;
use App\Http\Resources\DoctorAvailabilityResource;
use App\Models\DoctorAvailability;
use App\Models\Clinic;
use Illuminate\Http\Request;

class AvailabilityController extends Controller
{
    public function index(Request $request)
    {
        $doctor = $request->user()->doctor;
        abort_unless($doctor, 403);

        $availabilities = DoctorAvailability::where('doctor_id', $doctor->id)->get();

        return DoctorAvailabilityResource::collection($availabilities);
    }

    public function store(Request $request)
    {
        $doctor = $request->user()->doctor;
        abort_unless($doctor, 403);

        $validated = $request->validate([
            'clinic_id' => ['nullable', 'exists:clinics,id'],
            'day_of_week' => ['required', 'string', 'max:20'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'slot_capacity' => ['nullable', 'integer', 'min:1', 'max:50'],
            'fee_amount' => ['nullable', 'numeric', 'min:0'],
        ]);

        if (! empty($validated['clinic_id'])) {
            Clinic::where('doctor_id', $doctor->id)->findOrFail($validated['clinic_id']);
        }

        $availability = DoctorAvailability::create([
            'doctor_id' => $doctor->id,
            'clinic_id' => $validated['clinic_id'] ?? null,
            'day_of_week' => strtolower($validated['day_of_week']),
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
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
            'end_time' => ['nullable', 'date_format:H:i'],
            'slot_capacity' => ['nullable', 'integer', 'min:1', 'max:50'],
            'fee_amount' => ['nullable', 'numeric', 'min:0'],
        ]);

        if (! empty($validated['clinic_id'])) {
            Clinic::where('doctor_id', $doctor->id)->findOrFail($validated['clinic_id']);
        }

        if (! empty($validated['start_time']) && ! empty($validated['end_time']) && $validated['start_time'] >= $validated['end_time']) {
            return response()->json(['success' => false, 'message' => 'end_time must be after start_time'], 422);
        }

        $doctorAvailability->update(array_filter([
            'clinic_id' => $validated['clinic_id'] ?? null,
            'day_of_week' => isset($validated['day_of_week']) ? strtolower($validated['day_of_week']) : null,
            'start_time' => $validated['start_time'] ?? null,
            'end_time' => $validated['end_time'] ?? null,
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
