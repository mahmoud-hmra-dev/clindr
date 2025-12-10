<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Doctor extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'first_name',
        'last_name',
        'display_name',
        'designation',
        'phone',
        'email',
        'languages_json',
        'profile_image_path',
        'bio',
        'rating_avg',
        'default_fee',
        'city',
        'country',
        'accepting_new_patients',
        'recommended_percent',
        'years_experience',
        'verified_at',
    ];

    protected $casts = [
        'languages_json' => 'array',
        'rating_avg' => 'float',
        'default_fee' => 'float',
        'accepting_new_patients' => 'boolean',
        'verified_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function services()
    {
        return $this->hasMany(DoctorService::class);
    }

    public function clinics()
    {
        return $this->hasMany(Clinic::class);
    }

    public function availabilities()
    {
        return $this->hasMany(DoctorAvailability::class);
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    public function socialLinks()
    {
        return $this->hasMany(SocialLink::class);
    }

    public function memberships()
    {
        return $this->hasMany(Membership::class);
    }

    public function conversations()
    {
        return $this->hasMany(Conversation::class);
    }

    public function educations()
    {
        return $this->hasMany(DoctorEducation::class);
    }

    public function experiences()
    {
        return $this->hasMany(DoctorExperience::class);
    }

    public function awards()
    {
        return $this->hasMany(DoctorAward::class);
    }

    public function insurances()
    {
        return $this->hasMany(DoctorInsurance::class);
    }
}
