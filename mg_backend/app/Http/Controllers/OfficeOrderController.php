<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Office_order;

class OfficeOrderController extends Controller
{
    // Get all orders
    public function index()
    {
        $orders = Office_order::with('department')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $orders
        ]);
    }

    // Create order
    public function store(Request $request)
    {
        $validated = $request->validate([
            'order_id' => 'required|string|max:255|unique:orders,order_id',

            'department_id' => 'nullable|exists:departments,id',

            'order_subject' => 'required|string|max:255',

            'requester_name' => 'required|string|max:255',

            'client_email' => 'nullable|email|max:255',

            'order_date' => 'required|date',

            'order_status' => 'nullable|string|max:50',

            'order_notes' => 'nullable|string',
        ]);

        $order = Office_order::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Order created successfully',
            'data' => $order->load('department')
        ], 201);
    }

    // Get one order
    public function show($id)
    {
        $order = Office_order::with('department')->find($id);

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $order
        ]);
    }

    // Update order
    public function update(Request $request, $id)
    {
        $order = Office_order::find($id);

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found'
            ], 404);
        }

        $validated = $request->validate([
            'order_id' => 'required|string|max:255|unique:orders,order_id,' . $id,

            'department_id' => 'nullable|exists:departments,id',

            'order_subject' => 'required|string|max:255',

            'requester_name' => 'required|string|max:255',

            'client_email' => 'nullable|email|max:255',

            'order_date' => 'required|date',

            'order_status' => 'nullable|string|max:50',

            'order_notes' => 'nullable|string',
        ]);

        $order->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Order updated successfully',
            'data' => $order->load('department')
        ]);
    }

    // Delete order
    public function destroy($id)
    {
        $order = Office_order::find($id);

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found'
            ], 404);
        }

        $order->delete();

        return response()->json([
            'success' => true,
            'message' => 'Order deleted successfully'
        ]);
    }
}
    