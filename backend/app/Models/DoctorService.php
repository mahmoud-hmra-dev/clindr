<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DoctorService extends Model
{
    use HasFactory;

    protected $fillable = [
        'doctor_id',
        'specialty_id',
        'name',
        'price',
        'description',
    ];

    protected $casts = [
        'price' => 'float',
    ];

    public function doctor()
    {
        return $this->belongsTo(Doctor::class);
    }

    public function specialty()
    {
        return $this->belongsTo(Specialty::class);
    }
}
