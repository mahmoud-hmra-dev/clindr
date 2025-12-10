<?php

namespace App\Http\Controllers\API\Doctor;

use App\Http\Controllers\Controller;
use App\Http\Resources\AppointmentResource;
use App\Models\Appointment;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

class AppointmentController extends Controller
{
public function index(Request $request)
{
    $doctor = $request->user()->doctor;
    abort_unless($doctor, 403);

    $query = Appointment::query()
        ->with(['patient.user', 'invoice']) // 🔹 رجّع المريض + الفاتورة
        ->where('doctor_id', $doctor->id);

    if ($request->filled('status')) {
        $status = $request->string('status')->lower()->toString();
        $query->where('status', $status);
    }

    if ($request->filled('appointment_type')) {
        $appointmentType = $request->string('appointment_type')->lower()->toString();
        $query->where('appointment_type', $appointmentType);
    }

    if ($request->filled('visit_type')) {
        $visitType = $request->string('visit_type')->lower()->toString();
        $query->where('visit_type', $visitType);
    }

    if ($from = $request->date('from')) {
        $query->where('scheduled_at', '>=', Carbon::parse($from)->startOfDay());
    }

    if ($to = $request->date('to')) {
        $query->where('scheduled_at', '<=', Carbon::parse($to)->endOfDay());
    }

    $perPage = (int) $request->integer('per_page', 50);
    $appointments = $query->latest('scheduled_at')->paginate($perPage);

    return AppointmentResource::collection($appointments);
}

public function show(Appointment $appointment)
{
    $doctor = request()->user()->doctor;
    abort_unless($doctor && $appointment->doctor_id === $doctor->id, 403);

        $appointment->load([
            'patient.user',
            'invoice',
            'prescriptions',
            'medicalRecords',
        ]);


    return new AppointmentResource($appointment);
}


    public function updateStatus(Request $request, Appointment $appointment)
    {
        $doctor = $request->user()->doctor;
        abort_unless($doctor && $appointment->doctor_id === $doctor->id, 403);

        $validated = $request->validate([
            'status' => ['required', Rule::in(['confirmed', 'completed', 'no_show', 'cancelled' , 'rescheduled' , 'pending'])],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $appointment->status = $validated['status'];
        if (! empty($validated['notes'])) {
            $appointment->notes = $validated['notes'];
        }
        $appointment->save();
             $appointment->load([
            'patient.user',
            'invoice',
            'prescriptions',
            'medicalRecords',
        ]);

        return new AppointmentResource($appointment->fresh());
    }
}
