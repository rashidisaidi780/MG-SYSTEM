<?php

namespace App\Http\Controllers;

use App\Models\Worker;
use App\Services\WorkerSqliteMirror;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

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
            'data' => $workers,
        ]);
    }

    // Create worker
    public function store(Request $request, WorkerSqliteMirror $sqliteMirror)
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
        $worker->refresh();

        if (! $this->mirrorWorker($sqliteMirror, $worker, 'create')) {
            return $this->sqliteMirrorFailure($worker);
        }

        return response()->json([
            'success' => true,
            'message' => 'Worker created successfully',
            'data' => $worker,
        ], 201);
    }

    // Get single worker
    public function show($id)
    {
        $worker = is_numeric($id)
            ? Worker::with('department')->find($id)
            : Worker::with('department')->where('worker_id', $id)->first();

        if (! $worker) {
            return response()->json([
                'success' => false,
                'message' => 'Worker not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $worker,
        ]);
    }

    // Update worker
    public function update(Request $request, $id, WorkerSqliteMirror $sqliteMirror)
    {
        $worker = is_numeric($id)
            ? Worker::find($id)
            : Worker::where('worker_id', $id)->first();

        if (! $worker) {
            return response()->json([
                'success' => false,
                'message' => 'Worker not found',
            ], 404);
        }

        $validated = $request->validate([
            'worker_id' => 'sometimes|required|string|max:255|unique:workers,worker_id,'.$worker->id,
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

        $previousWorkerId = $worker->worker_id;
        $worker->update($validated);
        $worker->refresh();

        if (! $this->mirrorWorker($sqliteMirror, $worker, 'update', $previousWorkerId)) {
            return $this->sqliteMirrorFailure($worker);
        }

        return response()->json([
            'success' => true,
            'message' => 'Worker updated successfully',
            'data' => $worker,
        ]);
    }

    // Delete worker
    public function destroy($id, WorkerSqliteMirror $sqliteMirror)
    {
        $worker = is_numeric($id)
            ? Worker::find($id)
            : Worker::where('worker_id', $id)->first();

        if (! $worker) {
            return response()->json([
                'success' => false,
                'message' => 'Worker not found',
            ], 404);
        }

        $documentPaths = $worker->documents()->pluck('file_path');
        $workerId = $worker->worker_id;
        $worker->delete();

        try {
            $sqliteMirror->delete($workerId);
        } catch (\Throwable $exception) {
            Log::error('Worker was deleted from Supabase but could not be deleted from SQLite.', [
                'worker_id' => $workerId,
                'exception' => $exception->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Worker was deleted from Supabase, but the SQLite copy could not be updated. Contact an administrator before retrying.',
            ], 503);
        }

        foreach ($documentPaths as $path) {
            Storage::disk('local')->delete($path);
        }

        return response()->json([
            'success' => true,
            'message' => 'Worker deleted successfully',
        ]);
    }

    private function mirrorWorker(
        WorkerSqliteMirror $sqliteMirror,
        Worker $worker,
        string $operation,
        ?string $previousWorkerId = null
    ): bool {
        try {
            $sqliteMirror->sync($worker, $previousWorkerId);

            return true;
        } catch (\Throwable $exception) {
            Log::error('Worker was saved to Supabase but could not be mirrored to SQLite.', [
                'operation' => $operation,
                'worker_id' => $worker->worker_id,
                'exception' => $exception->getMessage(),
            ]);

            return false;
        }
    }

    private function sqliteMirrorFailure(Worker $worker)
    {
        return response()->json([
            'success' => false,
            'message' => 'Worker was saved to Supabase, but the SQLite copy could not be updated. Contact an administrator before retrying.',
            'data' => $worker,
        ], 503);
    }
}
