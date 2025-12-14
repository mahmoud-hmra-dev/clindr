<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\Clinic;
use App\Models\Conversation;
use App\Models\Dependent;
use App\Models\Doctor;
use App\Models\DoctorAvailability;
use App\Models\DoctorAward;
use App\Models\DoctorEducation;
use App\Models\DoctorExperience;
use App\Models\DoctorInsurance;
use App\Models\DoctorService;
use App\Models\Favourite;
use App\Models\Invoice;
use App\Models\MedicalRecord;
use App\Models\Membership;
use App\Models\Message;
use App\Models\Patient;
use App\Models\Payment;
use App\Models\Prescription;
use App\Models\Review;
use App\Models\SocialLink;
use App\Models\Specialty;
use App\Models\User;
use App\Models\Vital;
use App\Models\WalletTransaction;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Arr;

class SampleDataSeeder extends Seeder
{
    public function run(): void
    {
        $adminUser = User::firstOrCreate(
            ['email' => 'admin@clindoctor.net'],
            ['name' => 'Admin User', 'role' => 'admin', 'password' => bcrypt('password')]
        );
        $adminUser->assignRole('admin');

        $cardiology = Specialty::firstOrCreate(['name' => 'Cardiology'], ['description' => 'Heart and cardiovascular care']);
        $neurology = Specialty::firstOrCreate(['name' => 'Neurology'], ['description' => 'Brain and nervous system']);
        $dermatology = Specialty::firstOrCreate(['name' => 'Dermatology'], ['description' => 'Skin care']);

        $doctorUser = User::firstOrCreate(
            ['email' => 'doctor@clindoctor.net'],
            ['name' => 'Dr Edalin Hendry', 'role' => 'doctor', 'password' => bcrypt('password')]
        );
        $doctorUser->assignRole('doctor');
        $doctorUser2 = User::firstOrCreate(
            ['email' => 'dr.jane@clindoctor.net'],
            ['name' => 'Dr Jane Roe', 'role' => 'doctor', 'password' => bcrypt('password')]
        );
        $doctorUser2->assignRole('doctor');

        $doctor = Doctor::updateOrCreate(
            ['user_id' => $doctorUser?->id],
            [
                'first_name' => 'Edalin',
                'last_name' => 'Hendry',
                'display_name' => 'Dr. Edalin Hendry',
                'designation' => 'Cardiologist',
                'phone' => '+1 555 100 2000',
                'email' => 'doctor@clindoctor.net',
                'languages_json' => ['English', 'Spanish'],
                'rating_avg' => 4.8,
                'default_fee' => 250,
                'city' => 'New York',
                'country' => 'USA',
                'years_experience' => 21,
                'recommended_percent' => 94,
                'accepting_new_patients' => true,
                'bio' => 'Board-certified cardiologist focused on preventive cardiology, complex arrhythmias, and patient education with 20+ years experience.',
            ]
        );

        $doctorTwo = Doctor::updateOrCreate(
            ['user_id' => $doctorUser2->id],
            [
                'first_name' => 'Jane',
                'last_name' => 'Roe',
                'display_name' => 'Dr. Jane Roe',
                'designation' => 'Neurologist',
                'phone' => '+1 555 200 3000',
                'email' => 'dr.jane@clindoctor.net',
                'languages_json' => ['English', 'French'],
                'rating_avg' => 4.6,
                'default_fee' => 280,
                'city' => 'Los Angeles',
                'country' => 'USA',
                'years_experience' => 12,
                'recommended_percent' => 90,
                'accepting_new_patients' => true,
                'bio' => 'Neurologist specializing in headaches, movement disorders, and stroke rehab with a focus on telehealth follow-ups.',
            ]
        );

        foreach ([[$doctor, $cardiology], [$doctorTwo, $neurology], [$doctorTwo, $dermatology]] as [$doc, $spec]) {
            DoctorService::firstOrCreate(
                ['doctor_id' => $doc->id, 'specialty_id' => $spec->id, 'name' => 'Consultation'],
                ['price' => $doc->default_fee, 'description' => 'Initial consultation']
            );
        }

        $clinic = Clinic::firstOrCreate(
            ['doctor_id' => $doctor->id, 'name' => 'Downtown Clinic'],
            ['address' => '123 Main St', 'city' => 'New York', 'fee_amount' => 250]
        );
        $clinic2 = Clinic::firstOrCreate(
            ['doctor_id' => $doctor->id, 'name' => 'Sofia Clinic'],
            ['address' => '2286 Sundown Lane, Old Trafford 24541, UK', 'city' => 'Old Trafford', 'fee_amount' => 350]
        );

        DoctorAvailability::updateOrCreate(
            [
                'doctor_id' => $doctor->id,
                'clinic_id' => $clinic->id,
                'day_of_week' => 'monday',
                'start_time' => '09:00:00',
            ],
            ['slot_capacity' => 4, 'fee_amount' => 250]
        );
        DoctorAvailability::updateOrCreate(
            [
                'doctor_id' => $doctor->id,
                'clinic_id' => $clinic2->id,
                'day_of_week' => 'tuesday',
                'start_time' => '07:00:00',
            ],
            ['slot_capacity' => 4, 'fee_amount' => 350]
        );
        DoctorAvailability::updateOrCreate(
            [
                'doctor_id' => $doctor->id,
                'clinic_id' => $clinic2->id,
                'day_of_week' => 'wednesday',
                'start_time' => '14:00:00',
            ],
            ['slot_capacity' => 4, 'fee_amount' => 350]
        );

        SocialLink::updateOrCreate(
            ['doctor_id' => $doctor->id, 'platform' => 'facebook'],
            ['url' => 'https://facebook.com/dr.edalin']
        );
        SocialLink::updateOrCreate(
            ['doctor_id' => $doctor->id, 'platform' => 'linkedin'],
            ['url' => 'https://linkedin.com/in/dr-edalin']
        );

        Membership::updateOrCreate(
            ['doctor_id' => $doctor->id, 'title' => 'AMA Member'],
            ['description' => 'American Medical Association']
        );
        Membership::updateOrCreate(
            ['doctor_id' => $doctor->id, 'title' => 'ACC Fellow'],
            ['description' => 'American College of Cardiology Fellow']
        );

        DoctorEducation::updateOrCreate(
            ['doctor_id' => $doctor->id, 'degree' => 'MBBS'],
            ['institution' => 'Harvard Medical School', 'year_completed' => 2002]
        );

        DoctorEducation::updateOrCreate(
            ['doctor_id' => $doctor->id, 'degree' => 'MD - Cardiology'],
            ['institution' => 'NYU', 'year_completed' => 2006]
        );

        DoctorExperience::updateOrCreate(
            ['doctor_id' => $doctor->id, 'organization' => 'Cambridge University Hospital'],
            [
                'department' => 'Cardiology',
                'city' => 'Cambridge',
                'start_date' => '2020-12-01',
                'end_date' => '2022-01-01',
                'description' => 'Lead cardiologist focusing on interventional cardiology and preventive care.',
            ]
        );

        DoctorAward::updateOrCreate(
            ['doctor_id' => $doctor->id, 'name' => 'Clinical Excellence'],
            ['year' => 2021, 'description' => 'Awarded for excellence in patient care.']
        );

        DoctorInsurance::updateOrCreate(
            ['doctor_id' => $doctor->id, 'name' => 'Aetna'],
            ['logo_url' => 'assets/img/icons/insurence-logo-01.svg']
        );
        DoctorInsurance::updateOrCreate(
            ['doctor_id' => $doctor->id, 'name' => 'Blue Cross'],
            ['logo_url' => 'assets/img/icons/insurence-logo-02.svg']
        );

        // Additional services for better coverage
        DoctorService::updateOrCreate(
            ['doctor_id' => $doctor->id, 'specialty_id' => $cardiology->id, 'name' => 'Follow-up Consultation'],
            ['price' => 180, 'description' => 'Follow-up visit']
        );
        DoctorService::updateOrCreate(
            ['doctor_id' => $doctor->id, 'specialty_id' => $cardiology->id, 'name' => 'Online Consultation'],
            ['price' => 120, 'description' => 'Virtual visit']
        );

        $patientUser = User::firstOrCreate(
            ['email' => 'patient@clindoctor.net'],
            ['name' => 'Patient One', 'role' => 'patient', 'password' => bcrypt('password')]
        );
        $patientUser->assignRole('patient');
        $patientUser2 = User::firstOrCreate(
            ['email' => 'patient.two@clindoctor.net'],
            ['name' => 'Patient Two', 'role' => 'patient', 'password' => bcrypt('password')]
        );
        $patientUser2->assignRole('patient');

        $patient = Patient::firstOrCreate(
            ['user_id' => $patientUser?->id],
            [
                'first_name' => 'Hendrita',
                'last_name' => 'Clark',
                'dob' => '1990-05-10',
                'blood_group' => 'O+',
                'phone' => '+1 555 300 4000',
                'email' => 'patient@clindoctor.net',
                'address' => '456 Park Ave',
                'city' => 'New York',
                'state' => 'NY',
                'country' => 'USA',
                'pincode' => '10001',
            ]
        );

        $patientTwo = Patient::firstOrCreate(
            ['user_id' => $patientUser2->id],
            [
                'first_name' => 'Mathew',
                'last_name' => 'Charles',
                'dob' => '1988-08-08',
                'blood_group' => 'AB+',
                'phone' => '+1 555 400 5000',
                'email' => 'patient.two@clindoctor.net',
                'address' => '789 Sunset Blvd',
                'city' => 'Los Angeles',
                'state' => 'CA',
                'country' => 'USA',
                'pincode' => '90001',
            ]
        );

        $dependent = Dependent::firstOrCreate(
            ['patient_id' => $patient->id, 'name' => 'Laura'],
            ['gender' => 'female', 'relationship' => 'Mother', 'blood_group' => 'AB+', 'is_active' => true]
        );

        $scheduledAt = Carbon::now()->addDays(2)->setTime(10, 30);
        $appointment = Appointment::firstOrCreate(
            [
                'doctor_id' => $doctor->id,
                'patient_id' => $patient->id,
                'scheduled_at' => $scheduledAt,
            ],
            [
                'appointment_type' => 'in_clinic',
                'visit_type' => 'general',
                'duration_minutes' => 30,
                'status' => 'confirmed',
                'clinic_location' => $clinic->address,
                'created_by' => $adminUser?->id ?? $patientUser?->id,
                'patient_email' => $patient->email,
                'patient_phone' => $patient->phone,
            ]
        );

        // Online appointment ready for Twilio/token testing
        $onlineAppointment = Appointment::firstOrCreate(
            [
                'doctor_id' => $doctor->id,
                'patient_id' => $patientTwo->id,
                'scheduled_at' => Carbon::now()->addDays(3)->setTime(15, 0),
            ],
            [
                'appointment_type' => 'online',
                'visit_type' => 'consultation',
                'duration_minutes' => 30,
                'status' => 'confirmed',
                'areeba_payment_status' => 'paid',
                'created_by' => $adminUser?->id ?? $patientUser2->id,
                'patient_email' => $patientTwo->email,
                'patient_phone' => $patientTwo->phone,
            ]
        );

        $invoice = Invoice::firstOrCreate(
            ['appointment_id' => $appointment->id],
            [
                'doctor_id' => $doctor->id,
                'patient_id' => $patient->id,
                'amount' => 250,
                'currency' => 'USD',
                'booked_on' => $scheduledAt->copy()->subDays(1),
                'status' => 'paid',
                'payment_status' => 'paid',
                'payment_id' => 'PAY123',
            ]
        );

        Payment::firstOrCreate(
            ['appointment_id' => $appointment->id, 'invoice_id' => $invoice->id],
            [
                'amount' => 250,
                'currency' => 'USD',
                'areeba_transaction_id' => 'AREEBA123',
                'status' => 'paid',
                'redirect_url' => 'https://pay.clindoctor.net',
                'raw_response_json' => ['sample' => true],
                'paid_at' => Carbon::now()->subDay(),
            ]
        );

        $invoiceOnline = Invoice::firstOrCreate(
            ['appointment_id' => $onlineAppointment->id],
            [
                'doctor_id' => $doctor->id,
                'patient_id' => $patientTwo->id,
                'amount' => 200,
                'currency' => 'USD',
                'booked_on' => Carbon::now()->subDay(),
                'status' => 'paid',
                'payment_status' => 'paid',
                'payment_id' => 'PAYONLINE123',
            ]
        );

        Payment::firstOrCreate(
            ['appointment_id' => $onlineAppointment->id, 'invoice_id' => $invoiceOnline->id],
            [
                'amount' => 200,
                'currency' => 'USD',
                'areeba_transaction_id' => 'AREEBA456',
                'status' => 'paid',
                'redirect_url' => 'https://pay.clindoctor.net/online',
                'raw_response_json' => ['sample' => true],
                'paid_at' => Carbon::now()->subHours(2),
            ]
        );

        // Doctor two sample prescription and availability
        $clinicJane = Clinic::firstOrCreate(
            ['doctor_id' => $doctorTwo->id, 'name' => 'Family Dentistry Clinic'],
            ['address' => 'MDS - Periodontology and Oral Implantology, BDS', 'city' => 'Los Angeles', 'fee_amount' => 550]
        );
        DoctorAvailability::updateOrCreate(
            [
                'doctor_id' => $doctorTwo->id,
                'clinic_id' => $clinicJane->id,
                'day_of_week' => 'friday',
                'start_time' => '07:00:00',
            ],
            ['slot_capacity' => 6, 'fee_amount' => 550]
        );

        DoctorEducation::firstOrCreate(
            ['doctor_id' => $doctorTwo->id, 'degree' => 'DDS'],
            ['institution' => 'UCLA', 'year_completed' => 2010]
        );

        DoctorExperience::firstOrCreate(
            ['doctor_id' => $doctorTwo->id, 'organization' => 'Hill Medical Hospital'],
            [
                'department' => 'ENT',
                'city' => 'Cambridge',
                'start_date' => '2022-12-01',
                'end_date' => '2023-12-01',
                'description' => 'Emergency medicine coverage.',
            ]
        );

        DoctorAward::firstOrCreate(
            ['doctor_id' => $doctorTwo->id, 'name' => 'Best Dentist'],
            ['year' => 2023, 'description' => 'Regional award.']
        );

        DoctorInsurance::firstOrCreate(
            ['doctor_id' => $doctorTwo->id, 'name' => 'Cigna'],
            ['logo_url' => 'assets/img/icons/insurence-logo-03.svg']
        );

        SocialLink::updateOrCreate(
            ['doctor_id' => $doctorTwo->id, 'platform' => 'linkedin'],
            ['url' => 'https://linkedin.com/in/dr-jane-roe']
        );
        Membership::updateOrCreate(
            ['doctor_id' => $doctorTwo->id, 'title' => 'AAN Member'],
            ['description' => 'American Academy of Neurology']
        );

        Prescription::firstOrCreate(
            ['appointment_id' => $appointment->id, 'patient_id' => $patient->id, 'doctor_id' => $doctor->id, 'name' => 'Standard Prescription'],
            ['issued_at' => Carbon::now()->subDay(), 'file_url' => null]
        );

        Prescription::firstOrCreate(
            ['appointment_id' => $onlineAppointment->id, 'patient_id' => $patientTwo->id, 'doctor_id' => $doctor->id, 'name' => 'Online Prescription'],
            ['issued_at' => Carbon::now()->subHours(5), 'file_url' => null]
        );

        Review::firstOrCreate(
            ['appointment_id' => $appointment->id, 'doctor_id' => $doctor->id, 'patient_id' => $patient->id],
            ['rating' => 5, 'comment' => 'Great visit!']
        );
        Review::firstOrCreate(
            ['appointment_id' => $onlineAppointment->id, 'doctor_id' => $doctor->id, 'patient_id' => $patientTwo->id],
            ['rating' => 4, 'comment' => 'Smooth online consultation and clear instructions.']
        );

        MedicalRecord::firstOrCreate(
            ['patient_id' => $patient->id, 'title' => 'Electro cardiography'],
            [
                'doctor_id' => $doctor->id,
                'appointment_id' => $appointment->id,
                'record_type' => 'ECG',
                'recorded_at' => Carbon::now()->subDays(3),
                'comments' => 'Normal results',
            ]
        );

        Vital::firstOrCreate(
            ['patient_id' => $patient->id, 'recorded_at' => Carbon::now()->subDay()],
            [
                'dependent_id' => $dependent->id,
                'blood_pressure' => '100 mg/dl',
                'heart_rate' => 89,
                'glucose_level' => '70-90',
                'body_temperature' => '37.5',
                'bmi' => 23.5,
                'spo2' => 96,
                'weight' => 74,
                'fbc_status' => '140',
                'recorded_by' => $adminUser?->id,
            ]
        );

        WalletTransaction::firstOrCreate(
            ['patient_id' => $patient->id, 'account_no' => '5396 5250 1908 XXXX', 'transaction_date' => Carbon::now()->subDays(5)],
            [
                'reason' => 'Appointment',
                'amount' => 300,
                'status' => 'completed',
                'direction' => 'debit',
            ]
        );

        $conversation = Conversation::firstOrCreate(
            ['doctor_id' => $doctor->id, 'patient_id' => $patient->id],
            ['last_message_at' => Carbon::now()]
        );

        Message::firstOrCreate(
            ['conversation_id' => $conversation->id, 'sender_id' => Arr::first([$patientUser?->id, $patientUser2->id])],
            [
                'body' => 'Hello Doctor',
                'message_type' => 'text',
                'sent_at' => Carbon::now(),
                'status' => 'sent',
            ]
        );

        $conversation2 = Conversation::firstOrCreate(
            ['doctor_id' => $doctor->id, 'patient_id' => $patientTwo->id],
            ['last_message_at' => Carbon::now()->subHours(1)]
        );
        Message::firstOrCreate(
            ['conversation_id' => $conversation2->id, 'sender_id' => $patientUser2->id],
            [
                'body' => 'Following up on my online visit.',
                'message_type' => 'text',
                'sent_at' => Carbon::now()->subMinutes(30),
                'status' => 'sent',
            ]
        );

        Favourite::firstOrCreate(
            ['patient_id' => $patient->id, 'doctor_id' => $doctor->id]
        );
        Favourite::firstOrCreate(
            ['patient_id' => $patientTwo->id, 'doctor_id' => $doctor->id]
        );
    }
}
