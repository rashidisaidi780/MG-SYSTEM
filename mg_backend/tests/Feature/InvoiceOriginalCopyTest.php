<?php

namespace Tests\Feature;

use App\Models\Admin;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class InvoiceOriginalCopyTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config([
            'database.default' => 'supabase',
            'database.connections.supabase.driver' => 'sqlite',
            'database.connections.supabase.database' => ':memory:',
            'app.url' => 'http://localhost',
        ]);
        DB::purge('supabase');

        Schema::connection('supabase')->create('clients', function ($table) {
            $table->id();
            $table->string('client_name')->nullable();
        });
        Schema::connection('supabase')->create('invoices', function ($table) {
            $table->id();
            $table->string('invoice_id')->unique();
            $table->unsignedBigInteger('client_id')->nullable();
            $table->string('company_name');
            $table->string('client_tin')->nullable();
            $table->string('client_email')->nullable();
            $table->string('client_phone')->nullable();
            $table->text('client_address')->nullable();
            $table->string('country')->nullable();
            $table->text('item_description');
            $table->integer('item_quantity')->default(1);
            $table->decimal('item_unit_price', 15, 2)->default(0);
            $table->decimal('item_total_price', 15, 2)->default(0);
            $table->text('invoice_items')->nullable();
            $table->decimal('invoice_total_amount', 15, 2)->default(0);
            $table->decimal('paid_amount', 15, 2)->default(0);
            $table->decimal('remaining_amount', 15, 2)->default(0);
            $table->string('invoice_status')->default('unpaid');
            $table->date('invoice_date');
            $table->date('invoice_due_date')->nullable();
            $table->text('invoice_notes')->nullable();
            $table->timestamps();
        });

        DB::connection('supabase')->table('invoices')->insert([
            'invoice_id' => 'INV-2026-001',
            'company_name' => 'Example Client Ltd',
            'item_description' => 'Consulting',
            'invoice_items' => json_encode([[
                'desc' => 'Consulting',
                'quantity' => 2,
                'amount' => 50000,
            ]]),
            'invoice_total_amount' => 100000,
            'invoice_status' => 'unpaid',
            'invoice_date' => '2026-11-01',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    protected function tearDown(): void
    {
        DB::purge('supabase');

        parent::tearDown();
    }

    public function test_it_opens_a_signed_read_only_original_invoice_copy(): void
    {
        Sanctum::actingAs((new Admin)->newFromBuilder(['id' => 1]));

        $url = $this->getJson('/api/invoices/INV-2026-001/original-link')
            ->assertOk()
            ->json('data.url');

        $parts = parse_url($url);
        $this->get($parts['path'] . '?' . $parts['query'])
            ->assertOk()
            ->assertSee('Verified original copy')
            ->assertSee('INV-2026-001')
            ->assertSee('Example Client Ltd')
            ->assertSee('100,000');
    }

    public function test_it_rejects_a_modified_original_copy_link(): void
    {
        Sanctum::actingAs((new Admin)->newFromBuilder(['id' => 1]));

        $url = $this->getJson('/api/invoices/INV-2026-001/original-link')
            ->assertOk()
            ->json('data.url');
        $parts = parse_url($url);
        parse_str($parts['query'], $query);
        $query['invoice'] = 'INV-2026-002';

        $this->get($parts['path'] . '?' . http_build_query($query))
            ->assertForbidden();
    }
}
