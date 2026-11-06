<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            return;
        }

        $tables = DB::table('pg_tables')
            ->where('schemaname', 'public')
            ->pluck('tablename');

        foreach ($tables as $table) {
            $quotedTable = '"' . str_replace('"', '""', $table) . '"';
            DB::statement("ALTER TABLE public.{$quotedTable} ENABLE ROW LEVEL SECURITY");
        }
    }

    public function down(): void
    {
        // RLS is a security boundary; rolling back this migration must not disable it.
    }
};
