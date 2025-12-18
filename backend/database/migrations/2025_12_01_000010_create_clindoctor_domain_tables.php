<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Ensure users table keeps role column per spec
        if (! Schema::hasColumn('users', 'role')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('role', 20)->nullable()->index()->after('email');
            });
        }

        Schema::create('doctors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('display_name')->nullable();
            $table->string('designation')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->json('languages_json')->nullable();
            $table->string('profile_image_path')->nullable();
            $table->text('bio')->nullable();
            $table->decimal('rating_avg', 3, 2)->nullable();
            $table->decimal('default_fee', 10, 2)->nullable();
            $table->string('city')->nullable();
            $table->string('country')->nullable();
            $table->timestamps();
        });

        Schema::create('patients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('first_name');
            $table->string('last_name');
            $table->date('dob')->nullable();
            $table->string('blood_group', 10)->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('address')->nullable();
            $table->string('city')->nullable();
            $table->string('state')->nullable();
            $table->string('country')->nullable();
            $table->string('pincode', 20)->nullable();
            $table->timestamps();
        });

        Schema::create('specialties', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('doctor_services', function (Blueprint $table) {
            $table->id();
            $table->foreignId('doctor_id')->constrained('doctors')->cascadeOnDelete();
            $table->foreignId('specialty_id')->constrained('specialties')->cascadeOnDelete();
            $table->string('name');
            $table->decimal('price', 10, 2)->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('clinics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('doctor_id')->constrained('doctors')->cascadeOnDelete();
            $table->string('name');
            $table->string('address')->nullable();
            $table->string('city')->nullable();
            $table->string('image_url')->nullable();
            $table->timestamps();
        });

        Schema::create('doctor_availabilities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('doctor_id')->constrained('doctors')->cascadeOnDelete();
            $table->foreignId('clinic_id')->nullable()->constrained('clinics')->nullOnDelete();
            $table->date('date');
            $table->string('day_of_week', 20)->nullable(); // kept for backward compatibility
            $table->time('start_time');
            $table->string('availability_type', 20)->default('online'); // clinic | online
            $table->string('status', 30)->default('active');
            $table->unsignedInteger('slot_capacity')->default(1);
            $table->decimal('fee_amount', 10, 2)->nullable();
            $table->timestamps();

            $table->index(['doctor_id', 'date']);
        });

        // Backward/forwards compatibility if the table already exists and misses new columns.
        if (Schema::hasTable('doctor_availabilities')) {
            Schema::table('doctor_availabilities', function (Blueprint $table) {
                if (! Schema::hasColumn('doctor_availabilities', 'date')) {
                    $table->date('date')->nullable()->after('clinic_id');
                }
                if (! Schema::hasColumn('doctor_availabilities', 'day_of_week')) {
                    $table->string('day_of_week', 20)->nullable()->after('date');
                }
                if (! Schema::hasColumn('doctor_availabilities', 'availability_type')) {
                    $table->string('availability_type', 20)->default('online')->after('start_time');
                }
                if (! Schema::hasColumn('doctor_availabilities', 'status')) {
                    $table->string('status', 30)->default('active')->after('availability_type');
                }
            });
        }

        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('doctor_id')->constrained('doctors')->cascadeOnDelete();
            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->string('appointment_type', 20);
            $table->string('visit_type', 50)->nullable();
            $table->dateTime('scheduled_at');
            $table->unsignedInteger('duration_minutes')->nullable();
            $table->string('status', 20);
            $table->text('reason')->nullable();
            $table->text('notes')->nullable();
            $table->string('clinic_location')->nullable();
            $table->string('online_meeting_url')->nullable();
            $table->string('twilio_room_sid')->nullable();
            $table->string('areeba_transaction_id')->nullable();
            $table->string('areeba_payment_status', 20)->nullable();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('cancelled_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('cancelled_reason')->nullable();
            $table->string('patient_email')->nullable();
            $table->string('patient_phone')->nullable();
            $table->timestamps();
        });

        Schema::create('dependents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->string('name');
            $table->string('gender', 20)->nullable();
            $table->string('relationship', 50)->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('blood_group', 10)->nullable();
            $table->date('dob')->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
        });

        Schema::create('medical_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->foreignId('dependent_id')->nullable()->constrained('dependents')->nullOnDelete();
            $table->foreignId('doctor_id')->nullable()->constrained('doctors')->nullOnDelete();
            $table->foreignId('appointment_id')->nullable()->constrained('appointments')->nullOnDelete();
            $table->string('record_type', 100);
            $table->string('title');
            $table->dateTime('recorded_at')->nullable();
            $table->text('comments')->nullable();
            $table->string('file_url')->nullable();
            $table->timestamps();
        });

        Schema::create('prescriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appointment_id')->nullable()->constrained('appointments')->nullOnDelete();
            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->foreignId('doctor_id')->constrained('doctors')->cascadeOnDelete();
            $table->string('name');
            $table->dateTime('issued_at')->nullable();
            $table->string('file_url')->nullable();
            $table->timestamps();
        });

        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appointment_id')->nullable()->constrained('appointments')->nullOnDelete();
            $table->foreignId('doctor_id')->constrained('doctors')->cascadeOnDelete();
            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->unsignedTinyInteger('rating');
            $table->text('comment')->nullable();
            $table->foreignId('reply_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('reply_text')->nullable();
            $table->dateTime('reply_at')->nullable();
            $table->timestamps();
        });

        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appointment_id')->nullable()->constrained('appointments')->nullOnDelete();
            $table->foreignId('doctor_id')->constrained('doctors')->cascadeOnDelete();
            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->decimal('amount', 10, 2);
            $table->string('currency', 10)->default('USD');
            $table->dateTime('booked_on')->nullable();
            $table->string('status', 20)->default('pending');
            $table->date('due_date')->nullable();
            $table->string('pdf_url')->nullable();
            $table->string('payment_status', 30)->nullable();
            $table->string('payment_id')->nullable();
            $table->timestamps();
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appointment_id')->nullable()->constrained('appointments')->nullOnDelete();
            $table->foreignId('invoice_id')->nullable()->constrained('invoices')->nullOnDelete();
            $table->decimal('amount', 10, 2);
            $table->string('currency', 10)->default('USD');
            $table->string('areeba_transaction_id')->nullable()->index();
            $table->string('status', 20)->default('pending')->index();
            $table->string('redirect_url')->nullable();
            $table->json('raw_response_json')->nullable();
            $table->dateTime('paid_at')->nullable();
            $table->timestamps();
        });

        Schema::create('wallet_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->string('account_no');
            $table->string('reason')->nullable();
            $table->dateTime('transaction_date')->nullable();
            $table->decimal('amount', 10, 2);
            $table->string('status', 20)->default('pending');
            $table->string('direction', 10); // debit | credit
            $table->timestamps();
        });

        Schema::create('vitals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->foreignId('dependent_id')->nullable()->constrained('dependents')->nullOnDelete();
            $table->string('blood_pressure', 30)->nullable();
            $table->unsignedSmallInteger('heart_rate')->nullable();
            $table->string('glucose_level', 30)->nullable();
            $table->string('body_temperature', 30)->nullable();
            $table->decimal('bmi', 5, 2)->nullable();
            $table->unsignedTinyInteger('spo2')->nullable();
            $table->decimal('weight', 6, 2)->nullable();
            $table->string('fbc_status', 50)->nullable();
            $table->dateTime('recorded_at')->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('conversations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('doctor_id')->constrained('doctors')->cascadeOnDelete();
            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->dateTime('last_message_at')->nullable();
            $table->foreignId('pinned_by')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedInteger('unread_doctor')->default(0);
            $table->unsignedInteger('unread_patient')->default(0);
            $table->timestamps();
        });

        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained('conversations')->cascadeOnDelete();
            $table->foreignId('sender_id')->constrained('users')->cascadeOnDelete();
            $table->text('body')->nullable();
            $table->string('message_type', 30)->default('text');
            $table->string('attachment_url')->nullable();
            $table->dateTime('sent_at')->nullable();
            $table->string('status', 20)->nullable();
            $table->foreignId('reply_to_id')->nullable()->constrained('messages')->nullOnDelete();
            $table->json('metadata_json')->nullable();
            $table->timestamps();
        });

        Schema::create('social_links', function (Blueprint $table) {
            $table->id();
            $table->foreignId('doctor_id')->constrained('doctors')->cascadeOnDelete();
            $table->string('platform', 50);
            $table->string('url');
            $table->timestamps();
        });

        Schema::create('memberships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('doctor_id')->constrained('doctors')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('type')->nullable();
            $table->text('message');
            $table->json('data')->nullable();
            $table->dateTime('read_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('memberships');
        Schema::dropIfExists('social_links');
        Schema::dropIfExists('messages');
        Schema::dropIfExists('conversations');
        Schema::dropIfExists('vitals');
        Schema::dropIfExists('wallet_transactions');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('reviews');
        Schema::dropIfExists('prescriptions');
        Schema::dropIfExists('medical_records');
        Schema::dropIfExists('dependents');
        Schema::dropIfExists('appointments');
        Schema::dropIfExists('doctor_availabilities');
        Schema::dropIfExists('clinics');
        Schema::dropIfExists('doctor_services');
        Schema::dropIfExists('specialties');
        Schema::dropIfExists('patients');
        Schema::dropIfExists('doctors');

        if (Schema::hasColumn('users', 'role')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('role');
            });
        }
    }
};
