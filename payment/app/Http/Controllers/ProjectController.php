<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Project;
use Illuminate\Support\Str;

class ProjectController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
        $projects = Project::all();
        return response()->json([
            'projects' => $projects
        ]);

    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //

    }

    /**
     * Store a newly created resource in storage.
     */
public function store(Request $request)
{
    $validated = $request->validate([
        'name' => ['required', 'string', 'min:1', 'max:255'],
    ]);

    try {
        $project = Project::create([
            'uuid'   => (string) Str::uuid(),
            'name'   => $validated['name'],
            'status' => 1,
        ]);
    } catch (\Exception $e) {
        \Illuminate\Support\Facades\Log::error('Failed to create project: ' . $e->getMessage());
        return response()->json(['error' => 'Failed to create project'], 500);
    }

    return response()->json(['project' => $project], 201);
}

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
