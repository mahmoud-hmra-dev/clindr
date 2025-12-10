<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('doctors', function (Blueprint $table) {
            $table->boolean('accepting_new_patients')->default(true)->after('country');
            $table->unsignedTinyInteger('recommended_percent')->nullable()->after('accepting_new_patients');
            $table->unsignedSmallInteger('years_experience')->nullable()->after('recommended_percent');
            $table->timestamp('verified_at')->nullable()->after('years_experience');
        });

        Schema::table('clinics', function (Blueprint $table) {
            $table->decimal('fee_amount', 10, 2)->nullable()->after('image_url');
        });

        Schema::create('doctor_educations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('doctor_id')->constrained('doctors')->cascadeOnDelete();
            $table->string('degree');
            $table->string('institution')->nullable();
            $table->unsignedSmallInteger('year_completed')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('doctor_experiences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('doctor_id')->constrained('doctors')->cascadeOnDelete();
            $table->string('organization');
            $table->string('department')->nullable();
            $table->string('city')->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('doctor_awards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('doctor_id')->constrained('doctors')->cascadeOnDelete();
            $table->string('name');
            $table->unsignedSmallInteger('year')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('doctor_insurances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('doctor_id')->constrained('doctors')->cascadeOnDelete();
            $table->string('name');
            $table->string('logo_url')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('doctor_insurances');
        Schema::dropIfExists('doctor_awards');
        Schema::dropIfExists('doctor_experiences');
        Schema::dropIfExists('doctor_educations');

        Schema::table('clinics', function (Blueprint $table) {
            if (Schema::hasColumn('clinics', 'fee_amount')) {
                $table->dropColumn('fee_amount');
            }
        });

        Schema::table('doctors', function (Blueprint $table) {
            foreach (['accepting_new_patients', 'recommended_percent', 'years_experience', 'verified_at'] as $col) {
                if (Schema::hasColumn('doctors', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
