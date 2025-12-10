<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DoctorEducation extends Model
{
    use HasFactory;

    protected $table = 'doctor_educations';

    protected $fillable = [
        'doctor_id',
        'degree',
        'institution',
        'year_completed',
        'description',
    ];

    public function doctor()
    {
        return $this->belongsTo(Doctor::class);
    }
}
