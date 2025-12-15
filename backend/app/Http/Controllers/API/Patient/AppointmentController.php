<?php

namespace App\Http\Controllers\API\Patient;

use App\Http\Controllers\Controller;
use App\Http\Resources\AppointmentResource;
use App\Models\Appointment;
use App\Models\Clinic;
use App\Models\Doctor;
use App\Models\DoctorAvailability;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;

class AppointmentController extends Controller
{
public function index(Request $request)
{
    $patient = $request->user()->patient;
    abort_unless($patient, 403);

    $query = Appointment::query()
        ->with(['doctor', 'invoice'])
        ->where('patient_id', $patient->id);

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

    $perPage = (int) $request->integer('per_page', 15);
    $appointments = $query->latest('scheduled_at')->paginate($perPage);

    return AppointmentResource::collection($appointments);
}



    public function store(Request $request)
    {
        $patient = $request->user()->patient;
        abort_unless($patient, 403);

        $validated = $request->validate([
            'doctor_id' => ['required', 'exists:doctors,id'],
            'appointment_type' => ['required', Rule::in(['in_clinic', 'online'])],
            'visit_type' => ['required'],
            'scheduled_at' => ['required', 'date'],
            'duration_minutes' => ['nullable', 'integer', 'min:10', 'max:240'],
            'reason' => ['nullable', 'string', 'max:1000'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'clinic_id' => ['nullable', 'exists:clinics,id'],
            'online_meeting_url' => ['nullable', 'url'],


        ]);

        $doctor = Doctor::findOrFail($validated['doctor_id']);
        $clinic = null;
        if ($validated['appointment_type'] === 'in_clinic') {
            if (empty($validated['clinic_id'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Clinic is required for in-clinic appointments.',
                ], 422);
            }
            $clinic = Clinic::where('doctor_id', $doctor->id)->findOrFail($validated['clinic_id']);
        }

        $scheduledAt = Carbon::parse($validated['scheduled_at']);
        if ($scheduledAt->isPast()) {
            return response()->json([
                'success' => false,
                'message' => 'Scheduled time must be in the future.',
            ], 422);
        }

        $appointmentEnd = (clone $scheduledAt)->addMinutes($validated['duration_minutes'] ?? 30);
        $availabilityType = $validated['appointment_type'] === 'in_clinic' ? 'clinic' : 'online';
        $hasDateColumn = Schema::hasColumn('doctor_availabilities', 'date');
        $hasTypeColumn = Schema::hasColumn('doctor_availabilities', 'availability_type');

        $availabilities = DoctorAvailability::query()
            ->where('doctor_id', $doctor->id)
            ->when(
                $hasDateColumn,
                fn ($q) => $q->whereDate('date', $scheduledAt->toDateString())
            )
            ->when(
                $hasTypeColumn,
                fn ($q) => $q->where('availability_type', $availabilityType)
            )
            ->when(
                $availabilityType === 'clinic',
                fn ($q) => $q->where(function ($inner) use ($clinic) {
                    $inner->whereNull('clinic_id');
                    if ($clinic) {
                        $inner->orWhere('clinic_id', $clinic->id);
                    }
                })
            )
            ->get();

        if (! $hasDateColumn) {
            $dayKey = strtolower($scheduledAt->englishDayOfWeek);
            $availabilities = $availabilities->filter(fn ($slot) => strtolower((string) $slot->day_of_week) === $dayKey);
        }

        $slotExists = $availabilities->contains(function ($slot) use ($scheduledAt, $appointmentEnd) {
            if (! $slot->start_time) {
                return false;
            }

            $startTime = strlen($slot->start_time) === 5 ? $slot->start_time . ':00' : $slot->start_time;
            $slotStart = Carbon::createFromFormat('Y-m-d H:i:s', $scheduledAt->toDateString() . ' ' . $startTime);
            $endTime = $slot->end_time
                ? (strlen($slot->end_time) === 5 ? $slot->end_time . ':00' : $slot->end_time)
                : Carbon::createFromFormat('H:i:s', $startTime)->addHour()->format('H:i:s');
            $slotEnd = Carbon::createFromFormat('Y-m-d H:i:s', $scheduledAt->toDateString() . ' ' . $endTime);

            return $scheduledAt >= $slotStart && $appointmentEnd <= $slotEnd;
        });

        if (! $slotExists) {
            return response()->json([
                'success' => false,
                'message' => 'Selected slot is not available.',
            ], 422);
        }

        $conflictingBooking = Appointment::where('doctor_id', $doctor->id)
            ->whereDate('scheduled_at', $scheduledAt->toDateString())
            ->whereNotIn('status', ['cancelled'])
            ->get()
            ->contains(function ($appt) use ($scheduledAt, $appointmentEnd) {
                $start = Carbon::parse($appt->scheduled_at);
                $end = (clone $start)->addMinutes($appt->duration_minutes ?? 30);

                return $start < $appointmentEnd && $scheduledAt < $end;
            });

        if ($conflictingBooking) {
            return response()->json([
                'success' => false,
                'message' => 'Time range overlaps another booking.',
            ], 422);
        }

        $appointment = DB::transaction(function () use ($validated, $patient, $doctor, $clinic, $scheduledAt, $request) {
            $appointment = Appointment::create([
                'doctor_id' => $doctor->id,
                'patient_id' => $patient->id,
                'appointment_type' => $validated['appointment_type'],
                'visit_type' => $validated['visit_type'],
                'scheduled_at' => $scheduledAt,
                'duration_minutes' => $validated['duration_minutes'] ?? null,
                'status' => 'pending',
                'reason' => $validated['reason'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'clinic_location' => $clinic?->address,
                'created_by' => $request->user()->id,
                'patient_email' => $patient->email,
                'patient_phone' => $patient->phone,
                'online_meeting_url' => $validated['online_meeting_url'] ?? null,
            ]);

            return $appointment;
        });

        return (new AppointmentResource($appointment->fresh()))
            ->response()
            ->setStatusCode(201);
    }

public function show(Appointment $appointment)
{
    $patient = request()->user()->patient;
    abort_unless($patient && $appointment->patient_id === $patient->id, 403);

    $appointment->load(['doctor', 'invoice']);

    return new AppointmentResource($appointment);
}


    public function cancel(Appointment $appointment, Request $request)
    {
        $patient = $request->user()->patient;
        abort_unless($patient && $appointment->patient_id === $patient->id, 403);

        $request->validate([
            'cancelled_reason' => ['nullable', 'string', 'max:1000'],
        ]);

        if (! in_array($appointment->status, ['pending', 'confirmed'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Appointment cannot be cancelled in its current status.',
            ], 422);
        }

        if ($appointment->scheduled_at && Carbon::parse($appointment->scheduled_at)->isPast()) {
            return response()->json([
                'success' => false,
                'message' => 'Appointment time has passed and cannot be cancelled.',
            ], 422);
        }

        $appointment->status = 'cancelled';
        $appointment->cancelled_by = $request->user()->id;
        $appointment->cancelled_reason = $request->string('cancelled_reason');
        $appointment->save();

        return new AppointmentResource($appointment->fresh());
    }
}
