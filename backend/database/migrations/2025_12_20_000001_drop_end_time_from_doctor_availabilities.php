<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('doctor_availabilities', 'end_time')) {
            Schema::table('doctor_availabilities', function (Blueprint $table) {
                $table->dropColumn('end_time');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasColumn('doctor_availabilities', 'end_time')) {
            Schema::table('doctor_availabilities', function (Blueprint $table) {
                $table->time('end_time')->nullable()->after('start_time');
            });
        }
    }
};
