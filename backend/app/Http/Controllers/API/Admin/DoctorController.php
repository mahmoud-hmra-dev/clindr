<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\DoctorResource;
use App\Models\Doctor;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class DoctorController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->integer('per_page', 25);

        $query = Doctor::query()->with('user');
        if ($request->filled('city')) {
            $query->where('city', 'like', '%' . $request->string('city') . '%');
        }

        return DoctorResource::collection($query->paginate($perPage));
    }

    public function show(Doctor $doctor)
    {
        return new DoctorResource($doctor->loadMissing('user'));
    }

    public function update(Request $request, Doctor $doctor)
    {
        $validated = $request->validate([
            'first_name' => ['sometimes', 'string', 'max:255'],
            'last_name' => ['sometimes', 'string', 'max:255'],
            'display_name' => ['nullable', 'string', 'max:255'],
            'designation' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', Rule::unique('users', 'email')->ignore($doctor->user_id)],
            'languages' => ['nullable', 'array'],
            'default_fee' => ['nullable', 'numeric'],
            'city' => ['nullable', 'string', 'max:255'],
            'country' => ['nullable', 'string', 'max:255'],
            'years_experience' => ['nullable', 'integer'],
            'accepting_new_patients' => ['nullable', 'boolean'],
            'password' => ['nullable', 'string', 'min:8'],
        ]);

        DB::transaction(function () use ($validated, $doctor) {
            if (! empty($validated['email']) || ! empty($validated['password']) || ! empty($validated['first_name']) || ! empty($validated['last_name'])) {
                $doctor->user?->update([
                    'name' => trim(($validated['first_name'] ?? $doctor->first_name) . ' ' . ($validated['last_name'] ?? $doctor->last_name)),
                    'email' => $validated['email'] ?? $doctor->user?->email,
                    'password' => ! empty($validated['password'])
                        ? Hash::make($validated['password'])
                        : $doctor->user?->password,
                    'role' => 'doctor',
                ]);
            }

            $doctor->update([
                'first_name' => $validated['first_name'] ?? $doctor->first_name,
                'last_name' => $validated['last_name'] ?? $doctor->last_name,
                'display_name' => $validated['display_name'] ?? $doctor->display_name ?? trim(($validated['first_name'] ?? $doctor->first_name) . ' ' . ($validated['last_name'] ?? $doctor->last_name)),
                'designation' => $validated['designation'] ?? $doctor->designation,
                'phone' => $validated['phone'] ?? $doctor->phone,
                'email' => $validated['email'] ?? $doctor->email,
                'languages_json' => $validated['languages'] ?? $doctor->languages_json,
                'default_fee' => $validated['default_fee'] ?? $doctor->default_fee,
                'city' => $validated['city'] ?? $doctor->city,
                'country' => $validated['country'] ?? $doctor->country,
                'years_experience' => $validated['years_experience'] ?? $doctor->years_experience,
                'accepting_new_patients' => $validated['accepting_new_patients'] ?? $doctor->accepting_new_patients,
            ]);
        });

        return new DoctorResource($doctor->fresh()->loadMissing('user'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'display_name' => ['nullable', 'string', 'max:255'],
            'designation' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'languages' => ['nullable', 'array'],
            'default_fee' => ['nullable', 'numeric'],
            'city' => ['nullable', 'string', 'max:255'],
            'country' => ['nullable', 'string', 'max:255'],
            'years_experience' => ['nullable', 'integer'],
            'accepting_new_patients' => ['nullable', 'boolean'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $doctor = DB::transaction(function () use ($validated) {
            $user = User::create([
                'name' => trim($validated['first_name'] . ' ' . $validated['last_name']),
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => 'doctor',
            ]);
            $user->assignRole('doctor');

            return Doctor::create([
                'user_id' => $user->id,
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'display_name' => $validated['display_name'] ?? trim($validated['first_name'] . ' ' . $validated['last_name']),
                'designation' => $validated['designation'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'email' => $validated['email'],
                'languages_json' => $validated['languages'] ?? null,
                'default_fee' => $validated['default_fee'] ?? null,
                'city' => $validated['city'] ?? null,
                'country' => $validated['country'] ?? null,
                'years_experience' => $validated['years_experience'] ?? null,
                'accepting_new_patients' => $validated['accepting_new_patients'] ?? true,
            ]);
        });

        return (new DoctorResource($doctor->loadMissing('user')))->response()->setStatusCode(201);
    }

    public function destroy(Doctor $doctor)
    {
        DB::transaction(function () use ($doctor) {
            $user = $doctor->user;
            $doctor->delete();
            $user?->delete();
        });

        return response()->json(['message' => 'Doctor deleted']);
    }
}
