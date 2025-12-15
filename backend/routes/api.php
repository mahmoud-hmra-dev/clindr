<?php

use App\Http\Controllers\API\Admin\DoctorController as AdminDoctorController;
use App\Http\Controllers\API\Admin\InvoiceController as AdminInvoiceController;
use App\Http\Controllers\API\Admin\PatientController as AdminPatientController;
use App\Http\Controllers\API\Admin\SpecialtyController as AdminSpecialtyController;
use App\Http\Controllers\API\Admin\UserController as AdminUserController;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\AppointmentOnlineController;
use App\Http\Controllers\API\Doctor\AppointmentController as DoctorAppointmentController;
use App\Http\Controllers\API\Doctor\AvailabilityController as DoctorAvailabilityController;
use App\Http\Controllers\API\Doctor\ClinicController as DoctorClinicController;
use App\Http\Controllers\API\Doctor\InvoiceController as DoctorInvoiceController;
use App\Http\Controllers\API\Doctor\PatientController as DoctorPatientController;
use App\Http\Controllers\API\Doctor\ProfileController as DoctorProfileController;
use App\Http\Controllers\API\Doctor\PrescriptionController as DoctorPrescriptionController;
use App\Http\Controllers\API\Doctor\ServiceController as DoctorServiceController;
use App\Http\Controllers\API\Payment\AreebaPaymentController;
use App\Http\Controllers\API\Patient\AppointmentController as PatientAppointmentController;
use App\Http\Controllers\API\Patient\DependentController;
use App\Http\Controllers\API\Patient\FavouriteController;
use App\Http\Controllers\API\Patient\InvoiceController as PatientInvoiceController;
use App\Http\Controllers\API\Patient\MedicalRecordController;
use App\Http\Controllers\API\Doctor\MedicalRecordController as DoctorMedicalRecordController;

use App\Http\Controllers\API\Patient\VitalController;
use App\Http\Controllers\API\DoctorPublicController;
use App\Http\Controllers\API\Admin\ReviewController as AdminReviewController;
use App\Http\Controllers\API\Patient\ReviewController as PatientReviewController;
use App\Http\Controllers\API\Doctor\ReviewController as DoctorReviewController;
use App\Http\Controllers\API\Patient\ProfileController as PatientProfileController;
use App\Http\Controllers\API\Patient\ChatController as PatientChatController;
use App\Http\Controllers\API\Doctor\ChatController as DoctorChatController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('register-patient', [AuthController::class, 'registerPatient']);
    Route::post('register-doctor', [AuthController::class, 'registerDoctor']);
    Route::post('login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('change-password', [AuthController::class, 'changePassword']);
    });
});

Route::middleware(['auth:sanctum', 'role:patient', 'permission:appointment.view_own'])->prefix('patient')->group(function () {
    Route::get('appointments', [PatientAppointmentController::class, 'index']);
    Route::post('appointments', [PatientAppointmentController::class, 'store']);
    Route::get('appointments/{appointment}', [PatientAppointmentController::class, 'show']);
    Route::put('appointments/{appointment}/cancel', [PatientAppointmentController::class, 'cancel']);
    Route::get('profile', [PatientProfileController::class, 'show']);
    Route::put('profile', [PatientProfileController::class, 'update']);

    Route::get('favourites', [FavouriteController::class, 'index']);
    Route::post('favourites', [FavouriteController::class, 'store']);
    Route::delete('favourites/{id}', [FavouriteController::class, 'destroy']);
    Route::get('conversations', [PatientChatController::class, 'conversations']);
    Route::get('conversations/{conversation}/messages', [PatientChatController::class, 'messages']);
    Route::post('conversations/messages', [PatientChatController::class, 'send']);

    Route::apiResource('dependents', DependentController::class);
    Route::apiResource('medical-records', MedicalRecordController::class);
    Route::apiResource('vitals', VitalController::class);
    Route::apiResource('invoices', PatientInvoiceController::class)->only(['index', 'show']);
    Route::get('reviews', [PatientReviewController::class, 'index']);
});

Route::middleware(['auth:sanctum', 'role:patient'])->post('payments/areeba/create', [AreebaPaymentController::class, 'create']);
Route::match(['get', 'post'], 'payments/areeba/callback', [AreebaPaymentController::class, 'callback']);

Route::get('doctors', [DoctorPublicController::class, 'index']);
Route::get('doctors/{doctor}', [DoctorPublicController::class, 'show']);
Route::get('doctors/{doctor}/booked-slots', [DoctorPublicController::class, 'bookedSlots']);
Route::get('specialties', [DoctorPublicController::class, 'specialties']);
Route::get('specialties', [AdminSpecialtyController::class, 'index']);

Route::middleware(['auth:sanctum', 'role:doctor', 'permission:appointment.view_own'])->prefix('doctor')->group(function () {
    Route::get('appointments', [DoctorAppointmentController::class, 'index']);
    Route::get('appointments/{appointment}', [DoctorAppointmentController::class, 'show']);
    Route::put('appointments/{appointment}/status', [DoctorAppointmentController::class, 'updateStatus']);

        Route::get('appointments/{appointment}/medical-records', [DoctorMedicalRecordController::class, 'index']); // لو عندك index
        Route::post('appointments/{appointment}/medical-records', [DoctorMedicalRecordController::class, 'store']);
        Route::post('medical-records/{medicalRecord}', [DoctorMedicalRecordController::class, 'update']); // مع _method=PUT
        Route::delete('medical-records/{medicalRecord}', [DoctorMedicalRecordController::class, 'destroy']);

        Route::get('appointments/{appointment}/prescriptions', [DoctorPrescriptionController::class, 'indexForAppointment']);
        Route::post('appointments/{appointment}/prescriptions', [DoctorPrescriptionController::class, 'store']);
        Route::put('prescriptions/{prescription}', [DoctorPrescriptionController::class, 'update']); // مع _method=PUT
        Route::delete('prescriptions/{prescription}', [DoctorPrescriptionController::class, 'destroy']);

    Route::get('availability', [DoctorAvailabilityController::class, 'index']);
    Route::post('availability', [DoctorAvailabilityController::class, 'store']);
    Route::delete('availability/{doctorAvailability}', [DoctorAvailabilityController::class, 'destroy']);
    Route::apiResource('availabilities', DoctorAvailabilityController::class)->only(['index', 'store', 'destroy']);
    Route::apiResource('services', DoctorServiceController::class)->except(['show']);
    Route::apiResource('clinics', DoctorClinicController::class)->except(['show']);
    Route::get('my-patients', [DoctorPatientController::class, 'index']);
    Route::get('reviews', [DoctorReviewController::class, 'index']);
    Route::apiResource('invoices', DoctorInvoiceController::class)->only(['index', 'show']);
    Route::get('profile', [DoctorProfileController::class, 'show']);
    Route::put('profile', [DoctorProfileController::class, 'update']);
    Route::get('conversations', [DoctorChatController::class, 'conversations']);
    Route::get('conversations/{conversation}/messages', [DoctorChatController::class, 'messages']);
    Route::post('conversations/messages', [DoctorChatController::class, 'send']);
});

Route::middleware(['auth:sanctum', 'role:admin', 'permission:user.manage'])->prefix('admin')->group(function () {
    Route::apiResource('users', AdminUserController::class);
    Route::apiResource('doctors', AdminDoctorController::class)->only(['index', 'show', 'update']);
    Route::apiResource('patients', AdminPatientController::class)->only(['index', 'show', 'update']);
    Route::apiResource('specialties', AdminSpecialtyController::class);
    Route::apiResource('invoices', AdminInvoiceController::class)->only(['index', 'show']);
    Route::get('reviews', [AdminReviewController::class, 'index']);
});

Route::middleware(['auth:sanctum'])->get('appointments/{appointment}/twilio-token', [AppointmentOnlineController::class, 'token']);
