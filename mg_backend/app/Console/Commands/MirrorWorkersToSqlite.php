<?php

namespace App\Console\Commands;

use App\Models\Worker;
use App\Services\WorkerSqliteMirror;
use Illuminate\Console\Command;

class MirrorWorkersToSqlite extends Command
{
    protected $signature = 'workers:mirror-to-sqlite
        {--force : Insert Supabase workers that do not exist in SQLite}';

    protected $description = 'Safely copy missing Supabase workers into SQLite without overwriting local worker records';

    public function handle(WorkerSqliteMirror $sqliteMirror): int
    {
        $missing = [];

        Worker::query()->orderBy('id')->chunkById(200, function ($workers) use ($sqliteMirror, &$missing): void {
            foreach ($workers as $worker) {
                if (! $sqliteMirror->existsInSqlite($worker->worker_id)) {
                    $missing[] = $worker->worker_id;
                }
            }
        });

        $this->info(count($missing).' Supabase workers are not present in SQLite.');

        if ($missing === []) {
            return self::SUCCESS;
        }

        if (! $this->option('force')) {
            $this->comment('No SQLite data was changed. Review the count, then re-run with --force to insert only missing workers.');

            return self::SUCCESS;
        }

        $copied = 0;
        Worker::query()
            ->whereIn('worker_id', $missing)
            ->orderBy('id')
            ->chunkById(200, function ($workers) use ($sqliteMirror, &$copied): void {
                foreach ($workers as $worker) {
                    if ($sqliteMirror->existsInSqlite($worker->worker_id)) {
                        continue;
                    }

                    $sqliteMirror->sync($worker);
                    $copied++;
                }
            });

        $this->info("Inserted {$copied} missing workers into SQLite. Existing SQLite worker records were not overwritten.");

        return self::SUCCESS;
    }
}
