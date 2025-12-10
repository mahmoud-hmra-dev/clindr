<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Models\Specialty;
use Illuminate\Http\Request;

class SpecialtyController extends Controller
{
    public function index()
    {
        return response()->json(['data' => Specialty::all()]);
    }

    public function store(Request $request)
    {
        return response()->json(['message' => 'Create specialty stub'], 201);
    }

    public function show(Specialty $specialty)
    {
        return response()->json(['data' => $specialty]);
    }

    public function update(Request $request, Specialty $specialty)
    {
        return response()->json(['message' => 'Update specialty stub']);
    }

    public function destroy(Specialty $specialty)
    {
        return response()->json(['message' => 'Delete specialty stub']);
    }
}
