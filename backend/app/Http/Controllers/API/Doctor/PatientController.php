<?php

namespace App\Http\Controllers\API\Doctor;

use App\Http\Controllers\Controller;
use App\Http\Resources\PatientResource;
use App\Models\Patient;
use Illuminate\Http\Request;

class PatientController extends Controller
{
    public function index(Request $request)
    {
        $doctorId = $request->user()->doctor?->id;

        $patients = Patient::query()
            ->whereHas('appointments', fn ($q) => $q->where('doctor_id', $doctorId))
            ->paginate(15);

        return PatientResource::collection($patients);
    }
}
