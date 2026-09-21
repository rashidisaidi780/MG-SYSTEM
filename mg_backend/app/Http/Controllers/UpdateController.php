<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Update;

class UpdateController extends Controller
{
    // Get all updates
    public function index()
    {
        $updates = Update::orderBy('update_date', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $updates
        ]);
    }

    // Create update
    public function store(Request $request)
    {
        $validated = $request->validate([
            'update_id' => 'required|string|max:255|unique:updates,update_id',
            'update_title' => 'required|string|max:255',
            'update_description' => 'required|string',
            'update_image' => 'nullable|string',
            'update_date' => 'required|date',
            'update_duration' => 'nullable|integer|min:1',
            'update_status' => 'nullable|string|max:50',
            'is_new' => 'nullable|boolean',
        ]);

        $update = Update::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Update created successfully',
            'data' => $update
        ], 201);
    }

    // Get one update
    public function show($id)
    {
        $update = Update::find($id);

        if (!$update) {
            return response()->json([
                'success' => false,
                'message' => 'Update not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $update
        ]);
    }

    // Update existing update
    public function update(Request $request, $id)
    {
        $update = Update::find($id);

        if (!$update) {
            return response()->json([
                'success' => false,
                'message' => 'Update not found'
            ], 404);
        }

        $validated = $request->validate([
            'update_id' => 'sometimes|string|max:255|unique:updates,update_id,' . $id,
            'update_title' => 'sometimes|string|max:255',
            'update_description' => 'sometimes|string',
            'update_image' => 'nullable|string',
            'update_date' => 'sometimes|date',
            'update_duration' => 'nullable|integer|min:1',
            'update_status' => 'nullable|string|max:50',
            'is_new' => 'sometimes|boolean',
        ]);

        $update->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Update updated successfully',
            'data' => $update
        ]);
    }

    // Delete update
    public function destroy($id)
    {
        $update = Update::find($id);

        if (!$update) {
            return response()->json([
                'success' => false,
                'message' => 'Update not found'
            ], 404);
        }

        $update->delete();

        return response()->json([
            'success' => true,
            'message' => 'Update deleted successfully'
        ]);
    }
}
