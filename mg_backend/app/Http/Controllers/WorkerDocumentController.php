<?php

namespace App\Http\Controllers;

use App\Models\Worker;
use App\Services\WorkerDocumentDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class WorkerDocumentController extends Controller
{
    public function index(string $worker)
    {
        $workerRecord = $this->findWorker($worker);

        if (! $workerRecord) {
            return response()->json(['success' => false, 'message' => 'Worker not found'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $workerRecord->documents()
                ->latest()
                ->get(['id', 'original_name', 'file_size', 'created_at']),
        ]);
    }

    public function store(Request $request, string $worker, WorkerDocumentDatabase $documentDatabase)
    {
        $workerRecord = $this->findWorker($worker);

        if (! $workerRecord) {
            return response()->json(['success' => false, 'message' => 'Worker not found'], 404);
        }

        $validated = $request->validate([
            'documents' => 'required|array|min:1|max:5',
            'documents.*' => 'required|file|mimes:pdf|max:20480',
        ]);

        if (collect($validated['documents'])->sum(fn ($file) => $file->getSize()) > 30 * 1024 * 1024) {
            throw ValidationException::withMessages([
                'documents' => ['The combined size of the selected PDFs must not exceed 30 MB.'],
            ]);
        }

        try {
            $documents = $documentDatabase->storeBatch($workerRecord, $validated['documents']);
        } catch (\Throwable $exception) {
            Log::error('Unable to store worker documents in both databases.', [
                'worker_id' => $workerRecord->worker_id,
                'exception' => $exception->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'The PDFs could not be saved to both databases. No successful upload is reported; contact an administrator before retrying.',
            ], 503);
        }

        return response()->json([
            'success' => true,
            'message' => 'Worker documents uploaded successfully',
            'data' => $documents,
        ], 201);
    }

    public function download(string $worker, string $document)
    {
        $workerRecord = $this->findWorker($worker);
        $documentRecord = $workerRecord?->documents()->find($document);

        if (! $documentRecord) {
            return response()->json(['success' => false, 'message' => 'Worker document not found'], 404);
        }

        if ($documentRecord->content_base64 !== null) {
            $contents = base64_decode($documentRecord->content_base64, true);
            if ($contents === false) {
                Log::error('Worker document content has invalid Base64 encoding.', [
                    'worker_id' => $workerRecord->worker_id,
                    'document_id' => $documentRecord->id,
                ]);

                return response()->json(['success' => false, 'message' => 'Worker document content is corrupted'], 500);
            }

            return response()->streamDownload(static function () use ($contents): void {
                echo $contents;
            }, $documentRecord->original_name, [
                'Content-Type' => 'application/pdf',
                'Content-Length' => (string) $documentRecord->file_size,
                'X-Content-Type-Options' => 'nosniff',
            ]);
        }

        if (! Storage::disk('local')->exists($documentRecord->file_path)) {
            return response()->json(['success' => false, 'message' => 'Worker document content is missing'], 404);
        }

        return Storage::disk('local')->download($documentRecord->file_path, $documentRecord->original_name, [
            'Content-Type' => 'application/pdf',
        ]);
    }

    public function destroy(string $worker, string $document, WorkerDocumentDatabase $documentDatabase)
    {
        $workerRecord = $this->findWorker($worker);
        $documentRecord = $workerRecord?->documents()->find($document);

        if (! $documentRecord) {
            return response()->json(['success' => false, 'message' => 'Worker document not found'], 404);
        }

        try {
            $documentDatabase->delete($documentRecord->file_path);
        } catch (\Throwable $exception) {
            Log::error('Unable to delete worker document from both databases.', [
                'worker_id' => $workerRecord->worker_id,
                'document_id' => $documentRecord->id,
                'exception' => $exception->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'The document could not be deleted from both databases. Contact an administrator.',
            ], 503);
        }

        if (! str_starts_with($documentRecord->file_path, 'database/')) {
            Storage::disk('local')->delete($documentRecord->file_path);
        }

        return response()->json(['success' => true, 'message' => 'Worker document deleted successfully']);
    }

    private function findWorker(string $worker): ?Worker
    {
        return is_numeric($worker)
            ? Worker::find($worker)
            : Worker::where('worker_id', $worker)->first();
    }
}
