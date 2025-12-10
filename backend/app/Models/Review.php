<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    use HasFactory;

    protected $fillable = [
        'appointment_id',
        'doctor_id',
        'patient_id',
        'rating',
        'comment',
        'reply_user_id',
        'reply_text',
        'reply_at',
    ];

    protected $casts = [
        'rating' => 'integer',
        'reply_at' => 'datetime',
    ];

    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }

    public function doctor()
    {
        return $this->belongsTo(Doctor::class);
    }

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function replyUser()
    {
        return $this->belongsTo(User::class, 'reply_user_id');
    }
}
