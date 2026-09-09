<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();

            $table->string('order_id')->unique();

            $table->unsignedBigInteger('department_id')->nullable();

            $table->string('order_subject');
            $table->string('requester_name');
            $table->string('client_email')->nullable();

            $table->date('order_date');

            $table->string('order_status')->default('pending');

            $table->text('order_notes')->nullable();

            $table->timestamps();

            $table->foreign('department_id')
                  ->references('id')
                  ->on('departments')
                  ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};