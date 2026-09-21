<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('updates', function (Blueprint $table) {
            $table->boolean('is_new')->default(true)->after('update_status');
            $table->text('update_image')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('updates', function (Blueprint $table) {
            $table->dropColumn('is_new');
            $table->string('update_image')->nullable()->change();
        });
    }
};