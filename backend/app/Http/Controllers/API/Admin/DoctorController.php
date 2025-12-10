<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\DoctorResource;
use App\Models\Doctor;
use Illuminate\Http\Request;

class DoctorController extends Controller
{
    public function index()
    {
        return DoctorResource::collection(Doctor::paginate(25));
    }

    public function show(Doctor $doctor)
    {
        return new DoctorResource($doctor);
    }

    public function update(Request $request, Doctor $doctor)
    {
        return response()->json(['message' => 'Update doctor stub']);
    }
}
