<?php

namespace Database\Seeders;

use App\Models\Clinic;
use App\Models\Doctor;
use App\Models\DoctorService;
use App\Models\Membership;
use App\Models\Specialty;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Arr;
use Spatie\Permission\Models\Role;

class DoctorExcelSeeder extends Seeder
{
    public function run(): void
    {
        $doctorRole = Role::firstOrCreate(['name' => 'doctor', 'guard_name' => 'web']);

        $dataPath = __DIR__ . '/data/doctor_excel_data.php';
        if (! file_exists($dataPath)) {
            $this->command?->warn('Doctor seed data file missing: ' . $dataPath);
            return;
        }

        $rows = include $dataPath;
        if (! is_array($rows)) {
            $this->command?->warn('Doctor seed data file is invalid: ' . $dataPath);
            return;
        }

        foreach ($rows as $row) {
            if (! trim(Arr::get($row, 'email', ''))) {
                continue;
            }

            $langList = array_values(
                array_filter(array_map(fn ($l) => trim($l), explode(',', Arr::get($row, 'languages', ''))))
            );

            $specialtyNames = array_values(
                array_filter(array_map(fn ($s) => trim($s), explode(',', Arr::get($row, 'main_specialization', ''))))
            );

            $primarySpecialty = null;
            if ($specialtyNames) {
                $primarySpecialty = Specialty::firstOrCreate(['name' => $specialtyNames[0]]);
            }

            $user = User::firstOrCreate(
                ['email' => trim($row['email'])],
                [
                  'name' => trim(($row['first_name'] ?? '') . ' ' . ($row['last_name'] ?? '')),
                  'role' => 'doctor',
                  'password' => bcrypt('password'),
                ]
            );

            if (! $user->hasRole($doctorRole->name)) {
                $user->assignRole($doctorRole);
            }
            if ($doctorRole->permissions()->exists()) {
                $user->syncPermissions($doctorRole->permissions);
            }

            $doctor = Doctor::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'first_name' => trim($row['first_name'] ?? ''),
                    'last_name' => trim($row['last_name'] ?? ''),
                    'display_name' => trim(($row['first_name'] ?? '') . ' ' . ($row['last_name'] ?? '')),
                    'designation' => $primarySpecialty?->name,
                    'phone' => trim($row['phone'] ?? ''),
                    'email' => trim($row['email'] ?? ''),
                    'languages_json' => $langList ? json_encode($langList) : null,
                    'profile_image_path' => null,
                    'bio' => null,
                    'rating_avg' => 5.0,
                    'default_fee' => is_numeric($row['first_visit_price'] ?? null)
                        ? (float) $row['first_visit_price']
                        : null,
                    'city' => '',
                    'country' => trim($row['country'] ?? ''),
                ]
            );

            Clinic::updateOrCreate(
                [
                    'doctor_id' => $doctor->id,
                    'name' => 'Hotel-Dieu de France',
                ],
                [
                    'address' => null,
                    'city' => $doctor->city ?? '',
                    'image_url' => null,
                ]
            );

            $serviceNames = array_values(
                array_filter(array_map(fn ($s) => trim($s), explode(',', Arr::get($row, 'services', ''))))
            );

            if (! $serviceNames) {
                $serviceNames = $specialtyNames ?: array_values(
                    array_filter(array_map(fn ($s) => trim($s), explode(',', Arr::get($row, 'sub_specializations', ''))))
                );
            }

            foreach ($serviceNames as $serviceName) {
                $serviceSpecialty = Specialty::firstOrCreate(['name' => $serviceName]);
                DoctorService::updateOrCreate(
                    [
                        'doctor_id' => $doctor->id,
                        'name' => $serviceName,
                    ],
                    [
                        'specialty_id' => $serviceSpecialty->id,
                        'price' => is_numeric($row['first_visit_price'] ?? null)
                            ? (float) $row['first_visit_price']
                            : null,
                        'description' => null,
                    ]
                );
            }

            $clinicChunks = array_values(
                array_filter(array_map(fn ($c) => trim($c), explode(',', Arr::get($row, 'clinics', ''))))
            );

            if ($clinicChunks) {
                $first = array_shift($clinicChunks);
                Clinic::updateOrCreate(
                    [
                        'doctor_id' => $doctor->id,
                        'name' => $first ?: ($doctor->display_name . ' Clinic'),
                    ],
                    [
                        'address' => $clinicChunks ? implode(', ', $clinicChunks) : null,
                        'city' => '',
                    ]
                );
            }

            $membershipEntries = array_values(
                array_filter(array_map(fn ($m) => trim($m), explode(',', Arr::get($row, 'memberships', ''))))
            );

            foreach ($membershipEntries as $memberTitle) {
                Membership::updateOrCreate(
                    ['doctor_id' => $doctor->id, 'title' => $memberTitle],
                    ['description' => null]
                );
            }
        }
    }
}
