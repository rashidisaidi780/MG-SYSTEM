<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class BackfillWorkerDocumentDatabases extends Command
{
    protected $signature = 'worker-documents:backfill-databases
        {--force : Store existing PDF contents in both databases}';

    protected $description = 'Safely backfill existing worker PDF contents into Supabase and SQLite';

    public function handle(): int
    {
        foreach (['supabase', 'sqlite'] as $connection) {
            if (! Schema::connection($connection)->hasTable('worker_documents')
                || ! Schema::connection($connection)->hasColumn('worker_documents', 'content_base64')) {
                throw new RuntimeException("The [{$connection}] worker documents table is not ready. Run its migrations first.");
            }
        }

        $disk = Storage::disk('local');
        $documentCount = DB::connection('supabase')->table('worker_documents')->count();
        $needsBackfill = 0;
        $missingSqliteRows = 0;
        $unavailableFiles = [];

        DB::connection('supabase')->table('worker_documents')
            ->select(['id', 'worker_id', 'file_path'])
            ->orderBy('id')->chunkById(100, function ($documents) use (
                $disk,
                &$needsBackfill,
                &$missingSqliteRows,
                &$unavailableFiles
            ): void {
                foreach ($documents as $document) {
                    $workerCode = DB::connection('supabase')->table('workers')
                        ->where('id', $document->worker_id)
                        ->value('worker_id');
                    $sqliteWorkerId = $workerCode === null
                        ? null
                        : DB::connection('sqlite')->table('workers')->where('worker_id', $workerCode)->value('id');

                    if ($sqliteWorkerId === null) {
                        throw new RuntimeException("Worker document [{$document->id}] has no matching SQLite worker.");
                    }

                    $sqliteDocument = DB::connection('sqlite')->table('worker_documents')
                        ->where('file_path', $document->file_path)
                        ->first(['content_base64']);
                    $supabaseHasContent = DB::connection('supabase')->table('worker_documents')
                        ->where('id', $document->id)
                        ->whereNotNull('content_base64')
                        ->exists();

                    if ($sqliteDocument === null || $sqliteDocument->content_base64 === null) {
                        $missingSqliteRows++;
                    }

                    if (! $supabaseHasContent || $sqliteDocument?->content_base64 === null) {
                        $needsBackfill++;
                    }

                    if (! $supabaseHasContent
                        && ($sqliteDocument?->content_base64 === null)
                        && ! $disk->exists($document->file_path)) {
                        $unavailableFiles[] = $document->id;
                    }
                }
            });

        $this->info("Found {$documentCount} Supabase worker documents.");
        $this->info("{$needsBackfill} document records need a database backfill.");
        $this->info("{$missingSqliteRows} SQLite document records or contents need to be backfilled.");

        if ($unavailableFiles !== []) {
            throw new RuntimeException(
                'Some legacy PDF files are missing from private storage (document record IDs: '.implode(', ', $unavailableFiles).'). No documents were backfilled.'
            );
        }

        if (! $this->option('force')) {
            $this->comment('No data was changed. Re-run with --force to backfill these existing documents.');

            return self::SUCCESS;
        }

        DB::connection('supabase')->table('worker_documents')
            ->select(['id', 'worker_id', 'original_name', 'file_path', 'file_size', 'created_at', 'updated_at'])
            ->orderBy('id')->chunkById(50, function ($documents) use ($disk): void {
                foreach ($documents as $document) {
                    $workerCode = DB::connection('supabase')->table('workers')
                        ->where('id', $document->worker_id)
                        ->value('worker_id');
                    $sqliteWorkerId = DB::connection('sqlite')->table('workers')
                        ->where('worker_id', $workerCode)
                        ->value('id');
                    $sqlite = DB::connection('sqlite');
                    $sqliteDocument = $sqlite->table('worker_documents')
                        ->where('file_path', $document->file_path)
                        ->first(['id', 'content_base64']);
                    $supabaseContent = DB::connection('supabase')->table('worker_documents')
                        ->where('id', $document->id)
                        ->value('content_base64');
                    $content = $supabaseContent ?? $sqliteDocument?->content_base64;

                    if ($content === null) {
                        $content = base64_encode($disk->get($document->file_path));
                    }

                    try {
                        $sqlite->transaction(function () use ($sqlite, $sqliteDocument, $document, $sqliteWorkerId, $content): void {
                            if ($sqliteDocument === null) {
                                $sqlite->table('worker_documents')->insert([
                                    'worker_id' => $sqliteWorkerId,
                                    'original_name' => $document->original_name,
                                    'file_path' => $document->file_path,
                                    'file_size' => $document->file_size,
                                    'content_base64' => $content,
                                    'created_at' => $document->created_at,
                                    'updated_at' => $document->updated_at,
                                ]);
                            } elseif ($sqliteDocument->content_base64 === null) {
                                $sqlite->table('worker_documents')
                                    ->where('id', $sqliteDocument->id)
                                    ->update([
                                        'content_base64' => $content,
                                        'updated_at' => now(),
                                    ]);
                            }
                        });

                        if ($supabaseContent === null) {
                            DB::connection('supabase')->table('worker_documents')
                                ->where('id', $document->id)
                                ->update(['content_base64' => $content, 'updated_at' => now()]);
                        }
                    } catch (\Throwable $exception) {
                        Log::error('Failed to backfill a worker PDF into both databases.', [
                            'document_id' => $document->id,
                            'exception' => $exception->getMessage(),
                        ]);

                        throw new RuntimeException("Backfill failed for worker document [{$document->id}].", 0, $exception);
                    }
                }
            });

        $this->info("Backfilled {$documentCount} worker documents into both databases.");

        return self::SUCCESS;
    }
}
