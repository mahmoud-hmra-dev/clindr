<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Conversation extends Model
{
    use HasFactory;

    protected $fillable = [
        'doctor_id',
        'patient_id',
        'last_message_at',
        'pinned_by',
        'unread_doctor',
        'unread_patient',
    ];

    protected $casts = [
        'last_message_at' => 'datetime',
    ];

    public function doctor()
    {
        return $this->belongsTo(Doctor::class);
    }

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function pinnedByUser()
    {
        return $this->belongsTo(User::class, 'pinned_by');
    }

    public function messages()
    {
        return $this->hasMany(Message::class);
    }
}
