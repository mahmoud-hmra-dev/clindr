<?php

namespace App\Http\Controllers\API\Doctor;

use App\Http\Controllers\Controller;
use App\Http\Resources\MedicalRecordResource;
use App\Models\Appointment;
use App\Models\MedicalRecord;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;


class MedicalRecordController extends Controller
{

    public function index(Request $request, Appointment $appointment)
{
    $doctor = $request->user()->doctor;
    abort_unless($doctor && $appointment->doctor_id === $doctor->id, 403);

    $query = MedicalRecord::query()
        ->where('doctor_id', $doctor->id)
        ->where('patient_id', $appointment->patient_id)
        ->where('appointment_id', $appointment->id)
        ->latest('recorded_at');

    // لو حاب ترجع Paginated
    $perPage = (int) $request->integer('per_page', 50);

    return MedicalRecordResource::collection(
        $query->paginate($perPage)
    );
}

 public function store(Request $request, Appointment $appointment)
    {
        $doctor = $request->user()->doctor;
        abort_unless($doctor && $appointment->doctor_id === $doctor->id, 403);

        $validated = $request->validate([
            'record_type' => ['required', 'string', 'max:100'],
            'title'       => ['required', 'string', 'max:255'],
            'comments'    => ['nullable', 'string'],
            'file_url'    => ['nullable', 'string', 'max:1000'], // لو حاب تبقيها
            'file'        => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png,png,webp', 'max:5120'],
        ]);

        // 👇 تحديد رابط الملف
        $fileUrl = $validated['file_url'] ?? null;

        if ($request->hasFile('file')) {
            $path = $request->file('file')->store('medical_records', 'public');
            $fileUrl = Storage::disk('public')->url($path);
        }

        $record = MedicalRecord::create([
            'patient_id'    => $appointment->patient_id,
            'dependent_id'  => null,
            'doctor_id'     => $doctor->id,
            'appointment_id'=> $appointment->id,
            'record_type'   => $validated['record_type'],
            'title'         => $validated['title'],
            'recorded_at'   => now(),
            'comments'      => $validated['comments'] ?? null,
            'file_url'      => $fileUrl,
        ]);

        return new MedicalRecordResource($record);
    }

    public function update(Request $request, MedicalRecord $medicalRecord)
{
    $doctor = $request->user()->doctor;
    abort_unless($doctor && $medicalRecord->doctor_id === $doctor->id, 403);

    $validated = $request->validate([
        'record_type' => ['required', 'string', 'max:100'],
        'title'       => ['required', 'string', 'max:255'],
        'comments'    => ['nullable', 'string'],
        'file_url'    => ['nullable', 'string', 'max:1000'],
        'file'        => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png,webp', 'max:5120'],
    ]);

    $fileUrl = $validated['file_url'] ?? $medicalRecord->file_url;

    if ($request->hasFile('file')) {
        // اختياري: حذف القديم
        if ($medicalRecord->file_url) {
            // لو تخزن path بديسك، عدّل حسب اللوجيك عندك
        }
        $path = $request->file('file')->store('medical_records', 'public');
        $fileUrl = Storage::disk('public')->url($path);
    }

    $medicalRecord->update([
        'record_type'  => $validated['record_type'],
        'title'        => $validated['title'],
        'comments'     => $validated['comments'] ?? null,
        'file_url'     => $fileUrl,
    ]);

    return new MedicalRecordResource($medicalRecord->fresh());
}

public function destroy(Request $request, MedicalRecord $medicalRecord)
{
    $doctor = $request->user()->doctor;
    abort_unless($doctor && $medicalRecord->doctor_id === $doctor->id, 403);

    $medicalRecord->delete();

    return response()->json(['success' => true]);
}

}
