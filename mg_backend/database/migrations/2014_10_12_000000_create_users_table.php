<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();

            $table->string('user_id')->unique();
            $table->string('user_name');
            $table->string('user_email')->unique();
            $table->string('user_password');

            $table->unsignedBigInteger('department_id')->nullable();

            $table->string('user_role')->default('user');
            $table->string('user_status')->default('active');

            $table->rememberToken();
            $table->timestamps();

            if (Schema::getConnection()->getDriverName() === 'sqlite' || Schema::hasTable('departments')) {
                $table->foreign('department_id')
                    ->references('id')
                    ->on('departments')
                    ->onDelete('set null');
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
