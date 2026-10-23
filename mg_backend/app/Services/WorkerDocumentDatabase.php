<?php

namespace App\Services;

use App\Models\Worker;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

class WorkerDocumentDatabase
{
    public function storeBatch(Worker $worker, array $files): array
    {
        $supabase = DB::connection('supabase');
        $sqlite = DB::connection('sqlite');
        $sqliteWorkerId = $sqlite->table('workers')
            ->where('worker_id', $worker->worker_id)
            ->value('id');

        if ($sqliteWorkerId === null) {
            throw new RuntimeException('The worker is not present in SQLite. Sync the worker before uploading documents.');
        }

        $documents = collect($files)->map(function (UploadedFile $file) use ($worker): array {
            return [
                'worker_id' => $worker->id,
                'original_name' => $file->getClientOriginalName(),
                'file_path' => 'database/worker-documents/'.$worker->worker_id.'/'.Str::uuid().'.pdf',
                'file_size' => $file->getSize(),
                'content_base64' => base64_encode($file->get()),
                'created_at' => now(),
                'updated_at' => now(),
            ];
        })->all();

        $filePaths = array_column($documents, 'file_path');
        $sqliteDocuments = array_map(
            fn (array $document): array => [...$document, 'worker_id' => $sqliteWorkerId],
            $documents
        );

        try {
            $sqlite->beginTransaction();
            $supabase->beginTransaction();
            $sqlite->table('worker_documents')->insert($sqliteDocuments);
            $supabase->table('worker_documents')->insert($documents);
            $sqlite->commit();
            $supabase->commit();
        } catch (\Throwable $exception) {
            if ($sqlite->transactionLevel() > 0) {
                $sqlite->rollBack();
            }
            if ($supabase->transactionLevel() > 0) {
                $supabase->rollBack();
            }

            if ($sqlite->transactionLevel() === 0) {
                $sqlite->table('worker_documents')->whereIn('file_path', $filePaths)->delete();
            }
            if ($supabase->transactionLevel() === 0) {
                $supabase->table('worker_documents')->whereIn('file_path', $filePaths)->delete();
            }

            throw $exception;
        }

        return $supabase->table('worker_documents')
            ->whereIn('file_path', $filePaths)
            ->orderBy('id')
            ->get(['id', 'original_name', 'file_size', 'created_at'])
            ->all();
    }

    public function delete(string $filePath): void
    {
        $sqlite = DB::connection('sqlite');
        $supabase = DB::connection('supabase');

        try {
            $sqlite->beginTransaction();
            $supabase->beginTransaction();
            $deletedFromSqlite = $sqlite->table('worker_documents')->where('file_path', $filePath)->delete();
            $deletedFromSupabase = $supabase->table('worker_documents')->where('file_path', $filePath)->delete();

            if ($deletedFromSqlite + $deletedFromSupabase === 0) {
                throw new RuntimeException('The worker document was not found in either database.');
            }

            $sqlite->commit();
            $supabase->commit();
        } catch (\Throwable $exception) {
            if ($sqlite->transactionLevel() > 0) {
                $sqlite->rollBack();
            }
            if ($supabase->transactionLevel() > 0) {
                $supabase->rollBack();
            }

            throw $exception;
        }

        if ($sqlite->table('worker_documents')->where('file_path', $filePath)->exists()
            || $supabase->table('worker_documents')->where('file_path', $filePath)->exists()) {
            throw new RuntimeException('The worker document still exists in one of the databases.');
        }
    }
}
