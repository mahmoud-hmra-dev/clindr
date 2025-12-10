<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Dependent extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'name',
        'gender',
        'relationship',
        'phone',
        'email',
        'blood_group',
        'dob',
        'is_active',
    ];

    protected $casts = [
        'dob' => 'date',
        'is_active' => 'boolean',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function vitals()
    {
        return $this->hasMany(Vital::class);
    }

    public function medicalRecords()
    {
        return $this->hasMany(MedicalRecord::class);
    }
}
