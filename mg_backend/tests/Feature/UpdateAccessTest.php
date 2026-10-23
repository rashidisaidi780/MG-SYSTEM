<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UpdateAccessTest extends TestCase
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
        Storage::fake('local');

        Schema::connection('supabase')->create('updates', function ($table) {
            $table->id();
            $table->string('update_id')->unique();
            $table->string('update_title');
            $table->text('update_description');
            $table->text('update_image')->nullable();
            $table->string('update_link', 2048)->nullable();
            $table->date('update_date');
            $table->unsignedInteger('update_duration')->nullable();
            $table->string('update_status')->nullable();
            $table->boolean('is_new')->default(false);
            $table->timestamps();
        });
    }

    protected function tearDown(): void
    {
        DB::purge('supabase');

        parent::tearDown();
    }

    public function test_authenticated_users_without_event_permissions_can_view_events(): void
    {
        DB::connection('supabase')->table('updates')->insert([
            'update_id' => 'UPD-1',
            'update_title' => 'Company event',
            'update_description' => 'Event details',
            'update_image' => 'data:image/png;base64,dGVzdA==',
            'update_date' => now()->toDateString(),
            'update_duration' => 7,
            'update_status' => 'active',
            'is_new' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        Sanctum::actingAs((new User)->newFromBuilder([
            'id' => 1,
            'permissions' => '{}',
        ]));

        $this->getJson('/api/updates')
            ->assertOk()
            ->assertJsonPath('data.0.update_title', 'Company event')
            ->assertJsonPath('data.0.update_image', 'data:image/png;base64,dGVzdA==');
        $this->getJson('/api/updates/1')
            ->assertOk()
            ->assertJsonPath('data.update_title', 'Company event');
    }

    public function test_users_without_event_edit_permission_cannot_create_events(): void
    {
        Sanctum::actingAs((new User)->newFromBuilder([
            'id' => 1,
            'permissions' => '{"Event & Updates":"View"}',
        ]));

        $this->postJson('/api/updates', [
            'update_id' => 'UPD-2',
            'update_title' => 'Restricted event',
            'update_description' => 'Event details',
            'update_date' => now()->toDateString(),
        ])->assertForbidden();
    }

    public function test_event_editors_can_upload_videos_for_other_users_to_download(): void
    {
        Sanctum::actingAs((new User)->newFromBuilder([
            'id' => 1,
            'permissions' => '{"Event & Updates":"Edit"}',
        ]));

        $response = $this->post('/api/updates', [
            'update_id' => 'UPD-VIDEO',
            'update_title' => 'Company video',
            'update_description' => 'Event video',
            'update_date' => now()->toDateString(),
            'update_duration' => 7,
            'is_new' => true,
            'update_status' => 'active',
            'media' => UploadedFile::fake()->create('event.mp4', 1, 'video/mp4'),
        ], ['Accept' => 'application/json'])->assertCreated();

        $id = $response->json('data.id');
        $mediaPath = $response->json('data.update_image');
        Storage::disk('local')->assertExists($mediaPath);

        Sanctum::actingAs((new User)->newFromBuilder([
            'id' => 2,
            'permissions' => '{"Event & Updates":"View"}',
        ]));

        $this->get("/api/updates/{$id}/media")
            ->assertOk()
            ->assertHeader('content-type', 'video/mp4');
        $this->get("/api/updates/{$id}/media?download=1")
            ->assertOk()
            ->assertHeader('content-disposition', 'attachment; filename='.basename($mediaPath));
    }

    public function test_event_editors_can_publish_links_for_other_users_to_open(): void
    {
        Sanctum::actingAs((new User)->newFromBuilder([
            'id' => 1,
            'permissions' => '{"Event & Updates":"Edit"}',
        ]));

        $this->postJson('/api/updates', [
            'update_id' => 'UPD-LINK',
            'update_title' => 'Event registration',
            'update_description' => 'Register at the link below',
            'update_link' => 'https://example.com/register',
            'update_date' => now()->toDateString(),
        ])->assertCreated()
            ->assertJsonPath('data.update_link', 'https://example.com/register');

        Sanctum::actingAs((new User)->newFromBuilder([
            'id' => 2,
            'permissions' => '{}',
        ]));

        $this->getJson('/api/updates')
            ->assertOk()
            ->assertJsonPath('data.0.update_link', 'https://example.com/register');
    }

    public function test_event_links_only_allow_http_and_https_urls(): void
    {
        Sanctum::actingAs((new User)->newFromBuilder([
            'id' => 1,
            'permissions' => '{"Event & Updates":"Edit"}',
        ]));

        $this->postJson('/api/updates', [
            'update_id' => 'UPD-INVALID-LINK',
            'update_title' => 'Unsafe link',
            'update_description' => 'Invalid protocol',
            'update_link' => 'javascript:alert(1)',
            'update_date' => now()->toDateString(),
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('update_link');
    }
}
