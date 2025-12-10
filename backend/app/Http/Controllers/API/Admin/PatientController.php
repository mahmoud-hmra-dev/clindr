<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\PatientResource;
use App\Models\Patient;
use Illuminate\Http\Request;

class PatientController extends Controller
{
    public function index()
    {
        return PatientResource::collection(Patient::paginate(25));
    }

    public function show(Patient $patient)
    {
        return new PatientResource($patient);
    }

    public function update(Request $request, Patient $patient)
    {
        return response()->json(['message' => 'Update patient stub']);
    }
}
