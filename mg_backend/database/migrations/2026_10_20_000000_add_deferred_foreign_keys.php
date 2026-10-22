<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            return;
        }

        $foreignKeys = [
            ['users', 'department_id', 'departments', 'set null', null, 'users_department_id_deferred_foreign'],
            ['projects', 'client_id', 'clients', 'restrict', 'cascade', 'projects_client_id_deferred_foreign'],
            ['bookings', 'service_id', 'services', 'cascade', null, 'bookings_service_id_deferred_foreign'],
        ];

        foreach ($foreignKeys as [$tableName, $column, $referencedTable, $onDelete, $onUpdate, $name]) {
            if ($this->hasForeignKey($tableName, $column, $referencedTable)) {
                continue;
            }

            Schema::table($tableName, function (Blueprint $table) use ($column, $referencedTable, $onDelete, $onUpdate, $name) {
                $foreign = $table->foreign($column, $name)
                    ->references('id')
                    ->on($referencedTable)
                    ->onDelete($onDelete);

                if ($onUpdate !== null) {
                    $foreign->onUpdate($onUpdate);
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            return;
        }

        foreach ([
            ['users', 'users_department_id_deferred_foreign'],
            ['projects', 'projects_client_id_deferred_foreign'],
            ['bookings', 'bookings_service_id_deferred_foreign'],
        ] as [$tableName, $name]) {
            $exists = collect(Schema::getForeignKeys($tableName))
                ->contains(fn (array $foreignKey): bool => ($foreignKey['name'] ?? null) === $name);

            if (! $exists) {
                continue;
            }

            Schema::table($tableName, function (Blueprint $table) use ($name) {
                $table->dropForeign($name);
            });
        }
    }

    private function hasForeignKey(string $tableName, string $column, string $referencedTable): bool
    {
        foreach (Schema::getForeignKeys($tableName) as $foreignKey) {
            if (
                ($foreignKey['columns'] ?? []) === [$column]
                && ($foreignKey['foreign_table'] ?? null) === $referencedTable
            ) {
                return true;
            }
        }

        return false;
    }
};
