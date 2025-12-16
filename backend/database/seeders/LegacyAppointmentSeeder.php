<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;

class LegacyAppointmentSeeder extends Seeder
{
    private function normalizeStatus(string $status): string
    {
        $normalized = strtolower(trim($status));

        return match ($normalized) {
            'done' => 'completed',
            'approved' => 'confirmed',
            'ongoing' => 'confirmed',
            'canceled by patient', 'cancelled by patient', 'canceled by doctor', 'cancelled by doctor' => 'cancelled',
            default => $normalized ?: 'pending',
        };
    }

    private function parseNullableDate($value): ?Carbon
    {
        if ($value === null) {
            return null;
        }

        if (is_string($value)) {
            $trimmed = trim($value);
            if ($trimmed === '' || strtoupper($trimmed) === 'NULL') {
                return null;
            }
        }

        try {
            return Carbon::parse($value);
        } catch (\Throwable $e) {
            return null;
        }
    }

    public function run(): void
    {
        $dataFile = __DIR__ . '/data/legacy_appointments.php';
        if (! file_exists($dataFile)) {
            $this->command?->warn('Legacy appointments file not found: ' . $dataFile);
            return;
        }

        $rows = include $dataFile;
        if (! is_array($rows)) {
            $this->command?->warn('Legacy appointments file is invalid: ' . $dataFile);
            return;
        }

        $doctorCache = [];
        $patientCache = [];

        foreach ($rows as $row) {
            $doctorEmail = trim((string) Arr::get($row, 'doctor_email', ''));
            $patientEmail = trim((string) Arr::get($row, 'patient_email', ''));
            $scheduledAt = $this->parseNullableDate(Arr::get($row, 'scheduled_at'));

            if (! $doctorEmail || ! $patientEmail || ! $scheduledAt) {
                $this->command?->warn("Skipping booking {$row['old_booking_id']} due to missing doctor/patient/scheduled_at");
                continue;
            }

            $doctor = $doctorCache[$doctorEmail] ??= Doctor::where('email', $doctorEmail)
                ->orWhereHas('user', fn ($q) => $q->where('email', $doctorEmail))
                ->first();
            $patient = $patientCache[$patientEmail] ??= Patient::where('email', $patientEmail)
                ->orWhereHas('user', fn ($q) => $q->where('email', $patientEmail))
                ->first();

            if (! $doctor || ! $patient) {
                $this->command?->warn("Skipping booking {$row['old_booking_id']} (doctor or patient missing)");
                continue;
            }

            $creatorId = $patient->user_id ?? User::where('email', $patientEmail)->value('id');
            $status = $this->normalizeStatus((string) Arr::get($row, 'status', 'pending'));
            $appointmentType = Arr::get($row, 'appointment_type', 'in_clinic');

            $appointment = Appointment::updateOrCreate(
                [
                    'doctor_id' => $doctor->id,
                    'patient_id' => $patient->id,
                    'scheduled_at' => $scheduledAt,
                ],
                [
                    'appointment_type' => $appointmentType,
                    'visit_type' => 'legacy',
                    'duration_minutes' => 30,
                    'status' => $status,
                    'reason' => null,
                    'notes' => 'legacy_booking_id:' . Arr::get($row, 'old_booking_id'),
                    'clinic_location' => null,
                    'online_meeting_url' => null,
                    'created_by' => $creatorId,
                    'patient_email' => $patientEmail,
                    'patient_phone' => $patient->phone,
                ]
            );

            if ($createdAt = $this->parseNullableDate(Arr::get($row, 'created_at'))) {
                $appointment->created_at = $createdAt;
            }
            if ($updatedAt = $this->parseNullableDate(Arr::get($row, 'updated_at'))) {
                $appointment->updated_at = $updatedAt;
            }
            $appointment->save();
        }
    }
}
