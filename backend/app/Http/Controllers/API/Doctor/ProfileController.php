<?php

namespace App\Http\Controllers\API\Doctor;

use App\Http\Controllers\Controller;
use App\Http\Resources\DoctorResource;
use App\Models\DoctorAward;
use App\Models\DoctorAvailability;
use App\Models\DoctorEducation;
use App\Models\DoctorExperience;
use App\Models\DoctorInsurance;
use App\Models\Clinic;
use App\Models\Membership;
use App\Models\DoctorService;
use App\Models\SocialLink;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        $doctor = $request->user()->doctor?->load([
            'services',
            'clinics',
            'availabilities',
            'educations',
            'experiences',
            'awards',
            'insurances',
            'memberships',
            'socialLinks',
        ]);

        return new DoctorResource($doctor);
    }

    public function update(Request $request)
    {
        $doctor = $request->user()->doctor;
        abort_unless($doctor, 403);

        $payload = $request->all();
        foreach (['educations', 'experiences', 'awards', 'insurances', 'memberships', 'clinics', 'availabilities', 'social_links', 'services'] as $key) {
            if (isset($payload[$key]) && is_string($payload[$key])) {
                $decoded = json_decode($payload[$key], true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $request->merge([$key => $decoded]);
                }
            }
        }

        $validated = $request->validate([
            'first_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['nullable', 'string', 'max:255'],
            'display_name' => ['nullable', 'string', 'max:255'],
            'designation' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'languages' => ['nullable', 'array'],
            'languages.*' => ['string', 'max:50'],
            'bio' => ['nullable', 'string'],
            'default_fee' => ['nullable', 'numeric', 'min:0'],
            'city' => ['nullable', 'string', 'max:255'],
            'country' => ['nullable', 'string', 'max:255'],
            'accepting_new_patients' => ['nullable', 'boolean'],
            'recommended_percent' => ['nullable', 'integer', 'min:0', 'max:100'],
            'years_experience' => ['nullable', 'integer', 'min:0', 'max:80'],
            'profile_image' => ['nullable', 'file', 'image', 'max:4096'],
            'profile_image_path' => ['nullable', 'string', 'max:500'],

            'educations' => ['nullable', 'array'],
            'educations.*.degree' => ['required_with:educations', 'string', 'max:255'],
            'educations.*.institution' => ['nullable', 'string', 'max:255'],
            'educations.*.year_completed' => ['nullable', 'integer', 'min:1900', 'max:'.date('Y')],
            'educations.*.description' => ['nullable', 'string'],

            'experiences' => ['nullable', 'array'],
            'experiences.*.organization' => ['required_with:experiences', 'string', 'max:255'],
            'experiences.*.department' => ['nullable', 'string', 'max:255'],
            'experiences.*.city' => ['nullable', 'string', 'max:255'],
            'experiences.*.start_date' => ['nullable', 'date'],
            'experiences.*.end_date' => ['nullable', 'date'],
            'experiences.*.description' => ['nullable', 'string'],

            'awards' => ['nullable', 'array'],
            'awards.*.name' => ['required_with:awards', 'string', 'max:255'],
            'awards.*.year' => ['nullable', 'integer', 'min:1900', 'max:'.date('Y')],
            'awards.*.description' => ['nullable', 'string'],

            'insurances' => ['nullable', 'array'],
            'insurances.*.name' => ['required_with:insurances', 'string', 'max:255'],
            'insurances.*.logo_url' => ['nullable', 'string', 'max:500'],

            'memberships' => ['nullable', 'array'],
            'memberships.*.title' => ['required_with:memberships', 'string', 'max:255'],
            'memberships.*.description' => ['nullable', 'string'],

            'clinics' => ['nullable', 'array'],
            'clinics.*.name' => ['required_with:clinics', 'string', 'max:255'],
            'clinics.*.address' => ['nullable', 'string', 'max:255'],
            'clinics.*.city' => ['nullable', 'string', 'max:255'],
            'clinics.*.fee_amount' => ['nullable', 'numeric', 'min:0'],

            'availabilities' => ['nullable', 'array'],
            'availabilities.*.day_of_week' => ['required_with:availabilities', 'string', 'max:50'],
            'availabilities.*.start_time' => ['nullable', 'date_format:H:i:s'],
            'availabilities.*.fee_amount' => ['nullable', 'numeric', 'min:0'],
            'availabilities.*.slot_capacity' => ['nullable', 'integer', 'min:1'],
            'availabilities.*.clinic_id' => ['nullable', 'exists:clinics,id'],

            'services' => ['nullable', 'array'],
            'services.*.name' => ['required_with:services', 'string', 'max:255'],
            'services.*.price' => ['nullable', 'numeric', 'min:0'],
            'services.*.description' => ['nullable', 'string'],
            'services.*.specialty_id' => ['nullable', 'exists:specialties,id'],

            'social_links' => ['nullable', 'array'],
            'social_links.*.platform' => ['required_with:social_links', 'string', 'max:100'],
            'social_links.*.url' => ['nullable', 'string', 'max:500'],
        ]);

        $doctor = DB::transaction(function () use ($doctor, $validated, $request) {
            $profileImagePath = $doctor->profile_image_path;
            if ($request->hasFile('profile_image')) {
                $profileImagePath = $request->file('profile_image')->store('doctor_profiles', 'public');
            } elseif (!empty($validated['profile_image_path'])) {
                $profileImagePath = $this->normalizePath($validated['profile_image_path']);
            }

            $doctor->fill([
                'first_name' => $validated['first_name'] ?? $doctor->first_name,
                'last_name' => $validated['last_name'] ?? $doctor->last_name,
                'display_name' => $validated['display_name'] ?? $doctor->display_name,
                'designation' => $validated['designation'] ?? $doctor->designation,
                'phone' => $validated['phone'] ?? $doctor->phone,
                'email' => $validated['email'] ?? $doctor->email,
                'languages_json' => $validated['languages'] ?? $doctor->languages_json,
                'bio' => $validated['bio'] ?? $doctor->bio,
                'default_fee' => $validated['default_fee'] ?? $doctor->default_fee,
                'city' => $validated['city'] ?? $doctor->city,
                'country' => $validated['country'] ?? $doctor->country,
                'accepting_new_patients' => $validated['accepting_new_patients'] ?? $doctor->accepting_new_patients,
                'recommended_percent' => $validated['recommended_percent'] ?? $doctor->recommended_percent,
                'years_experience' => $validated['years_experience'] ?? $doctor->years_experience,
                'profile_image_path' => $profileImagePath,
            ])->save();

            if (array_key_exists('educations', $validated)) {
                DoctorEducation::where('doctor_id', $doctor->id)->delete();
                foreach ($validated['educations'] ?? [] as $education) {
                    DoctorEducation::create(array_merge($education, ['doctor_id' => $doctor->id]));
                }
            }

            if (array_key_exists('experiences', $validated)) {
                DoctorExperience::where('doctor_id', $doctor->id)->delete();
                foreach ($validated['experiences'] ?? [] as $exp) {
                    DoctorExperience::create(array_merge($exp, ['doctor_id' => $doctor->id]));
                }
            }

            if (array_key_exists('awards', $validated)) {
                DoctorAward::where('doctor_id', $doctor->id)->delete();
                foreach ($validated['awards'] ?? [] as $award) {
                    DoctorAward::create(array_merge($award, ['doctor_id' => $doctor->id]));
                }
            }

            if (array_key_exists('insurances', $validated)) {
                DoctorInsurance::where('doctor_id', $doctor->id)->delete();
                foreach ($validated['insurances'] ?? [] as $insurance) {
                    DoctorInsurance::create(array_merge($insurance, ['doctor_id' => $doctor->id]));
                }
            }

            if (array_key_exists('memberships', $validated)) {
                Membership::where('doctor_id', $doctor->id)->delete();
                foreach ($validated['memberships'] ?? [] as $membership) {
                    Membership::create(array_merge($membership, ['doctor_id' => $doctor->id]));
                }
            }

            if (array_key_exists('clinics', $validated)) {
                Clinic::where('doctor_id', $doctor->id)->delete();
                foreach ($validated['clinics'] ?? [] as $clinic) {
                    Clinic::create(array_merge($clinic, ['doctor_id' => $doctor->id]));
                }
            }

            if (array_key_exists('availabilities', $validated)) {
                DoctorAvailability::where('doctor_id', $doctor->id)->delete();
                foreach ($validated['availabilities'] ?? [] as $availability) {
                    DoctorAvailability::create(array_merge($availability, ['doctor_id' => $doctor->id]));
                }
            }

            if (array_key_exists('services', $validated)) {
                DoctorService::where('doctor_id', $doctor->id)->delete();
                foreach ($validated['services'] ?? [] as $service) {
                    DoctorService::create(array_merge($service, ['doctor_id' => $doctor->id]));
                }
            }

            if (array_key_exists('social_links', $validated)) {
                SocialLink::where('doctor_id', $doctor->id)->delete();
                foreach ($validated['social_links'] ?? [] as $link) {
                    SocialLink::create(array_merge($link, ['doctor_id' => $doctor->id]));
                }
            }

            return $doctor->load([
                'services',
                'clinics',
                'availabilities',
                'educations',
                'experiences',
                'awards',
                'insurances',
                'memberships',
                'socialLinks',
            ]);
        });

        return new DoctorResource($doctor);
    }

    private function normalizePath(string $path): string
    {
        if (str_starts_with($path, 'http')) {
            // strip domain/storage prefix if present
            $parts = parse_url($path, PHP_URL_PATH);
            if ($parts) {
                $path = ltrim(str_replace('/storage/', '', $parts), '/');
            }
        }
        return $path;
    }
}
