<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WorkerDocumentTest extends TestCase
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
        Storage::fake('local');

        foreach (['supabase', 'sqlite'] as $connection) {
            Schema::connection($connection)->create('workers', function ($table) {
                $table->id();
                $table->string('worker_id')->unique();
                $table->string('worker_name');
                $table->timestamps();
            });
            Schema::connection($connection)->create('worker_documents', function ($table) {
                $table->id();
                $table->foreignId('worker_id')->constrained('workers')->cascadeOnDelete();
                $table->string('original_name');
                $table->string('file_path')->unique();
                $table->unsignedBigInteger('file_size');
                $table->longText('content_base64')->nullable();
                $table->timestamps();
            });
            DB::connection($connection)->table('workers')->insert([
                'worker_id' => 'WR-1',
                'worker_name' => 'Test Worker',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    protected function tearDown(): void
    {
        DB::purge('supabase');
        DB::purge('sqlite');

        parent::tearDown();
    }

    public function test_worker_editors_can_upload_multiple_pdfs_and_viewers_can_download_them(): void
    {
        Sanctum::actingAs((new User)->newFromBuilder([
            'id' => 1,
            'permissions' => '{"Workers":"Edit"}',
        ]));

        $response = $this->post('/api/workers/1/documents', [
            'documents' => [
                UploadedFile::fake()->createWithContent('contract.pdf', "%PDF-1.4\ncontract content\n%%EOF"),
                UploadedFile::fake()->createWithContent('certificate.pdf', "%PDF-1.4\ncertificate content\n%%EOF"),
            ],
        ], ['Accept' => 'application/json'])->assertCreated();

        $document = $response->json('data.0');
        $this->assertArrayNotHasKey('content_base64', $document);
        $supabaseDocument = DB::connection('supabase')->table('worker_documents')->where('original_name', 'contract.pdf')->first();
        $sqliteDocument = DB::connection('sqlite')->table('worker_documents')->where('file_path', $supabaseDocument->file_path)->first();
        $this->assertNotEmpty($supabaseDocument->content_base64);
        $this->assertSame($supabaseDocument->content_base64, $sqliteDocument->content_base64);
        $this->assertSame(2, DB::connection('supabase')->table('worker_documents')->count());
        $this->assertSame(2, DB::connection('sqlite')->table('worker_documents')->count());
        $this->assertCount(2, $response->json('data'));

        Sanctum::actingAs((new User)->newFromBuilder([
            'id' => 2,
            'permissions' => '{"Workers":"View"}',
        ]));

        $this->getJson('/api/workers/1/documents')
            ->assertOk()
            ->assertJsonCount(2, 'data');
        $download = $this->get('/api/workers/1/documents/'.$document['id'])->assertOk();
        $download->assertHeader('content-type', 'application/pdf');
        $this->assertSame(base64_decode($supabaseDocument->content_base64), $download->streamedContent());
        $this->assertStringContainsString('filename=contract.pdf', $download->headers->get('content-disposition'));

        Sanctum::actingAs((new User)->newFromBuilder([
            'id' => 1,
            'permissions' => '{"Workers":"Edit"}',
        ]));
        $this->deleteJson('/api/workers/1/documents/'.$document['id'])->assertOk();
        $this->assertSame(0, DB::connection('supabase')->table('worker_documents')->where('original_name', 'contract.pdf')->count());
        $this->assertSame(0, DB::connection('sqlite')->table('worker_documents')->where('original_name', 'contract.pdf')->count());
    }

    public function test_worker_viewers_cannot_upload_or_delete_documents(): void
    {
        Sanctum::actingAs((new User)->newFromBuilder([
            'id' => 1,
            'permissions' => '{"Workers":"View"}',
        ]));

        $this->postJson('/api/workers/1/documents', [
            'documents' => [UploadedFile::fake()->create('contract.pdf', 10, 'application/pdf')],
        ])->assertForbidden();

        $this->deleteJson('/api/workers/1/documents/1')->assertForbidden();
    }

    public function test_worker_document_delete_removes_both_database_copies_when_ids_differ(): void
    {
        $filePath = 'database/worker-documents/WR-1/document.pdf';
        $timestamp = now();
        DB::connection('sqlite')->table('worker_documents')->insert([
            'worker_id' => 1,
            'original_name' => 'sqlite-only.pdf',
            'file_path' => 'database/worker-documents/WR-1/sqlite-only.pdf',
            'file_size' => 10,
            'content_base64' => base64_encode('sqlite-only'),
            'created_at' => $timestamp,
            'updated_at' => $timestamp,
        ]);

        foreach (['supabase', 'sqlite'] as $connection) {
            DB::connection($connection)->table('worker_documents')->insert([
                'worker_id' => 1,
                'original_name' => 'document.pdf',
                'file_path' => $filePath,
                'file_size' => 12,
                'content_base64' => base64_encode('document'),
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ]);
        }

        $this->assertNotSame(
            DB::connection('supabase')->table('worker_documents')->where('file_path', $filePath)->value('id'),
            DB::connection('sqlite')->table('worker_documents')->where('file_path', $filePath)->value('id')
        );

        Sanctum::actingAs((new User)->newFromBuilder([
            'id' => 1,
            'permissions' => '{"Workers":"Edit"}',
        ]));

        $this->deleteJson('/api/workers/1/documents/1')->assertOk();

        foreach (['supabase', 'sqlite'] as $connection) {
            $this->assertSame(0, DB::connection($connection)->table('worker_documents')->where('file_path', $filePath)->count());
        }
        $this->assertSame(1, DB::connection('sqlite')->table('worker_documents')->where('original_name', 'sqlite-only.pdf')->count());
    }

    public function test_non_pdf_documents_are_rejected(): void
    {
        Sanctum::actingAs((new User)->newFromBuilder([
            'id' => 1,
            'permissions' => '{"Workers":"Edit"}',
        ]));

        $this->postJson('/api/workers/1/documents', [
            'documents' => [UploadedFile::fake()->create('notes.txt', 10, 'text/plain')],
        ])->assertUnprocessable();
    }

    public function test_backfill_copies_existing_private_pdf_files_into_both_databases(): void
    {
        $filePath = 'worker-documents/1/legacy.pdf';
        $contents = "%PDF-1.4\nexisting worker document\n%%EOF";
        Storage::disk('local')->put($filePath, $contents);
        DB::connection('supabase')->table('worker_documents')->insert([
            'worker_id' => 1,
            'original_name' => 'legacy.pdf',
            'file_path' => $filePath,
            'file_size' => strlen($contents),
            'content_base64' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Artisan::call('worker-documents:backfill-databases', ['--force' => true]);

        $supabaseDocument = DB::connection('supabase')->table('worker_documents')->where('file_path', $filePath)->first();
        $sqliteDocument = DB::connection('sqlite')->table('worker_documents')->where('file_path', $filePath)->first();
        $this->assertSame(base64_encode($contents), $supabaseDocument->content_base64);
        $this->assertSame($supabaseDocument->content_base64, $sqliteDocument->content_base64);
        $this->assertSame(1, DB::connection('sqlite')->table('worker_documents')->where('file_path', $filePath)->count());
    }
}
