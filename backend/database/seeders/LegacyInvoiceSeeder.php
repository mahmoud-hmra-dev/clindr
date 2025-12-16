<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Invoice;
use App\Models\Patient;
use Illuminate\Database\Seeder;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;

class LegacyInvoiceSeeder extends Seeder
{
    public function run(): void
    {
        $dataFile = __DIR__ . '/data/legacy_payments.php';
        if (! file_exists($dataFile)) {
            $this->command?->warn('Legacy payments file not found: ' . $dataFile);
            return;
        }

        $rows = include $dataFile;
        if (! is_array($rows)) {
            $this->command?->warn('Legacy payments file is invalid: ' . $dataFile);
            return;
        }

        $doctorCache = [];
        $patientCache = [];

        foreach ($rows as $row) {
            $doctorEmail = trim((string) Arr::get($row, 'doctor_email', ''));
            $patientEmail = trim((string) Arr::get($row, 'patient_email', ''));
            if (! $doctorEmail || ! $patientEmail) {
                continue;
            }

            $doctor = $doctorCache[$doctorEmail] ??= Doctor::where('email', $doctorEmail)
                ->orWhereHas('user', fn ($q) => $q->where('email', $doctorEmail))
                ->first();
            $patient = $patientCache[$patientEmail] ??= Patient::where('email', $patientEmail)
                ->orWhereHas('user', fn ($q) => $q->where('email', $patientEmail))
                ->first();

            if (! $doctor || ! $patient) {
                $this->command?->warn("Skipping invoice for booking {$row['old_booking_id']} (doctor or patient missing)");
                continue;
            }

            $appointment = Appointment::where('doctor_id', $doctor->id)
                ->where('patient_id', $patient->id)
                ->where('notes', 'legacy_booking_id:' . Arr::get($row, 'old_booking_id'))
                ->first();

            if (! $appointment) {
                $this->command?->warn("No appointment found for legacy booking {$row['old_booking_id']}");
                continue;
            }

            $invoice = Invoice::updateOrCreate(
                ['appointment_id' => $appointment->id],
                [
                    'doctor_id' => $doctor->id,
                    'patient_id' => $patient->id,
                    'amount' => Arr::get($row, 'amount', 0),
                    'currency' => 'USD',
                    'booked_on' => $appointment->scheduled_at,
                    'status' => Arr::get($row, 'status', 'pending'),
                    'payment_status' => Arr::get($row, 'status', 'pending'),
                    'payment_id' => Arr::get($row, 'invoice_number'),
                ]
            );

            if ($createdAt = Arr::get($row, 'created_at')) {
                $invoice->created_at = Carbon::parse($createdAt);
            }
            if ($updatedAt = Arr::get($row, 'updated_at')) {
                $invoice->updated_at = Carbon::parse($updatedAt);
            }
            $invoice->save();
        }
    }
}
