<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Office_order;
use App\Models\Department;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

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
        if ($request->filled('department_name')) {
            $request->merge(['department_id' => Department::where('department_name', $request->input('department_name'))->value('id')]);
        }

        $validated = $request->validate([
            'department_id' => 'nullable|exists:departments,id',

            'order_subject' => 'required|string|max:255',

            'requester_name' => 'required|string|max:255',

            'client_email' => 'nullable|email|max:255',

            'order_date' => 'required|date',

            'order_status' => 'nullable|string|max:50',

            'order_notes' => 'nullable|string',
        ]);

        $validated['order_id'] = 'pending-' . Str::uuid();
        $order = DB::transaction(function () use ($validated) {
            $order = Office_order::create($validated);
            $order->update(['order_id' => sprintf('OO-%04d', $order->id)]);

            return $order;
        });

        return response()->json([
            'success' => true,
            'message' => 'Order created successfully',
            'data' => $order->load('department')
        ], 201);
    }

    // Get one order
    public function show($id)
    {
        $order = is_numeric($id) ? Office_order::with('department')->find($id) : Office_order::with('department')->where('order_id', $id)->first();

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
        $order = is_numeric($id) ? Office_order::find($id) : Office_order::where('order_id', $id)->first();

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found'
            ], 404);
        }

        if ($request->filled('department_name')) {
            $request->merge(['department_id' => Department::where('department_name', $request->input('department_name'))->value('id')]);
        }

        $validated = $request->validate([
            'order_id' => 'required|string|max:255|unique:orders,order_id,' . $order->id,

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
        $order = is_numeric($id) ? Office_order::find($id) : Office_order::where('order_id', $id)->first();

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
    