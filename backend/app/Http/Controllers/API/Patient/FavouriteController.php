<?php

namespace App\Http\Controllers\API\Patient;

use App\Http\Controllers\Controller;
use App\Http\Resources\DoctorResource;
use App\Models\Favourite;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FavouriteController extends Controller
{
    public function index(Request $request)
    {
        $patient = $request->user()->patient;
        abort_unless($patient, 403);

        $favs = Favourite::with([
                'doctor.services.specialty',
                'doctor.clinics',
                'doctor.availabilities',
            ])
            ->where('patient_id', $patient->id)
            ->get();

        $doctors = $favs->map(function ($fav) {
            return $fav->doctor;
        })->filter();

        return DoctorResource::collection($doctors);
    }

    public function store(Request $request)
    {
        $patient = $request->user()->patient;
        abort_unless($patient, 403);

        $validated = $request->validate([
            'doctor_id' => ['required', 'exists:doctors,id'],
        ]);

        $fav = Favourite::firstOrCreate([
            'patient_id' => $patient->id,
            'doctor_id' => $validated['doctor_id'],
        ]);

        return response()->json(['success' => true, 'data' => $fav], 201);
    }

    public function destroy(Request $request, int $id)
    {
        $patient = $request->user()->patient;
        abort_unless($patient, 403);

        $fav = Favourite::where('patient_id', $patient->id)->where('doctor_id', $id)->first();
        if (! $fav) {
            return response()->json(['success' => false, 'message' => 'Favourite not found'], 404);
        }

        $fav->delete();

        return response()->json(['success' => true]);
    }
}
