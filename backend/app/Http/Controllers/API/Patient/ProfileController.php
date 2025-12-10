<?php

namespace App\Http\Controllers\API\Patient;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ProfileController extends Controller
{
    public function show()
    {
        $user = Auth::user();
        [$first, $last] = $this->splitName($user->name);

        $patient = Patient::firstOrCreate(
            ['user_id' => $user->id],
            [
                'first_name' => $first,
                'last_name' => $last,
                'email' => $user->email,
            ]
        );

        return response()->json([
            'success' => true,
            'data' => $patient,
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'dob' => 'nullable|date',
            'phone' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'blood_group' => 'nullable|string|max:10',
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'state' => 'nullable|string|max:255',
            'country' => 'nullable|string|max:255',
            'pincode' => 'nullable|string|max:50',
        ]);

        $patient = Patient::firstOrCreate(['user_id' => Auth::id()], [
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'email' => $data['email'] ?? null,
        ]);
        $patient->fill($data);
        $patient->save();

        if ($patient->user) {
            $patient->user->name = trim($patient->first_name . ' ' . $patient->last_name);
            if (!empty($data['email'])) {
                $patient->user->email = $data['email'];
            }
            $patient->user->save();
        }

        return response()->json([
            'success' => true,
            'message' => 'Profile updated',
            'data' => $patient,
        ]);
    }

    private function splitName(string $name): array
    {
        $parts = array_values(array_filter(explode(' ', $name)));
        $first = $parts[0] ?? $name;
        $last = isset($parts[1]) ? implode(' ', array_slice($parts, 1)) : $first;
        return [$first, $last];
    }
}
