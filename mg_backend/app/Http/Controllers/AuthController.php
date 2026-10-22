<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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

        $username = $validated['username'];
        $adminLookup = DB::table('admins')
            ->selectRaw("0 AS account_priority, 'admin' AS account_type, id, NULL AS user_id, username, email, password AS password_hash, full_name, 'Admin' AS role, '[]' AS permissions")
            ->where(fn ($query) => $query->where('username', $username)->orWhere('email', $username));
        $userLookup = DB::table('users')
            ->selectRaw("1 AS account_priority, 'user' AS account_type, id, user_id, user_name AS username, user_email AS email, user_password AS password_hash, NULL AS full_name, user_role AS role, CAST(permissions AS VARCHAR) AS permissions")
            ->where(fn ($query) => $query->where('user_name', $username)->orWhere('user_email', $username));

        foreach ($adminLookup->unionAll($userLookup)->orderBy('account_priority')->get() as $account) {
            if (! Hash::check($validated['password'], $account->password_hash)) {
                continue;
            }

            if ($account->account_type === 'admin') {
                $admin = (new Admin)->newFromBuilder(['id' => $account->id]);
                $token = $admin->createToken('auth-token')->plainTextToken;

                return response()->json([
                    'success' => true,
                    'type' => 'admin',
                    'user' => [
                        'id' => (string) $admin->id,
                        'username' => $account->username,
                        'name' => $account->full_name,
                        'email' => $account->email,
                        'role' => 'Admin',
                        'permissions' => ['*'],
                    ],
                    'token' => $token,
                ]);
            }

            $user = (new User)->newFromBuilder([
                'id' => $account->id,
                'user_id' => $account->user_id,
                'user_name' => $account->username,
                'user_email' => $account->email,
                'user_password' => $account->password_hash,
                'user_role' => $account->role,
                'permissions' => $account->permissions,
            ]);
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
                ],
                'token' => $token,
            ], 200);
        }

        throw ValidationException::withMessages([
            'username' => ['The provided credentials are incorrect.'],
        ]);
    }

    /**
     * Get current authenticated user
     */
    public function me(Request $request)
    {
        $user = $request->user('sanctum');

        if (! $user instanceof User) {
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
