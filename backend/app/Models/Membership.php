<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Membership extends Model
{
    use HasFactory;

    protected $fillable = [
        'doctor_id',
        'title',
        'description',
    ];

    public function doctor()
    {
        return $this->belongsTo(Doctor::class);
    }
}
