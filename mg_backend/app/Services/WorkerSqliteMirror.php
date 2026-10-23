<?php

namespace App\Services;

use App\Models\Worker;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use RuntimeException;

class WorkerSqliteMirror
{
    private const WORKER_COLUMNS = [
        'worker_id',
        'worker_name',
        'worker_email',
        'worker_tin',
        'worker_nida',
        'worker_phone',
        'worker_otherphone',
        'workers_salary',
        'department_id',
        'worker_contact_date',
        'duration',
        'worker_contact_end_date',
        'worker_role',
        'worker_status',
        'worker_description',
        'created_at',
        'updated_at',
    ];

    public function sync(Worker $worker, ?string $previousWorkerId = null): void
    {
        $sqlite = DB::connection('sqlite');

        if (! Schema::connection('sqlite')->hasTable('workers')) {
            throw new RuntimeException('The SQLite workers table does not exist.');
        }

        $attributes = $worker->only(self::WORKER_COLUMNS);
        $attributes['department_id'] = $this->sqliteDepartmentId($worker->department_id);

        $sqlite->transaction(function () use ($sqlite, $attributes, $previousWorkerId, $worker): void {
            $query = $sqlite->table('workers');

            if ($previousWorkerId !== null) {
                $query->where('worker_id', $previousWorkerId);
            } else {
                $query->where('worker_id', $worker->worker_id);
            }

            if ($query->exists()) {
                $query->update($attributes);

                return;
            }

            $sqlite->table('workers')->insert($attributes);
        });
    }

    public function existsInSqlite(string $workerId): bool
    {
        if (! Schema::connection('sqlite')->hasTable('workers')) {
            throw new RuntimeException('The SQLite workers table does not exist.');
        }

        return DB::connection('sqlite')
            ->table('workers')
            ->where('worker_id', $workerId)
            ->exists();
    }

    public function delete(string $workerId): void
    {
        if (! Schema::connection('sqlite')->hasTable('workers')) {
            throw new RuntimeException('The SQLite workers table does not exist.');
        }

        DB::connection('sqlite')
            ->table('workers')
            ->where('worker_id', $workerId)
            ->delete();
    }

    private function sqliteDepartmentId(?int $supabaseDepartmentId): ?int
    {
        if ($supabaseDepartmentId === null
            || ! Schema::connection('sqlite')->hasTable('departments')
            || ! Schema::connection('supabase')->hasTable('departments')) {
            return null;
        }

        $departmentCode = DB::connection('supabase')
            ->table('departments')
            ->where('id', $supabaseDepartmentId)
            ->value('department_id');

        if ($departmentCode === null) {
            return null;
        }

        $sqliteId = DB::connection('sqlite')
            ->table('departments')
            ->where('department_id', $departmentCode)
            ->value('id');

        return $sqliteId === null ? null : (int) $sqliteId;
    }
}
