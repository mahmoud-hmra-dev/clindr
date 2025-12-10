<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'appointment_id',
        'doctor_id',
        'patient_id',
        'amount',
        'currency',
        'booked_on',
        'status',
        'due_date',
        'pdf_url',
        'payment_status',
        'payment_id',
    ];

    protected $casts = [
        'amount' => 'float',
        'booked_on' => 'datetime',
        'due_date' => 'date',
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

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }
}
