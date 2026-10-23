<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WorkerSqliteMirrorTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config([
            'database.default' => 'supabase',
            'database.connections.supabase.driver' => 'sqlite',
            'database.connections.supabase.database' => ':memory:',
            'database.connections.sqlite.database' => ':memory:',
        ]);
        DB::purge('supabase');
        DB::purge('sqlite');

        foreach (['supabase', 'sqlite'] as $connection) {
            Schema::connection($connection)->create('departments', function ($table) {
                $table->id();
                $table->string('department_id')->unique();
                $table->string('department_name');
                $table->timestamps();
            });
            Schema::connection($connection)->create('workers', function ($table) {
                $table->id();
                $table->string('worker_id')->unique();
                $table->string('worker_name');
                $table->string('worker_email')->nullable();
                $table->string('worker_tin')->nullable();
                $table->string('worker_nida')->nullable();
                $table->string('worker_phone');
                $table->string('worker_otherphone')->nullable();
                $table->decimal('workers_salary', 15, 2)->default(0);
                $table->unsignedBigInteger('department_id')->nullable();
                $table->date('worker_contact_date')->nullable();
                $table->integer('duration')->nullable();
                $table->date('worker_contact_end_date')->nullable();
                $table->string('worker_role')->nullable();
                $table->string('worker_status')->default('active');
                $table->text('worker_description')->nullable();
                $table->timestamps();
            });
        }
        Schema::connection('supabase')->create('worker_documents', function ($table) {
            $table->id();
            $table->foreignId('worker_id')->constrained('workers')->cascadeOnDelete();
            $table->string('original_name');
            $table->string('file_path')->unique();
            $table->unsignedBigInteger('file_size');
            $table->timestamps();
        });

        DB::connection('supabase')->table('departments')->insert([
            'id' => 2,
            'department_id' => 'DEPT-1',
            'department_name' => 'Engineering',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::connection('sqlite')->table('departments')->insert([
            'id' => 8,
            'department_id' => 'DEPT-1',
            'department_name' => 'Engineering',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Sanctum::actingAs((new User)->newFromBuilder([
            'id' => 1,
            'permissions' => '{"Workers":"Edit"}',
        ]));
    }

    protected function tearDown(): void
    {
        DB::purge('supabase');
        DB::purge('sqlite');

        parent::tearDown();
    }

    public function test_worker_create_update_and_delete_are_mirrored_to_sqlite(): void
    {
        $this->postJson('/api/workers', [
            'worker_id' => 'WR-MIRROR-1',
            'worker_name' => 'Mirrored worker',
            'worker_email' => 'worker@example.test',
            'worker_phone' => '+255700000000',
            'workers_salary' => 1000,
            'department_id' => 2,
            'worker_contact_date' => '2026-10-01',
            'worker_contact_end_date' => '2027-10-01',
        ])
            ->assertCreated()
            ->assertJsonPath('data.worker_id', 'WR-MIRROR-1');

        $sqliteWorker = DB::connection('sqlite')->table('workers')->where('worker_id', 'WR-MIRROR-1')->first();
        $this->assertNotNull($sqliteWorker);
        $this->assertSame('Mirrored worker', $sqliteWorker->worker_name);
        $this->assertSame(8, $sqliteWorker->department_id);

        $this->putJson('/api/workers/WR-MIRROR-1', [
            'worker_name' => 'Updated worker',
            'worker_phone' => '+255711111111',
            'workers_salary' => 1200,
        ])
            ->assertOk()
            ->assertJsonPath('data.worker_name', 'Updated worker');

        $this->assertSame(
            'Updated worker',
            DB::connection('sqlite')->table('workers')->where('worker_id', 'WR-MIRROR-1')->value('worker_name')
        );

        $this->deleteJson('/api/workers/WR-MIRROR-1')->assertOk();
        $this->assertSame(0, DB::connection('sqlite')->table('workers')->where('worker_id', 'WR-MIRROR-1')->count());
    }

    public function test_sqlite_mirror_failure_is_reported_without_hiding_the_supabase_save(): void
    {
        Schema::connection('sqlite')->drop('workers');

        $this->postJson('/api/workers', [
            'worker_id' => 'WR-MIRROR-FAIL',
            'worker_name' => 'Worker requiring mirror',
            'worker_phone' => '+255700000001',
            'workers_salary' => 1000,
        ])
            ->assertStatus(503)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Worker was saved to Supabase, but the SQLite copy could not be updated. Contact an administrator before retrying.');

        $this->assertSame(1, DB::connection('supabase')->table('workers')->where('worker_id', 'WR-MIRROR-FAIL')->count());
    }

    public function test_backfill_only_inserts_missing_supabase_workers(): void
    {
        DB::connection('supabase')->table('workers')->insert([
            'worker_id' => 'WR-BACKFILL-1',
            'worker_name' => 'Supabase worker',
            'worker_phone' => '+255700000002',
            'workers_salary' => 900,
            'worker_status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::connection('supabase')->table('workers')->insert([
            'worker_id' => 'WR-BACKFILL-2',
            'worker_name' => 'Missing local worker',
            'worker_phone' => '+255700000004',
            'workers_salary' => 950,
            'worker_status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::connection('sqlite')->table('workers')->insert([
            'worker_id' => 'WR-BACKFILL-1',
            'worker_name' => 'Existing local worker',
            'worker_phone' => '+255700000003',
            'workers_salary' => 800,
            'worker_status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Artisan::call('workers:mirror-to-sqlite');

        $this->assertSame(1, DB::connection('sqlite')->table('workers')->where('worker_id', 'WR-BACKFILL-1')->count());
        $this->assertSame(0, DB::connection('sqlite')->table('workers')->where('worker_id', 'WR-BACKFILL-2')->count());
        $this->assertSame(
            'Existing local worker',
            DB::connection('sqlite')->table('workers')->where('worker_id', 'WR-BACKFILL-1')->value('worker_name')
        );

        Artisan::call('workers:mirror-to-sqlite', ['--force' => true]);

        $this->assertSame(1, DB::connection('sqlite')->table('workers')->where('worker_id', 'WR-BACKFILL-1')->count());
        $this->assertSame(
            'Missing local worker',
            DB::connection('sqlite')->table('workers')->where('worker_id', 'WR-BACKFILL-2')->value('worker_name')
        );
        $this->assertSame(
            'Existing local worker',
            DB::connection('sqlite')->table('workers')->where('worker_id', 'WR-BACKFILL-1')->value('worker_name')
        );
    }
}
