<?php

namespace App\Http\Controllers\API\Patient;

use App\Http\Controllers\Controller;
use App\Http\Resources\MedicalRecordResource;
use App\Models\MedicalRecord;
use Illuminate\Http\Request;

class MedicalRecordController extends Controller
{
    public function index(Request $request)
    {
        $records = MedicalRecord::query()
            ->where('patient_id', $request->user()->patient?->id)
            ->latest()
            ->paginate(15);

        return MedicalRecordResource::collection($records);
    }

    public function store(Request $request)
    {
        $patient = $request->user()->patient;
        abort_unless($patient, 403);

        $validated = $request->validate([
            'dependent_id' => ['nullable', 'exists:dependents,id'],
            'doctor_id' => ['nullable', 'exists:doctors,id'],
            'appointment_id' => ['nullable', 'exists:appointments,id'],
            'record_type' => ['required', 'string', 'max:100'],
            'title' => ['required', 'string', 'max:255'],
            'recorded_at' => ['nullable', 'date'],
            'comments' => ['nullable', 'string'],
            'file_url' => ['nullable', 'string', 'max:500'],
        ]);

        if (! empty($validated['dependent_id'])) {
            abort_unless($patient->dependents()->where('id', $validated['dependent_id'])->exists(), 403);
        }

        $record = MedicalRecord::create(array_merge($validated, [
            'patient_id' => $patient->id,
        ]));

        return (new MedicalRecordResource($record))->response()->setStatusCode(201);
    }

    public function show(MedicalRecord $medicalRecord)
    {
        $patient = request()->user()->patient;
        abort_unless($patient && $medicalRecord->patient_id === $patient->id, 403);

        return new MedicalRecordResource($medicalRecord);
    }

    public function update(Request $request, MedicalRecord $medicalRecord)
    {
        $patient = $request->user()->patient;
        abort_unless($patient && $medicalRecord->patient_id === $patient->id, 403);

        $validated = $request->validate([
            'dependent_id' => ['nullable', 'exists:dependents,id'],
            'doctor_id' => ['nullable', 'exists:doctors,id'],
            'appointment_id' => ['nullable', 'exists:appointments,id'],
            'record_type' => ['nullable', 'string', 'max:100'],
            'title' => ['nullable', 'string', 'max:255'],
            'recorded_at' => ['nullable', 'date'],
            'comments' => ['nullable', 'string'],
            'file_url' => ['nullable', 'string', 'max:500'],
        ]);

        if (! empty($validated['dependent_id'])) {
            abort_unless($patient->dependents()->where('id', $validated['dependent_id'])->exists(), 403);
        }

        $medicalRecord->update($validated);

        return new MedicalRecordResource($medicalRecord->fresh());
    }

    public function destroy(MedicalRecord $medicalRecord)
    {
        $patient = request()->user()->patient;
        abort_unless($patient && $medicalRecord->patient_id === $patient->id, 403);

        $medicalRecord->delete();

        return response()->json(['success' => true]);
    }
}
