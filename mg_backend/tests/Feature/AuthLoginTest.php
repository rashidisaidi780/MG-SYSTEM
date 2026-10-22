<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class AuthLoginTest extends TestCase
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

        Schema::connection('supabase')->create('admins', function ($table) {
            $table->id();
            $table->string('full_name');
            $table->string('username');
            $table->string('email');
            $table->string('password');
            $table->timestamps();
        });
        Schema::connection('supabase')->create('users', function ($table) {
            $table->id();
            $table->string('user_id');
            $table->string('user_name');
            $table->string('user_email');
            $table->string('user_password');
            $table->string('user_role');
            $table->text('permissions')->nullable();
            $table->timestamps();
        });
        Schema::connection('supabase')->create('personal_access_tokens', function ($table) {
            $table->id();
            $table->morphs('tokenable');
            $table->string('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });
    }

    protected function tearDown(): void
    {
        DB::purge('supabase');

        parent::tearDown();
    }

    public function test_it_authenticates_a_user_using_the_combined_account_lookup(): void
    {
        DB::connection('supabase')->table('users')->insert([
            'user_id' => 'user-1',
            'user_name' => 'staff',
            'user_email' => 'staff@example.com',
            'user_password' => Hash::make('correct-password'),
            'user_role' => 'Employee',
            'permissions' => '{"Projects":"View"}',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->postJson('/api/auth/login', [
            'username' => 'staff',
            'password' => 'correct-password',
        ])
            ->assertOk()
            ->assertJsonPath('user.id', 'user-1')
            ->assertJsonPath('user.username', 'staff')
            ->assertJsonPath('user.permissions.Projects', 'View')
            ->assertJsonStructure(['token']);

        $this->assertSame(1, DB::connection('supabase')->table('personal_access_tokens')->count());
    }

    public function test_it_authenticates_an_admin_and_keeps_admin_precedence(): void
    {
        DB::connection('supabase')->table('admins')->insert([
            'full_name' => 'Test Admin',
            'username' => 'manager',
            'email' => 'manager@example.com',
            'password' => Hash::make('admin-password'),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->postJson('/api/auth/login', [
            'username' => 'manager@example.com',
            'password' => 'admin-password',
        ])
            ->assertOk()
            ->assertJsonPath('type', 'admin')
            ->assertJsonPath('user.name', 'Test Admin')
            ->assertJsonPath('user.permissions.0', '*');
    }

    public function test_it_rejects_invalid_credentials(): void
    {
        $this->postJson('/api/auth/login', [
            'username' => 'missing',
            'password' => 'wrong-password',
        ])->assertUnprocessable();
    }
}
