<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DoctorAward extends Model
{
    use HasFactory;

    protected $fillable = [
        'doctor_id',
        'name',
        'year',
        'description',
    ];

    public function doctor()
    {
        return $this->belongsTo(Doctor::class);
    }
}
