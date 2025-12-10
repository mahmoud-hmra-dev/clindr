<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WalletTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'account_no',
        'reason',
        'transaction_date',
        'amount',
        'status',
        'direction',
    ];

    protected $casts = [
        'transaction_date' => 'datetime',
        'amount' => 'float',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }
}
