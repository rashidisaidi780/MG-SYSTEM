<?php

namespace App\Http\Middleware;

use App\Models\Admin;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    public function handle(Request $request, Closure $next, string $area): Response
    {
        $account = $request->user('sanctum');

        if ($account instanceof Admin) {
            return $next($request);
        }

        $permissions = $account?->permissions ?? [];
        $level = $permissions[$area] ?? 'None';
        $isReadRequest = in_array($request->method(), ['GET', 'HEAD'], true);
        $allowed = $isReadRequest
            ? in_array($level, ['View', 'Edit', 'Both'], true)
            : in_array($level, ['Edit', 'Both'], true);

        if (!$allowed) {
            return response()->json([
                'success' => false,
                'message' => $isReadRequest
                    ? "You do not have view access to {$area}."
                    : "You do not have edit access to {$area}.",
            ], 403);
        }

        return $next($request);
    }
}
