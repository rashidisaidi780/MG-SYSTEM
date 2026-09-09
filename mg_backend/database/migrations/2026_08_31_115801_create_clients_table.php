<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clients', function (Blueprint $table) {
            $table->id();

            $table->string('client_id')->unique();
            $table->string('client_name');
            $table->string('client_email')->nullable();
            $table->string('client_phone');
            $table->text('client_address')->nullable();
            $table->string('client_otherphone')->nullable();
            $table->string('client_status')->default('active');
            $table->string('client_tin')->nullable();
            $table->date('client_date_added')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clients');
    }
};
