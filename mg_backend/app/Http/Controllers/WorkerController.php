<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Worker;

class WorkerController extends Controller
{
    // Get all workers
    public function index()
    {
        $workers = Worker::with('department')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $workers
        ]);
    }

    // Create worker
    public function store(Request $request)
    {
        $validated = $request->validate([
            'worker_id' => 'required|string|max:255|unique:workers,worker_id',
            'worker_name' => 'required|string|max:255',
            'worker_email' => 'nullable|email|max:255',
            'worker_tin' => 'nullable|string|max:100',
            'worker_nida' => 'nullable|string|max:100',
            'worker_phone' => 'required|string|max:50',
            'worker_otherphone' => 'nullable|string|max:50',
            'workers_salary' => 'required|numeric|min:0',
            'department_id' => 'nullable|exists:departments,id',
            'worker_contact_date' => 'nullable|date',
            'duration' => 'nullable|integer|min:1',
            'worker_contact_end_date' => 'nullable|date|after_or_equal:worker_contact_date',
            'worker_role' => 'nullable|string|max:100',
            'worker_status' => 'nullable|string|max:50',
            'worker_description' => 'nullable|string',
        ]);

        $worker = Worker::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Worker created successfully',
            'data' => $worker
        ], 201);
    }

    // Get single worker
    public function show($id)
    {
        $worker = Worker::with('department')->find($id);

        if (!$worker) {
            return response()->json([
                'success' => false,
                'message' => 'Worker not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $worker
        ]);
    }

    // Update worker
    public function update(Request $request, $id)
    {
        $worker = Worker::find($id);

        if (!$worker) {
            return response()->json([
                'success' => false,
                'message' => 'Worker not found'
            ], 404);
        }

        $validated = $request->validate([
            'worker_id' => 'required|string|max:255|unique:workers,worker_id,' . $id,
            'worker_name' => 'required|string|max:255',
            'worker_email' => 'nullable|email|max:255',
            'worker_tin' => 'nullable|string|max:100',
            'worker_nida' => 'nullable|string|max:100',
            'worker_phone' => 'required|string|max:50',
            'worker_otherphone' => 'nullable|string|max:50',
            'workers_salary' => 'required|numeric|min:0',
            'department_id' => 'nullable|exists:departments,id',
            'worker_contact_date' => 'nullable|date',
            'duration' => 'nullable|integer|min:1',
            'worker_contact_end_date' => 'nullable|date|after_or_equal:worker_contact_date',
            'worker_role' => 'nullable|string|max:100',
            'worker_status' => 'nullable|string|max:50',
            'worker_description' => 'nullable|string',
        ]);

        $worker->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Worker updated successfully',
            'data' => $worker
        ]);
    }

    // Delete worker
    public function destroy($id)
    {
        $worker = Worker::find($id);

        if (!$worker) {
            return response()->json([
                'success' => false,
                'message' => 'Worker not found'
            ], 404);
        }

        $worker->delete();

        return response()->json([
            'success' => true,
            'message' => 'Worker deleted successfully'
        ]);
    }
}
