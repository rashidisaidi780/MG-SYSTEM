<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
    * Authenticate either the seeded admin or an admin-created user.
     */
    public function login(Request $request)
    {
        $validated = $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        // The same login form accepts either admin or user credentials.
        $admin = Admin::where('username', $validated['username'])
            ->orWhere('email', $validated['username'])
            ->first();

        if ($admin && Hash::check($validated['password'], $admin->password)) {
            $token = $admin->createToken('auth-token')->plainTextToken;

            return response()->json([
                'success' => true,
                'type' => 'admin',
                'user' => [
                    'id' => (string) $admin->id,
                    'username' => $admin->username,
                    'name' => $admin->full_name,
                    'email' => $admin->email,
                    'role' => 'Admin',
                    'permissions' => ['*'],
                ],
                'token' => $token,
            ]);
        }

        $user = User::where('user_name', $validated['username'])
            ->orWhere('user_email', $validated['username'])
            ->first();

        // Check if user exists and password is correct
        if (!$user || !Hash::check($validated['password'], $user->user_password)) {
            throw ValidationException::withMessages([
                'username' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Generate API token for user
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'type' => 'user',
            'user' => [
                'id' => $user->user_id,
                'username' => $user->user_name,
                'email' => $user->user_email,
                'role' => $user->user_role,
                'permissions' => $user->permissions ?? [],
                'permissions' => $user->permissions ?? [],
            ],
            'token' => $token,
        ], 200);
    }

    /**
     * Get current authenticated user
     */
    public function me(Request $request)
    {
        $user = $request->user('sanctum');

        if (!$user instanceof User) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 401);
        }

        return response()->json([
            'success' => true,
            'type' => 'user',
            'data' => [
                'id' => $user->user_id,
                'username' => $user->user_name,
                'email' => $user->user_email,
                'role' => $user->user_role,
            ],
        ], 200);
    }

    /**
     * Logout and revoke token
     */
    public function logout(Request $request)
    {
        // Revoke the token
        $request->user('sanctum')?->tokens()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully',
        ], 200);
    }

    /**
     * Refresh authentication token
     */
    public function refresh(Request $request)
    {
        $user = $request->user('sanctum');

        // Revoke old token
        $request->user('sanctum')?->tokens()->delete();

        // Generate new token
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'token' => $token,
        ], 200);
    }
}
