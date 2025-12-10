<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DoctorInsurance extends Model
{
    use HasFactory;

    protected $fillable = [
        'doctor_id',
        'name',
        'logo_url',
    ];

    public function doctor()
    {
        return $this->belongsTo(Doctor::class);
    }
}
