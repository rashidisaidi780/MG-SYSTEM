<?php

namespace App\Http\Controllers;

use App\Models\Update;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class UpdateController extends Controller
{
    // Get all updates
    public function index()
    {
        $updates = Update::orderBy('created_at', 'desc')->get()->filter(function (Update $update) {
            $duration = max(1, $update->update_duration ?? 1);

            return $update->created_at && $update->created_at->copy()->addDays($duration)->isFuture();
        })->values();

        return response()->json([
            'success' => true,
            'data' => $updates,
        ]);
    }

    public function media($id, Request $request)
    {
        $update = Update::find($id);

        if (! $update || ! str_starts_with((string) $update->update_image, 'events/')) {
            return response()->json([
                'success' => false,
                'message' => 'Event media not found',
            ], 404);
        }

        $disk = Storage::disk('local');
        $path = $update->update_image;

        if (! $disk->exists($path)) {
            return response()->json([
                'success' => false,
                'message' => 'Event media file is missing',
            ], 404);
        }

        if ($request->boolean('download')) {
            return $disk->download($path, basename($path));
        }

        return response()->file($disk->path($path), [
            'Content-Type' => match (strtolower(pathinfo($path, PATHINFO_EXTENSION))) {
                'mp4' => 'video/mp4',
                'webm' => 'video/webm',
                'mov' => 'video/quicktime',
                default => 'application/octet-stream',
            },
            'Content-Disposition' => 'inline; filename="'.basename($path).'"',
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
            'media' => 'nullable|file|mimes:mp4,webm,mov|max:30720',
        ]);

        $mediaPath = isset($validated['media'])
            ? Storage::disk('local')->putFile('events', $validated['media'])
            : null;
        unset($validated['media']);

        if ($mediaPath !== null) {
            $validated['update_image'] = $mediaPath;
        }

        try {
            $update = Update::create($validated);
        } catch (\Throwable $exception) {
            if ($mediaPath !== null) {
                Storage::disk('local')->delete($mediaPath);
            }

            throw $exception;
        }

        return response()->json([
            'success' => true,
            'message' => 'Update created successfully',
            'data' => $update,
        ], 201);
    }

    // Get one update
    public function show($id)
    {
        $update = Update::find($id);

        if (! $update) {
            return response()->json([
                'success' => false,
                'message' => 'Update not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $update,
        ]);
    }

    // Update existing update
    public function update(Request $request, $id)
    {
        $update = Update::find($id);

        if (! $update) {
            return response()->json([
                'success' => false,
                'message' => 'Update not found',
            ], 404);
        }

        $validated = $request->validate([
            'update_id' => 'sometimes|string|max:255|unique:updates,update_id,'.$id,
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
            'data' => $update,
        ]);
    }

    // Delete update
    public function destroy($id)
    {
        $update = Update::find($id);

        if (! $update) {
            return response()->json([
                'success' => false,
                'message' => 'Update not found',
            ], 404);
        }

        $update->delete();

        return response()->json([
            'success' => true,
            'message' => 'Update deleted successfully',
        ]);
    }
}
