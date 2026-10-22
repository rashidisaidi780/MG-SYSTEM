<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DashboardSummaryTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config([
            'database.default' => 'supabase',
            'database.connections.supabase.driver' => 'sqlite',
            'database.connections.supabase.database' => ':memory:',
        ]);
        DB::purge('supabase');

        Schema::connection('supabase')->create('invoices', function ($table) {
            $table->id();
            $table->string('invoice_id');
            $table->date('invoice_due_date')->nullable();
            $table->string('invoice_status');
        });
        Schema::connection('supabase')->create('projects', function ($table) {
            $table->id();
            $table->string('project_name');
            $table->date('project_end_date')->nullable();
            $table->unsignedTinyInteger('project_progress')->default(0);
        });
        Schema::connection('supabase')->create('clients', function ($table) {
            $table->id();
        });
        Schema::connection('supabase')->create('bookings', function ($table) {
            $table->id();
            $table->string('booking_id');
            $table->date('booking_date');
        });
        Schema::connection('supabase')->create('orders', function ($table) {
            $table->id();
            $table->string('order_id');
            $table->date('order_date');
        });
        Schema::connection('supabase')->create('workers', function ($table) {
            $table->id();
            $table->string('worker_name');
            $table->date('worker_contact_end_date')->nullable();
        });
    }

    protected function tearDown(): void
    {
        DB::purge('supabase');

        parent::tearDown();
    }

    public function test_it_returns_dashboard_counts_and_deadlines_in_one_summary(): void
    {
        $date = now()->addDays(5)->toDateString();
        DB::connection('supabase')->table('invoices')->insert([
            'invoice_id' => 'INV-1',
            'invoice_due_date' => $date,
            'invoice_status' => 'unpaid',
        ]);
        DB::connection('supabase')->table('projects')->insert([
            'project_name' => 'Project 1',
            'project_end_date' => $date,
            'project_progress' => 50,
        ]);
        DB::connection('supabase')->table('clients')->insert([['id' => 1], ['id' => 2]]);
        DB::connection('supabase')->table('bookings')->insert([
            'booking_id' => 'BO-1',
            'booking_date' => $date,
        ]);
        DB::connection('supabase')->table('orders')->insert([
            'order_id' => 'OO-1',
            'order_date' => $date,
        ]);
        DB::connection('supabase')->table('workers')->insert([
            'worker_name' => 'Worker 1',
            'worker_contact_end_date' => $date,
        ]);

        Sanctum::actingAs((new Admin)->newFromBuilder(['id' => 1]));

        $this->getJson('/api/dashboard/summary')
            ->assertOk()
            ->assertJsonPath('data.invoiceCount', 1)
            ->assertJsonPath('data.projectCount', 1)
            ->assertJsonPath('data.clientCount', 2)
            ->assertJsonPath('data.bookingCount', 1)
            ->assertJsonPath('data.officeOrderCount', 1)
            ->assertJsonCount(5, 'data.deadlines');
    }

    public function test_it_only_includes_data_the_user_can_view(): void
    {
        DB::connection('supabase')->table('projects')->insert([
            'project_name' => 'Private project',
            'project_end_date' => now()->addDays(5)->toDateString(),
            'project_progress' => 20,
        ]);
        DB::connection('supabase')->table('clients')->insert([['id' => 1], ['id' => 2]]);

        Sanctum::actingAs((new User)->newFromBuilder([
            'id' => 2,
            'permissions' => '{"Projects":"View"}',
        ]));

        $this->getJson('/api/dashboard/summary')
            ->assertOk()
            ->assertJsonPath('data.projectCount', 1)
            ->assertJsonPath('data.clientCount', 0)
            ->assertJsonCount(1, 'data.deadlines');
    }
}
