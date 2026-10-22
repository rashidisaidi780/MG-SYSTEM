<?php

namespace Tests\Feature;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use RuntimeException;
use Tests\TestCase;

class CopySqliteToSupabaseTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config([
            'database.connections.sqlite.database' => ':memory:',
            'database.connections.supabase.driver' => 'sqlite',
            'database.connections.supabase.database' => ':memory:',
        ]);

        DB::purge('sqlite');
        DB::purge('supabase');

        foreach (['sqlite', 'supabase'] as $connection) {
            Schema::connection($connection)->create('departments', function ($table) {
                $table->id();
                $table->string('name');
            });

            Schema::connection($connection)->create('users', function ($table) {
                $table->id();
                $table->string('name');
                $table->foreignId('department_id')->constrained('departments');
            });
        }
    }

    protected function tearDown(): void
    {
        DB::purge('sqlite');
        DB::purge('supabase');

        parent::tearDown();
    }

    public function test_it_copies_rows_without_changing_sqlite(): void
    {
        DB::connection('sqlite')->table('departments')->insert([
            'id' => 7,
            'name' => 'Operations',
        ]);
        DB::connection('sqlite')->table('users')->insert([
            'id' => 12,
            'name' => 'Test User',
            'department_id' => 7,
        ]);

        $this->assertSame(
            Command::SUCCESS,
            Artisan::call('db:copy-sqlite-to-supabase', ['--dry-run' => true])
        );
        $this->assertSame(0, DB::connection('supabase')->table('users')->count());

        $this->assertSame(
            Command::SUCCESS,
            Artisan::call('db:copy-sqlite-to-supabase', ['--force' => true])
        );
        $this->assertSame(1, DB::connection('supabase')->table('users')->count());
        $this->assertSame(7, DB::connection('supabase')->table('users')->value('department_id'));
        $this->assertSame(1, DB::connection('sqlite')->table('users')->count());
    }

    public function test_it_refuses_to_copy_into_a_nonempty_destination(): void
    {
        DB::connection('sqlite')->table('departments')->insert([
            'id' => 7,
            'name' => 'Operations',
        ]);
        DB::connection('supabase')->table('departments')->insert([
            'id' => 2,
            'name' => 'Existing data',
        ]);

        try {
            Artisan::call('db:copy-sqlite-to-supabase', ['--force' => true]);
            $this->fail('The copy should refuse to write into a non-empty destination.');
        } catch (RuntimeException $exception) {
            $this->assertStringContainsString('not empty', $exception->getMessage());
        }

        $this->assertSame(1, DB::connection('supabase')->table('departments')->count());
        $this->assertSame(0, DB::connection('supabase')->table('users')->count());
        $this->assertSame(1, DB::connection('sqlite')->table('departments')->count());
    }
}
