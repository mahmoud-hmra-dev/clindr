<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Appointment extends Model
{
    use HasFactory;

    protected $fillable = [
        'doctor_id',
        'patient_id',
        'appointment_type',
        'visit_type',
        'scheduled_at',
        'duration_minutes',
        'status',
        'reason',
        'notes',
        'clinic_location',
        'online_meeting_url',
        'twilio_room_sid',
        'areeba_transaction_id',
        'areeba_payment_status',
        'created_by',
        'cancelled_by',
        'cancelled_reason',
        'patient_email',
        'patient_phone',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
    ];

    public function doctor()
    {
        return $this->belongsTo(Doctor::class);
    }

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function canceller()
    {
        return $this->belongsTo(User::class, 'cancelled_by');
    }

    public function invoice()
    {
        return $this->hasOne(Invoice::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function prescriptions()
    {
        return $this->hasMany(Prescription::class);
    }

    public function medicalRecords()
    {
        return $this->hasMany(MedicalRecord::class);
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }
}
