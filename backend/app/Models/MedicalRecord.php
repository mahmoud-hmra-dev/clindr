<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MedicalRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'dependent_id',
        'doctor_id',
        'appointment_id',
        'record_type',
        'title',
        'recorded_at',
        'comments',
        'file_url',
    ];

    protected $casts = [
        'recorded_at' => 'datetime',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function dependent()
    {
        return $this->belongsTo(Dependent::class);
    }

    public function doctor()
    {
        return $this->belongsTo(Doctor::class);
    }

    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }
}
