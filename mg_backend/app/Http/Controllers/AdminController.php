<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\User;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    /**
     * Get all users
     */
    public function getAllUsers()
    {
        return response()->json(User::all(), 200);
    }

    /**
     * Create a new user
     */
    public function createUser(Request $request)
    {
        $validated = $request->validate([
            'user_name' => 'required|string|max:255',
            'user_email' => 'required|email|unique:users',
            'user_password' => 'required|string|min:8',
            'department_id' => 'nullable|integer',
            'user_role' => 'nullable|string',
            'user_status' => 'nullable|string',
        ]);

        $user = User::create($validated);

        return response()->json([
            'message' => 'User created successfully',
            'user' => $user
        ], 201);
    }

    /**
     * Update user information
     */
    public function updateUser(Request $request, $userId)
    {
        $user = User::find($userId);

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $validated = $request->validate([
            'user_name' => 'nullable|string|max:255',
            'user_email' => 'nullable|email|unique:users,user_email,' . $userId,
            'user_password' => 'nullable|string|min:8',
            'department_id' => 'nullable|integer',
            'user_role' => 'nullable|string',
            'user_status' => 'nullable|string',
        ]);

        $user->update(array_filter($validated));

        return response()->json([
            'message' => 'User updated successfully',
            'user' => $user
        ], 200);
    }

    /**
     * Delete a user
     */
    public function deleteUser($userId)
    {
        $user = User::find($userId);

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted successfully'], 200);
    }
}
