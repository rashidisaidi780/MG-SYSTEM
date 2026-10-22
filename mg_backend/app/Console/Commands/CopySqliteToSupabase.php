<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Database\Connection;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class CopySqliteToSupabase extends Command
{
    protected $signature = 'db:copy-sqlite-to-supabase
        {--dry-run : Validate schemas and report row counts without copying}
        {--force : Confirm the one-time copy to Supabase}';

    protected $description = 'Copy SQLite data to empty Supabase tables without changing SQLite';

    private const CHUNK_SIZE = 500;

    public function handle(): int
    {
        $source = DB::connection('sqlite');
        $destination = DB::connection('supabase');

        $sourceSchema = $source->getSchemaBuilder();
        $destinationSchema = $destination->getSchemaBuilder();
        $sourceTables = array_values(array_filter(
            $sourceSchema->getTableListing(),
            fn (string $table): bool => $table !== 'migrations'
        ));
        $destinationTables = $destinationSchema->getTableListing();

        $tableCounts = [];
        foreach ($sourceTables as $table) {
            if (! in_array($table, $destinationTables, true)) {
                throw new RuntimeException("Supabase is missing the required table [{$table}]. Run its migrations first.");
            }

            $sourceColumns = $sourceSchema->getColumnListing($table);
            $destinationColumns = $destinationSchema->getColumnListing($table);
            sort($sourceColumns);
            sort($destinationColumns);

            if ($sourceColumns !== $destinationColumns) {
                throw new RuntimeException("SQLite and Supabase columns do not match for [{$table}]. No data was copied.");
            }

            $sourceCount = $source->table($table)->count();
            $destinationCount = $destination->table($table)->count();

            if ($destinationCount !== 0) {
                throw new RuntimeException("Supabase table [{$table}] is not empty. No data was copied.");
            }

            $tableCounts[$table] = $sourceCount;
        }

        foreach ($tableCounts as $table => $count) {
            $this->line(sprintf('%-30s %d rows', $table, $count));
        }

        if ($this->option('dry-run')) {
            $this->info('Dry run complete. SQLite was not modified and no rows were copied.');

            return self::SUCCESS;
        }

        if (! $this->option('force')) {
            $this->error('No rows were copied. Re-run with --force after reviewing the dry-run output.');

            return self::FAILURE;
        }

        $orderedTables = $this->orderByDependencies($tableCounts, $destination);

        $destination->transaction(function () use ($source, $destination, $orderedTables, $tableCounts): void {
            foreach ($orderedTables as $table) {
                $this->copyTable($source, $destination, $table, $tableCounts[$table]);
            }

            if ($destination->getDriverName() === 'pgsql') {
                foreach ($orderedTables as $table) {
                    $this->resetPostgresSequence($destination, $table);
                }
            }
        });

        $this->info('SQLite data was copied to Supabase. The SQLite database was left unchanged.');

        return self::SUCCESS;
    }

    /**
     * @param  array<string, int>  $tableCounts
     * @return array<int, string>
     */
    private function orderByDependencies(array $tableCounts, Connection $destination): array
    {
        $tables = array_keys($tableCounts);
        $dependencies = [];

        foreach ($tables as $table) {
            $dependencies[$table] = [];

            foreach ($destination->getSchemaBuilder()->getForeignKeys($table) as $foreignKey) {
                $referencedTable = $foreignKey['foreign_table'] ?? null;

                if ($referencedTable !== null && $referencedTable !== $table && in_array($referencedTable, $tables, true)) {
                    $dependencies[$table][] = $referencedTable;
                }
            }
        }

        $ordered = [];
        while (count($ordered) < count($tables)) {
            $ready = array_values(array_filter(
                $tables,
                fn (string $table): bool => ! in_array($table, $ordered, true)
                    && count(array_diff($dependencies[$table], $ordered)) === 0
            ));

            if ($ready === []) {
                throw new RuntimeException('The Supabase foreign-key dependencies contain a cycle. No data was copied.');
            }

            array_push($ordered, ...$ready);
        }

        return $ordered;
    }

    private function copyTable(Connection $source, Connection $destination, string $table, int $rowCount): void
    {
        $sourceSchema = $source->getSchemaBuilder();
        $primaryIndex = collect($sourceSchema->getIndexes($table))->first(
            fn (array $index): bool => $index['primary'] ?? false
        );
        $primaryColumn = $primaryIndex['columns'][0] ?? $sourceSchema->getColumnListing($table)[0] ?? null;
        $offset = 0;

        while ($offset < $rowCount) {
            $query = $source->table($table);

            if ($primaryColumn !== null) {
                $query->orderBy($primaryColumn);
            }

            $rows = $query->offset($offset)->limit(self::CHUNK_SIZE)->get();
            if ($rows->isEmpty()) {
                break;
            }

            $destination->table($table)->insert(
                $rows->map(fn (object $row): array => (array) $row)->all()
            );

            $offset += $rows->count();
        }
    }

    private function resetPostgresSequence(Connection $destination, string $table): void
    {
        if (! in_array('id', $destination->getSchemaBuilder()->getColumnListing($table), true)) {
            return;
        }

        $wrappedTable = $destination->getQueryGrammar()->wrapTable($table);
        $destination->selectOne(
            "SELECT setval(pg_get_serial_sequence(?, 'id'), COALESCE(MAX({$destination->getQueryGrammar()->wrap('id')}), 1), MAX({$destination->getQueryGrammar()->wrap('id')}) IS NOT NULL) FROM {$wrappedTable}",
            [$table]
        );
    }
}
