<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'appointment_id',
        'invoice_id',
        'amount',
        'currency',
        'areeba_transaction_id',
        'status',
        'redirect_url',
        'raw_response_json',
        'paid_at',
    ];

    protected $casts = [
        'amount' => 'float',
        'paid_at' => 'datetime',
        'raw_response_json' => 'array',
    ];

    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }
}
