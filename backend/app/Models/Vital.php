<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vital extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'dependent_id',
        'blood_pressure',
        'heart_rate',
        'glucose_level',
        'body_temperature',
        'bmi',
        'spo2',
        'weight',
        'fbc_status',
        'recorded_at',
        'recorded_by',
    ];

    protected $casts = [
        'recorded_at' => 'datetime',
        'bmi' => 'float',
        'weight' => 'float',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function dependent()
    {
        return $this->belongsTo(Dependent::class);
    }

    public function recordedBy()
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
