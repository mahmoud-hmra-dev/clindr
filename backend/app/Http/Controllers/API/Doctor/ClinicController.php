<?php

namespace App\Http\Controllers\API\Doctor;

use App\Http\Controllers\Controller;
use App\Http\Resources\ClinicResource;
use App\Models\Clinic;
use Illuminate\Http\Request;

class ClinicController extends Controller
{
    public function index(Request $request)
    {
        $doctor = $request->user()->doctor;
        abort_unless($doctor, 403);

        $clinics = Clinic::where('doctor_id', $doctor->id)->get();

        return ClinicResource::collection($clinics);
    }

    public function store(Request $request)
    {
        $doctor = $request->user()->doctor;
        abort_unless($doctor, 403);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'city' => ['nullable', 'string', 'max:255'],
            'image_url' => ['nullable', 'string', 'max:500'],
            'fee_amount' => ['nullable', 'numeric', 'min:0'],
        ]);

        $clinic = Clinic::create(array_merge($validated, ['doctor_id' => $doctor->id]));

        return new ClinicResource($clinic);
    }

    public function update(Request $request, Clinic $clinic)
    {
        $doctor = $request->user()->doctor;
        abort_unless($doctor && $clinic->doctor_id === $doctor->id, 403);

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'city' => ['nullable', 'string', 'max:255'],
            'image_url' => ['nullable', 'string', 'max:500'],
            'fee_amount' => ['nullable', 'numeric', 'min:0'],
        ]);

        $clinic->update($validated);

        return new ClinicResource($clinic->fresh());
    }

    public function destroy(Request $request, Clinic $clinic)
    {
        $doctor = $request->user()->doctor;
        abort_unless($doctor && $clinic->doctor_id === $doctor->id, 403);

        $clinic->delete();

        return response()->json(['success' => true]);
    }
}
