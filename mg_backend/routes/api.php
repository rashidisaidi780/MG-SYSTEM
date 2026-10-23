<?php

use App\Http\Controllers\AdminAuthController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OfficeOrderController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\UpdateController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\WorkerController;
use App\Http\Controllers\WorkerDocumentController;
use Illuminate\Support\Facades\Route;

// Public authentication routes (no token required)
Route::post('/auth/login', [AuthController::class, 'login']);

// Protected routes (require authentication)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);

    // Auth endpoints
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/refresh', [AuthController::class, 'refresh']);

    // Notifications are always scoped to the authenticated admin or user.
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications', [NotificationController::class, 'store']);
    Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllRead']);
    Route::get('/notifications/unread/count', [NotificationController::class, 'unreadCount']);
    Route::delete('/notifications', [NotificationController::class, 'destroyAll']);
    Route::patch('/notifications/{notification}', [NotificationController::class, 'update']);
    Route::delete('/notifications/{notification}', [NotificationController::class, 'destroy']);

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
    Route::middleware('permission:Workers')->group(function () {
        Route::get('/workers/{worker}/documents', [WorkerDocumentController::class, 'index']);
        Route::post('/workers/{worker}/documents', [WorkerDocumentController::class, 'store']);
        Route::get('/workers/{worker}/documents/{document}', [WorkerDocumentController::class, 'download']);
        Route::delete('/workers/{worker}/documents/{document}', [WorkerDocumentController::class, 'destroy']);
        Route::apiResource('workers', WorkerController::class);
    });
    Route::middleware('permission:Booking Orders')->apiResource('bookings', BookingController::class);
    Route::middleware('permission:Invoices')->apiResource('invoices', InvoiceController::class);
    Route::get('/updates', [UpdateController::class, 'index']);
    Route::get('/updates/{id}/media', [UpdateController::class, 'media']);
    Route::get('/updates/{id}', [UpdateController::class, 'show']);
    Route::middleware('permission:Event & Updates')->group(function () {
        Route::post('/updates', [UpdateController::class, 'store']);
        Route::put('/updates/{id}', [UpdateController::class, 'update']);
        Route::delete('/updates/{id}', [UpdateController::class, 'destroy']);
    });
    Route::middleware('permission:Office Orders')->apiResource('officeorders', OfficeOrderController::class);
    Route::apiResource('admins', AdminController::class);
});
