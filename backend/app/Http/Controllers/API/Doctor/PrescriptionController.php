<?php

namespace App\Http\Controllers\API\Doctor;

use App\Http\Controllers\Controller;
use App\Http\Resources\PrescriptionResource;
use App\Models\Appointment;
use App\Models\Prescription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PrescriptionController extends Controller
{
 public function index(Request $request)
    {
        $doctor = $request->user()->doctor;
        abort_unless($doctor, 403);

        $prescriptions = Prescription::where('doctor_id', $doctor->id)
            ->latest('issued_at')
            ->paginate((int) $request->integer('per_page', 15));

        return PrescriptionResource::collection($prescriptions);
    }

    public function show(Prescription $prescription, Request $request)
    {
        $doctor = $request->user()->doctor;
        abort_unless($doctor && $prescription->doctor_id === $doctor->id, 403);

        return new PrescriptionResource($prescription);
    }

public function indexForAppointment(Request $request, Appointment $appointment)
{
    $doctor = $request->user()->doctor;
    abort_unless($doctor && $appointment->doctor_id === $doctor->id, 403);

    $query = Prescription::where('doctor_id', $doctor->id)
        ->where('patient_id', $appointment->patient_id)
        ->where('appointment_id', $appointment->id)
        ->latest('issued_at');

    $perPage = (int) $request->integer('per_page', 50);

    return PrescriptionResource::collection(
        $query->paginate($perPage)
    );
}

public function store(Request $request, Appointment $appointment)
{
    $doctor = $request->user()->doctor;
    abort_unless($doctor && $appointment->doctor_id === $doctor->id, 403);

    $validated = $request->validate([
        'name'     => ['required', 'string', 'max:255'],
        'file_url' => ['nullable', 'string', 'max:1000'],
        'file'     => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png,webp', 'max:5120'],
    ]);

    $fileUrl = $validated['file_url'] ?? null;

    if ($request->hasFile('file')) {
        $path = $request->file('file')->store('prescriptions', 'public');
        $fileUrl = Storage::disk('public')->url($path);
    }

    $prescription = Prescription::create([
        'appointment_id' => $appointment->id,
        'patient_id'     => $appointment->patient_id,
        'doctor_id'      => $doctor->id,
        'name'           => $validated['name'],
        'issued_at'      => now(),
        'file_url'       => $fileUrl,
    ]);

    return new PrescriptionResource($prescription);
}

public function update(Request $request, Prescription $prescription)
{
    $doctor = $request->user()->doctor;
    abort_unless($doctor && $prescription->doctor_id === $doctor->id, 403);

    $validated = $request->validate([
        'name'     => ['required', 'string', 'max:255'],
        'file_url' => ['nullable', 'string', 'max:1000'],
        'file'     => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png,webp', 'max:5120'],
    ]);

    $fileUrl = $validated['file_url'] ?? $prescription->file_url;

    if ($request->hasFile('file')) {
        $path = $request->file('file')->store('prescriptions', 'public');
        $fileUrl = Storage::disk('public')->url($path);
    }

    $prescription->update([
        'name'      => $validated['name'],
        'file_url'  => $fileUrl,
        'issued_at' => $prescription->issued_at ?? now(),
    ]);

    return new PrescriptionResource($prescription->fresh());
}

public function destroy(Request $request, Prescription $prescription)
{
    $doctor = $request->user()->doctor;
    abort_unless($doctor && $prescription->doctor_id === $doctor->id, 403);

    $prescription->delete();

    return response()->json(['success' => true]);
}


}
