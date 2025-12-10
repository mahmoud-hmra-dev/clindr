<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Resources\DoctorResource;
use App\Models\Doctor;
use App\Models\Specialty;
use Illuminate\Http\Request;

class DoctorPublicController extends Controller
{
    public function index(Request $request)
    {
        $query = Doctor::query()
            ->with([
                'services.specialty',
                'clinics',
                'availabilities',
                'educations',
                'experiences',
                'awards',
                'insurances',
                'memberships',
                'socialLinks',


            ]);

        if ($name = $request->get('name')) {
            $query->where(function ($q) use ($name) {
                $q->where('display_name', 'like', '%' . $name . '%')
                    ->orWhere('first_name', 'like', '%' . $name . '%')
                    ->orWhere('last_name', 'like', '%' . $name . '%');
            });
        }

        if ($city = $request->get('city')) {
            $query->where('city', 'like', '%' . $city . '%');
        }

        $specialties = collect(explode(',', (string)$request->get('specialties')))->filter();
        if ($specialties->count()) {
            $query->whereHas('services', function ($q) use ($specialties) {
                $q->whereIn('specialty_id', $specialties);
            });
        }

        $minFee = $request->get('min_fee');
        $maxFee = $request->get('max_fee');
        if ($minFee !== null || $maxFee !== null) {
            $query->where(function ($q) use ($minFee, $maxFee) {
                if ($minFee !== null) {
                    $q->where(function ($inner) use ($minFee) {
                        $inner->where('default_fee', '>=', $minFee)
                            ->orWhereHas('services', function ($srv) use ($minFee) {
                                $srv->where('price', '>=', $minFee);
                            });
                    });
                }
                if ($maxFee !== null) {
                    $q->where(function ($inner) use ($maxFee) {
                        $inner->where('default_fee', '<=', $maxFee)
                            ->orWhereHas('services', function ($srv) use ($maxFee) {
                                $srv->where('price', '<=', $maxFee);
                            });
                    });
                }
            });
        }

        $doctors = $query->paginate($request->get('per_page', 9));

        return DoctorResource::collection($doctors);
    }

    public function show(Doctor $doctor)
    {
        $doctor->load([
            'services.specialty',
            'clinics',
            'availabilities',
            'educations',
            'experiences',
            'awards',
            'insurances',
            'memberships',
            'socialLinks',
            'reviews',
        ]);

        return new DoctorResource($doctor);
    }

    public function specialties()
    {
        $specialties = Specialty::whereHas('services')->orderBy('name')->get();
        return response()->json([
            'data' => $specialties
        ]);
    }
}
