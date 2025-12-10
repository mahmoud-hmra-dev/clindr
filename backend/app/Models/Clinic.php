<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Clinic extends Model
{
    use HasFactory;

    protected $fillable = [
        'doctor_id',
        'name',
        'address',
        'city',
        'image_url',
        'fee_amount',
    ];

    public function doctor()
    {
        return $this->belongsTo(Doctor::class);
    }

    public function availabilities()
    {
        return $this->hasMany(DoctorAvailability::class);
    }
}
