<?php

namespace Database\Seeders;

use App\Models\Patient;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class LegacyPatientSeeder extends Seeder
{
    public function run(): void
    {
        $dataFile = __DIR__ . '/data/legacy_patients.php';
        if (! file_exists($dataFile)) {
            $this->command?->warn('Legacy patients file not found: ' . $dataFile);
            return;
        }

        $rows = include $dataFile;
        if (! is_array($rows)) {
            $this->command?->warn('Legacy patients file is invalid: ' . $dataFile);
            return;
        }

        $patientRole = Role::firstOrCreate(['name' => 'patient', 'guard_name' => 'web']);

        foreach ($rows as $row) {
            $email = trim((string) Arr::get($row, 'email', ''));
            if ($email === '') {
                continue;
            }

            $passwordHash = Arr::get($row, 'password');
            $user = User::firstOrCreate(
                ['email' => $email],
                [
                    'name' => trim((Arr::get($row, 'first_name', '') . ' ' . Arr::get($row, 'last_name', ''))),
                    'role' => 'patient',
                    'password' => $passwordHash && str_starts_with($passwordHash, '$2y$')
                        ? $passwordHash
                        : Hash::make($passwordHash ?: 'password'),
                ]
            );

            if (! $user->hasRole($patientRole->name)) {
                $user->assignRole($patientRole);
            }

            Patient::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'first_name' => Arr::get($row, 'first_name', ''),
                    'last_name' => Arr::get($row, 'last_name', ''),
                    'dob' => Arr::get($row, 'dob'),
                    'blood_group' => Arr::get($row, 'blood_group'),
                    'phone' => Arr::get($row, 'phone'),
                    'email' => $email,
                    'country' => Arr::get($row, 'country'),
                ]
            );
        }
    }
}
