<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('project_id')->unique();
            $table->string('project_name');

            $table->foreignId('client_id')
                ->constrained('clients')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->decimal('project_budget', 15, 2)->default(0);

            $table->string('project_status')->default('pending');

            $table->unsignedTinyInteger('project_progress')->default(0);

            $table->foreignId('project_leader')
                ->constrained('users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->date('project_start_date');
            $table->date('project_end_date')->nullable();

            $table->text('project_details')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
