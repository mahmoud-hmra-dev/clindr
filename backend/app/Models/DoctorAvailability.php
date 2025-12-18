<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DoctorAvailability extends Model
{
    use HasFactory;

    protected $fillable = [
        'doctor_id',
        'clinic_id',
        'date',
        'day_of_week',
        'start_time',
        'availability_type',
        'status',
        'slot_capacity',
        'fee_amount',
    ];

    protected $casts = [
        'date' => 'date',
        'fee_amount' => 'float',
    ];

    public function doctor()
    {
        return $this->belongsTo(Doctor::class);
    }

    public function clinic()
    {
        return $this->belongsTo(Clinic::class);
    }
}
