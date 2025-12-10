<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index()
    {
        return response()->json(['data' => User::paginate(25)]);
    }

    public function store(Request $request)
    {
        return response()->json(['message' => 'Create user stub'], 201);
    }

    public function show(User $user)
    {
        return response()->json(['data' => $user]);
    }

    public function update(Request $request, User $user)
    {
        return response()->json(['message' => 'Update user stub']);
    }

    public function destroy(User $user)
    {
        return response()->json(['message' => 'Delete user stub']);
    }
}
