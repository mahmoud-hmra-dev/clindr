<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\AppointmentResource;
use App\Http\Resources\DoctorResource;
use App\Http\Resources\PatientResource;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Invoice;
use App\Models\Patient;

class DashboardController extends Controller
{
    public function summary()
    {
        $counts = [
            'doctors' => Doctor::count(),
            'patients' => Patient::count(),
            'appointments' => Appointment::count(),
            'revenue' => Invoice::sum('amount'),
        ];

        $latestDoctors = Doctor::query()->latest()->take(5)->get();
        $latestPatients = Patient::query()->latest()->take(5)->get();
        $recentAppointments = Appointment::query()
            ->with(['doctor', 'patient', 'invoice'])
            ->latest('scheduled_at')
            ->take(5)
            ->get();

        return response()->json([
            'counts' => $counts,
            'latest_doctors' => DoctorResource::collection($latestDoctors),
            'latest_patients' => PatientResource::collection($latestPatients),
            'recent_appointments' => AppointmentResource::collection($recentAppointments),
        ]);
    }
}
