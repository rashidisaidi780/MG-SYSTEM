<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Booking;
use App\Models\Service;
use App\Models\Client;
use App\Models\Worker;
use Illuminate\Support\Str;

class BookingController extends Controller
{
    // Get all bookings
    public function index()
    {
        $bookings = Booking::with([
            'client',
            'service',
            'worker'
        ])
        ->orderBy('booking_date', 'desc')
        ->get();

        return response()->json([
            'success' => true,
            'data' => $bookings
        ]);
    }

    // Create booking
    public function store(Request $request)
    {
        if ($request->filled('service_name')) {
            $request->merge(['service_id' => Service::firstOrCreate(['service_name' => $request->input('service_name')])->id]);
        }
        if ($request->filled('client_name')) {
            $request->merge(['client_id' => Client::where('client_name', $request->input('client_name'))->value('id')]);
        }
        if ($request->filled('assignee_name')) {
            $request->merge(['assignee' => Worker::where('worker_name', $request->input('assignee_name'))->value('id')]);
        }

        $validated = $request->validate([
            'booking_id' => 'sometimes|string|max:255|unique:bookings,booking_id',

            'client_id' => 'required|exists:clients,id',

            'service_id' => 'required|exists:services,id',

            'assignee' => 'nullable|exists:workers,id',

            'booking_date' => 'required|date',

            'booking_time' => 'required|date_format:H:i',

            'booking_status' => 'nullable|string|max:50',

            'booking_notes' => 'nullable|string',
        ]);

        $validated['booking_id'] ??= 'BO-' . Str::upper(Str::random(12));
        $booking = Booking::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Booking created successfully',
            'data' => $booking->load([
                'client',
                'service',
                'worker'
            ])
        ], 201);
    }

    // Get one booking
    public function show($id)
    {
        $booking = (is_numeric($id) ? Booking::whereKey($id) : Booking::where('booking_id', $id))->with([
            'client',
            'service',
            'worker'
        ])->first();

        if (!$booking) {
            return response()->json([
                'success' => false,
                'message' => 'Booking not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $booking
        ]);
    }

    // Update booking
    public function update(Request $request, $id)
    {
        $booking = is_numeric($id) ? Booking::find($id) : Booking::where('booking_id', $id)->first();

        if (!$booking) {
            return response()->json([
                'success' => false,
                'message' => 'Booking not found'
            ], 404);
        }

        if ($request->filled('service_name')) {
            $request->merge(['service_id' => Service::firstOrCreate(['service_name' => $request->input('service_name')])->id]);
        }
        if ($request->filled('client_name')) {
            $request->merge(['client_id' => Client::where('client_name', $request->input('client_name'))->value('id')]);
        }
        if ($request->filled('assignee_name')) {
            $request->merge(['assignee' => Worker::where('worker_name', $request->input('assignee_name'))->value('id')]);
        }

        $validated = $request->validate([
            'booking_id' => 'sometimes|string|max:255|unique:bookings,booking_id,' . $booking->id,

            'client_id' => 'required|exists:clients,id',

            'service_id' => 'required|exists:services,id',

            'assignee' => 'nullable|exists:workers,id',

            'booking_date' => 'required|date',

            'booking_time' => 'required|date_format:H:i',

            'booking_status' => 'nullable|string|max:50',

            'booking_notes' => 'nullable|string',
        ]);

        $booking->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Booking updated successfully',
            'data' => $booking->load([
                'client',
                'service',
                'worker'
            ])
        ]);
    }

    // Delete booking
    public function destroy($id)
    {
        $booking = is_numeric($id) ? Booking::find($id) : Booking::where('booking_id', $id)->first();

        if (!$booking) {
            return response()->json([
                'success' => false,
                'message' => 'Booking not found'
            ], 404);
        }

        $booking->delete();

        return response()->json([
            'success' => true,
            'message' => 'Booking deleted successfully'
        ]);
    }
}