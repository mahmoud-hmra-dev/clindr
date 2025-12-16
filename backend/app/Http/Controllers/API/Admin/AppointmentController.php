<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\AppointmentResource;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Patient;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

class AppointmentController extends Controller
{
    public function index(Request $request)
    {
        $query = Appointment::query()->with(['doctor', 'patient', 'invoice']);

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('doctor_id')) {
            $query->where('doctor_id', $request->integer('doctor_id'));
        }

        if ($request->filled('patient_id')) {
            $query->where('patient_id', $request->integer('patient_id'));
        }

        if ($from = $request->date('from')) {
            $query->where('scheduled_at', '>=', Carbon::parse($from)->startOfDay());
        }

        if ($to = $request->date('to')) {
            $query->where('scheduled_at', '<=', Carbon::parse($to)->endOfDay());
        }

        $perPage = (int) $request->integer('per_page', 25);

        return AppointmentResource::collection(
            $query->latest('scheduled_at')->paginate($perPage)
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'doctor_id' => ['required', 'exists:doctors,id'],
            'patient_id' => ['required', 'exists:patients,id'],
            'appointment_type' => ['required', Rule::in(['in_clinic', 'online'])],
            'visit_type' => ['nullable', 'string', 'max:50'],
            'scheduled_at' => ['required', 'date'],
            'duration_minutes' => ['nullable', 'integer', 'min:10', 'max:240'],
            'status' => ['nullable', 'string', 'max:30'],
            'reason' => ['nullable', 'string', 'max:1000'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'clinic_location' => ['nullable', 'string', 'max:255'],
            'online_meeting_url' => ['nullable', 'url'],
        ]);

        $doctor = Doctor::findOrFail($validated['doctor_id']);
        $patient = Patient::findOrFail($validated['patient_id']);
        $scheduledAt = Carbon::parse($validated['scheduled_at']);

        $appointment = Appointment::create([
            'doctor_id' => $doctor->id,
            'patient_id' => $patient->id,
            'appointment_type' => $validated['appointment_type'],
            'visit_type' => $validated['visit_type'] ?? null,
            'scheduled_at' => $scheduledAt,
            'duration_minutes' => $validated['duration_minutes'] ?? null,
            'status' => $validated['status'] ?? 'pending',
            'reason' => $validated['reason'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'clinic_location' => $validated['clinic_location'] ?? null,
            'online_meeting_url' => $validated['online_meeting_url'] ?? null,
            'created_by' => $request->user()?->id,
            'patient_email' => $patient->email,
            'patient_phone' => $patient->phone,
        ]);

        return (new AppointmentResource($appointment->load(['doctor', 'patient', 'invoice'])))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Appointment $appointment)
    {
        return new AppointmentResource($appointment->load(['doctor', 'patient', 'invoice']));
    }

    public function update(Request $request, Appointment $appointment)
    {
        $validated = $request->validate([
            'doctor_id' => ['sometimes', 'exists:doctors,id'],
            'patient_id' => ['sometimes', 'exists:patients,id'],
            'appointment_type' => ['sometimes', Rule::in(['in_clinic', 'online'])],
            'visit_type' => ['nullable', 'string', 'max:50'],
            'scheduled_at' => ['sometimes', 'date'],
            'duration_minutes' => ['nullable', 'integer', 'min:10', 'max:240'],
            'status' => ['nullable', 'string', 'max:30'],
            'reason' => ['nullable', 'string', 'max:1000'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'clinic_location' => ['nullable', 'string', 'max:255'],
            'online_meeting_url' => ['nullable', 'url'],
        ]);

        if (isset($validated['doctor_id'])) {
            $appointment->doctor()->associate(Doctor::findOrFail($validated['doctor_id']));
        }

        if (isset($validated['patient_id'])) {
            $patient = Patient::findOrFail($validated['patient_id']);
            $appointment->patient()->associate($patient);
            $appointment->patient_email = $patient->email;
            $appointment->patient_phone = $patient->phone;
        }

        if (isset($validated['scheduled_at'])) {
            $appointment->scheduled_at = Carbon::parse($validated['scheduled_at']);
        }

        $appointment->fill(collect($validated)->except(['doctor_id', 'patient_id', 'scheduled_at'])->toArray());
        $appointment->save();

        return new AppointmentResource($appointment->load(['doctor', 'patient', 'invoice']));
    }

    public function destroy(Appointment $appointment)
    {
        $appointment->delete();

        return response()->json(['message' => 'Appointment deleted']);
    }
}
