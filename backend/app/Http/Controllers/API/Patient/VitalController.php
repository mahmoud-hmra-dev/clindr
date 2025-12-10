<?php

namespace App\Http\Controllers\API\Patient;

use App\Http\Controllers\Controller;
use App\Http\Resources\VitalResource;
use App\Models\Vital;
use Illuminate\Http\Request;

class VitalController extends Controller
{
    public function index(Request $request)
    {
        $vitals = Vital::query()
            ->where('patient_id', $request->user()->patient?->id)
            ->latest('recorded_at')
            ->paginate(15);

        return VitalResource::collection($vitals);
    }

    public function store(Request $request)
    {
        $patient = $request->user()->patient;
        abort_unless($patient, 403);

        $validated = $request->validate([
            'dependent_id' => ['nullable', 'exists:dependents,id'],
            'blood_pressure' => ['nullable', 'string', 'max:30'],
            'heart_rate' => ['nullable', 'integer', 'min:0'],
            'glucose_level' => ['nullable', 'string', 'max:30'],
            'body_temperature' => ['nullable', 'string', 'max:30'],
            'bmi' => ['nullable', 'numeric', 'min:0'],
            'spo2' => ['nullable', 'integer', 'min:0', 'max:100'],
            'weight' => ['nullable', 'numeric', 'min:0'],
            'fbc_status' => ['nullable', 'string', 'max:50'],
            'recorded_at' => ['nullable', 'date'],
        ]);

        if (! empty($validated['dependent_id'])) {
            abort_unless($patient->dependents()->where('id', $validated['dependent_id'])->exists(), 403);
        }

        $vital = Vital::create(array_merge($validated, [
            'patient_id' => $patient->id,
            'recorded_by' => $request->user()->id,
        ]));

        return (new VitalResource($vital))->response()->setStatusCode(201);
    }

    public function show(Vital $vital)
    {
        $patient = request()->user()->patient;
        abort_unless($patient && $vital->patient_id === $patient->id, 403);

        return new VitalResource($vital);
    }

    public function update(Request $request, Vital $vital)
    {
        $patient = $request->user()->patient;
        abort_unless($patient && $vital->patient_id === $patient->id, 403);

        $validated = $request->validate([
            'dependent_id' => ['nullable', 'exists:dependents,id'],
            'blood_pressure' => ['nullable', 'string', 'max:30'],
            'heart_rate' => ['nullable', 'integer', 'min:0'],
            'glucose_level' => ['nullable', 'string', 'max:30'],
            'body_temperature' => ['nullable', 'string', 'max:30'],
            'bmi' => ['nullable', 'numeric', 'min:0'],
            'spo2' => ['nullable', 'integer', 'min:0', 'max:100'],
            'weight' => ['nullable', 'numeric', 'min:0'],
            'fbc_status' => ['nullable', 'string', 'max:50'],
            'recorded_at' => ['nullable', 'date'],
        ]);

        if (! empty($validated['dependent_id'])) {
            abort_unless($patient->dependents()->where('id', $validated['dependent_id'])->exists(), 403);
        }

        $vital->update(array_merge($validated, ['recorded_by' => $request->user()->id]));

        return new VitalResource($vital->fresh());
    }

    public function destroy(Vital $vital)
    {
        $patient = request()->user()->patient;
        abort_unless($patient && $vital->patient_id === $patient->id, 403);

        $vital->delete();

        return response()->json(['success' => true]);
    }
}
