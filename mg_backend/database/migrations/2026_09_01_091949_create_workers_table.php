<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workers', function (Blueprint $table) {
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

            $table->foreign('department_id')
                  ->references('id')
                  ->on('departments')
                  ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workers');
    }
};