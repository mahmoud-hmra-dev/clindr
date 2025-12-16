<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\DoctorServiceResource;
use App\Http\Resources\ClinicResource;
use App\Http\Resources\DoctorAvailabilityResource;
use App\Http\Resources\DoctorEducationResource;
use App\Http\Resources\DoctorExperienceResource;
use App\Http\Resources\DoctorAwardResource;
use App\Http\Resources\DoctorInsuranceResource;
use App\Http\Resources\MembershipResource;
use App\Http\Resources\SocialLinkResource;
use App\Http\Resources\ReviewResource;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DoctorResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'full_name' => trim($this->first_name . ' ' . $this->last_name),
            'display_name' => $this->display_name,
            'designation' => $this->designation,
            'phone' => $this->phone,
            'email' => $this->email,
            'languages' => $this->languages_json,
            'profile_image_path' => $this->formatProfileImage(),
            'bio' => $this->bio,
            'rating_avg' => $this->rating_avg,
            'default_fee' => $this->default_fee,
            'city' => $this->city,
            'country' => $this->country,
            'accepting_new_patients' => $this->accepting_new_patients,
            'recommended_percent' => $this->recommended_percent,
            'years_experience' => $this->years_experience,
            'verified_at' => optional($this->verified_at)->toIso8601String(),
            'services' => DoctorServiceResource::collection($this->whenLoaded('services')),
            'clinics' => ClinicResource::collection($this->whenLoaded('clinics')),
            'availabilities' => DoctorAvailabilityResource::collection($this->whenLoaded('availabilities')),
            'educations' => DoctorEducationResource::collection($this->whenLoaded('educations')),
            'experiences' => DoctorExperienceResource::collection($this->whenLoaded('experiences')),
            'awards' => DoctorAwardResource::collection($this->whenLoaded('awards')),
            'insurances' => DoctorInsuranceResource::collection($this->whenLoaded('insurances')),
            'memberships' => MembershipResource::collection($this->whenLoaded('memberships')),
            'social_links' => SocialLinkResource::collection($this->whenLoaded('socialLinks')),
            'reviews' => ReviewResource::collection($this->whenLoaded('reviews')),
        ];
    }

    private function formatProfileImage(): ?string
    {
        if (!$this->profile_image_path) {
            return null;
        }
        if (Str::startsWith($this->profile_image_path, ['http://', 'https://'])) {
            return $this->profile_image_path;
        }
        return Storage::disk('public')->url($this->profile_image_path);
    }
}
