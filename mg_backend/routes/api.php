<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\WorkerController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\OfficeOrderController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AdminAuthController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\UpdateController;
use App\Http\Controllers\BookingController;

// Public authentication routes (no token required)
Route::post('/auth/login', [AuthController::class, 'login']);

// Protected routes (require authentication)
Route::middleware('auth:sanctum')->group(function () {
    // Auth endpoints
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/refresh', [AuthController::class, 'refresh']);

    // Admin endpoints (only accessible by admins)
    Route::put('/admin/users/{userId}', [AdminAuthController::class, 'updateUser']);
    Route::post('/admin/users', [AdminAuthController::class, 'createUser']);
    Route::get('/admin/users', [AdminAuthController::class, 'listUsers']);
    Route::delete('/admin/users/{userId}', [AdminAuthController::class, 'deleteUser']);

    // Resource endpoints
    Route::middleware('permission:Projects')->apiResource('projects', ProjectController::class);
    Route::middleware('permission:Clients')->apiResource('clients', ClientController::class);
    Route::middleware('permission:Users')->apiResource('users', UserController::class);
    Route::middleware('permission:Departments')->apiResource('departments', DepartmentController::class);
    Route::middleware('permission:Workers')->apiResource('workers', WorkerController::class);
    Route::middleware('permission:Booking Orders')->apiResource('bookings', BookingController::class);
    Route::middleware('permission:Invoices')->apiResource('invoices', InvoiceController::class);
    Route::middleware('permission:Event & Updates')->apiResource('updates', UpdateController::class);
    Route::middleware('permission:Office Orders')->apiResource('officeorders', OfficeOrderController::class);
    Route::apiResource('admins', AdminController::class);
});
