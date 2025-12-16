<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Models\Specialty;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SpecialtyController extends Controller
{
    public function index()
    {
        return response()->json(['data' => Specialty::all()]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:specialties,name'],
            'description' => ['nullable', 'string'],
        ]);

        $specialty = Specialty::create($validated);

        return response()->json(['data' => $specialty], 201);
    }

    public function show(Specialty $specialty)
    {
        return response()->json(['data' => $specialty]);
    }

    public function update(Request $request, Specialty $specialty)
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255', Rule::unique('specialties', 'name')->ignore($specialty->id)],
            'description' => ['nullable', 'string'],
        ]);

        $specialty->update($validated);

        return response()->json(['data' => $specialty]);
    }

    public function destroy(Specialty $specialty)
    {
        $specialty->delete();

        return response()->json(['message' => 'Specialty deleted']);
    }
}
