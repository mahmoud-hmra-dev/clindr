<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->integer('per_page', 25);

        return response()->json(['data' => User::paginate($perPage)]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', Rule::in(['admin', 'doctor', 'patient'])],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
        ]);
        $user->assignRole($validated['role']);

        return response()->json(['data' => $user], 201);
    }

    public function show(User $user)
    {
        return response()->json(['data' => $user]);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:8'],
            'role' => ['nullable', Rule::in(['admin', 'doctor', 'patient'])],
        ]);

        $user->update([
            'name' => $validated['name'] ?? $user->name,
            'email' => $validated['email'] ?? $user->email,
            'password' => ! empty($validated['password'])
                ? Hash::make($validated['password'])
                : $user->password,
            'role' => $validated['role'] ?? $user->role,
        ]);

        if (! empty($validated['role'])) {
            $user->syncRoles([$validated['role']]);
        }

        return response()->json(['data' => $user]);
    }

    public function destroy(User $user)
    {
        $user->delete();

        return response()->json(['message' => 'User deleted']);
    }
}
