<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    // Get all users
    public function index()
    {
        $users = User::orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $users
        ]);
    }

    // Create user
    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|string|max:255|unique:users,user_id',
            'user_name' => 'required|string|max:255',
            'user_email' => 'required|email|max:255|unique:users,user_email',
            'user_password' => 'required|string|min:6',
            'department_id' => 'nullable|integer',
            'user_role' => 'required|string|max:50',
            'user_status' => 'nullable|string|max:50',
        ]);

        $validated['user_password'] = Hash::make(
            $validated['user_password']
        );

        $user = User::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'User created successfully',
            'data' => $user
        ], 201);
    }

    // Get single user
    public function show($id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $user
        ]);
    }

    // Update user
    public function update(Request $request, $id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        }

        $validated = $request->validate([
            'user_id' => 'required|string|max:255|unique:users,user_id,' . $id,
            'user_name' => 'required|string|max:255',
            'user_email' => 'required|email|max:255|unique:users,user_email,' . $id,
            'user_password' => 'nullable|string|min:6',
            'department_id' => 'nullable|integer',
            'user_role' => 'required|string|max:50',
            'user_status' => 'nullable|string|max:50',
        ]);

        if (!empty($validated['user_password'])) {
            $validated['user_password'] = Hash::make(
                $validated['user_password']
            );
        } else {
            unset($validated['user_password']);
        }

        $user->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'User updated successfully',
            'data' => $user
        ]);
    }

    // Delete user
    public function destroy($id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'User deleted successfully'
        ]);
    }
}