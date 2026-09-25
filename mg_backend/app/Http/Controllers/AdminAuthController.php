<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\User;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AdminAuthController extends Controller
{
    /**
     * Admin login - only admin can login here
     */
    public function login(Request $request)
    {
        $validated = $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        // Find admin by username or email
        $admin = Admin::where('username', $validated['username'])
            ->orWhere('email', $validated['username'])
            ->first();

        // Check if admin exists and password is correct
        if (!$admin || !Hash::check($validated['password'], $admin->password)) {
            throw ValidationException::withMessages([
                'username' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Generate API token for admin
        $token = $admin->createToken('admin-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'type' => 'admin',
            'user' => [
                'id' => $admin->id,
                'name' => $admin->full_name,
                'username' => $admin->username,
                'email' => $admin->email,
                'role' => 'Admin',
            ],
            'token' => $token,
        ], 200);
    }

    /**
     * Get current authenticated admin
     */
    public function me(Request $request)
    {
        // Get the authenticated model (could be Admin or User)
        $admin = $request->user('sanctum');

        // Check if it's actually an admin
        if (!$admin instanceof Admin) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 401);
        }

        return response()->json([
            'success' => true,
            'type' => 'admin',
            'data' => [
                'id' => $admin->id,
                'name' => $admin->full_name,
                'username' => $admin->username,
                'email' => $admin->email,
                'role' => 'Admin',
            ],
        ], 200);
    }

    /**
     * Create a new user (Admin only)
     */
    public function createUser(Request $request)
    {
        // Verify the authenticated user is admin
        $admin = $request->user('sanctum');
        if (!$admin instanceof Admin) {
            return response()->json([
                'success' => false,
                'message' => 'Only admins can create users',
            ], 403);
        }

        $validated = $request->validate([
            'user_id' => 'required|string|max:255|unique:users,user_id',
            'user_name' => 'required|string|max:255',
            'user_email' => 'required|email|max:255|unique:users,user_email',
            'user_password' => 'required|string|min:6',
            'department_id' => 'nullable|integer|exists:departments,id',
            'user_role' => 'required|string|max:50|in:Admin,Manager,Employee,Guest,Sub User,Accountant',
            'user_status' => 'nullable|string|max:50|in:Active,Inactive,Suspended',
            'permissions' => 'nullable|array',
        ]);

        // Hash the password
        $validated['user_password'] = Hash::make($validated['user_password']);
        $validated['user_status'] = $validated['user_status'] ?? 'Active';

        try {
            $user = User::create($validated);

            return response()->json([
                'success' => true,
                'message' => 'User created successfully',
                'data' => [
                    'id' => $user->user_id,
                    'username' => $user->user_name,
                    'email' => $user->user_email,
                    'role' => $user->user_role,
                    'status' => $user->user_status,
                    'permissions' => $user->permissions ?? [],
                ],
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create user',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * List all users (Admin only)
     */
    public function listUsers(Request $request)
    {
        // Verify the authenticated user is admin
        $admin = $request->user('sanctum');
        if (!$admin instanceof Admin) {
            return response()->json([
                'success' => false,
                'message' => 'Only admins can view users',
            ], 403);
        }

        $users = User::select('id', 'user_id', 'user_name', 'user_email', 'user_role', 'user_status', 'department_id', 'permissions', 'created_at')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $users,
        ], 200);
    }

    /** Update a user and/or the permissions assigned by an admin. */
    public function updateUser(Request $request, $userId)
    {
        $admin = $request->user('sanctum');
        if (!$admin instanceof Admin) {
            return response()->json(['success' => false, 'message' => 'Only admins can update users'], 403);
        }

        $user = User::where('user_id', $userId)->firstOrFail();
        $validated = $request->validate([
            'user_name' => 'sometimes|string|max:255',
            'user_email' => 'sometimes|email|max:255|unique:users,user_email,' . $user->id,
            'user_password' => 'nullable|string|min:6',
            'user_role' => 'sometimes|string|max:50|in:Admin,Manager,Employee,Guest,Sub User,Accountant',
            'user_status' => 'sometimes|string|max:50|in:Active,Inactive,Suspended',
            'department_id' => 'nullable|integer|exists:departments,id',
            'permissions' => 'sometimes|array',
        ]);

        if (!empty($validated['user_password'])) {
            $validated['user_password'] = Hash::make($validated['user_password']);
        } else {
            unset($validated['user_password']);
        }

        $user->update($validated);

        return response()->json(['success' => true, 'data' => $user->fresh()]);
    }

    /**
     * Delete a user (Admin only)
     */
    public function deleteUser(Request $request, $userId)
    {
        // Verify the authenticated user is admin
        $admin = $request->user('sanctum');
        if (!$admin instanceof Admin) {
            return response()->json([
                'success' => false,
                'message' => 'Only admins can delete users',
            ], 403);
        }

        $user = User::where('user_id', $userId)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found',
            ], 404);
        }

        // Keep projects when their assigned leader is removed; the leader can be reassigned later.
        DB::transaction(function () use ($user) {
            Project::where('project_leader', $user->id)->update(['project_leader' => null]);
            $user->delete();
        });

        return response()->json([
            'success' => true,
            'message' => 'User deleted successfully',
        ], 200);
    }

    /**
     * Logout (revoke token)
     */
    public function logout(Request $request)
    {
        $request->user('sanctum')?->tokens()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully',
        ], 200);
    }
}
