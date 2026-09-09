<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Booking;

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
        $validated = $request->validate([
            'booking_id' => 'required|string|max:255|unique:bookings,booking_id',

            'client_id' => 'required|exists:clients,id',

            'service_id' => 'required|exists:services,id',

            'assignee' => 'nullable|exists:workers,id',

            'booking_date' => 'required|date',

            'booking_time' => 'required|date_format:H:i',

            'booking_status' => 'nullable|string|max:50',

            'booking_notes' => 'nullable|string',
        ]);

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
        $booking = Booking::with([
            'client',
            'service',
            'worker'
        ])->find($id);

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
        $booking = Booking::find($id);

        if (!$booking) {
            return response()->json([
                'success' => false,
                'message' => 'Booking not found'
            ], 404);
        }

        $validated = $request->validate([
            'booking_id' => 'required|string|max:255|unique:bookings,booking_id,' . $id,

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
        $booking = Booking::find($id);

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