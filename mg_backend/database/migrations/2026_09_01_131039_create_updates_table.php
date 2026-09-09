<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('updates', function (Blueprint $table) {
            $table->id();

            $table->string('update_id')->unique();
            $table->string('update_title');
            $table->text('update_description');
            $table->string('update_image')->nullable();
            $table->date('update_date');
            $table->integer('update_duration')->nullable();
            $table->string('update_status')->default('active');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('updates');
    }
};