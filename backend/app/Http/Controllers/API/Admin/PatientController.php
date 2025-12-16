<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\PatientResource;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class PatientController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->integer('per_page', 25);

        $query = Patient::query()->with('user');
        if ($request->filled('city')) {
            $query->where('city', 'like', '%' . $request->string('city') . '%');
        }

        return PatientResource::collection($query->paginate($perPage));
    }

    public function show(Patient $patient)
    {
        return new PatientResource($patient->loadMissing('user'));
    }

    public function update(Request $request, Patient $patient)
    {
        $validated = $request->validate([
            'first_name' => ['sometimes', 'string', 'max:255'],
            'last_name' => ['sometimes', 'string', 'max:255'],
            'dob' => ['nullable', 'date'],
            'blood_group' => ['nullable', 'string', 'max:10'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', Rule::unique('users', 'email')->ignore($patient->user_id)],
            'address' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'state' => ['nullable', 'string', 'max:255'],
            'country' => ['nullable', 'string', 'max:255'],
            'pincode' => ['nullable', 'string', 'max:20'],
            'password' => ['nullable', 'string', 'min:8'],
        ]);

        DB::transaction(function () use ($validated, $patient) {
            if (! empty($validated['email']) || ! empty($validated['password']) || ! empty($validated['first_name']) || ! empty($validated['last_name'])) {
                $patient->user?->update([
                    'name' => trim(($validated['first_name'] ?? $patient->first_name) . ' ' . ($validated['last_name'] ?? $patient->last_name)),
                    'email' => $validated['email'] ?? $patient->user?->email,
                    'password' => ! empty($validated['password'])
                        ? Hash::make($validated['password'])
                        : $patient->user?->password,
                    'role' => 'patient',
                ]);
            }

            $patient->update([
                'first_name' => $validated['first_name'] ?? $patient->first_name,
                'last_name' => $validated['last_name'] ?? $patient->last_name,
                'dob' => $validated['dob'] ?? $patient->dob,
                'blood_group' => $validated['blood_group'] ?? $patient->blood_group,
                'phone' => $validated['phone'] ?? $patient->phone,
                'email' => $validated['email'] ?? $patient->email,
                'address' => $validated['address'] ?? $patient->address,
                'city' => $validated['city'] ?? $patient->city,
                'state' => $validated['state'] ?? $patient->state,
                'country' => $validated['country'] ?? $patient->country,
                'pincode' => $validated['pincode'] ?? $patient->pincode,
            ]);
        });

        return new PatientResource($patient->fresh()->loadMissing('user'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'dob' => ['nullable', 'date'],
            'blood_group' => ['nullable', 'string', 'max:10'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'address' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'state' => ['nullable', 'string', 'max:255'],
            'country' => ['nullable', 'string', 'max:255'],
            'pincode' => ['nullable', 'string', 'max:20'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $patient = DB::transaction(function () use ($validated) {
            $user = User::create([
                'name' => trim($validated['first_name'] . ' ' . $validated['last_name']),
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => 'patient',
            ]);
            $user->assignRole('patient');

            return Patient::create([
                'user_id' => $user->id,
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'dob' => $validated['dob'] ?? null,
                'blood_group' => $validated['blood_group'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'email' => $validated['email'],
                'address' => $validated['address'] ?? null,
                'city' => $validated['city'] ?? null,
                'state' => $validated['state'] ?? null,
                'country' => $validated['country'] ?? null,
                'pincode' => $validated['pincode'] ?? null,
            ]);
        });

        return (new PatientResource($patient->loadMissing('user')))->response()->setStatusCode(201);
    }

    public function destroy(Patient $patient)
    {
        DB::transaction(function () use ($patient) {
            $user = $patient->user;
            $patient->delete();
            $user?->delete();
        });

        return response()->json(['message' => 'Patient deleted']);
    }
}
