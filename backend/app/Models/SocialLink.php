<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SocialLink extends Model
{
    use HasFactory;

    protected $fillable = [
        'doctor_id',
        'platform',
        'url',
    ];

    public function doctor()
    {
        return $this->belongsTo(Doctor::class);
    }
}
