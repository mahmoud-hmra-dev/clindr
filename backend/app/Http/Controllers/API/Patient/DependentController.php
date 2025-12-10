<?php

namespace App\Http\Controllers\API\Patient;

use App\Http\Controllers\Controller;
use App\Http\Resources\DependentResource;
use App\Models\Dependent;
use Illuminate\Http\Request;

class DependentController extends Controller
{
    public function index(Request $request)
    {
        $dependents = Dependent::query()
            ->where('patient_id', $request->user()->patient?->id)
            ->get();

        return DependentResource::collection($dependents);
    }

    public function store(Request $request)
    {
        $patient = $request->user()->patient;
        abort_unless($patient, 403);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'gender' => ['nullable', 'string', 'max:20'],
            'relationship' => ['nullable', 'string', 'max:50'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'blood_group' => ['nullable', 'string', 'max:10'],
            'dob' => ['nullable', 'date'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $dependent = Dependent::create(array_merge($validated, ['patient_id' => $patient->id]));

        return (new DependentResource($dependent))->response()->setStatusCode(201);
    }

    public function show(Dependent $dependent)
    {
        $patient = request()->user()->patient;
        abort_unless($patient && $dependent->patient_id === $patient->id, 403);

        return new DependentResource($dependent);
    }

    public function update(Request $request, Dependent $dependent)
    {
        $patient = $request->user()->patient;
        abort_unless($patient && $dependent->patient_id === $patient->id, 403);

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'gender' => ['nullable', 'string', 'max:20'],
            'relationship' => ['nullable', 'string', 'max:50'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'blood_group' => ['nullable', 'string', 'max:10'],
            'dob' => ['nullable', 'date'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $dependent->update($validated);

        return new DependentResource($dependent->fresh());
    }

    public function destroy(Dependent $dependent)
    {
        $patient = request()->user()->patient;
        abort_unless($patient && $dependent->patient_id === $patient->id, 403);

        $dependent->delete();

        return response()->json(['success' => true]);
    }
}
