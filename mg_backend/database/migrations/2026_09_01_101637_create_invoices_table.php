<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
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

            $table->decimal('invoice_total_amount', 15, 2)->default(0);

            $table->string('invoice_status')->default('unpaid');
            $table->decimal('paid_amount', 15, 2)->default(0);
            $table->decimal('remaining_amount', 15, 2)->default(0);

            $table->date('invoice_date');
            $table->date('invoice_due_date')->nullable();

            $table->text('invoice_notes')->nullable();

            $table->timestamps();

            $table->foreign('client_id')
                  ->references('id')
                  ->on('clients')
                  ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};