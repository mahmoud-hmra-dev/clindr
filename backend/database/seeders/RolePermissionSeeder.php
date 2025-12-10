<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        $guard = config('permission.defaults.guard', 'web');

        $roles = collect(['admin', 'doctor', 'patient'])
            ->mapWithKeys(fn ($name) => [$name => Role::firstOrCreate(['name' => $name, 'guard_name' => $guard])]);

        $permissions = [
            'user.manage',
            'doctor.manage',
            'patient.manage',
            'specialty.manage',
            'appointment.view_any',
            'appointment.view_own',
            'appointment.create',
            'appointment.update_status',
            'appointment.cancel_own',
            'invoice.view_any',
            'invoice.view_own',
            'medical_record.view_own',
            'medical_record.manage_for_patient',
            'vital.view_own',
            'vital.manage_for_patient',
            'chat.use',
            'profile.manage_own',
            'availability.manage_own',
            'service.manage_own',
        ];

        $permissionModels = collect($permissions)
            ->mapWithKeys(fn ($name) => [$name => Permission::firstOrCreate(['name' => $name, 'guard_name' => $guard])]);

        // Assign permissions to roles
        $roles['admin']->syncPermissions($permissionModels->values());

        $roles['doctor']->syncPermissions($permissionModels->only([
            'appointment.view_own',
            'appointment.update_status',
            'medical_record.manage_for_patient',
            'invoice.view_own',
            'chat.use',
            'profile.manage_own',
            'availability.manage_own',
            'service.manage_own',
        ])->values());

        $roles['patient']->syncPermissions($permissionModels->only([
            'appointment.view_own',
            'appointment.create',
            'appointment.cancel_own',
            'invoice.view_own',
            'medical_record.view_own',
            'vital.view_own',
            'chat.use',
        ])->values());

        User::firstOrCreate(
            ['email' => 'admin@clindoctor.net'],
            [
                'name' => 'Admin User',
                'role' => 'admin',
                'password' => Hash::make('password'),
            ]
        )->assignRole($roles['admin']);

        User::firstOrCreate(
            ['email' => 'doctor@clindoctor.net'],
            [
                'name' => 'Doctor User',
                'role' => 'doctor',
                'password' => Hash::make('password'),
            ]
        )->assignRole($roles['doctor']);

        User::firstOrCreate(
            ['email' => 'patient@clindoctor.net'],
            [
                'name' => 'Patient User',
                'role' => 'patient',
                'password' => Hash::make('password'),
            ]
        )->assignRole($roles['patient']);

        // Map legacy role column into Spatie roles
        User::query()
            ->whereIn('role', ['admin', 'doctor', 'patient'])
            ->get()
            ->each(function (User $user) use ($roles) {
                if ($user->role && $roles->has($user->role)) {
                    $user->syncRoles([$roles[$user->role]]);
                }
            });
    }
}
