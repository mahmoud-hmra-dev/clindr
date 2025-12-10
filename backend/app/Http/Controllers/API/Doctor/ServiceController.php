<?php

namespace App\Http\Controllers\API\Doctor;

use App\Http\Controllers\Controller;
use App\Http\Resources\DoctorServiceResource;
use App\Models\DoctorService;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    public function index(Request $request)
    {
        $doctor = $request->user()->doctor;
        abort_unless($doctor, 403);

        $services = DoctorService::where('doctor_id', $doctor->id)->get();

        return DoctorServiceResource::collection($services);
    }

    public function store(Request $request)
    {
        $doctor = $request->user()->doctor;
        abort_unless($doctor, 403);

        $validated = $request->validate([
            'specialty_id' => ['required', 'exists:specialties,id'],
            'name' => ['required', 'string', 'max:255'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'description' => ['nullable', 'string'],
        ]);

        $service = DoctorService::create([
            'doctor_id' => $doctor->id,
            'specialty_id' => $validated['specialty_id'],
            'name' => $validated['name'],
            'price' => $validated['price'] ?? null,
            'description' => $validated['description'] ?? null,
        ]);

        return new DoctorServiceResource($service);
    }

    public function update(Request $request, DoctorService $service)
    {
        $doctor = $request->user()->doctor;
        abort_unless($doctor && $service->doctor_id === $doctor->id, 403);

        $validated = $request->validate([
            'specialty_id' => ['sometimes', 'required', 'exists:specialties,id'],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'description' => ['nullable', 'string'],
        ]);

        $service->update($validated);

        return new DoctorServiceResource($service->fresh());
    }

    public function destroy(Request $request, DoctorService $service)
    {
        $doctor = $request->user()->doctor;
        abort_unless($doctor && $service->doctor_id === $doctor->id, 403);

        $service->delete();

        return response()->json(['success' => true]);
    }
}
